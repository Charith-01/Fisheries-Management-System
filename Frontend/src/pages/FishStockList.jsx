import { useState, useEffect } from "react";
import { fishStockService } from "../services/fishStockService";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

export default function FishStockList() {
    const [fishStocks, setFishStocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    useEffect(() => {
        fetchFishStocks();
    }, []);

    async function fetchFishStocks() {
        try {
            setLoading(true);
            const response = await fishStockService.getAllFishStocks();
            setFishStocks(response.data);
        } catch (error) {
            toast.error(error.message || "Failed to load fish stocks");
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="w-full h-screen flex justify-center items-center">
                <p className="text-gray-700">Loading fish stocks...</p>
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen p-4">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">Fish Stock Management</h1>
                    {(user.role === "admin" || user.role === "fisherman") && (
                        <Link
                            to="/fishstock/create"
                            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                        >
                            Add New Fish Stock
                        </Link>
                    )}
                </div>

                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="px-6 py-3 text-left">Stock ID</th>
                                <th className="px-6 py-3 text-left">Fish Type</th>
                                <th className="px-6 py-3 text-left">Weight (kg)</th>
                                <th className="px-6 py-3 text-left">Quality</th>
                                <th className="px-6 py-3 text-left">Catch Date</th>
                                {user.role === "admin" && (
                                    <th className="px-6 py-3 text-left">Actions</th>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {fishStocks.map((stock) => (
                                <tr key={stock._id} className="border-b">
                                    <td className="px-6 py-4">{stock.stockId}</td>
                                    <td className="px-6 py-4"><span className={`px-2 py-1 rounded ${
                                            stock.quality === "Premium" ? "bg-green-100 text-green-800" :
                                            stock.quality === "Grade A" ? "bg-blue-100 text-blue-800" :
                                            stock.quality === "Grade B" ? "bg-yellow-100 text-yellow-800" :
                                            "bg-red-100 text-red-800"
                                        }`}>
                                            {stock.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">{stock.weight}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded ${
                                            stock.quality === "Premium" ? "bg-green-100 text-green-800" :
                                            stock.quality === "Grade A" ? "bg-blue-100 text-blue-800" :
                                            stock.quality === "Grade B" ? "bg-yellow-100 text-yellow-800" :
                                            "bg-red-100 text-red-800"
                                        }`}>
                                            {stock.quality}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {new Date(stock.catchDate).toLocaleDateString()}
                                    </td>
                                    {user.role === "admin" && (
                                        <td className="px-6 py-4">
                                            <Link
                                                to={`/fishstock/edit/${stock._id}`}
                                                className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 mr-2"
                                            >
                                                Edit
                                            </Link>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {fishStocks.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                            No fish stocks found.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}