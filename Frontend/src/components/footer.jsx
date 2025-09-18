import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

export default function Footer() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [email, setEmail] = useState("");
  const [showTop, setShowTop] = useState(false);

  // Show "back to top" after scroll
  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 240);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // helpers for in-page navigation
  const scrollToId = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const go = (id) => {
    if (pathname === "/") {
      scrollToId(id);
    } else {
      navigate(`/#${id}`);
      // attempt scroll after nav resolves
      setTimeout(() => scrollToId(id), 0);
    }
  };

  const subscribe = (e) => {
    e.preventDefault();
    // UI only: show a toast-like alert
    if (email.trim()) {
      alert("Thanks! We’ll keep you updated on fresh catches and deals.");
      setEmail("");
    }
  };

  const year = new Date().getFullYear();

  return (
    <footer className="relative bg-white text-slate-700">
      <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          {/* Brand + mini about */}
          <div>
            <div className="flex items-center gap-3">
              <img
                src="/logo-dashboard.png"
                alt="Ocean Track 360"
                className="h-10 w-auto"
                draggable="false"
              />
            </div>
            <p className="mt-3 text-sm text-slate-600">
              Fresh, sustainably sourced seafood from trusted local boats—kept ice-cold
              from dock to door.
            </p>

            {/* Payments */}
            <div className="mt-4">
              <div className="text-xs font-semibold text-slate-500">We accept</div>
              <div className="mt-2 flex items-center gap-2">
                <img src="/visa.webp" alt="Visa" className="h-6 w-auto" loading="lazy" />
                <img src="/master.webp" alt="Mastercard" className="h-6 w-auto" loading="lazy" />
                <img src="/ae.webp" alt="American Express" className="h-6 w-auto" loading="lazy" />
                <img src="/jcb.webp" alt="JCB" className="h-6 w-auto" loading="lazy" />
              </div>
            </div>
          </div>

          {/* Quick links */}
          <div className="grid grid-cols-2 gap-6 md:grid-cols-2">
            <div>
              <div className="text-sm font-bold text-slate-900">Navigate</div>
              <ul className="mt-3 space-y-2 text-sm">
                <li>
                  <button
                    onClick={() => go("hero")}
                    className="hover:text-sky-700 transition"
                  >
                    Home
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => go("trending")}
                    className="hover:text-sky-700 transition"
                  >
                    Trending
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => go("contact")}
                    className="hover:text-sky-700 transition"
                  >
                    Contact
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => go("reviews")}
                    className="hover:text-sky-700 transition"
                  >
                    Reviews
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <div className="text-sm font-bold text-slate-900">Contact</div>
              <ul className="mt-3 space-y-2 text-sm">
                <li>
                  Fisheries Harbour, Colombo
                </li>
                <li>
                  Mon–Sat: 7:00–18:00
                </li>
                <li>
                  <a href="tel:+94112223344" className="hover:text-sky-700 transition">
                    +94 11 222 3344
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:support@oceantrack360.lk"
                    className="hover:text-sky-700 transition"
                  >
                    support@oceantrack360.lk
                  </a>
                </li>
              </ul>

              {/* Social */}
              <div className="mt-4 flex items-center gap-3">
                <a
                  href="#"
                  aria-label="Facebook"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                    <path d="M13 3h4a1 1 0 0 1 1 1v3h-3a1 1 0 0 0-1 1v3h4l-1 4h-3v8h-4v-8H7v-4h3V8a5 5 0 0 1 5-5Z"/>
                  </svg>
                </a>
                <a
                  href="#"
                  aria-label="Instagram"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                    <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm5 5a5 5 0 1 0 .001 10.001A5 5 0 0 0 12 7Zm6-1a1 1 0 1 0 0 2 1 1 0 0 0 0-2Zm-6 3a3 3 0 1 1-.001 6.001A3 3 0 0 1 12 9Z"/>
                  </svg>
                </a>
                <a
                  href="#"
                  aria-label="X"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                    <path d="M3 3h4.6l4.2 6 4.6-6H21l-7 9.2L21 21h-4.6l-4.2-6L7.6 21H3l7-8.8L3 3Z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Newsletter */}
          <div>
            <div className="text-sm font-bold text-slate-900">Get fresh-catch alerts</div>
            <p className="mt-2 text-sm text-slate-600">
              Weekly availability, deals, and chef tips straight to your inbox.
            </p>
            <form onSubmit={subscribe} className="mt-4 flex items-stretch gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none ring-2 ring-transparent transition focus:border-sky-300 focus:ring-sky-200"
              />
              <button
                type="submit"
                className="shrink-0 rounded-xl bg-sky-600 px-4 py-3 font-semibold text-white shadow transition hover:-translate-y-0.5 hover:bg-sky-700 active:translate-y-0"
              >
                Subscribe
              </button>
            </form>
            <p className="mt-2 text-xs text-slate-500">
              By subscribing, you agree to our terms & privacy policy.
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-slate-200 pt-4 text-xs text-slate-500 md:flex-row">
          <div>© {year} Ocean Track 360. All rights reserved.</div>
          <div className="flex items-center gap-4">
            <button onClick={() => go("hero")} className="hover:text-sky-700 transition">
              Back to Home
            </button>
            <button onClick={() => go("contact")} className="hover:text-sky-700 transition">
              Support
            </button>
            <button onClick={() => go("reviews")} className="hover:text-sky-700 transition">
              Reviews
            </button>
          </div>
        </div>
      </div>

      {/* floating back-to-top */}
      {showTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 inline-flex h-11 w-11 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg transition hover:-translate-y-0.5 hover:opacity-90"
          aria-label="Back to top"
          title="Back to top"
        >
          ↑
        </button>
      )}
    </footer>
  );
}
