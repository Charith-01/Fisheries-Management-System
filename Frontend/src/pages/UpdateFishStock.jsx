import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fishStockService } from "../services/fishStockService";
import toast from "react-hot-toast";

export default function UpdateFishStock() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [type, setType] = useState("");
    const [weight, setWeight] = useState("");
    const [quality, setQuality] = useState("Grade A");
    const [catchDate, setCatchDate] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchFishStock();
    }, [id]);

    async function fetchFishStock() {
        try {
            const response = await fishStockService.getFishStockById(id);
            const stock = response.data;
            setType(stock.type);
            setWeight(stock.weight);
            setQuality(stock.quality);
            setCatchDate(stock.catchDate.split('T')[0]);
        } catch (error) {
            toast.error(error.message || "Failed to load fish stock");
            navigate("/fishstock");
        }
    }

    async function handleSubmit() {
        if (!type || !weight) {
            toast.error("Please fill all required fields");
            return;
        }

        setLoading(true);
        try {
            await fishStockService.updateFishStock(id, {
                type,
                weight: parseFloat(weight),
                quality,
                catchDate
            });

            toast.success("Fish stock updated successfully");
            navigate("/admin/stock");
        } catch (error) {
            toast.error(error.message || "Failed to update fish stock");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="w-full min-h-screen p-4">
            <div className="max-w-md mx-auto bg-white rounded-lg shadow p-6">
                <h1 className="text-2xl font-bold text-gray-800 mb-6">Update Fish Stock</h1>

                <div className="space-y-4">
                    <div>
                        <label className="block text-gray-700 mb-2">Fish Type *</label>
                         <select
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="Balaya">Balaya</option>
                            <option value="Tuna">Tuna</option>
                            <option value="Salaya">Salaya</option>
                            <option value="Bolla">Bolla</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-gray-700 mb-2">Weight (kg) *</label>
                        <input
                            type="number"
                            value={weight}
                            onChange={(e) => setWeight(e.target.value)}
                            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            step="0.1"
                            min="0.1"
                        />
                    </div>

                    <div>
                        <label className="block text-gray-700 mb-2">Quality Grade</label>
                        <select
                            value={quality}
                            onChange={(e) => setQuality(e.target.value)}
                            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="Premium">Premium</option>
                            <option value="Grade A">Grade A</option>
                            <option value="Grade B">Grade B</option>
                            <option value="Grade C">Grade C</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-gray-700 mb-2">Catch Date</label>
                        <input
                            type="date"
                            value={catchDate}
                            onChange={(e) => setCatchDate(e.target.value)}
                            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
                        >
                            {loading ? "Updating..." : "Update Fish Stock"}
                        </button>
                        <button
                            onClick={() => navigate("/fishstock")}
                            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}