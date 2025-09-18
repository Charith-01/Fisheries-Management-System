import { Route, Routes, Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import Header from "../components/header";
import ProductsPage from "./client/productsPage";
import ProductOverview from "./client/productOverview";
import CartPage from "./client/cart";
import Checkout from "./client/checkout";
import NotFoundPage from "./client/notFoundPage";
import Footer from "../components/footer";

/* --------------------- Hero (Image Slider) --------------------- */
/* --------------------- Hero (Image Slider with Promotions) --------------------- */
function HeroSection() {
  const navigate = useNavigate();

  // Each slide now carries its own promotion details
  const slides = useMemo(
    () => [
      {
        title: "Fresh Yellowfin Tuna",
        subtitle: "Wild-caught • Grade A • Same-day dispatch",
        img: "https://images.unsplash.com/photo-1514511826142-1be72277b32e?q=80&w=1600&auto=format&fit=crop",
        discount: "-20%",
        promoText: "Weekend Deal — Yellowfin Tuna",
        code: "FRESH20",
        cta: { label: "Shop Tuna Deal", to: "/products?search=Yellowfin%20Tuna" },
        tag: "Limited time",
      },
      {
        title: "Premium Tiger Prawns",
        subtitle: "Firm, sweet & perfect for grills",
        img: "https://images.unsplash.com/photo-1604908554028-236a0ff2b2e2?q=80&w=1600&auto=format&fit=crop",
        discount: "-15%",
        promoText: "Grill Season — Tiger Prawns",
        code: "PRAWN15",
        cta: { label: "Shop Prawn Deal", to: "/products?search=Tiger%20Prawns" },
        tag: "This week",
      },
      {
        title: "Line-Caught Mahi-Mahi",
        subtitle: "Sustainably sourced from local boats",
        img: "https://images.unsplash.com/photo-1586201375761-83865001e31b?q=80&w=1600&auto=format&fit=crop",
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
      {/* soft gradient blobs */}
      <div className="pointer-events-none absolute -top-32 -right-24 h-96 w-96 rounded-full bg-sky-300/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-cyan-300/30 blur-3xl" />

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-8 px-4 py-12 md:grid-cols-2 md:py-16 lg:px-8">
        {/* Left: copy + CTA */}
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

          {/* trust stats */}
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

        {/* Right: slider with promo overlays */}
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

              {/* top-left discount ribbon */}
              <div className="absolute left-4 top-4">
                <div className="rounded-xl bg-rose-600 px-3 py-1.5 text-sm font-bold text-white shadow-lg">
                  {s.discount}
                </div>
              </div>

              {/* bottom promo panel */}
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

          {/* dots */}
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

      {/* divider wave */}
      <svg className="block w-full text-sky-50" viewBox="0 0 1440 80" preserveAspectRatio="none">
        <path
          fill="currentColor"
          d="M0,64L48,64C96,64,192,64,288,58.7C384,53,480,43,576,37.3C672,32,768,32,864,42.7C960,53,1056,75,1152,80C1248,85,1344,75,1392,69.3L1440,64L1440,80L0,80Z"
        />
      </svg>
    </section>
  );
}


/* --------------------- Trending Products --------------------- */
function TrendingSection() {
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(import.meta.env.VITE_BACKEND_URL + "/api/product/all");
        const json = await res.json();
        const list = json?.data || [];

        const pickImg = (p) =>
          p?.imageUrl ||
          (Array.isArray(p?.images) ? p.images[0] : null) ||
          p?.thumbnail ||
          null;

        // Just grab first 4 active products (or adjust to your needs)
        const top = list
          .filter((p) => p && (p.isActive ?? true))
          .slice(0, 4)
          .map((p) => ({
            id: p?.productId || p?._id || p?.id || p?.name,
            name: p?.name || "Unnamed Product",
            img:
              pickImg(p) ||
              "https://images.unsplash.com/photo-1523419409543-8fcf3a4e5a9f?q=80&w=1600&auto=format&fit=crop",
            tag: p?.category || "Fresh",
            price: p?.price
              ? `Rs ${Number(p.price).toLocaleString()}`
              : "See price",
          }));

        if (mounted) {
          setItems(top);
          setLoaded(true);
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
    <section className="bg-gradient-to-b from-sky-50 to-white py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 md:text-3xl">
              Trending Today
            </h2>
            <p className="mt-1 text-slate-600">
              Freshest best-sellers
            </p>
          </div>
          <Link
            to="/products"
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-white"
          >
            View all
          </Link>
        </div>

        {/* Loader */}
        {!loaded && (
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-[320px] rounded-2xl border border-slate-200 bg-white p-4 shadow-sm animate-pulse"
              >
                <div className="h-40 w-full rounded-xl bg-slate-200" />
                <div className="mt-4 space-y-3">
                  <div className="h-4 w-1/2 rounded bg-slate-200" />
                  <div className="h-4 w-1/3 rounded bg-slate-200" />
                  <div className="h-8 w-24 rounded bg-slate-200" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {loaded && err && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {err}
          </div>
        )}

        {/* Products */}
        {loaded && !err && (
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((p, i) => (
              <Link
                to={`/overview/${encodeURIComponent(p.id)}`}
                key={p.id}
                className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
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
                    <h3 className="font-semibold text-slate-900">{p.name}</h3>
                    <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-700">
                      {p.tag}
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-slate-600">{p.price}</div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-slate-500">Tap to view</span>
                    <span className="translate-x-0 transition group-hover:translate-x-1">
                      →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}



/* --------------------- Contact Us --------------------- */
function ContactSection() {
  return (
    <section className="relative isolate overflow-hidden bg-white py-12 md:py-16">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 lg:grid-cols-2 lg:gap-16 lg:px-8">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 md:text-3xl">Contact Us</h2>
          <p className="mt-2 text-slate-600">
            Questions about today’s catch, bulk orders, or delivery? We’d love to help.
          </p>

          <form
            className="mt-6 space-y-4 rounded-2xl border border-slate-200 bg-slate-50/50 p-4 shadow-sm"
            onSubmit={(e) => e.preventDefault()}
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <input
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none ring-2 ring-transparent transition focus:border-sky-300 focus:ring-sky-200"
                placeholder="Full name"
              />
              <input
                type="email"
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none ring-2 ring-transparent transition focus:border-sky-300 focus:ring-sky-200"
                placeholder="Email"
              />
            </div>
            <input
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none ring-2 ring-transparent transition focus:border-sky-300 focus:ring-sky-200"
              placeholder="Subject"
            />
            <textarea
              className="h-28 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none ring-2 ring-transparent transition focus:border-sky-300 focus:ring-sky-200"
              placeholder="Your message…"
            />
            <button
              className="w-full rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:opacity-90 active:translate-y-0"
              type="button"
            >
              Send Message
            </button>
            <p className="text-xs text-slate-500">
              By contacting us, you agree to our terms & privacy policy.
            </p>
          </form>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 shadow-xl">
          <img
            src="https://images.unsplash.com/photo-1523374228107-6e44bd2b524e?q=80&w=1600&auto=format&fit=crop"
            alt="Our docks and partner boats"
            className="h-full w-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 rounded-xl bg-white/85 p-4 backdrop-blur">
            <div className="text-sm font-semibold text-slate-800">Dock Office</div>
            <div className="text-xs text-slate-600">
              Fisheries Harbour, Colombo • Mon–Sat 7:00–18:00
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* --------------------- Reviews --------------------- */
function ReviewsSection() {
  const reviews = [
    {
      name: "Kavindu S.",
      text:
        "Best prawns I’ve had in years. Packed in ice, zero smell, super fresh!",
    },
    {
      name: "Ishara P.",
      text:
        "Delivery was quick and the tuna quality was restaurant-grade. Highly recommend.",
    },
    {
      name: "Ruwan D.",
      text:
        "Transparent pricing and honest weights. My go-to for weekly seafood.",
    },
  ];
  const [active, setActive] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setActive((p) => (p + 1) % reviews.length), 5000);
    return () => clearInterval(t);
  }, [reviews.length]);

  return (
    <section className="bg-gradient-to-b from-white to-sky-50 py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <h2 className="text-2xl font-extrabold text-slate-900 md:text-3xl">What Customers Say</h2>
        <p className="mt-1 text-slate-600">Real feedback from happy seafood lovers</p>

        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
          {reviews.map((r, i) => (
            <div
              key={r.name}
              className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition ${
                i === active ? "ring-2 ring-sky-300" : "hover:-translate-y-0.5"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 shrink-0 rounded-full bg-sky-100" />
                <div>
                  <div className="font-semibold text-slate-900">{r.name}</div>
                  <div className="text-xs text-slate-500">Verified Buyer</div>
                </div>
              </div>
              <p className="mt-3 text-slate-700">{r.text}</p>
              <div className="mt-3 text-sky-600">★★★★★</div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-center gap-2">
          {reviews.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`h-2.5 w-6 rounded-full transition ${
                i === active ? "bg-sky-600" : "bg-sky-200 hover:bg-sky-300"
              }`}
              aria-label={`Show review ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/* --------------------- Landing (combines sections) --------------------- */
function LandingPage() {
  return (
    <main className="animate-[fadeIn_0.5s_ease]">
      {/* Hero */}
      <section id="hero">
        <HeroSection />
      </section>

      {/* Trending products can stay without id */}
      <section id="trending">
        <TrendingSection />
      </section>


      {/* Contact */}
      <section id="contact">
        <ContactSection />
      </section>

      {/* Reviews */}
      <section id="reviews">
        <ReviewsSection />
      </section>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0 }
          to { opacity: 1 }
        }
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
          <Route path="/" element={<LandingPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/overview/:id" element={<ProductOverview />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/*" element={<NotFoundPage />} />
        </Routes>
      </div>
    </div>
  );
}
