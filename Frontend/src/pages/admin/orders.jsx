// pages/admin/orders.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import api from "../../api/axios";
import {
  Search,
  RefreshCw,
  Eye,
  X,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";

/* --------------------------- helpers --------------------------- */

const norm = (s) => String(s || "").trim().toLowerCase();
const fmtMoney = (n) => `Rs. ${Number(n || 0).toLocaleString()}`;
const fmtDate = (d) => (d ? new Date(d).toLocaleString() : "-");

// Payment status is separate and authoritative
const isPaymentSucceeded = (o) => norm(o.paymentStatus) === "succeeded";
const isPaymentPending = (o) => norm(o.paymentStatus) === "pending";
const isPaymentFailed = (o) => norm(o.paymentStatus) === "failed";

// Order lifecycle (independent of payment)
const isOrderPending = (o) => norm(o.status) === "pending";

// Canonical order statuses (admin can change these)
const ORDER_STATUS_OPTIONS = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"];

// Payment filter options for UI
const PAYMENT_FILTER_OPTIONS = ["all", "pending", "succeeded", "failed"];

/* --------------------------- component --------------------------- */

export default function AdminOrdersPage({ darkMode }) {
  const [orders, setOrders] = useState([]);
  const [filtered, setFiltered] = useState([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");     // order status
  const [paymentFilter, setPaymentFilter] = useState("all");   // payment status

  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(""); // track row-level action
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeOrder, setActiveOrder] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/order/all");
      const list = Array.isArray(res.data) ? res.data : res.data.orders || [];
      setOrders(list);
      setFiltered(list);
    } catch (e) {
      console.error(e);
      toast.error("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  // filter + search (order status + payment status + query)
  useEffect(() => {
    let base = [...orders];

    if (statusFilter !== "all") {
      const s = norm(statusFilter);
      base = base.filter((o) => norm(o.status) === s);
    }

    if (paymentFilter !== "all") {
      const p = norm(paymentFilter);
      base = base.filter((o) => norm(o.paymentStatus) === p);
    }

    if (search.trim()) {
      const s = norm(search);
      base = base.filter(
        (o) =>
          norm(o.orderId).includes(s) ||
          norm(o.email).includes(s) ||
          norm(o.name).includes(s) ||
          norm(o.status).includes(s) ||
          norm(o.paymentStatus).includes(s)
      );
    }

    setFiltered(base);
  }, [orders, search, statusFilter, paymentFilter]);

  // Ensure strong contrast for payment badge in light + dark
  const paymentBadge = (o) => {
    if (isPaymentSucceeded(o)) {
      return "bg-green-100 text-green-700 dark:bg-emerald-900/50 dark:text-emerald-300";
    }
    if (isPaymentFailed(o)) {
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-200";
    }
    // Pending / unknown
    return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200";
  };

  const handleView = async (orderId) => {
    try {
      setDetailsLoading(true);
      setDrawerOpen(true);
      const res = await api.get(`/api/order/${encodeURIComponent(orderId)}`);
      setActiveOrder(res.data);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load order details");
      setDrawerOpen(false);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleStatusChange = async (orderId, status) => {
    try {
      setBusyId(orderId);
      await api.put(`/api/order/status/${encodeURIComponent(orderId)}`, { status });
      toast.success("Order status updated");
      await loadOrders();

      if (activeOrder?.orderId === orderId) {
        const res = await api.get(`/api/order/${encodeURIComponent(orderId)}`);
        setActiveOrder(res.data);
      }
    } catch (e) {
      console.error(e);
      toast.error(e?.response?.data?.message || "Failed to update status");
    } finally {
      setBusyId("");
    }
  };

  const handleCancel = async (order) => {
    if (!isOrderPending(order)) {
      toast.error("Only pending orders can be cancelled");
      return;
    }
    if (!confirm(`Cancel order ${order.orderId}?`)) return;
    try {
      setBusyId(order.orderId);
      await api.post(`/api/order/cancel/${encodeURIComponent(order.orderId)}`);
      toast.success("Order cancelled");
      await loadOrders();
      if (activeOrder?.orderId === order.orderId) {
        const res = await api.get(`/api/order/${encodeURIComponent(order.orderId)}`);
        setActiveOrder(res.data);
      }
    } catch (e) {
      console.error(e);
      toast.error(e?.response?.data?.message || "Failed to cancel order");
    } finally {
      setBusyId("");
    }
  };

  const totalPaid = useMemo(
    () => filtered.filter(isPaymentSucceeded).reduce((s, o) => s + Number(o.total || 0), 0),
    [filtered]
  );

  const showRefreshBar = loading && orders.length > 0;

  return (
    <div className={`space-y-4 ${darkMode ? "dark text-slate-100" : ""}`}>
      {/* header / filters */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-bold">Orders</h1>
          <p className="text-sm text-slate-500">
            Total: {filtered.length} • Paid Amount:{" "}
            <span className="font-semibold">{fmtMoney(totalPaid)}</span>
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by order, email, name, status…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`pl-9 pr-3 py-2 rounded-xl border text-sm focus:ring-blue-500 focus:border-blue-500 outline-none w-72 ${
                darkMode ? "bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-400" : "border-slate-300"
              }`}
              aria-label="Search orders"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`rounded-xl border bg-white px-3 py-2 text-sm outline-none ${
                darkMode ? "bg-slate-800 border-slate-700 text-slate-100" : "border-slate-300"
              }`}
              title="Order status"
              aria-label="Filter by order status"
            >
              <option value="all">All order statuses</option>
              {ORDER_STATUS_OPTIONS.map((s) => (
                <option key={s} value={norm(s)}>
                  {s}
                </option>
              ))}
            </select>

            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className={`rounded-xl border bg-white px-3 py-2 text-sm outline-none ${
                darkMode ? "bg-slate-800 border-slate-700 text-slate-100" : "border-slate-300"
              }`}
              title="Payment status"
              aria-label="Filter by payment status"
            >
              {PAYMENT_FILTER_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {p === "all" ? "All payment statuses" : p}
                </option>
              ))}
            </select>

            <button
              onClick={loadOrders}
              className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-slate-200 ${
                darkMode ? "bg-slate-700 text-slate-100 hover:bg-slate-600" : "bg-slate-100"
              }`}
              title="Refresh"
              aria-label="Refresh orders"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* subtle refresh bar when reloading with data present */}
      {showRefreshBar && <div className="h-0.5 w-full animate-pulse bg-blue-500/60 rounded" />}

      {/* table */}
      <div
        className={`overflow-x-auto rounded-2xl shadow ring-1 ${
          darkMode ? "bg-slate-800 ring-slate-700" : "bg-white ring-slate-200"
        }`}
      >
        <table className="min-w-full text-sm">
          <thead
            className={`text-left text-xs uppercase tracking-wide ${
              darkMode ? "bg-slate-700 text-slate-200" : "bg-slate-100 text-slate-600"
            }`}
          >
            <tr>
              <th className="px-4 py-3">Order ID</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Order Status</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className={darkMode ? "divide-y divide-slate-700" : "divide-y divide-slate-200"}>
            {loading && orders.length === 0 ? (
              <>
                {Array.from({ length: 8 }).map((_, i) => (
                  <tr key={`sk-${i}`} className="animate-pulse">
                    <td className="px-4 py-3">
                      <div className={`h-3 w-24 rounded ${darkMode ? "bg-slate-700" : "bg-slate-200"}`} />
                    </td>
                    <td className="px-4 py-3">
                      <div className={`h-3 w-32 rounded ${darkMode ? "bg-slate-700" : "bg-slate-200"}`} />
                      <div className={`mt-2 h-2.5 w-40 rounded ${darkMode ? "bg-slate-700" : "bg-slate-200"}`} />
                    </td>
                    <td className="px-4 py-3">
                      <div className={`h-3 w-20 rounded ${darkMode ? "bg-slate-700" : "bg-slate-200"}`} />
                    </td>
                    <td className="px-4 py-3">
                      <div className={`h-5 w-24 rounded-full ${darkMode ? "bg-slate-700" : "bg-slate-200"}`} />
                      <div className={`mt-2 h-2 w-28 rounded ${darkMode ? "bg-slate-800" : "bg-slate-100"}`} />
                    </td>
                    <td className="px-4 py-3">
                      <div className={`h-7 w-24 rounded ${darkMode ? "bg-slate-700" : "bg-slate-200"}`} />
                    </td>
                    <td className="px-4 py-3">
                      <div className={`h-3 w-28 rounded ${darkMode ? "bg-slate-700" : "bg-slate-200"}`} />
                    </td>
                    <td className="px-4 py-3">
                      <div className={`h-7 w-20 rounded ${darkMode ? "bg-slate-700" : "bg-slate-200"}`} />
                    </td>
                  </tr>
                ))}
              </>
            ) : filtered.length === 0 ? (
              <tr>
                <td className={`px-4 py-10 text-center ${darkMode ? "text-slate-300" : "text-slate-500"}`} colSpan={7}>
                  No orders match your filters.
                </td>
              </tr>
            ) : (
              filtered.map((o) => (
                <tr key={o._id} className={darkMode ? "hover:bg-slate-700/30" : "hover:bg-slate-50"}>
                  <td className="px-4 py-3 font-mono text-xs">{o.orderId}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{o.name || "-"}</div>
                    <div className="text-xs text-slate-500">{o.email}</div>
                  </td>
                  <td className="px-4 py-3 font-semibold">{fmtMoney(o.total)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${paymentBadge(o)}`}>
                      {(o.paymentStatus || "pending")}
                    </span>
                    {o.paymentId ? (
                      <div className="mt-1 text-[10px] text-slate-500 truncate max-w-[160px]">
                        {o.paymentId}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <InlineStatusSelect
                      current={o.status || "Pending"}
                      disabled={busyId === o.orderId}
                      onChange={(val) => handleStatusChange(o.orderId, val)}
                      darkMode={darkMode}
                    />
                  </td>
                  <td className="px-4 py-3 text-slate-500">{fmtDate(o.date)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => handleView(o.orderId)}
                        className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 ${
                          darkMode ? "text-blue-300 hover:bg-blue-900/20" : "text-blue-700 hover:bg-blue-50"
                        }`}
                        title="View details"
                        aria-label={`View details for ${o.orderId}`}
                      >
                        <Eye className="h-4 w-4" /> View
                      </button>

                      <button
                        onClick={() => handleCancel(o)}
                        disabled={!isOrderPending(o) || busyId === o.orderId}
                        className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 ${
                          isOrderPending(o)
                            ? darkMode
                              ? "text-amber-300 hover:bg-amber-900/20"
                              : "text-amber-700 hover:bg-amber-50"
                            : "text-slate-400 cursor-not-allowed"
                        }`}
                        title="Cancel (Pending only)"
                        aria-disabled={!isOrderPending(o) || busyId === o.orderId}
                      >
                        {busyId === o.orderId ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Cancel"
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* details drawer */}
      <DetailsDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        order={activeOrder}
        loading={detailsLoading}
        onStatus={(s) => activeOrder && handleStatusChange(activeOrder.orderId, s)}
        onCancel={() => activeOrder && handleCancel(activeOrder)}
        darkMode={darkMode}
      />
    </div>
  );
}

/* ----------------------- Inline status select ----------------------- */
/* Portal + proper outside-click detection */
function InlineStatusSelect({ current, onChange, disabled, darkMode }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);
  const menuRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 160 });
  const value = current || "Pending";

  useEffect(() => {
    if (!open || !btnRef.current) return;

    const update = () => {
      const r = btnRef.current.getBoundingClientRect();
      setPos({
        top: r.bottom + 4,
        left: r.left,
        width: 160, // match w-40
      });
    };

    const handleDocMouseDown = (e) => {
      if (btnRef.current?.contains(e.target)) return;
      if (menuRef.current?.contains(e.target)) return;
      setOpen(false);
    };

    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    document.addEventListener("mousedown", handleDocMouseDown);

    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
      document.removeEventListener("mousedown", handleDocMouseDown);
    };
  }, [open]);

  return (
    <div ref={btnRef} className="relative inline-block">
      <button
        onClick={() => setOpen((p) => !p)}
        disabled={disabled}
        className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs ${
          darkMode
            ? "border-slate-600 bg-slate-800 text-slate-100 hover:bg-slate-700"
            : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
        } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Change order status"
      >
        {value}
        {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            className={`overflow-hidden rounded-lg border shadow z-[9999] ${
              darkMode ? "border-slate-600 bg-slate-800 text-slate-100" : "border-slate-200 bg-white text-slate-700"
            }`}
            style={{ position: "fixed", top: pos.top, left: pos.left, width: pos.width }}
            role="menu"
          >
            {ORDER_STATUS_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => {
                  setOpen(false);
                  if (s !== value) onChange && onChange(s);
                }}
                className={`block w-full px-3 py-2 text-left text-xs ${
                  darkMode ? "hover:bg-slate-700" : "hover:bg-slate-50"
                } ${s === value ? (darkMode ? "text-sky-300 font-medium" : "text-sky-700 font-medium") : ""}`}
                role="menuitem"
              >
                {s}
              </button>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
}

/* -------------------------- Details Drawer -------------------------- */

function DetailsDrawer({ open, onClose, order, loading, onStatus, onCancel, darkMode }) {
  const badge = order
    ? isPaymentSucceeded(order)
      ? "bg-green-100 text-green-700 dark:bg-emerald-900/30 dark:text-emerald-200"
      : isPaymentFailed(order)
      ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-200"
      : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200"
    : "bg-slate-100 text-slate-600";

  return (
    <div
      className={`fixed inset-0 z-40 transition ${open ? "pointer-events-auto" : "pointer-events-none"}`}
      aria-hidden={!open}
    >
      {/* backdrop */}
      <div
        className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity ${
          open ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      {/* panel */}
      <div
        className={`absolute right-0 top-0 h-full w-full max-w-lg transform shadow-xl transition-transform ${
          open ? "translate-x-0" : "translate-x-full"
        } ${darkMode ? "bg-slate-800 text-slate-100" : "bg-white"}`}
        role="dialog"
        aria-modal="true"
      >
        <div className={`flex items-center justify-between border-b p-4 ${
          darkMode ? "border-slate-700" : "border-slate-200"
        }`}>
          <div>
            <div className="text-sm text-slate-500">Order</div>
            <div className="font-semibold">{order?.orderId || "-"}</div>
          </div>
          <button
            onClick={onClose}
            className={`rounded-lg p-2 ${darkMode ? "text-slate-300 hover:bg-slate-700/50" : "text-slate-500 hover:bg-slate-100"}`}
            aria-label="Close details"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="h-full overflow-y-auto p-4">
          {loading ? (
            <div className="space-y-4 animate-pulse">
              <div className={`rounded-2xl border p-4 shadow-sm ${darkMode ? "border-slate-700" : "border-slate-200"}`}>
                <div className="grid grid-cols-2 gap-3">
                  <div className={`h-4 w-32 rounded ${darkMode ? "bg-slate-700" : "bg-slate-200"}`} />
                  <div className={`h-4 w-24 rounded ${darkMode ? "bg-slate-700" : "bg-slate-200"}`} />
                  <div className={`h-4 w-64 rounded col-span-2 ${darkMode ? "bg-slate-700" : "bg-slate-200"}`} />
                  <div className={`h-4 w-28 rounded ${darkMode ? "bg-slate-700" : "bg-slate-200"}`} />
                  <div className={`h-4 w-24 rounded ${darkMode ? "bg-slate-700" : "bg-slate-200"}`} />
                  <div className={`h-4 w-20 rounded ${darkMode ? "bg-slate-700" : "bg-slate-200"}`} />
                  <div className={`h-4 w-28 rounded ${darkMode ? "bg-slate-700" : "bg-slate-200"}`} />
                </div>
              </div>
              <div className={`rounded-2xl border p-4 shadow-sm ${darkMode ? "border-slate-700" : "border-slate-200"}`}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <div className={`h-12 w-12 rounded-lg ${darkMode ? "bg-slate-700" : "bg-slate-200"}`} />
                      <div>
                        <div className={`h-3 w-40 rounded ${darkMode ? "bg-slate-700" : "bg-slate-200"}`} />
                        <div className={`mt-2 h-2.5 w-28 rounded ${darkMode ? "bg-slate-700" : "bg-slate-200"}`} />
                      </div>
                    </div>
                    <div className={`h-3 w-16 rounded ${darkMode ? "bg-slate-700" : "bg-slate-200"}`} />
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <div className={`h-9 w-32 rounded-xl ${darkMode ? "bg-slate-700" : "bg-slate-200"}`} />
                <div className={`h-9 w-36 rounded-xl ${darkMode ? "bg-slate-700" : "bg-slate-200"}`} />
              </div>
            </div>
          ) : !order ? (
            <div className="text-slate-500">No order selected.</div>
          ) : (
            <>
              {/* summary */}
              <div className={`rounded-2xl border p-4 shadow-sm ${darkMode ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-white"}`}>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-slate-500">Customer</div>
                    <div className="font-medium">{order.name || "-"}</div>
                    <div className="text-xs text-slate-500">{order.email}</div>
                  </div>
                  <div>
                    <div className="text-slate-500">Phone</div>
                    <div className="font-medium">{order.phone || "-"}</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-slate-500">Address</div>
                    <div className="font-medium whitespace-pre-wrap">{order.address || "-"}</div>
                  </div>

                  <div>
                    <div className="text-slate-500">Order Status</div>
                    <div className="font-medium">{order.status || "Pending"}</div>
                  </div>
                  <div>
                    <div className="text-slate-500">Payment</div>
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${badge}`}>
                      {order.paymentStatus ? order.paymentStatus : "pending"}
                    </span>
                    {order.paymentId ? (
                      <div className="text-[10px] text-slate-500 break-all mt-1">{order.paymentId}</div>
                    ) : null}
                  </div>

                  <div>
                    <div className="text-slate-500">Total</div>
                    <div className="font-semibold">{fmtMoney(order.total)}</div>
                  </div>
                  <div>
                    <div className="text-slate-500">Date</div>
                    <div className="font-medium">{fmtDate(order.date)}</div>
                  </div>
                </div>
              </div>

              {/* items */}
              <div className={`mt-4 rounded-2xl border p-4 shadow-sm ${darkMode ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-white"}`}>
                <div className="mb-2 font-semibold">Items</div>
                {Array.isArray(order.billItems) && order.billItems.length > 0 ? (
                  <div className={darkMode ? "divide-y divide-slate-700" : "divide-y divide-slate-100"}>
                    {order.billItems.map((it, idx) => (
                      <div key={idx} className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`h-12 w-12 overflow-hidden rounded-lg ${darkMode ? "bg-slate-700" : "bg-slate-100"}`}>
                            {it.image ? (
                              <img src={it.image} alt={it.productName} className="h-full w-full object-cover" />
                            ) : null}
                          </div>
                          <div className="min-w-0">
                            <div className="truncate font-medium">
                              {it.productName || it.productId}
                            </div>
                            <div className="text-xs text-slate-500">
                              Qty {Number(it.quantity)} × {fmtMoney(it.price)}
                            </div>
                          </div>
                        </div>
                        <div className="shrink-0 font-semibold">{fmtMoney(it.total)}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-slate-500">No items</div>
                )}
              </div>

              {/* actions */}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <InlineStatusSelect
                  current={order.status || "Pending"}
                  onChange={(s) => onStatus && onStatus(s)}
                  darkMode={darkMode}
                />
                <button
                  onClick={onCancel}
                  disabled={!isOrderPending(order)}
                  className={`rounded-xl px-3 py-2 text-sm ${
                    isOrderPending(order)
                      ? "bg-amber-600 text-white hover:bg-amber-700"
                      : "bg-slate-100 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  Cancel Order
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
