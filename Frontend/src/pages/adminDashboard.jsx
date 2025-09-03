import { Link, Route, Routes, Navigate } from "react-router-dom";


export default function AdminDashboard() {
  return (
    <div className="w-full h-screen bg-gray-200 flex p-2">
      <div className="h-full w-[300px]">
        <h2 className="text-lg font-bold">Admin Menu</h2>
        <Link to="users" className="block py-2 px-4 hover:bg-gray-300">Manage Users</Link>
        <Link to="products" className="block py-2 px-4 hover:bg-gray-300">Manage Products</Link>
        <Link to="orders" className="block py-2 px-4 hover:bg-gray-300">View Orders</Link>
       

      </div>

      <div className="h-full bg-white w-[calc(100vw-300px)] rounded-lg p-4">
        <Routes>
          {/* Default page when visiting /admin */}
          <Route index element={<h2>Welcome to Admin Dashboard</h2>} />

          <Route path="users" element={<h2>Manage Users Content</h2>} />
          <Route path="products" element={<h2>Products Content</h2>} />
          <Route path="orders" element={<h2>View Orders Content</h2>} />
  

         
          <Route path="*" element={<Navigate to="/admin" />} />
        </Routes>
      </div>
    </div>
  );
}
