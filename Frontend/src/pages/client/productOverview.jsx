// Frontend/src/pages/client/productOverview.jsx
import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useParams, useSearchParams } from "react-router-dom";
import ProductImageSlider from "../../components/productImageSlider";
import { addToCart } from "../../utils/cart";

// Reviews API
import { getReviews as apiGetReviews } from "../../api/reviews";

// Review UI components (clean + reusable)
import ReviewStars from "../../components/reviewStars";
import ReviewForm from "../../components/reviewForm";
import ReviewList from "../../components/reviewList";
import Layout from "../../components/Layout";

/* -------------------------- small local component -------------------------- */
function RatingBreakdown({
  average = 0,
  count = 0,
  dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
}) {
  const pct = (n) => (count ? Math.round((n / count) * 100) : 0);

  return (
    <div className="flex flex-col sm:flex-row gap-6 sm:gap-10 items-start">
      {/* Left: big average */}
      <div className="min-w-[140px]">
        <div className="text-5xl font-semibold text-slate-900">
          {Number(average || 0).toFixed(1)}
          <span className="text-slate-400 text-3xl align-top">/5</span>
        </div>
        <div className="mt-2">
          <ReviewStars value={average} />
        </div>
        <div className="mt-1 text-slate-600 text-sm">{count} Ratings</div>
      </div>

      {/* Right: bars 5 -> 1 */}
      <div className="w-full max-w-md space-y-2">
        {[5, 4, 3, 2, 1].map((star) => (
          <div key={star} className="flex items-center gap-3">
            <div className="min-w-[84px] text-sm text-slate-700">
              {Array.from({ length: 5 }).map((_, i) => (
                <span
                  key={i}
                  className={i < star ? "text-yellow-500" : "text-slate-300"}
                >
                  ★
                </span>
              ))}
            </div>
            <div className="flex-1 h-2 rounded bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-yellow-400"
                style={{ width: `${pct(dist[star] || 0)}%` }}
              />
            </div>
            <div className="w-10 text-right text-sm text-slate-700">
              {dist[star] || 0}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ProductOverview() {
  const params = useParams();
  const [searchParams] = useSearchParams();

  // Only show the review form when user came via "Make review"
  const reviewMode = searchParams.get("review") === "1";
  const orderId = searchParams.get("orderId") || null;

  if (params.id == null || params.id == undefined) {
    window.location.href = "/products";
  }

  const [product, setProduct] = useState(null);
  const [status, setStatus] = useState("loading");

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  // Review eligibility (frontend guard mirrors backend rule)
  const [canReview, setCanReview] = useState(false);
  const [eligibilityLoading, setEligibilityLoading] = useState(false);

  // Show form only if we are in reviewMode; hide it after submit/delete
  const [showReviewForm, setShowReviewForm] = useState(reviewMode);

  const isLoggedIn = !!localStorage.getItem("token");

  useEffect(() => {
    if (status === "loading") {
      axios
        .get(
          import.meta.env.VITE_BACKEND_URL +
            "/api/product/get/" +
            encodeURIComponent(params.id)
        )
        .then(async (res) => {
          const base = res.data?.product ?? res.data?.data ?? res.data;
          if (!base) throw new Error("Empty product payload");

          // Enrich with stock data from /all (FishStock linkage)
          try {
            const all = await axios.get(
              import.meta.env.VITE_BACKEND_URL + "/api/product/all"
            );
            const arr = Array.isArray(all.data?.data) ? all.data.data : [];
            const match = arr.find((p) => p?.productId === base?.productId);
            const merged = match
              ? {
                  ...base,
                  stockWeight: match.stockWeight,
                  stockUnit: match.stockUnit,
                  stockType: match.stockType,
                }
              : base;
            setProduct(merged);
          } catch {
            setProduct(base);
          }

          setStatus("loaded");
        })
        .catch((err) => {
          console.error(err);
          toast.error("Error fetching product details");
          setStatus("error");
        });
    }
  }, [status, params.id]);

  // Helper to (re)load reviews and sync aggregates on the product
  async function refreshReviews(pid) {
    if (!pid) return;
    try {
      setReviewsLoading(true);
      const res = await apiGetReviews(pid);
      const payload = res?.data || {};
      setReviews(Array.isArray(payload.data) ? payload.data : []);
      // sync product aggregates if backend returns them
      setProduct((p) =>
        p
          ? {
              ...p,
              averageRating:
                typeof payload.averageRating === "number"
                  ? payload.averageRating
                  : p.averageRating,
              reviewCount:
                typeof payload.reviewCount === "number"
                  ? payload.reviewCount
                  : p.reviewCount,
            }
          : p
      );
    } catch {
      // keep page usable if reviews fail
    } finally {
      setReviewsLoading(false);
    }
  }

  // Load reviews when product is ready
  useEffect(() => {
    if (status === "loaded" && product?.productId) {
      refreshReviews(product.productId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, product?.productId]);

  // Check if user is eligible to review (has completed order with this product)
  useEffect(() => {
    async function checkEligibility() {
      if (!isLoggedIn || !product?.productId) {
        setCanReview(false);
        return;
      }
      try {
        setEligibilityLoading(true);
        // Attach token manually for this call
        const token = localStorage.getItem("token");
        const res = await axios.get(
          import.meta.env.VITE_BACKEND_URL + "/api/order/all",
          token
            ? { headers: { Authorization: `Bearer ${token}` } }
            : undefined
        );
        const list = Array.isArray(res.data) ? res.data : res.data.orders || [];
        const pid = product.productId;
        const eligible = list.some((o) => {
          const s = String(o.status || "").toLowerCase();
          const processed = s === "delivered" || s === "completed";
          const hasItem =
            Array.isArray(o.billItems) &&
            o.billItems.some((it) => it?.productId === pid);
          return processed && hasItem;
        });
        setCanReview(!!eligible);
      } catch {
        setCanReview(false);
      } finally {
        setEligibilityLoading(false);
      }
    }
    checkEligibility();
  }, [isLoggedIn, product?.productId]);

  // After a successful review, hide form and mark order as reviewed (so Orders page can disable its button)
  const handleReviewSaved = () => {
    if (product?.productId) {
      refreshReviews(product.productId);
    }
    setShowReviewForm(false);

    if (orderId) {
      try {
        const prev = JSON.parse(localStorage.getItem("reviewedOrders") || "[]");
        const updated = [...new Set([...prev, orderId])];
        localStorage.setItem("reviewedOrders", JSON.stringify(updated));
      } catch {
        localStorage.setItem("reviewedOrders", JSON.stringify([orderId]));
      }
    }
  };

  const handleReviewDeleted = () => {
    if (product?.productId) {
      refreshReviews(product.productId);
    }
    // Hide form after delete as per requirement
    setShowReviewForm(false);
  };

  /* -------------------- rating summary / distribution values -------------------- */
  const ratingDist = useMemo(() => {
    const d = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    (reviews || []).forEach((r) => {
      const k = Math.round(Number(r?.rating) || 0);
      if (d[k] != null) d[k] += 1;
    });
    return d;
  }, [reviews]);

  const avgForSummary = useMemo(() => {
    if (typeof product?.averageRating === "number") return product.averageRating;
    if (!reviews.length) return 0;
    const sum = reviews.reduce((s, r) => s + (Number(r.rating) || 0), 0);
    return sum / reviews.length;
  }, [product?.averageRating, reviews]);

  const totalForSummary = useMemo(() => {
    if (typeof product?.reviewCount === "number") return product.reviewCount;
    return reviews.length;
  }, [product?.reviewCount, reviews]);

  return (
    <Layout>
    <div className="w-full h-full flex items-center justify-center">
      {status === "loading" && (
        <div className="w-full h-full flex gap-6 p-6 animate-pulse">
          <div className="w-[50%] h-full">
            <div className="w-full aspect-square rounded-2xl bg-slate-200" />
          </div>
          <div className="w-[50%] h-full">
            <div className="h-full w-full p-6 md:p-8">
              <div className="h-7 w-2/3 bg-slate-200 rounded mb-4" />
              <div className="flex gap-2 justify-center mb-5">
                <div className="h-6 w-16 bg-slate-200 rounded-full" />
                <div className="h-6 w-20 bg-slate-200 rounded-full" />
                <div className="h-6 w-14 bg-slate-200 rounded-full" />
              </div>
              <div className="flex items-end justify-center gap-3 mb-3">
                <div className="h-8 w-48 bg-slate-200 rounded" />
                <div className="h-4 w-24 bg-slate-200 rounded" />
                <div className="h-5 w-12 bg-slate-200 rounded-full" />
              </div>
              <div className="h-8 w-40 bg-slate-200 rounded mx-auto mb-4" />
              <div className="h-12 w-4/5 bg-slate-200 rounded mx-auto mb-5" />
              <div className="flex items-center justify-center gap-2 mb-6">
                <div className="h-10 w-10 bg-slate-200 rounded-xl" />
                <div className="h-10 w-24 bg-slate-200 rounded-xl" />
                <div className="h-10 w-10 bg-slate-200 rounded-xl" />
                <div className="h-5 w-14 bg-slate-200 rounded" />
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <div className="h-10 w-32 bg-slate-200 rounded-xl" />
                <div className="h-10 w-28 bg-slate-200 rounded-xl" />
                <div className="h-10 w-28 bg-slate-200 rounded-xl" />
                <div className="h-10 w-28 bg-slate-200 rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      )}

      {status === "loaded" && product && (
        <div className="w-full h-full flex flex-col">
          {/* existing two-column layout */}
          <div className="w-full h-full flex">
            <div className="w-[50%] h-full">
              <ProductImageSlider
                images={product.images}
                productName={product.name}
              />
            </div>

            <div className="w-[50%] h-full">
              <div className="h-full w-full p-6 md:p-8">
                <h1 className="text-3xl font-bold text-center mt-8 tracking-tight">
                  {product?.name}
                </h1>

                {/* Average rating row (non-intrusive) */}
                <div className="mt-2 text-center">
                  <div className="inline-flex items-center gap-2">
                    <ReviewStars value={product?.averageRating || 0} />
                    <span className="text-sm text-slate-600">
                      {typeof product?.averageRating === "number"
                        ? `${product.averageRating.toFixed(1)}`
                        : "0.0"}{" "}
                      · {product?.reviewCount ?? 0} reviews
                    </span>
                  </div>
                </div>

                {Array.isArray(product?.altNames) &&
                  product.altNames.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2 justify-center">
                      {product.altNames.slice(0, 4).map((n, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 rounded-full text-xs bg-slate-100 text-slate-700 ring-1 ring-slate-200"
                          title={n}
                        >
                          {n}
                        </span>
                      ))}
                      {product.altNames.length > 4 && (
                        <span className="px-2.5 py-1 rounded-full text-xs bg-slate-50 text-slate-500 ring-1 ring-slate-200">
                          +{product.altNames.length - 4} more
                        </span>
                      )}
                    </div>
                  )}

                {(() => {
                  // Prefer stock values coming from FishStock linkage
                  const effectiveUnit = product?.stockUnit || product?.unit;
                  const effectiveStock =
                    typeof product?.stockWeight === "number"
                      ? product.stockWeight
                      : product?.stock;

                  const hasDiscount =
                    typeof product?.labeledPrice === "number" &&
                    typeof product?.price === "number" &&
                    product.labeledPrice > product.price;

                  return (
                    <>
                      <div className="mt-5 flex items-end justify-center gap-3">
                        <div className="text-3xl font-extrabold text-slate-900">
                          {typeof product?.price === "number"
                            ? `Rs. ${product.price.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                              })}`
                            : "—"}
                          {effectiveUnit && (
                            <span className="ml-2 text-sm font-medium text-slate-500">
                              /{effectiveUnit}
                            </span>
                          )}
                        </div>
                        {hasDiscount && (
                          <>
                            <div className="text-sm line-through text-slate-400">
                              Rs.{" "}
                              {product.labeledPrice.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                              })}
                            </div>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-red-50 text-red-700 text-xs font-semibold ring-1 ring-red-200">
                              -
                              {Math.round(
                                ((product.labeledPrice - product.price) /
                                  product.labeledPrice) *
                                  100
                              )}
                              %
                            </span>
                          </>
                        )}
                      </div>

                      <div className="mt-2 text-center">
                        {(() => {
                          const u = (effectiveUnit || "").toLowerCase();
                          const isWeight = [
                            "kg",
                            "kilogram",
                            "kilograms",
                            "g",
                            "gram",
                            "grams",
                            "lb",
                            "lbs",
                            "pound",
                            "pounds",
                          ].includes(u);
                          const step = isWeight ? 0.25 : 1;
                          const price =
                            typeof product?.price === "number"
                              ? product.price
                              : 0;
                          const totalId = `total-${
                            product?.productId ?? "p"
                          }`;
                          const initialTotal = price * step;
                          return (
                            <div className="inline-flex items-baseline gap-2 px-3 py-2 rounded-xl bg-slate-50 ring-1 ring-slate-200">
                              <span className="text-sm text-slate-600">
                                Total
                              </span>
                              <span
                                id={totalId}
                                className="text-xl font-semibold text-slate-900"
                              >
                                {price
                                  ? `Rs. ${initialTotal.toLocaleString(
                                      undefined,
                                      { minimumFractionDigits: 2 }
                                    )}`
                                  : "—"}
                              </span>
                            </div>
                          );
                        })()}
                      </div>

                      <div className="mt-2 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ring-1 ${
                            product?.isActive
                              ? "bg-green-50 text-green-700 ring-green-200"
                              : "bg-slate-100 text-slate-600 ring-slate-200"
                          }`}
                        >
                          <span
                            className={`inline-block w-1.5 h-1.5 rounded-full ${
                              product?.isActive
                                ? "bg-green-500"
                                : "bg-slate-400"
                            }`}
                          />
                          {product?.isActive ? "In stock" : "Unavailable"}
                          {typeof effectiveStock === "number" && (
                            <span className="ml-1 text-slate-500">
                              ({effectiveStock}{" "}
                              {effectiveUnit || product?.unit} left)
                            </span>
                          )}
                        </span>
                      </div>
                    </>
                  );
                })()}

                {product?.description && (
                  <p className="text-[15px] leading-6 text-slate-700 text-center mt-4 max-w-[42ch] mx-auto">
                    {product.description}
                  </p>
                )}

                <div className="mt-5 flex items-stretch justify-center gap-2">
                  {(() => {
                    const effectiveUnit = product?.stockUnit || product?.unit;
                    const u = (effectiveUnit || "").toLowerCase();
                    const isWeight = [
                      "kg",
                      "kilogram",
                      "kilograms",
                      "g",
                      "gram",
                      "grams",
                      "lb",
                      "lbs",
                      "pound",
                      "pounds",
                    ].includes(u);
                    const step = isWeight ? 0.25 : 1;
                    const min = isWeight ? 0.25 : 1;
                    const qtyId = `qty-${product?.productId ?? "p"}`;
                    const totalId = `total-${product?.productId ?? "p"}`;
                    const price =
                      typeof product?.price === "number" ? product.price : 0;

                    const fmt = (n) =>
                      n.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      });
                    const updateTotal = () => {
                      const qEl = document.getElementById(qtyId);
                      const tEl = document.getElementById(totalId);
                      if (!qEl || !tEl) return;
                      const q = Math.max(
                        min,
                        parseFloat(qEl.value || String(min)) || min
                      );
                      tEl.textContent = price ? `Rs. ${fmt(q * price)}` : "—";
                    };

                    return (
                      <>
                        <button
                          type="button"
                          aria-label="Decrease quantity"
                          className="px-3 rounded-xl bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 active:scale-[0.98] transition inline-flex items-center justify-center"
                          onClick={() => {
                            const el = document.getElementById(qtyId);
                            if (el) {
                              el.stepDown();
                              el.dispatchEvent(
                                new Event("input", { bubbles: true })
                              );
                            }
                            updateTotal();
                          }}
                        >
                          <svg
                            viewBox="0 0 24 24"
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            aria-hidden="true"
                          >
                            <path
                              d="M5 12h14"
                              strokeWidth="2"
                              strokeLinecap="round"
                            />
                          </svg>
                        </button>

                        <input
                          id={qtyId}
                          type="number"
                          inputMode="decimal"
                          defaultValue={min}
                          min={min}
                          step={step}
                          className="w-24 text-center px-3 py-2 rounded-xl ring-1 ring-slate-200 bg-white focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                          aria-label="Quantity"
                          onInput={updateTotal}
                          onBlur={(e) => {
                            const val = parseFloat(
                              e.target.value || String(min)
                            );
                            const s = parseFloat(String(step)) || 1;
                            const snapped = Math.max(
                              min,
                              Math.round(val / s) * s
                            );
                            e.target.value =
                              s < 1 ? snapped.toFixed(2) : String(snapped);
                            updateTotal();
                          }}
                        />

                        <button
                          type="button"
                          aria-label="Increase quantity"
                          className="px-3 rounded-xl bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 active:scale-[0.98] transition inline-flex items-center justify-center"
                          onClick={() => {
                            const el = document.getElementById(qtyId);
                            if (el) {
                              el.stepUp();
                              el.dispatchEvent(
                                new Event("input", { bubbles: true })
                              );
                            }
                            updateTotal();
                          }}
                        >
                          <svg
                            viewBox="0 0 24 24"
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            aria-hidden="true"
                          >
                            <path
                              d="M12 5v14M5 12h14"
                              strokeWidth="2"
                              strokeLinecap="round"
                            />
                          </svg>
                        </button>

                        <span className="self-center text-sm text-slate-600 ml-1">
                          {effectiveUnit ?? "unit"}
                        </span>
                      </>
                    );
                  })()}
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <button
                    className="px-5 py-2.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 active:scale-[0.99] transition shadow-sm inline-flex items-center gap-2"
                    onClick={() => {
                      const effectiveUnit = product?.stockUnit || product?.unit;
                      const qtyId = `qty-${product?.productId ?? "p"}`;
                      const el = document.getElementById(qtyId);
                      let qty = parseFloat(el?.value || "0");
                      const u = (effectiveUnit || "").toLowerCase();
                      const isWeight = [
                        "kg",
                        "kilogram",
                        "kilograms",
                        "g",
                        "gram",
                        "grams",
                        "lb",
                        "lbs",
                        "pound",
                        "pounds",
                      ].includes(u);
                      const min = isWeight ? 0.25 : 1;
                      if (isNaN(qty) || qty < min) qty = min;

                      addToCart({ ...product, unit: effectiveUnit }, qty);

                      const price =
                        typeof product?.price === "number" ? product.price : 0;
                      const total = qty * price;
                      toast.success(
                        `Added ${qty} ${effectiveUnit || ""} (Rs. ${total.toLocaleString(
                          undefined,
                          {
                            minimumFractionDigits: 2,
                          }
                        )}) to cart`
                      );
                    }}
                    aria-label="Add to cart"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        d="M3 3h2l.4 2M7 13h10l3-8H6.4"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <circle cx="9" cy="19" r="1.5" />
                      <circle cx="17" cy="19" r="1.5" />
                    </svg>
                    <span>Add to Cart</span>
                  </button>

                  <button
                    className="px-5 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.99] transition shadow-sm inline-flex items-center gap-2"
                    onClick={() => {
                      const effectiveUnit = product?.stockUnit || product?.unit;
                      const qtyId = `qty-${product?.productId ?? "p"}`;
                      const el = document.getElementById(qtyId);
                      let qty = parseFloat(el?.value || "0");
                      const u = (effectiveUnit || "").toLowerCase();
                      const isWeight = [
                        "kg",
                        "kilogram",
                        "kilograms",
                        "g",
                        "gram",
                        "grams",
                        "lb",
                        "lbs",
                        "pound",
                        "pounds",
                      ].includes(u);
                      const min = isWeight ? 0.25 : 1;
                      if (isNaN(qty) || qty < min) qty = min;

                      const singleItem = {
                        productId: product?.productId,
                        name: product?.name,
                        unit: effectiveUnit,
                        image: Array.isArray(product?.images)
                          ? product.images[0]
                          : product?.image || null,
                        price:
                          typeof product?.price === "number"
                            ? product.price
                            : 0,
                        quantity: qty,
                      };
                      localStorage.setItem(
                        "buyNow",
                        JSON.stringify([singleItem])
                      );
                      window.location.href = "/checkout";

                      const price =
                        typeof product?.price === "number" ? product.price : 0;
                      const total = qty * price;
                      toast(
                        `Checkout: ${qty} ${effectiveUnit || ""} • Total Rs. ${total.toLocaleString(
                          undefined,
                          {
                            minimumFractionDigits: 2,
                          }
                        )}`
                      );
                    }}
                    aria-label="Buy now"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <rect
                        x="3"
                        y="5"
                        width="18"
                        height="14"
                        rx="2"
                        ry="2"
                        strokeWidth="2"
                      />
                      <path d="M3 10h18" strokeWidth="2" />
                    </svg>
                    <span>Buy Now</span>
                  </button>

                  <button
                    className="px-4 py-2 rounded-xl bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 active:scale-[0.99] transition inline-flex items-center gap-2"
                    onClick={() => {
                      const url = window.location.href;
                      if (navigator.share) {
                        navigator
                          .share({ title: product?.name ?? "Product", url })
                          .catch(() => {});
                      } else if (navigator.clipboard) {
                        navigator.clipboard
                          .writeText(url)
                          .then(() => toast.success("Link copied"));
                      } else {
                        toast("Share not supported");
                      }
                    }}
                    title="Share product"
                    aria-label="Share product"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <circle cx="18" cy="5" r="2" />
                      <circle cx="6" cy="12" r="2" />
                      <circle cx="18" cy="19" r="2" />
                      <path
                        d="M8 12l8-7M8 12l8 7"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                    <span>Share</span>
                  </button>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3 max-w-md mx-auto text-sm">
                  <div className="p-3 rounded-xl ring-1 ring-slate-200 bg-white">
                    <div className="text-[11px] uppercase tracking-wide text-slate-500">
                      Product ID
                    </div>
                    <div className="font-medium text-slate-800">
                      {product?.productId ?? "—"}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl ring-1 ring-slate-200 bg-white">
                    <div className="text-[11px] uppercase tracking-wide text-slate-500">
                      Category
                    </div>
                    <div className="uppercase font-medium text-slate-800">
                      {product?.stockType || product?.category || "—"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Reviews Section */}
          <div className="w-full max-w-4xl mx-auto mt-10 mb-16 px-4">
            <div className="border-t border-slate-200 pt-8">
              <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                Customer Reviews
                <span className="text-sm font-normal text-slate-600">
                  ({product?.reviewCount ?? 0})
                </span>
              </h2>

              {/* Ratings summary (replaces the previous hint) */}
              <div className="mt-5 p-4 rounded-xl ring-1 ring-slate-200 bg-white">
                <RatingBreakdown
                  average={avgForSummary}
                  count={totalForSummary}
                  dist={ratingDist}
                />
              </div>

              {/* Write/Edit Review (only when navigated via Make Review) */}
              {showReviewForm && (
                <div className="mt-5 p-4 rounded-xl ring-1 ring-slate-200 bg-white">
                  {eligibilityLoading ? (
                    <div className="text-sm text-slate-500">Checking eligibility…</div>
                  ) : !isLoggedIn ? (
                    <div className="text-sm text-slate-600">Please log in to write a review.</div>
                  ) : canReview ? (
                    <ReviewForm
                      productId={product.productId}
                      orderId={orderId}
                      onReviewSaved={handleReviewSaved}
                      onReviewDeleted={handleReviewDeleted}
                    />
                  ) : (
                    <div className="text-sm text-slate-600">
                      You can only review this product after your order is completed (Delivered/Completed).
                    </div>
                  )}
                </div>
              )}
              
              {/* Reviews List */}
              <div className="mt-6">
                <ReviewList reviews={reviews} loading={reviewsLoading} />
              </div>
            </div>
          </div>
          {/* end reviews section */}
        </div>
      )}

      {status === "error" && (
        <div className="w-full h-full flex items-center justify-center p-6">
          <div className="max-w-lg w/full rounded-2xl bg-red-50 ring-1 ring-red-200 p-6 text-red-900">
            <div className="flex items-start gap-3">
              <div className="shrink-0">
                <svg
                  viewBox="0 0 24 24"
                  className="w-6 h-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                >
                  <circle cx="12" cy="12" r="10" strokeWidth="2" />
                  <path
                    d="M12 7v6M12 17h.01"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="font-semibold text-red-800">
                  Error loading product details
                </h2>
                <p className="text-sm mt-1">
                  Something went wrong while fetching this product. You can
                  retry or go back to the product list.
                </p>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => setStatus("loading")}
                    className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 active:scale-[0.99] transition"
                  >
                    Retry
                  </button>
                  <button
                    onClick={() => {
                      window.location.href = "/products";
                    }}
                    className="px-4 py-2 rounded-lg bg-white text-red-700 ring-1 ring-red-200 hover:bg-red-100 active:scale-[0.99] transition"
                  >
                    Back to Products
                  </button>
                </div>
                <details className="mt-3 text-xs text-red-800/80">
                  <summary className="cursor-pointer">
                    Troubleshooting tips
                  </summary>
                  <ul className="list-disc ml-5 mt-2 space-y-1">
                    <li>Check your internet connection.</li>
                    <li>Confirm the product ID in the URL is correct.</li>
                    <li>
                      Ensure the server is running and{" "}
                      <code>VITE_BACKEND_URL</code> is set.
                    </li>
                  </ul>
                </details>
              </div>
            </div>
          </div>

        </div>
        
      )}
     
    </div>
    </Layout>
  );
}
