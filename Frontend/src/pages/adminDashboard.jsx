import { Link, Route, Routes } from "react-router-dom";

export default function AdminDashboard() {
    return (
        <div className="w-full h-screen bg-gray-200 flex p-2">
            <div className="h-full w-[300px]">
                <h2 className="text-lg font-bold">Admin Menu</h2>
                <Link to="/admin/users" className="block py-2 px-4 hover:bg-gray-300">Manage Users</Link>
                <Link to="/admin/products" className="block py-2 px-4 hover:bg-gray-300">Manage Products</Link>
                <Link to="/admin/orders" className="block py-2 px-4 hover:bg-gray-300">View Orders</Link>
            </div>
            <div className="h-full bg-white w-[calc(100vw-300px)] rounded-lg">
               <Routes path="/*">
                    <Route path="/users" element={<h2>Manage Users Content</h2>} />
                    <Route path="/products" element={<h2>Products Content</h2>} />
                    <Route path="/orders" element={<h2>View Orders Content</h2>} />
               </Routes>
            </div>
        </div>
    );
}