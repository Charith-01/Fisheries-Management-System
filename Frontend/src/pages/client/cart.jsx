import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import getCart, { addToCart, removeFromCart } from "../../utils/cart"; // ⬅️ adjust path if needed

export default function CartPage() {
  const [cart, setCart] = useState([]);
  const navigate = useNavigate();

  // ---- helpers (JS only) ----
  const fmt = (n) =>
    Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2 });

  const isWeightUnit = (u = "") => {
    const x = u.toLowerCase();
    return ["kg", "kilogram", "kilograms", "g", "gram", "grams", "lb", "lbs", "pound", "pounds"].includes(x);
  };

  const stepFor = (u) => (isWeightUnit(u) ? 0.25 : 1);

  const readCart = () => {
    try {
      const data = getCart();
      setCart(Array.isArray(data) ? data : []);
    } catch {
      setCart([]);
    }
  };

  // ---- effects ----
  useEffect(() => {
    readCart();

    // live updates: cross-tab changes, same-tab custom event, and tab visibility
    const onStorage = (e) => { if (e.key === "cart") readCart(); };
    const onCartUpdated = () => readCart();
    const onVisible = () => { if (!document.hidden) readCart(); };

    window.addEventListener("storage", onStorage);
    window.addEventListener("cart:updated", onCartUpdated);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("cart:updated", onCartUpdated);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, []);

  // ---- derived totals ----
  const { itemCount, subTotal } = useMemo(() => {
    const count = Array.isArray(cart)
      ? cart.filter((it) => (Number(it.quantity) || 0) > 0).length
      : 0;
    const sub = Array.isArray(cart)
      ? cart.reduce((s, it) => s + (Number(it.price) || 0) * (Number(it.quantity) || 0), 0)
      : 0;
    return { itemCount: count, subTotal: sub };
  }, [cart]);

  // ---- actions ----
  const handleIncrease = (item) => {
    const s = stepFor(item.unit);
    const updated = addToCart(item, s); // helper fires "cart:updated" if you added that
    setCart(updated);
  };

  const handleDecrease = (item) => {
    const s = stepFor(item.unit);
    const updated = addToCart(item, -s); // removes if qty ≤ 0
    setCart(updated);
  };

  const handleRemove = (productId) => {
    const updated = removeFromCart(productId);
    setCart(updated);
  };

  const handleCheckout = () => {
    // IMPORTANT: Ensure full-cart checkout (not buy-now)
    localStorage.removeItem("buyNow"); // <-- so checkout uses the full cart
    navigate("/checkout");
  };

  // ---- empty state ----
  if (!cart || cart.length === 0) {
    return (
      <div className="w-full min-h-[60vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-7 h-7 text-slate-500" fill="none" stroke="currentColor">
              <path d="M3 3h2l.4 2M7 13h10l3-8H6.4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="9" cy="19" r="1.6" />
              <circle cx="17" cy="19" r="1.6" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-900">Your cart is empty</h2>
          <p className="mt-1 text-slate-600">Browse products and add what you love.</p>
          <Link
            to="/products"
            className="inline-flex items-center justify-center mt-5 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  // ---- main UI ----
  return (
    <div className="w-full min-h-[60vh] px-4 py-6 md:px-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: Items */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-slate-900">Your Cart</h1>
            <div className="text-sm text-slate-600">{itemCount} {itemCount === 1 ? "item" : "items"}</div>
          </div>

          <div className="space-y-3">
            {cart.map((item, idx) => {
              const s = stepFor(item.unit);
              const lineTotal = (Number(item.price) || 0) * (Number(item.quantity) || 0);

              return (
                <div
                  key={String(item.productId ?? item.name ?? idx)}
                  className="w-full rounded-xl ring-1 ring-slate-200 bg-white p-3 md:p-4 flex gap-3 md:gap-4"
                >
                  {/* Image */}
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-lg bg-slate-100 overflow-hidden shrink-0">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : null}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-medium text-slate-900 truncate">{item.name}</div>
                        <div className="text-sm text-slate-600">
                          Rs. {fmt(item.price)} {item.unit ? <span className="text-slate-500">/ {item.unit}</span> : null}
                        </div>
                      </div>

                      {/* Remove */}
                      <button
                        className="shrink-0 inline-flex items-center justify-center h-8 w-8 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 ring-1 ring-transparent hover:ring-red-200 transition"
                        onClick={() => handleRemove(item.productId)}
                        aria-label="Remove item"
                        title="Remove"
                      >
                        <svg viewBox="0 0 24 24" className="w-4.5 h-4.5" fill="none" stroke="currentColor">
                          <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" strokeWidth="2" strokeLinecap="round" />
                          <path d="M10 10v7M14 10v7" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                      </button>
                    </div>

                    {/* Qty controls */}
                    <div className="mt-3 flex items-center justify-between">
                      <div className="inline-flex items-stretch rounded-xl ring-1 ring-slate-200 bg-white overflow-hidden">
                        <button
                          onClick={() => handleDecrease(item)}
                          className="px-3 py-2 text-slate-700 hover:bg-slate-50 active:scale-[0.98] transition"
                          aria-label="Decrease quantity"
                          title="Decrease"
                        >
                          <svg viewBox="0 0 24 24" className="w-4.5 h-4.5" fill="none" stroke="currentColor">
                            <path d="M5 12h14" strokeWidth="2" strokeLinecap="round" />
                          </svg>
                        </button>
                        <div className="px-3 py-2 min-w-[64px] text-center font-medium text-slate-900">
                          {Number(item.quantity).toFixed(s < 1 ? 2 : 0)} {item.unit || "unit"}
                        </div>
                        <button
                          onClick={() => handleIncrease(item)}
                          className="px-3 py-2 text-slate-700 hover:bg-slate-50 active:scale-[0.98] transition"
                          aria-label="Increase quantity"
                          title="Increase"
                        >
                          <svg viewBox="0 0 24 24" className="w-4.5 h-4.5" fill="none" stroke="currentColor">
                            <path d="M12 5v14M5 12h14" strokeWidth="2" strokeLinecap="round" />
                          </svg>
                        </button>
                      </div>

                      <div className="text-right">
                        <div className="text-sm text-slate-500">Line total</div>
                        <div className="text-base md:text-lg font-semibold text-slate-900">
                          Rs. {fmt(lineTotal)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Continue Shopping */}
          <div className="mt-4">
            <Link
              to="/products"
              className="inline-flex items-center gap-1.5 text-blue-700 hover:text-blue-800"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor">
                <path d="M15 19l-7-7 7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Continue shopping
            </Link>
          </div>
        </div>

        {/* RIGHT: Summary */}
        <aside className="lg:col-span-1">
          <div className="sticky top-4">
            <div className="rounded-2xl ring-1 ring-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Order Summary</h2>

              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Items</span>
                  <span className="font-medium text-slate-900">{itemCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Subtotal</span>
                  <span className="font-medium text-slate-900">Rs. {fmt(subTotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Discount</span>
                  <span className="font-medium text-slate-900">Rs. {fmt(0)}</span>
                </div>
                <div className="pt-2 flex items-center justify-between border-t border-slate-200 mt-2">
                  <span className="text-base font-semibold text-slate-900">Total</span>
                  <span className="text-base font-semibold text-slate-900">Rs. {fmt(subTotal)}</span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                className="mt-5 w-full inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.99] transition shadow-sm"
              >
                Proceed to Checkout
              </button>

              <p className="mt-2 text-[12px] text-slate-500">
                Taxes and shipping calculated at checkout.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
