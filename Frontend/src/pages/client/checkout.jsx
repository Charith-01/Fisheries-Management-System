import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import getCart from "../../utils/cart";
import api from "../../api/axios"; // ✅ use api instance

export default function Checkout() {
  const navigate = useNavigate();

  const [cart, setCart] = useState([]);

  const readCart = () => {
    try {
      const rawBuyNow = localStorage.getItem("buyNow");
      if (rawBuyNow) {
        const bn = JSON.parse(rawBuyNow);
        if (Array.isArray(bn) && bn.length > 0) {
          setCart(bn);
          return;
        }
      }
      const data = getCart();
      setCart(Array.isArray(data) ? data : []);
    } catch {
      setCart([]);
    }
  };

  useEffect(() => {
    readCart();
    const onStorage = (e) => {
      if (e.key === "cart" || e.key === "buyNow") readCart();
    };
    const onCartUpdated = () => readCart();
    window.addEventListener("storage", onStorage);
    window.addEventListener("cart:updated", onCartUpdated);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("cart:updated", onCartUpdated);
    };
  }, []);

  const fmt = (n) =>
    Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2 });

  // ⬇️ update #3: show weight quantities with decimals where needed
  const isWeightUnit = (u = "") => {
    const x = u.toLowerCase();
    return ["kg","kilogram","kilograms","g","gram","grams","lb","lbs","pound","pounds"].includes(x);
  };

  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [addr1, setAddr1] = useState("");
  const [addr2, setAddr2] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [notes, setNotes] = useState("");
  const [delivery, setDelivery] = useState("express");
  const [agree, setAgree] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("customer");
      if (!raw) return;
      const c = JSON.parse(raw);
      if (c?.email) setEmail(c.email);
      if (c?.firstName) setFirstName(c.firstName);
      if (c?.lastName) setLastName(c.lastName);
      if (c?.phone) setPhone(c.phone);
      if (c?.address) setAddr1(c.address);
    } catch {}
  }, []);

  const subTotal = useMemo(
    () =>
      cart.reduce(
        (s, it) => s + (Number(it.price) || 0) * (Number(it.quantity) || 0),
        0
      ),
    [cart]
  );

  const shippingCost = useMemo(() => {
    if (!cart.length) return 0;
    return delivery === "express" ? 400 : 350;
  }, [delivery, cart.length]);

  const grandTotal = Math.max(0, subTotal + shippingCost);

  const itemCount = useMemo(
    () => cart.filter((it) => (Number(it.quantity) || 0) > 0).length,
    [cart]
  );

  const [placing, setPlacing] = useState(false);

  const validate = () => {
    if (!cart.length) return "Your cart is empty.";
    if (!firstName.trim()) return "First name is required.";
    if (!lastName.trim()) return "Last name is required.";
    if (!email.trim()) return "Email is required.";
    if (!phone.trim()) return "Phone is required.";
    if (!addr1.trim()) return "Address line 1 is required.";
    if (!city.trim()) return "City is required.";
    if (!district.trim()) return "District/Province is required.";
    if (!postalCode.trim()) return "Postal code is required.";
    if (!agree) return "Please agree to Terms & Privacy.";
    return null;
  };

  const generateOrderId = () =>
    `ORD-${Date.now().toString(36).toUpperCase()}-${Math.random()
      .toString(36)
      .slice(2, 6)
      .toUpperCase()}`;

  const handlePlaceOrder = async () => {
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }

    setPlacing(true);
    try {
      const orderId = generateOrderId();
      const fullName = `${firstName} ${lastName}`.trim();
      const fullAddress = `${addr1}${addr2 ? ", " + addr2 : ""}, ${city}, ${district} ${postalCode}${
        notes ? ` (Notes: ${notes})` : ""
      }`;

      const billItems = cart.map((it) => ({
        productId: it.productId,
        productName: it.name,
        image: it.image || null,
        quantity: Number(it.quantity) || 0,
        price: Number(it.price) || 0,
        total: (Number(it.price) || 0) * (Number(it.quantity) || 0),
      }));

      const payload = {
        orderId,
        email,
        name: fullName,
        address: fullAddress,
        status: "Pending",
        phone,
        billItems,
        total: grandTotal,
      };

      const response = await api.post("/api/order/create", payload);

      if (response.data.message === "Order created successfully") {
        toast.success("Order created. Proceeding to card payment.");

        localStorage.setItem(
          "lastOrder",
          JSON.stringify({
            orderId: orderId,
            total: grandTotal,
            status: "Pending",
            date: new Date().toISOString(),
            items: billItems,
            shippingAddress: fullAddress,
            customerName: fullName,
            email: email,
            phone: phone,
          })
        );

        localStorage.setItem("cart", JSON.stringify([]));
        window.dispatchEvent(new Event("cart:updated"));
        localStorage.removeItem("buyNow");

        setTimeout(() => {
          navigate(`/payment?orderId=${orderId}`);
        }, 300);
      } else {
        toast.error(
          "Failed to create order: " + (response.data.message || "Unknown error")
        );
      }
    } catch (e) {
      console.error("Order creation error:", e.response?.data || e.message);

      if (e.response?.status === 403 || e.response?.status === 401) {
        toast.error("Please log in to complete your order");
        navigate("/login");
      } else if (e.response?.data?.message) {
        toast.error(e.response.data.message);
      } else {
        toast.error("Failed to create order. Please try again.");
      }
    } finally {
      setPlacing(false);
    }
  };

  if (!cart || cart.length === 0) {
    return (
      <div className="w-full min-h-[60vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
            <svg
              viewBox="0 0 24 24"
              className="w-7 h-7 text-slate-500"
              fill="none"
              stroke="currentColor"
            >
              <path
                d="M3 3h2l.4 2M7 13h10l3-8H6.4"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="9" cy="19" r="1.6" />
              <circle cx="17" cy="19" r="1.6" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-900">
            Your cart is empty
          </h2>
          <p className="mt-1 text-slate-600">
            Add items before proceeding to checkout.
          </p>
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

  return (
<div className="w-full min-h-[60vh] px-4 py-6 md:px-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section className="rounded-2xl ring-1 ring-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Contact Information</h2>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-slate-600">First name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="mt-1 w-full rounded-lg ring-1 ring-slate-200 px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="John"
                />
              </div>
              <div>
                <label className="text-sm text-slate-600">Last name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="mt-1 w-full rounded-lg ring-1 ring-slate-200 px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Doe"
                />
              </div>
              <div>
                <label className="text-sm text-slate-600">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full rounded-lg ring-1 ring-slate-200 px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <label className="text-sm text-slate-600">Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1 w-full rounded-lg ring-1 ring-slate-200 px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="+94 7X XXX XXXX"
                />
              </div>
            </div>
          </section>

          <section className="rounded-2xl ring-1 ring-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Shipping Address</h2>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <label className="text-sm text-slate-600">Address line 1</label>
                <input
                  type="text"
                  value={addr1}
                  onChange={(e) => setAddr1(e.target.value)}
                  className="mt-1 w-full rounded-lg ring-1 ring-slate-200 px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Street address"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm text-slate-600">Address line 2 (optional)</label>
                <input
                  type="text"
                  value={addr2}
                  onChange={(e) => setAddr2(e.target.value)}
                  className="mt-1 w-full rounded-lg ring-1 ring-slate-200 px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Apartment, suite, etc."
                />
              </div>
              <div>
                <label className="text-sm text-slate-600">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="mt-1 w-full rounded-lg ring-1 ring-slate-200 px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Colombo"
                />
              </div>
              <div>
                <label className="text-sm text-slate-600">District / Province</label>
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="mt-1 w-full rounded-lg ring-1 ring-slate-200 px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Western Province"
                />
              </div>
              <div>
                <label className="text-sm text-slate-600">Postal code</label>
                <input
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className="mt-1 w-full rounded-lg ring-1 ring-slate-200 px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="00000"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm text-slate-600">Delivery notes (optional)</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1 w-full rounded-lg ring-1 ring-slate-200 px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Any special instructions for the courier"
                />
              </div>
            </div>
          </section>

          <section className="rounded-2xl ring-1 ring-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Delivery</h2>

            <div className="mt-3 p-3 rounded-lg ring-1 ring-slate-200 bg-slate-50">
              <div className="flex items-start gap-3">
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor">
                  <path d="M3 13h13l3.5-6H6.5L3 13z" strokeWidth="2" />
                  <circle cx="7.5" cy="18.5" r="1.5" />
                  <circle cx="16.5" cy="18.5" r="1.5" />
                </svg>
                <div className="flex-1">
                  <div className="text-sm text-slate-900 font-medium">Fresh fish delivery — within 24 hours</div>
                  <div className="text-xs text-slate-600">Fixed fast delivery (Rs. 400)</div>
                </div>
              </div>
              <input type="hidden" name="delivery" value={delivery} readOnly />
            </div>

            <div className="mt-5 rounded-xl ring-1 ring-slate-200 p-4">
              <div className="text-sm font-medium text-slate-900 mb-2">Payment method</div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 ring-1 ring-slate-200">
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor">
                  <rect x="2" y="5" width="20" height="14" rx="2" ry="2" strokeWidth="2" />
                  <path d="M2 10h20" strokeWidth="2" />
                </svg>
                <div className="text-sm text-slate-800">Card (secured on next step)</div>
              </div>

              <div className="mt-3">
                <div className="text-xs text-slate-600 mb-1">We accept</div>
                <div className="flex items-center gap-2">
                  <img src="/visa.webp" alt="Visa" className="h-6 w-auto rounded" />
                  <img src="/jcb.webp" alt="JCB" className="h-6 w-auto rounded" />
                  <img src="/master.webp" alt="Mastercard" className="h-6 w-auto rounded" />
                  <img src="/ae.webp" alt="American Express" className="h-6 w-auto rounded" />
                </div>
              </div>
            </div>

            <label className="mt-4 flex items-start gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
                className="mt-0.5"
              />
              <span>
                I agree to the{" "}
                <Link to="/terms" className="text-blue-700 hover:underline">Terms</Link> and{" "}
                <Link to="/privacy" className="text-blue-700 hover:underline">Privacy Policy</Link>.
              </span>
            </label>
          </section>
        </div>

        <aside className="lg:col-span-1">
          <div className="sticky top-4">
            <div className="rounded-2xl ring-1 ring-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Order Summary</h2>

              <div className="mt-3 max-h-64 overflow-auto divide-y divide-slate-100">
                {cart.map((it) => (
                  <div key={it.productId} className="py-2 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden shrink-0">
                        {it.image ? <img src={it.image} alt={it.name} className="w-full h-full object-cover" /> : null}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-slate-900 truncate">{it.name}</div>
                        <div className="text-xs text-slate-600">
                          {isWeightUnit(it.unit) ? Number(it.quantity).toFixed(2) : Number(it.quantity)}{" "}
                          {it.unit || "unit"} × Rs. {fmt(it.price)}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-slate-900 shrink-0">
                      Rs. {fmt((Number(it.price) || 0) * (Number(it.quantity) || 0))}
                    </div>
                  </div>
                ))}
              </div>

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
                  <span className="text-slate-600">Shipping</span>
                  <span className="font-medium text-slate-900">Rs. {fmt(shippingCost)}</span>
                </div>
                <div className="pt-2 flex items-center justify-between border-t border-slate-200 mt-2">
                  <span className="text-base font-semibold text-slate-900">Total</span>
                  <span className="text-base font-semibold text-slate-900">Rs. {fmt(grandTotal)}</span>
                </div>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={placing}
                className="mt-5 w-full inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.99] transition shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {placing ? "Placing order…" : "Place Order"}
              </button>

              <p className="mt-2 text-[12px] text-slate-500">
                You’ll be redirected to complete your card payment securely.
              </p>
            </div>

            <div className="mt-3 text-center">
              <Link to="/cart" className="text-sm text-blue-700 hover:underline">Back to Cart</Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
