import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

export default function Header() {
  const [cartCount, setCartCount] = useState(0);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Smooth scroll to a section if it's present
  const scrollToId = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Handlers for section nav
  const goHero = (e) => {
    e.preventDefault();
    if (pathname === "/") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      scrollToId("hero");
    } else {
      navigate("/#hero");
      setTimeout(() => scrollToId("hero"), 0);
    }
  };

  const goCategories = (e) => {
    e.preventDefault();
    if (pathname === "/") {
      scrollToId("categories");
    } else {
      navigate("/#categories");
      setTimeout(() => scrollToId("categories"), 0);
    }
  };

  const goTrending = (e) => {
    e.preventDefault();
    if (pathname === "/") {
      scrollToId("trending");
    } else {
      navigate("/#trending");
      setTimeout(() => scrollToId("trending"), 0);
    }
  };

  const goContact = (e) => {
    e.preventDefault();
    if (pathname === "/") {
      scrollToId("contact");
    } else {
      navigate("/#contact");
      setTimeout(() => scrollToId("contact"), 0);
    }
  };

  const goReviews = (e) => {
    e.preventDefault();
    if (pathname === "/") {
      scrollToId("reviews");
    } else {
      navigate("/#reviews");
      setTimeout(() => scrollToId("reviews"), 0);
    }
  };

  useEffect(() => {
    const readCartCount = () => {
      try {
        const raw = localStorage.getItem("cart") || "[]";
        const cart = JSON.parse(raw);
        const total = Array.isArray(cart)
          ? cart.filter((it) => (Number(it?.quantity) || 0) > 0).length
          : 0;
        setCartCount(total);
      } catch {
        setCartCount(0);
      }
    };

    readCartCount();

    const onStorage = (e) => { if (e.key === "cart") readCartCount(); };
    const onCartUpdated = () => readCartCount();
    const onVisible = () => { if (!document.hidden) readCartCount(); };

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

  return (
    <header className="h-[75px] w-full bg-white shadow-md flex items-center px-6">
      {/* Left: Logo */}
      <div className="flex items-center gap-3">
        <img
          src="/logo-dashboard.png"
          alt="Ocean Track 360"
          className="h-10 w-auto"
        />
      </div>

      {/* Center: Navigation */}
      <nav className="flex-1 flex justify-center">
        <ul className="flex items-center gap-8 text-blue-800 font-medium">
          <li>
            <a href="/#hero" onClick={goHero} className="hover:text-blue-600 transition">
              Home
            </a>
          </li>

          <li>
            <a href="/#categories" onClick={goCategories} className="hover:text-blue-600 transition">
              Category
            </a>
          </li>

          <li>
            <a href="/#trending" onClick={goTrending} className="hover:text-blue-600 transition">
              Trending
            </a>
          </li>

          <li>
            <a href="/#contact" onClick={goContact} className="hover:text-blue-600 transition">
              Contact
            </a>
          </li>

          <li>
            <a href="/#reviews" onClick={goReviews} className="hover:text-blue-600 transition">
              Reviews
            </a>
          </li>
        </ul>
      </nav>

      {/* Right: Cart + Auth buttons */}
      <div className="flex items-center gap-3">
        <Link
          to="/cart"
          className="relative inline-flex items-center justify-center h-10 w-10 rounded-lg ring-1 ring-blue-200 text-blue-800 hover:bg-blue-50 hover:ring-blue-300 transition focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label={`Cart${cartCount ? `, ${cartCount} items` : ""}`}
          title="Cart"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            className="h-5 w-5"
            aria-hidden="true"
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

          {cartCount > 0 && (
            <span
              aria-live="polite"
              className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1.5 text-[10px] leading-[18px] text-white bg-red-600 rounded-full text-center font-bold shadow"
            >
              {cartCount > 99 ? "99+" : cartCount}
            </span>
          )}
        </Link>

        <Link
          to="/login"
          className="px-4 py-2 text-sm font-semibold text-blue-800 border border-blue-800 rounded-lg hover:bg-blue-50 transition"
        >
          Login
        </Link>
        <Link
          to="/register"
          className="px-4 py-2 text-sm font-semibold text-white bg-blue-800 rounded-lg hover:bg-blue-700 transition"
        >
          Register
        </Link>
      </div>
    </header>
  );
}
