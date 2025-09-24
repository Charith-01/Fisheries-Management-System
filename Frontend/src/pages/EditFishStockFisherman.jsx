import { useState, useEffect } from "react";
import { fishStockService } from "../services/fishStockService";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft } from "lucide-react";
import axios from "axios";

export default function EditFishStockFisherman() {
  const { id } = useParams();
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [weight, setWeight] = useState("");
  const [unit, setUnit] = useState("kg");
  const [quality, setQuality] = useState("Grade A");
  const [catchDate, setCatchDate] = useState("");

  // Link by ObjectId
  const [product, setProduct] = useState("");
  const [productOptions, setProductOptions] = useState([]);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchFishStock();
    (async () => {
      try {
        const res = await axios.get((import.meta.env.VITE_BACKEND_URL || "http://localhost:3000") + "/api/product/all");
        const list = Array.isArray(res.data?.data) ? res.data.data : [];
        const opts = list.map(p => ({
          value: p._id,
          label: `${p.name || "Unnamed"}${p.productId ? ` (${p.productId})` : ""}`
        }));
        setProductOptions(opts);
      } catch {
        // ignore
      }
    })();
  }, [id]);

  async function fetchFishStock() {
    try {
      setFetching(true);
      const response = await fishStockService.getFishStockById(id);
      const stock = response.data;
      
      setName(stock.name || "");
      setType(stock.type || "");
      setWeight(typeof stock.weight === "number" ? stock.weight.toString() : stock.weight || "");
      setUnit(stock.unit || "kg");
      setQuality(stock.quality || "Grade A");
      setCatchDate(stock.catchDate ? stock.catchDate.split('T')[0] : "");

      if (stock.product && stock.product._id) setProduct(stock.product._id);
      else setProduct("");
    } catch (error) {
      toast.error(error.message || "Failed to fetch fish stock");
      navigate("/fisherman/stock");
    } finally {
      setFetching(false);
    }
  }

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

    if (product) payload.product = product;
    else payload.product = null;

    setLoading(true);
    try {
      await fishStockService.updateFishStock(id, payload);

      toast.success("Fish stock updated successfully");
      navigate("/fisherman/stock");
    } catch (error) {
      toast.error(error.message || "Failed to update fish stock");
    } finally {
      setLoading(false);
    }
  }

  if (fetching) {
    return (
      <div className="w-full min-h-screen p-4 bg-gradient-to-br from-sky-50 via-cyan-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading fish stock details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen p-4 bg-gradient-to-br from-sky-50 via-cyan-50 to-blue-50">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center mb-6">
          <button 
            onClick={() => navigate("/fisherman/stock")}
            className="flex items-center text-blue-600 hover:text-blue-800 mr-4"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Edit Fish Stock</h1>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-gray-700 mb-2">Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter Seafood name"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Type *</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Link to Product */}
          <div>
            <label className="block text-gray-700 mb-2">Link to Product</label>
            <select
              value={product}
              onChange={(e) => setProduct(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- No Link --</option>
              {productOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 disabled:bg-gray-400 font-medium transition-colors"
            >
              {loading ? "Updating..." : "Update Fish Stock"}
            </button>
            <button
              onClick={() => navigate("/fisherman/stock")}
              className="px-6 py-3 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
