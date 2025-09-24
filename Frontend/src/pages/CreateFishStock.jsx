//Fish stock add form
import { useEffect, useState } from "react";
import { fishStockService } from "../services/fishStockService";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "axios";

export default function CreateFishStock() {
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [weight, setWeight] = useState("");
  const [unit, setUnit] = useState("kg");
  const [quality, setQuality] = useState("Grade A");
  const [catchDate, setCatchDate] = useState("");

  // Link by ObjectId (selected from dropdown)
  const [product, setProduct] = useState("");
  const [productOptions, setProductOptions] = useState([]);

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Load products for dropdown
  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get((import.meta.env.VITE_BACKEND_URL || "http://localhost:3000") + "/api/product/all");
        const list = Array.isArray(res.data?.data) ? res.data.data : [];
        // map to { value: _id, label: "Name (PRD0001)" }
        const opts = list.map(p => ({
          value: p._id,
          label: `${p.name || "Unnamed"}${p.productId ? ` (${p.productId})` : ""}`
        }));
        setProductOptions(opts);
      } catch {
        // dropdown is optional; ignore error, keep empty
      }
    };
    load();
  }, []);

  async function handleSubmit() {
    const w = parseFloat(weight);

    if (!name || !type || !weight) {
      toast.error("Please fill all required fields");
      return;
    }
    if (Number.isNaN(w) || w <= 0) {
      toast.error("Weight must be a positive number");
      return;
    }

    const payload = {
      name,
      type,
      weight: w,
      unit,
      quality,
      catchDate: catchDate || new Date().toISOString().split("T")[0],
    };

    if (product) payload.product = product; // ObjectId only

    setLoading(true);
    try {
      await fishStockService.createFishStock(payload);
      toast.success("Fish stock created successfully");
      navigate("/admin/stock");
    } catch (error) {
      toast.error(error.message || "Failed to create fish stock");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full min-h-screen p-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Add New Fish Stock</h1>

        <div className="space-y-4">
          <div>
            <label className="block text-gray-700 mb-2">Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter Seafood name"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Type *</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Select Type --</option>
              <option value="fish">Fish</option>
              <option value="crab">Crab</option>
              <option value="shellfish">Shellfish</option>
              <option value="prawn">Prawn</option>
              <option value="lobster">Lobster</option>
              <option value="squid">Squid</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Weight *</label>
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter weight"
              step="0.1"
              min="0.1"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Unit</label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="kg">Kilograms (kg)</option>
              <option value="g">Grams (g)</option>
              <option value="lbs">Pounds (lbs)</option>
              <option value="pieces">Pieces</option>
            </select>
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

          {/* Product link (optional) */}
          <div>
            <label className="block text-gray-700 mb-2">Link to Product (optional)</label>
            <select
              value={product}
              onChange={(e) => setProduct(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Select Product --</option>
              {productOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
            >
              {loading ? "Creating..." : "Create Fish Stock"}
            </button>
            <button
              onClick={() => navigate("/admin/stock")}
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
