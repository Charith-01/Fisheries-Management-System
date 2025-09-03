import { Link, Route, Routes, Navigate } from "react-router-dom";
import NotificationDashboard from "./admin/NotificationDashboard.jsx";

export default function AdminDashboard() {
  return (
    <div className="w-full h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="fixed top-0 left-0 h-screen w-[300px] bg-white shadow-lg p-4 z-50">
        <h2 className="text-lg font-bold mb-6">Admin Menu</h2>
        <nav className="flex flex-col space-y-2">
          <Link to="users" className="block py-2 px-4 rounded hover:bg-gray-200">
            Manage Users
          </Link>
          <Link to="products" className="block py-2 px-4 rounded hover:bg-gray-200">
            Manage Products
          </Link>
          <Link to="orders" className="block py-2 px-4 rounded hover:bg-gray-200">
            View Orders
          </Link>
          <Link to="notifications" className="block py-2 px-4 rounded hover:bg-gray-200">
            Notification Management
          </Link>
        </nav>
      </aside>

      {/* Main content */}
      <main className="ml-[300px] h-screen overflow-y-auto p-6 bg-white rounded-lg shadow-inner">
        <Routes>
          {/* Default page */}
          <Route index element={<h2 className="text-xl font-semibold">Welcome to Admin Dashboard</h2>} />

          {/* Sub routes */}
          <Route path="users" element={<h2 className="text-lg">Manage Users Content</h2>} />
          <Route path="products" element={<h2 className="text-lg">Products Content</h2>} />
          <Route path="orders" element={<h2 className="text-lg">View Orders Content</h2>} />
          <Route path="notifications" element={<NotificationDashboard />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/admin" />} />
        </Routes>
      </main>
    </div>
  );
}
