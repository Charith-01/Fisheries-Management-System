import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import {
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  Truck,
  Package,
  CreditCard,
  Calendar,
  Copy as CopyIcon,
} from "lucide-react";
import toast from "react-hot-toast";

// ✅ add footer (no changes inside footer.jsx)
import Footer from "../../components/footer";

/* ------------------------------ helpers (unchanged) ------------------------------ */

const norm = (s) => String(s || "").trim().toLowerCase();

const isPaid = (o) =>
  norm(o.status) === "paid" || norm(o.paymentStatus) === "succeeded";

const isCancelled = (o) =>
  norm(o.status).includes("cancel") || norm(o.paymentStatus) === "failed";

const isPayable = (o) =>
  !isPaid(o) && !isCancelled(o) && Number(o.total || 0) > 0;

// NEW: processed = delivered/completed (matches your tab)
const isProcessed = (o) =>
  ["delivered", "completed"].includes(norm(o.status));

const fmtMoney = (n) => `Rs. ${Number(n || 0).toLocaleString()}`;
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : "-");

/* ------------------------------ small UI bits ------------------------------ */

function Badge({ children, variant = "default" }) {
  const base =
    "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1";
  const theme =
    variant === "success"
      ? "bg-green-50 text-green-700 ring-green-200"
      : variant === "warning"
      ? "bg-amber-50 text-amber-700 ring-amber-200"
      : variant === "danger"
      ? "bg-rose-50 text-rose-700 ring-rose-200"
      : variant === "info"
      ? "bg-blue-50 text-blue-700 ring-blue-200"
      : "bg-slate-50 text-slate-700 ring-slate-200";
  return <span className={`${base} ${theme}`}>{children}</span>;
}

