import { Link } from "react-router-dom";

export default function Header() {
  return (
    <header className="h-[75px] w-full bg-white shadow-md flex items-center px-6">
      {/* Left: Logo */}
      <div className="flex items-center gap-3">
        <img
          src="/logo-dashboard.png"   // ✅ directly reference from public/
          alt="Ocean Track 360"
          className="h-10 w-auto"
        />
      </div>

      {/* Center: Navigation */}
      <nav className="flex-1 flex justify-center">
        <ul className="flex items-center gap-8 text-blue-800 font-medium">
          <li><Link to="/" className="hover:text-blue-600 transition">Home</Link></li>
          <li><Link to="/products" className="hover:text-blue-600 transition">Products</Link></li>
          <li><Link to="/contact" className="hover:text-blue-600 transition">Contact</Link></li>
          <li><Link to="/reviews" className="hover:text-blue-600 transition">Reviews</Link></li>
        </ul>
      </nav>

      {/* Right: Auth buttons */}
      <div className="flex items-center gap-3">
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
