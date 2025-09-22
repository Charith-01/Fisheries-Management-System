import { Link, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";

export default function NotFoundPage() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const bobRef = useRef(null);

  // gentle bobbing animation on the buoy card
  useEffect(() => {
    const el = bobRef.current;
    if (!el) return;
    let t = 0;
    let raf;
    const tick = () => {
      t += 0.02;
      el.style.transform = `translateY(${Math.sin(t) * 4}px)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const onSearch = (e) => {
    e.preventDefault();
    const term = q.trim();
    navigate(term ? `/products?search=${encodeURIComponent(term)}` : "/products");
  };

  return (
    <main className="relative min-h-[calc(100vh-75px)] overflow-hidden bg-gradient-to-b from-sky-50 to-white">
      {/* Soft background blobs */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-sky-300/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-cyan-300/30 blur-3xl" />

      <div className="relative z-10 mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-6 py-16 md:grid-cols-2 md:py-24">
        {/* Left: message + actions */}
        <section>
          <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-sky-700 ring-1 ring-sky-200 backdrop-blur">
            🧭 Lost at sea
          </span>

          <h1 className="mt-4 text-4xl font-extrabold leading-tight text-slate-900 md:text-5xl">
            404 — We couldn’t find that page
          </h1>
          <p className="mt-3 max-w-xl text-slate-600">
            The link might be broken, or the page may have been moved. Try searching for a fish
            or head back to safer waters.
          </p>

          {/* Quick links */}
          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            <Link
              to="/"
              className="rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-slate-700 transition hover:-translate-y-0.5 hover:border-sky-300 hover:bg-sky-50"
            >
              ← Go Home
            </Link>
            <Link
              to="/products"
              className="rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-slate-700 transition hover:-translate-y-0.5 hover:border-sky-300 hover:bg-sky-50"
            >
              Browse Products
            </Link>
            <Link
              to="/contact"
              className="rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-slate-700 transition hover:-translate-y-0.5 hover:border-sky-300 hover:bg-sky-50"
            >
              Contact Support
            </Link>
          </div>

          {/* Small tip */}
          <p className="mt-3 text-xs text-slate-500">
            Tip: Check the URL spelling or use the search above.
          </p>
        </section>

        {/* Right: illustration card */}
        <section
          ref={bobRef}
          className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-xl backdrop-blur"
          aria-hidden="true"
        >
          {/* Ocean illustration */}
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-gradient-to-b from-sky-200 via-cyan-200 to-teal-200">
            {/* Sun */}
            <div className="absolute left-6 top-6 h-10 w-10 rounded-full bg-yellow-300/90 shadow" />
            {/* Boat */}
            <div className="absolute left-1/2 top-10 -translate-x-1/2">
              <svg width="140" height="80" viewBox="0 0 140 80" className="drop-shadow">
                <g>
                  <rect x="60" y="5" width="4" height="26" rx="2" fill="#0ea5e9" />
                  <path d="M64 8 L110 28 L64 28 Z" fill="#e0f2fe" stroke="#0ea5e9" />
                  <path d="M20 50 Q70 70 120 50 L110 62 Q70 80 30 62 Z" fill="#0ea5e9" />
                </g>
              </svg>
            </div>
            {/* Waves */}
            <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 120" preserveAspectRatio="none">
              <path
                d="M0,80 C180,120 360,40 540,80 C720,120 900,40 1080,80 C1260,120 1440,60 1440,60 L1440,120 L0,120 Z"
                fill="rgba(255,255,255,0.7)"
              />
            </svg>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-slate-900">Lost buoy spotted</div>
              <div className="text-xs text-slate-500">Let’s guide you back to shore</div>
            </div>
            <Link
              to="/"
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:opacity-90 active:translate-y-0"
            >
              Take me Home
            </Link>
          </div>
        </section>
      </div>

      {/* Bottom wave divider */}
      <svg
        className="pointer-events-none absolute bottom-0 left-0 w-full text-sky-50"
        viewBox="0 0 1440 80"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          fill="currentColor"
          d="M0,64L48,64C96,64,192,64,288,58.7C384,53,480,43,576,37.3C672,32,768,32,864,42.7C960,53,1056,75,1152,80C1248,85,1344,75,1392,69.3L1440,64L1440,80L0,80Z"
        />
      </svg>
    </main>
  );
}