function StatusChip({ order }) {
  if (isCancelled(order)) {
    return (
      <Badge variant="danger">
        <span className="mr-1.5 inline-flex"><XCircle className="h-3.5 w-3.5" /></span>
        Cancelled
      </Badge>
    );
  }
  const s = norm(order.status);
  if (["delivered", "completed"].includes(s)) {
    return (
      <Badge variant="success">
        <span className="mr-1.5 inline-flex"><CheckCircle2 className="h-3.5 w-3.5" /></span>
        Completed
      </Badge>
    );
  }
  if (s === "shipped") {
    return (
      <Badge variant="info">
        <span className="mr-1.5 inline-flex"><Truck className="h-3.5 w-3.5" /></span>
        Shipped
      </Badge>
    );
  }
  if (isPaid(order)) {
    return (
      <Badge variant="success">
        <span className="mr-1.5 inline-flex"><CreditCard className="h-3.5 w-3.5" /></span>
        Paid
      </Badge>
    );
  }
  return <Badge>Pending</Badge>;
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden ring-1 ring-slate-200 bg-white shadow-sm animate-pulse">
      <div className="h-9 bg-slate-50" />
      <div className="p-4 flex items-center gap-3 text-sm">
        <div className="h-4 w-36 bg-slate-200 rounded" />
        <div className="h-4 w-48 bg-slate-200 rounded" />
        <div className="ml-auto h-4 w-24 bg-slate-200 rounded" />
      </div>
      <div className="px-4 py-4 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-16 w-16 rounded-lg bg-slate-200" />
          <div className="space-y-2">
            <div className="h-4 w-40 bg-slate-200 rounded" />
            <div className="h-3 w-56 bg-slate-200 rounded" />
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="space-y-2">
            <div className="h-3 w-10 bg-slate-200 rounded" />
            <div className="h-5 w-24 bg-slate-200 rounded" />
          </div>
          <div className="h-9 w-24 bg-slate-200 rounded-full" />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ component ------------------------------ */

export default function MyOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // purely UI states
  const [activeTab, setActiveTab] = useState("all"); // all | pay | toship | shipped | processed
  const [period, setPeriod] = useState("all"); // UI-only, no backend change
  const navigate = useNavigate();

  // Track orders that have already received a review (persisted by productOverview after submit)
  const [reviewedOrders, setReviewedOrders] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("reviewedOrders") || "[]");
    } catch {
      return [];
    }
  });

  // Keep in sync if another tab updates localStorage (not strictly required, but nice)
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "reviewedOrders") {
        try {
          setReviewedOrders(JSON.parse(e.newValue || "[]"));
        } catch {
          setReviewedOrders([]);
        }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Read current user email from localStorage (as stored by your app)
  const currentEmail = useMemo(() => {
    try {
      const raw =
        localStorage.getItem("customer") ||
        localStorage.getItem("user") ||
        localStorage.getItem("auth_user");
      if (!raw) return null;
      const obj = JSON.parse(raw);
      return obj?.email || obj?.user?.email || null;
    } catch {
      return null;
    }
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/order/all");
      const list = Array.isArray(res.data) ? res.data : res.data.orders || [];
      // Server should restrict, but filter again by email for safety
      const mine = currentEmail ? list.filter((o) => o.email === currentEmail) : list;
      setOrders(mine);
      setFiltered(mine);
    } catch (e) {
      console.error(e);
      if (e.response?.status === 401 || e.response?.status === 403) {
        toast.error("Please log in to view your orders.");
        navigate("/login");
      } else {
        toast.error("Failed to load your orders.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(orders);
    } else {
      const s = search.toLowerCase();
      setFiltered(
        orders.filter(
          (o) =>
            o.orderId?.toLowerCase().includes(s) ||
            o.status?.toLowerCase().includes(s) ||
            o.paymentStatus?.toLowerCase().includes(s)
        )
      );
    }
  }, [search, orders]);

  // --- counts for tabs (UI only) ---
  const toPayCount = useMemo(() => orders.filter(isPayable).length, [orders]);
  const toShipCount = useMemo(
    () =>
      orders.filter(
        (o) => isPaid(o) && ["pending", "processing"].includes(norm(o.status))
      ).length,
    [orders]
  );
  const shippedCount = useMemo(
    () => orders.filter((o) => norm(o.status) === "shipped").length,
    [orders]
  );
  const processedCount = useMemo(
    () =>
      orders.filter((o) =>
        ["delivered", "completed"].includes(norm(o.status))
      ).length,
    [orders]
  );

  // derive list by tab (UI only; does not change underlying logic)
  const tabbed = useMemo(() => {
    switch (activeTab) {
      case "pay":
        return filtered.filter(isPayable);
      case "toship":
        return filtered.filter(
          (o) => isPaid(o) && ["pending", "processing"].includes(norm(o.status))
        );
      case "shipped":
        return filtered.filter((o) => norm(o.status) === "shipped");
      case "processed":
        return filtered.filter((o) =>
          ["delivered", "completed"].includes(norm(o.status))
        );
      default:
        return filtered;
    }
  }, [filtered, activeTab]);

  const copyId = async (id) => {
    try {
      await navigator.clipboard.writeText(id);
      toast.success("Order ID copied");
    } catch {
      toast.error("Failed to copy");
    }
  };

  // simple label like "Completed" section in screenshot
  const sectionLabelFor = (o) => {
    const s = norm(o.status);
    if (isCancelled(o)) return "Cancelled";
    if (["delivered", "completed"].includes(s)) return "Completed";
    if (s === "shipped") return "Shipped";
    if (isPaid(o)) return "Paid";
    return "Pending";
  };

  // first order item (for summary row)
  const firstItem = (o) =>
    Array.isArray(o.billItems) && o.billItems.length ? o.billItems[0] : null;

  return (
    // ✅ Page shell so the footer sits at the bottom everywhere
    <div className="min-h-screen flex flex-col bg-white">
      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 py-6">
          {/* Heading */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900">My Orders</h1>
            <p className="mt-1 text-sm text-slate-600">
              Track payments, shipping status, and past purchases.
            </p>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-2 text-sm font-medium overflow-x-auto no-scrollbar">
            {[
              { k: "all", label: "All", count: orders.length },
              { k: "pay", label: "To Pay", count: toPayCount },
              { k: "toship", label: "To Ship", count: toShipCount },
              { k: "shipped", label: "Shipped", count: shippedCount },
              { k: "processed", label: "Processed", count: processedCount },
            ].map((t) => {
              const active = activeTab === t.k;
              return (
                <button
                  key={t.k}
                  onClick={() => setActiveTab(t.k)}
                  className={`px-4 py-2 rounded-full border text-sm transition ${
                    active
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {t.label}
                  <span className="ml-2 text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                    {t.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search + filters */}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <div className="relative flex">
              <div className="flex items-center rounded-l-xl border-y border-l border-slate-300 bg-white px-3 text-sm text-slate-700">
                <Package className="h-4 w-4 mr-1.5" />
                Order
              </div>
              <input
                type="text"
                placeholder="Order ID, product or store name"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 w-72 sm:w-96 rounded-r-xl border-y border-r border-slate-300 bg-white pl-3 pr-10 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/30"
              />
              <Search className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            </div>

            <div className="ml-auto flex items-center gap-2">
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-800 focus:ring-2 focus:ring-blue-500/30"
              >
                <option value="all">All / Last year</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="365d">Last year</option>
              </select>

              <button
                onClick={fetchOrders}
                className="h-10 w-10 grid place-items-center rounded-xl bg-slate-100 hover:bg-slate-200 ring-1 ring-slate-200"
                title="Refresh"
                aria-label="Refresh orders"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="min-h-[40vh] flex flex-col gap-4 justify-center">
              <div className="mx-auto flex items-center gap-2 text-slate-500">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Loading your orders…</span>
              </div>
              <div className="space-y-4">
                <SkeletonCard />
                <SkeletonCard />
              </div>
            </div>
          ) : tabbed.length === 0 ? (
            <div className="mt-6 rounded-2xl p-8 bg-white shadow ring-1 ring-slate-200 text-center">
              <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-slate-100">
                <Package className="h-6 w-6 text-slate-400" />
              </div>
              <p className="text-slate-700 font-medium">No orders found</p>
              <p className="mt-1 text-sm text-slate-500">
                When you place an order, it will appear here.
              </p>
              <Link
                to="/products"
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500/30"
              >
                Shop Products
              </Link>
            </div>
          ) : (
            <div className="mt-4 space-y-6">
              {tabbed.map((o) => {
                const it = firstItem(o);
                const statusLabel = sectionLabelFor(o);
                const isReviewed = reviewedOrders.includes(o.orderId);

                return (
                  <div
                    key={o._id}
                    className="rounded-2xl overflow-hidden ring-1 ring-slate-200 bg-white shadow-sm"
                  >
                    {/* Section label */}
                    <div className="px-4 py-3 text-sm font-semibold bg-slate-50 flex items-center gap-3">
                      <StatusChip order={o} />
                      <span className="text-slate-700">{statusLabel}</span>
                    </div>

                    {/* top meta row */}
                    <div className="px-4 py-3 flex flex-wrap items-center gap-3 text-sm">
                      <div className="text-slate-700 flex items-center gap-1.5">
                        <Calendar className="h-4 w-4 opacity-70" />
                        Order date: <span className="font-medium">{fmtDate(o.date)}</span>
                      </div>
                      <div className="text-slate-700 flex items-center gap-1.5">
                        <span>Order ID:</span>
                        <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                          {o.orderId}
                        </span>
                        <button
                          onClick={() => copyId(o.orderId)}
                          className="inline-flex items-center gap-1 text-blue-700 hover:underline"
                          aria-label="Copy order ID"
                        >
                          <CopyIcon className="h-3.5 w-3.5" />
                          Copy
                        </button>
                      </div>
                      <Link
                        to={`/checkout/success?orderId=${o.orderId}`}
                        className="ml-auto text-slate-900 hover:underline"
                        title="Order details"
                      >
                        Order details
                      </Link>
                    </div>

                    {/* item summary row */}
                    <div className="px-4 py-4 border-t border-slate-100 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-16 w-16 rounded-xl bg-slate-100 overflow-hidden shrink-0 ring-1 ring-slate-200">
                          {it?.image ? (
                            <img
                              src={it.image}
                              alt={it.productName}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full grid place-items-center text-slate-400">
                              <Package className="h-6 w-6" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium text-slate-900">
                            {it?.productName || "Order items"}
                          </div>
                          {it && (
                            <div className="text-xs text-slate-500">
                              {it?.variant || it?.productId || ""}{" "}
                              {it?.quantity ? ` • x${Number(it.quantity)}` : ""}{" "}
                              {it?.price ? ` • ${fmtMoney(it.price)}` : ""}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-6 shrink-0">
                        <div className="text-right">
                          <div className="text-[10px] tracking-wide text-slate-500 uppercase">
                            Total
                          </div>
                          <div className="text-base font-semibold text-slate-900">
                            {fmtMoney(o.total)}
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-stretch gap-2">
                         {isPayable(o) ? (
                                <Link
                                  to={`/payment?orderId=${o.orderId}`}
                                  className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-full bg-orange-500 text-white hover:bg-orange-600 focus:ring-2 focus:ring-orange-500/30"
                                  onClick={(e) => {
                                    e.stopPropagation(); // Prevent event bubbling
                                    e.preventDefault(); // Prevent default link behavior
                                    // Force navigation
                                    window.location.href = `/payment?orderId=${o.orderId}`;
                                  }}
                                >
                                  <CreditCard className="h-4 w-4" />
                                  Pay
                                </Link>
                              ) : null}

                          {/* NEW: Make Review button (only when processed) */}
                          {isProcessed(o) && it?.productId ? (
                            isReviewed ? (
                              <span
                                className="inline-flex items-center justify-center px-5 py-2 rounded-full bg-slate-400 text-white cursor-not-allowed"
                                title="You've already reviewed this order"
                              >
                                Reviewed
                              </span>
                            ) : (
                              <Link
                                to={`/overview/${encodeURIComponent(it.productId)}?review=1&orderId=${encodeURIComponent(o.orderId)}`}
                                className="inline-flex items-center justify-center px-5 py-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500/30"
                                title="Write a review for this product"
                              >
                                Make review
                              </Link>
                            )
                          ) : null}

                          <Link
                            to={`/checkout/success?orderId=${o.orderId}`}
                            className="inline-flex items-center justify-center px-5 py-2 rounded-full border border-slate-300 text-slate-800 hover:bg-slate-50 focus:ring-2 focus:ring-slate-500/20"
                          >
                            View
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
