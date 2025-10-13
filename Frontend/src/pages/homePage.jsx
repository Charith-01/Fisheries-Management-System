import { Route, Routes, Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import Header from "../components/header";
import ProductsPage from "./client/productsPage";
import ProductOverview from "./client/productOverview";
import CartPage from "./client/cart";
import Checkout from "./client/checkout";
import NotFoundPage from "./client/notFoundPage";
import Footer from "../components/footer";
import Profile from "./client/profile";
import MyOrdersPage from "./client/orders";
import ProtectedRoute from "../components/ProtectedRoute";
import EnhancedRoleProtectedRoute  from "../components/EnhancedRoleProtectedRoute";

function SectionHeader({ title, subtitle }) {
  return (
    <div className="mb-10">
      <div className="mx-auto flex max-w-3xl items-center gap-6">
        <div className="h-px flex-1 bg-slate-200" />
        <h2 className="text-center text-2xl font-extrabold tracking-wide text-slate-800 md:text-3xl">
          {title}
        </h2>
        <div className="h-px flex-1 bg-slate-200" />
      </div>
      {subtitle ? (
        <p className="mt-2 text-center text-slate-600">{subtitle}</p>
      ) : null}
    </div>
  );
}

function HeroSection() {
  const navigate = useNavigate();
  

  const slides = useMemo(
    () => [
      {
        title: "Fresh Yellowfin Tuna",
        subtitle: "Wild-caught • Grade A • Same-day dispatch",
        img: "https://thumbs.dreamstime.com/b/fresh-seafood-sale-crabs-sea-urchins-mussels-lemons-displayed-ice-shop-window-generated-ai-338121829.jpg",
        discount: "-20%",
        promoText: "Weekend Deal — Yellowfin Tuna",
        code: "FRESH20",
        cta: { label: "Shop Tuna Deal", to: "/products?search=Yellowfin%20Tuna" },
        tag: "Limited time",
      },
      {
        title: "Premium Tiger Prawns",
        subtitle: "Firm, sweet & perfect for grills",
        img: "https://media.istockphoto.com/id/649390552/photo/fresh-tuna-fish-in-market-seafood-background.jpg?s=612x612&w=0&k=20&c=EVQPFFkSMellZtaRnvvd6Wj8tM4ymHOp4VJTFGyJtsM=",
        discount: "-15%",
        promoText: "Grill Season — Tiger Prawns",
        code: "PRAWN15",
        cta: { label: "Shop Prawn Deal", to: "/products?search=Tiger%20Prawns" },
        tag: "This week",
      },
      {
        title: "Line-Caught Mahi-Mahi",
        subtitle: "Sustainably sourced from local boats",
        img: "https://static.vecteezy.com/system/resources/previews/069/422/533/non_2x/fresh-shrimps-on-a-black-background-photo.jpg",
        discount: "Buy 2 kg, Get 10% OFF",
        promoText: "Boat-fresh Mahi-Mahi",
        code: "MAHI10",
        cta: { label: "Shop Mahi Deal", to: "/products?search=Mahi-Mahi" },
        tag: "Fresh arrival",
      },
    ],
    []
  );

  const [idx, setIdx] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setIdx((p) => (p + 1) % slides.length);
    }, 4500);
    return () => clearInterval(timerRef.current);
  }, [slides.length]);

  const gotoProducts = () => navigate("/products");

  return (
    <section className="relative isolate overflow-hidden">
      <div className="pointer-events-none absolute -top-32 -right-24 h-96 w-96 rounded-full bg-sky-300/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-cyan-300/30 blur-3xl" />

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-8 px-4 py-12 md:grid-cols-2 md:py-16 lg:px-8">
        <div className="z-10">
          <h1 className="mt-4 text-4xl font-extrabold leading-tight text-slate-900 md:text-5xl lg:text-6xl">
            Ocean-fresh seafood,
            <br />
            <span className="text-sky-600">delivered to your door</span>
          </h1>

          <p className="mt-4 max-w-xl text-slate-600">
            Shop today’s catch from trusted local fisheries. Transparent pricing and dock-to-door freshness.
          </p>

          <div className="mt-6 flex items-center gap-3">
            <button
              onClick={gotoProducts}
              className="rounded-xl bg-sky-600 px-5 py-3 font-semibold text-white shadow transition hover:-translate-y-0.5 hover:bg-sky-700 active:translate-y-0"
            >
              Shop Now
            </button>

            <button
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById("reviews");
                if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50 active:translate-y-0"
            >
              See Reviews
            </button>
          </div>
          <div className="mt-8 grid max-w-lg grid-cols-3 gap-4">
            {[
              { k: "10+", v: "Boats" },
              { k: "4.8★", v: "Avg Rating" },
              { k: "100%", v: "Cold Chain" },
            ].map((s) => (
              <div
                key={s.v}
                className="rounded-2xl border border-slate-200 bg-white/80 p-4 text-center shadow-sm transition hover:-translate-y-0.5"
              >
                <div className="text-2xl font-bold text-slate-900">{s.k}</div>
                <div className="text-xs text-slate-500">{s.v}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 shadow-xl">
          {slides.map((s, i) => (
            <div
              key={s.title}
              className={`absolute inset-0 transition-opacity duration-700 ease-out ${
                i === idx ? "opacity-100" : "opacity-0"
              }`}
              aria-hidden={i !== idx}
            >
              <img
                src={s.img}
                alt={s.title}
                className="h-full w-full object-cover"
                draggable="false"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

              <div className="absolute left-4 top-4">
                <div className="rounded-xl bg-rose-600 px-3 py-1.5 text-sm font-bold text-white shadow-lg">
                  {s.discount}
                </div>
              </div>

              <div className="absolute bottom-4 left-4 right-4">
                <div className="rounded-2xl bg-white/90 p-4 backdrop-blur shadow">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-semibold text-sky-700">{s.tag}</div>
                      <div className="text-sm font-bold text-slate-900">{s.promoText}</div>
                      <div className="text-xs text-slate-600">{s.subtitle}</div>
                      <div className="mt-2 inline-flex items-center gap-2">
                        <span className="rounded-md bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-700">
                          Code: {s.code}
                        </span>
                        <span className="text-xs text-slate-500">Apply at checkout</span>
                      </div>
                    </div>
                    <Link
                      to={s.cta.to}
                      className="shrink-0 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:opacity-90 active:translate-y-0"
                    >
                      {s.cta.label}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
            <div className="flex items-center gap-2">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIdx(i)}
                  className={`h-2.5 w-2.5 rounded-full transition ${
                    i === idx ? "bg-white" : "bg-white/50 hover:bg-white/80"
                  }`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <svg className="block w-full text-sky-50" viewBox="0 0 1440 80" preserveAspectRatio="none">
        <path
          fill="currentColor"
          d="M0,64L48,64C96,64,192,64,288,58.7C384,53,480,43,576,37.3C672,32,768,32,864,42.7C960,53,1056,75,1152,80C1248,85,1344,75,1392,69.3L1440,64L1440,80L0,80Z"
        />
      </svg>
    </section>
  );
}

function CategorySection() {
  const categories = useMemo(
    () => [
      { name: "FISH", slug: "fish", img: "https://www.oceancare.org/wp-content/uploads/2023/10/shutterstock_2151164471_Taras-Shparhala.jpg" },
      { name: "CRAB", slug: "crab", img: "https://bringmaalu.lk/cdn/shop/products/IMG-20210204-WA0001.jpg?v=1612621311" },
      { name: "SHELLFISH", slug: "shellfish", img: "https://www.mussel-inn.com/wp-content/uploads/2018/06/Mussels-clams-and-prawns.jpg" },
      { name: "PRAWNS/SHRIMPS", slug: "prawn", img: "https://seafoodfactoryoutlet.com.au/wp-content/uploads/2024/09/Whole-Cooked-Prawns.jpg" },
      { name: "LOBSTER", slug: "lobster", img: "https://lobsteranywhere.com/wp-content/uploads/2013/10/Live-Lobsters-For-Sale-1535x1024.jpg" },
      { name: "SQUID", slug: "squid", img: "https://media.sciencephoto.com/image/h1104023/400wm" },
      { name: "IMPORTED SEAFOOD", slug: "imported", img: "https://media.fisheries.noaa.gov/dam-migration/shutterstock-seafood-display-in-market-750x500.jpg" },
      { name: "OTHER", slug: "other", img: "https://www.allrecipes.com/thmb/N104Tn_L-bXuNxozTT7tg007bhA=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/IMG_1122__90605.1633465971-e42410e5e88f4b52ba973b537a23e25e.jpg" },
    ],
    []
  );

  return (
    <section id="categories" className="relative isolate bg-white py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <SectionHeader title="BROWSE OUR CATEGORIES" />

        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-10 md:gap-14">
          {categories.map((c) => (
            <Link
              key={c.slug}
              to={`/products?category=${encodeURIComponent(c.slug)}`}
              className="group flex w-[150px] flex-col items-center md:w-[200px]"
              aria-label={`Browse ${c.name}`}
            >
              <div className="h-[150px] w-[150px] overflow-hidden rounded-full border border-slate-200 bg-white shadow-sm transition-transform duration-300 group-hover:scale-[1.04] md:h-[200px] md:w-[200px]">
                <img src={c.img} alt={c.name} className="h-full w-full object-cover" loading="lazy" draggable="false" />
              </div>
              <span className="mt-4 w-full truncate text-center text-sm font-semibold tracking-wide text-slate-700 md:text-base" title={c.name}>
                {c.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function TrendingSection() {
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [err, setErr] = useState("");
  const [refreshedAt, setRefreshedAt] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(import.meta.env.VITE_BACKEND_URL + "/api/product/all");
        const json = await res.json();
        const list = Array.isArray(json?.data) ? json.data : [];

        const pickImg = (p) => p?.imageUrl || (Array.isArray(p?.images) ? p.images[0] : null) || p?.thumbnail || null;

        const discountPct = (p) => {
          const price = Number(p?.price);
          const was = Number(p?.compareAtPrice || p?.mrp);
          if (!price || !was || was <= price) return 0;
          return Math.round(((was - price) / was) * 100);
        };

        const rating = (p) => Number(p?.rating || p?.avgRating || 0);
        const ordersToday = (p) => Number(p?.ordersToday || p?.salesLast24h || 0);
        const views7d = (p) => Number(p?.views7d || p?.views || 0);
        const stock = (p) => Number(p?.stock || p?.qty || 0);

        const score = (p) => {
          const o = ordersToday(p);
          const v = views7d(p);
          const r = rating(p);
          const d = discountPct(p);
          const s = stock(p);
          const lowStockBoost = s > 0 ? Math.max(0, 10 - Math.min(10, s)) : 0;
          return o * 3 + v * 0.02 + r * 4 + d * 0.5 + lowStockBoost;
        };

        const enriched = list
          .filter((p) => p && (p.isActive ?? true))
          .map((p) => ({
            raw: p,
            id: p?.productId || p?._id || p?.id || p?.slug || String(p?.name || "item"),
            name: p?.name || "Unnamed Product",
            img: pickImg(p) || "https://images.unsplash.com/photo-1523419409543-8fcf3a4e5a9f?q=80&w=1600&auto=format&fit=crop",
            tag: p?.category || "Fresh",
            price: p?.price != null ? Number(p.price) : null,
            wasPrice: p?.compareAtPrice || p?.mrp ? Number(p?.compareAtPrice || p?.mrp) : null,
            discount: discountPct(p),
            rating: rating(p),
            reviewsCount: Number(p?.reviewsCount || p?.ratingsCount || 0),
            ordersToday: ordersToday(p),
            stock: stock(p),
            score: score(p),
          }));

        const top = enriched.sort((a, b) => b.score - a.score).slice(0, 4);

        if (mounted) {
          setItems(top);
          setLoaded(true);
          const now = new Date();
          setRefreshedAt(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
        }
      } catch (e) {
        if (mounted) {
          setErr("Could not load trending products.");
          setLoaded(true);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section id="trending" className="bg-gradient-to-b from-sky-50 to-white py-12 md:py-16 scroll-mt-[80px]">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <SectionHeader title="TRENDING TODAY" subtitle={refreshedAt ? `Freshest best-sellers • updated ${refreshedAt}` : "Freshest best-sellers"} />

        <div className="flex justify-center">
          <Link
            to="/products"
            className="inline-block rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-white"
          >
            View all
          </Link>
        </div>

        {!loaded && (
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-[340px] rounded-2xl border border-slate-200 bg-white p-4 shadow-sm animate-pulse">
                <div className="h-44 w-full rounded-xl bg-slate-200" />
                <div className="mt-4 space-y-3">
                  <div className="h-4 w-1/2 rounded bg-slate-200" />
                  <div className="h-4 w-1/3 rounded bg-slate-200" />
                  <div className="h-8 w-24 rounded bg-slate-200" />
                </div>
              </div>
            ))}
          </div>
        )}

        {loaded && err && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {err}
          </div>
        )}

        {loaded && !err && (
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((p) => {
              const lowStock = p.stock > 0 && p.stock <= 10;
              const hasDeal = p.discount > 0;
              const priceText = p.price != null ? `Rs ${p.price.toLocaleString()}` : "See price";
              return (
                <Link
                  to={`/overview/${encodeURIComponent(p.id)}`}
                  key={p.id}
                  className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="absolute left-3 top-3 z-10 flex flex-col gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-600/90 px-2 py-0.5 text-[10px] font-bold text-white shadow">
                      <span className="animate-pulse">🔥</span> Trending
                    </span>
                    {lowStock && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/90 px-2 py-0.5 text-[10px] font-bold text-white shadow">
                        ⚡ Selling fast
                      </span>
                    )}
                    {hasDeal && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600/90 px-2 py-0.5 text-[10px] font-bold text-white shadow">
                        {p.discount}% OFF
                      </span>
                    )}
                  </div>

                  <div className="aspect-[4/3] w-full overflow-hidden">
                    <img
                      src={p.img}
                      alt={p.name}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>

                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-slate-900 line-clamp-1">{p.name}</h3>
                      <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-700">
                        {p.tag}
                      </span>
                    </div>

                    <div className="mt-1 text-lg font-bold text-blue-600">
                      {priceText}{" "}
                      {p.wasPrice && p.wasPrice > (p.price || 0) && (
                        <span className="ml-2 text-xs text-slate-400 line-through">
                          Rs {p.wasPrice.toLocaleString()}
                        </span>
                      )}
                    </div>

                    <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                      {p.rating > 0 && (
                        <span aria-label={`${p.rating} stars`}>
                          {"★".repeat(Math.round(p.rating))} {"☆".repeat(5 - Math.round(p.rating))}
                        </span>
                      )}
                      {p.reviewsCount > 0 && <span>({p.reviewsCount})</span>}
                      {p.ordersToday > 0 && (
                        <span className="ml-auto text-rose-600 font-semibold">
                          {p.ordersToday} ordered today
                        </span>
                      )}
                    </div>

                    {lowStock && (
                      <div className="mt-3">
                        <div className="mb-1 flex items-center justify-between text-[10px] text-slate-500">
                          <span>Only {p.stock} left</span>
                          <span>Hurry</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full bg-amber-500 transition-[width] duration-700"
                            style={{ width: `${Math.max(5, (p.stock / 10) * 100)}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs text-slate-500">Tap to view</span>
                      <span className="translate-x-0 transition group-hover:translate-x-1">→</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

function ContactSection() {
  return (
    <section className="relative isolate overflow-hidden bg-white py-12 md:py-16" id="contact">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <SectionHeader title="CONTACT US" subtitle="Questions about today’s catch, bulk orders, or delivery? We’d love to help." />

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <form className="mt-2 space-y-4 rounded-2xl border border-slate-200 bg-slate-50/50 p-4 shadow-sm" onSubmit={(e) => e.preventDefault()}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <input className="rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none ring-2 ring-transparent transition focus:border-sky-300 focus:ring-sky-200" placeholder="Full name" />
                <input type="email" className="rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none ring-2 ring-transparent transition focus:border-sky-300 focus:ring-sky-200" placeholder="Email" />
              </div>
              <input className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none ring-2 ring-transparent transition focus:border-sky-300 focus:ring-sky-200" placeholder="Subject" />
              <textarea className="h-28 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none ring-2 ring-transparent transition focus:border-sky-300 focus:ring-sky-200" placeholder="Your message…" />
              <button className="w-full rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:opacity-90 active:translate-y-0" type="button">
                Send Message
              </button>
              <p className="text-xs text-slate-500">By contacting us, you agree to our terms & privacy policy.</p>
            </form>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 shadow-xl">
            <img
              src="https://cfhc.gov.lk/cfhc_admin/upload/539_image3.jpg"
              alt="Our docks and partner boats"
              className="h-full w-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 rounded-xl bg-white/85 p-4 backdrop-blur">
              <div className="text-sm font-semibold text-slate-800">Office</div>
              <div className="text-xs text-slate-600">Fisheries Harbour, Galle • Mon–Sat 7:00–18:00</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ===================== UPDATED REVIEWS SECTION (FULL-BLEED MARQUEE) ===================== */
function ReviewsSection() {
  // Real reviews (5-star only), aggregated from products
  const [reviews, setReviews] = useState([]);
  const [loaded, setLoaded] = useState(false);

  // Helper: initials from name/email
  const initials = (name) => {
    const n = (name || "Customer").trim();
    const parts = n.replace(/\s+/g, " ").split(" ").filter(Boolean);
    if (parts.length === 1) {
      const p = parts[0];
      if (p.includes("@")) return p[0]?.toUpperCase() || "C";
      return (p[0] || "C").toUpperCase();
    }
    return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // 1) Get all products to know productIds
        const prodRes = await fetch(import.meta.env.VITE_BACKEND_URL + "/api/product/all");
        const prodJson = await prodRes.json();
        const products = Array.isArray(prodJson?.data) ? prodJson.data : [];

        // 2) For each product, fetch its reviews and keep only 5★
        const allReviews = [];
        await Promise.all(
          products.map(async (p) => {
            const pid = p?.productId;
            if (!pid) return;
            try {
              const r = await fetch(
                `${import.meta.env.VITE_BACKEND_URL}/api/review/${encodeURIComponent(pid)}`
              );
              const j = await r.json();
              const list = Array.isArray(j?.data) ? j.data : [];
              list
                .filter((rv) => Number(rv?.rating) === 5)
                .forEach((rv) => {
                  allReviews.push({
                    name:
                      rv?.user?.name ||
                      (rv?.user?.email ? rv.user.email.split("@")[0] : "Customer"),
                    text: rv?.comment || "★★★★★",
                    createdAt: rv?.createdAt || null,
                  });
                });
            } catch {
              // ignore single-product review errors
            }
          })
        );

        // Sort newest first, cap to 18 for the slider
        allReviews.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        const top = allReviews.slice(0, 18);

        if (mounted) {
          setReviews(top);
          setLoaded(true);
        }
      } catch {
        if (mounted) {
          setReviews([]);
          setLoaded(true);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section className="bg-gradient-to-b from-white to-sky-50 py-12 md:py-16" id="reviews">
      {/* Header stays centered in the normal container */}
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <SectionHeader
          title="WHAT CUSTOMERS SAY"
          subtitle="Real feedback from happy seafood lovers"
        />
      </div>

      {/* Full-bleed marquee strip (edge to edge) */}
      {!loaded && (
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 shrink-0 rounded-full bg-sky-100" />
                  <div className="h-4 w-32 rounded bg-slate-200" />
                </div>
                <div className="mt-3 h-16 rounded bg-slate-100" />
                <div className="mt-3 h-4 w-16 rounded bg-slate-200" />
              </div>
            ))}
          </div>
        </div>
      )}

      {loaded && reviews.length === 0 && (
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 text-center text-slate-600">
            No 5-star reviews yet. Check back soon!
          </div>
        </div>
      )}

      {loaded && reviews.length > 0 && (
        <div className="relative mt-6 overflow-hidden -mx-4 lg:-mx-8">
          {/* left/right edge fades for a polished look */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-sky-50 to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-sky-50 to-transparent" />

          {/* Track: duplicate list to get seamless loop */}
          <div className="flex gap-4 px-4 lg:px-8 animate-marquee will-change-transform">
            {[...reviews, ...reviews].map((r, i) => (
              <div
                key={`${r.name}-${i}`}
                className="w-[280px] sm:w-[320px] md:w-[360px] shrink-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 shrink-0 rounded-full bg-sky-100 grid place-items-center text-sky-700 font-bold">
                    {initials(r.name)}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">{r.name}</div>
                    <div className="text-xs text-slate-500">Verified Buyer</div>
                  </div>
                </div>
                <p className="mt-3 text-slate-700 line-clamp-4">{r.text}</p>
                <div className="mt-3 text-sky-600">★★★★★</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* styles for the continuous marquee */}
      <style>{`
        /* Make the track width fit content so translateX works predictably */
        .animate-marquee {
          width: max-content;
          animation: marquee 40s linear infinite;
        }
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  );
}
/* =================== END UPDATED REVIEWS SECTION (FULL-BLEED) =================== */


function LandingPage() {
  return (
    <main className="animate-[fadeIn_0.5s_ease]">
      <section id="hero">
        <HeroSection />
      </section>

      <section>
        <CategorySection />
      </section>

      <section id="trending">
        <TrendingSection />
      </section>

      <ContactSection />

      <ReviewsSection />

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <Footer />
    </main>
  );
}

export default function HomePage() {
  return (
    <div className="w-full h-screen">
      <Header />
      <div className="w-full h-[calc(100vh-75px)] min-h-[calc(100vh-75px)] overflow-y-auto">
        <Routes path="/*">
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/overview/:id" element={<ProductOverview />} />
          
          
          <Route path="/cart" element={   <CartPage /> } />
          <Route path="/checkout" element={
            <ProtectedRoute>
              <Checkout />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="/orders" element={
            <EnhancedRoleProtectedRoute>
              <MyOrdersPage />
            </EnhancedRoleProtectedRoute>
          } />
        
          {/* Catch all route */}
          <Route path="/*" element={<NotFoundPage />} />
        </Routes>
      </div>
    </div>
  );
}
