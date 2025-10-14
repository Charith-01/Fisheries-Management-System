import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fishStockService } from "../services/fishStockService";
import toast from "react-hot-toast";
import axios from "axios";

export default function UpdateFishStock() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [weight, setWeight] = useState("");
  const [unit, setUnit] = useState("kg");
  const [quality, setQuality] = useState("Grade A");
  const [catchDate, setCatchDate] = useState("");
  const [updateComment, setUpdateComment] = useState("");

  // Link by ObjectId
  const [product, setProduct] = useState("");
  const [productOptions, setProductOptions] = useState([]);
  const [originalData, setOriginalData] = useState(null);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log('Component mounted with ID:', id);
    console.log('ID type:', typeof id);
    fetchFishStock();
    
    // Load products for dropdown
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
      console.log('Fetching fish stock with ID:', id);
      const response = await fishStockService.getFishStockById(id);
      const stock = response.data;
      console.log('Fetched stock:', stock);

      setName(stock.name || "");
      setType(stock.type || "");
      setWeight(typeof stock.weight === "number" ? String(stock.weight) : stock.weight || "");
      setUnit(stock.unit || "kg");
      setQuality(stock.quality || "Grade A");
      setCatchDate(stock.catchDate ? String(stock.catchDate).split("T")[0] : "");

      // prefill product if populated
      if (stock.product && stock.product._id) {
        setProduct(stock.product._id);
      } else {
        setProduct("");
      }

      // Store original data for comparison
      setOriginalData({
        name: stock.name,
        type: stock.type,
        weight: stock.weight,
        unit: stock.unit,
        quality: stock.quality,
        catchDate: stock.catchDate,
        product: stock.product?._id || ""
      });
    } catch (error) {
      console.error('Error fetching fish stock:', error);
      toast.error(error.message || "Failed to load fish stock");
      navigate("/admin/stock");
    }
  }

  // Check if there are any changes
  const hasChanges = () => {
    if (!originalData) return false;
    
    return name !== originalData.name ||
           type !== originalData.type ||
           parseFloat(weight) !== originalData.weight ||
           unit !== originalData.unit ||
           quality !== originalData.quality ||
           catchDate !== (originalData.catchDate ? String(originalData.catchDate).split("T")[0] : "") ||
           product !== (originalData.product || "");
  };

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
    if (!updateComment.trim()) {
      toast.error("Please provide an update comment explaining the changes");
      return;
    }
    if (!hasChanges()) {
      toast.error("No changes detected. Please make changes before updating.");
      return;
    }

    const payload = {
      name,
      type,
      weight: w,
      unit,
      quality,
      catchDate: catchDate || undefined,
      updateComment: updateComment.trim()
    };

    if (product) payload.product = product;
    else payload.product = null;

    console.log('Submitting update with ID:', id);
    console.log('Payload:', payload);

    setLoading(true);
    try {
      await fishStockService.updateFishStock(id, payload);
      toast.success("Fish stock updated successfully"); 
      navigate("/admin/stock");
    } catch (error) {
      console.error('Update error:', error);
      toast.error(error.message || "Failed to update fish stock");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full min-h-screen p-4">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Update Fish Stock</h1>
        
        {/* Debug info - remove in production */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-yellow-700">
            <strong>Debug Info:</strong> ID: {id} | Type: {typeof id} | Length: {id?.length}
          </p>
        </div>

        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">Update Information</h3>
            <p className="text-sm text-blue-600">
              Please provide a comment explaining the reason for these changes. This will be recorded in the update history.
            </p>
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Update Comment *</label>
            <textarea
              value={updateComment}
              onChange={(e) => setUpdateComment(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Explain the reason for these changes..."
              rows="3"
            />
            <p className="text-sm text-gray-500 mt-1">
              Required field. Describe what changed and why.
            </p>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Stock Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>

            {/* Product link (optional) */}
            <div className="mt-4">
              <label className="block text-gray-700 mb-2">Link to Product</label>
              <select
                value={product}
                onChange={(e) => setProduct(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- No Link --</option>
                {productOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSubmit}
              disabled={loading || !hasChanges() || !updateComment.trim()}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? "Updating..." : "Update Fish Stock"}
            </button>
            <button
              onClick={() => navigate("/admin/stock")}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>

          {!hasChanges() && originalData && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-700">
                No changes detected. Modify the fields above to enable the update button.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}