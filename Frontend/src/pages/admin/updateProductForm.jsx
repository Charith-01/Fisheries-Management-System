import axios from "axios";
import { useState, useMemo } from "react";
import toast from "react-hot-toast";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { X, Image as ImageIcon, Percent } from "lucide-react";
import meadiaUpload from "../../utils/meadiaUpload";

export default function UpdateProductForm({ darkMode }) {
  const locationData = useLocation();
  const navigate = useNavigate();

  // Guard: require product state
  if (locationData.state == null) {
    toast.error("Please select a product to edit");
    window.location.href = "/admin/products";
  }

  // Prefill from location state
  const [productId, setProductId] = useState(locationData.state?.productId || "");
  const [name, setName] = useState(locationData.state?.name || "");
  const [altName, setAltName] = useState(locationData.state?.altNames?.join(", ") || "");
  const [price, setPrice] = useState(locationData.state?.price ?? "");
  const [labeledPrice, setLabeledPrice] = useState(locationData.state?.labeledPrice ?? "");
  const [stock, setStock] = useState(locationData.state?.stock ?? "");
  const [category, setCategory] = useState(locationData.state?.category || "fish");
  const [unit, setUnit] = useState(locationData.state?.unit || "kg");
  const [description, setDescription] = useState(locationData.state?.description || "");
  const [images, setImages] = useState([]); // newly added files only
  const [isActive, setIsActive] = useState(
    typeof locationData.state?.isActive === "boolean" ? locationData.state.isActive : true
  );
  const [submitting, setSubmitting] = useState(false);

  // Derived UI states (kept consistent with AddProductForm)
  const discountPct = useMemo(() => {
    const p = Number(price);
    const lp = Number(labeledPrice);
    if (!isFinite(p) || !isFinite(lp) || lp <= p || lp <= 0) return 0;
    return Math.round(((lp - p) / lp) * 100);
  }, [price, labeledPrice]);

  const altNameChips = useMemo(
    () =>
      (altName || "")
        .split(",")
        .map((n) => n.trim())
        .filter(Boolean)
        .slice(0, 8),
    [altName]
  );

  // File pick/preview helpers (same behavior as AddProductForm)
  function onFilesPicked(fileList) {
    const next = Array.from(fileList || []);
    setImages((prev) => [...prev, ...next]);
  }
  function removeImageAt(idx) {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e) {
    if (e) e.preventDefault();
    setSubmitting(true);

    // Keep your existing uploader approach
    const promisesArray = [];
    for (let i = 0; i < images.length; i++) {
      const promise = meadiaUpload(images[i]);
      promisesArray[i] = promise;
    }

    try {
      let result = await Promise.all(promisesArray);

      // Preserve existing images if no new files were selected
      if (images.length === 0) {
        // NOTE: use existing product images from location state
        result = locationData.state?.images || [];
      }

      const altNamesInArray = altName
        .split(",")
        .map((n) => n.trim())
        .filter((n) => n);

      const product = {
        productId: productId.trim(),
        name: name.trim(),
        altNames: altNamesInArray,
        price: Number(price),
        labeledPrice: Number(labeledPrice),
        stock: Number(stock),
        category: category.trim(),
        unit: unit.trim(),
        description: description.trim(),
        images: result,
        isActive: Boolean(isActive),
      };

      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("You must be logged in to update a product");
        setSubmitting(false);
        return;
      }

      // Keep original logic (PUT), but fix path to include slash
      await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/product/update/${productId}`,
        product,
        {
          headers: {
            Authorization: "Bearer " + token,
          },
        }
      );

      toast.success("Product updated successfully");
      navigate("/admin/products");
    } catch (err) {
      console.log(err);
      toast.error(err?.response?.data?.message || "Product updating failed");
    } finally {
      setSubmitting(false);
    }
  }

  // Existing images from state (for display when editing)
  const existingImages = Array.isArray(locationData.state?.images)
    ? locationData.state.images
    : [];

  return (
    <div
      className={`w-full min-h-[calc(100vh-120px)] flex items-center justify-center p-4 sm:p-6 ${
        darkMode ? "bg-slate-900/20" : "bg-gradient-to-br from-white to-slate-50"
      }`}
    >
      <div
        className={`w-full max-w-4xl rounded-2xl ring-1 overflow-hidden transition-shadow ${
          darkMode
            ? "ring-slate-700 bg-slate-800/90 shadow-xl"
            : "ring-slate-200 bg-white shadow-lg"
        }`}
      >
        {/* Top accent */}
        <div className="h-1 w-full bg-gradient-to-r from-cyan-500 to-blue-600" />

        {/* Header */}
        <div className="px-6 pt-6">
          <h1 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-slate-900"}`}>
            Edit Product
          </h1>
          <p className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
            Update the fields below and save your changes.
          </p>

          {/* Live hints row: discount + status */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {discountPct > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-600/10 px-3 py-1 text-xs font-semibold text-blue-700 dark:text-blue-600 dark:bg-blue-600/20">
                <Percent className="h-3.5 w-3.5" />
                {discountPct}% discount from labeled price
              </span>
            )}
            <span
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                isActive
                  ? "bg-emerald-600 text-white"
                  : darkMode
                  ? "bg-slate-700 text-slate-200"
                  : "bg-slate-200 text-slate-700"
              }`}
            >
              {isActive ? "Active" : "Inactive"}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Product ID (disabled) */}
            <FormField label="Product ID" darkMode={darkMode}>
              <input
                value={productId}
                disabled
                onChange={(e) => setProductId(e.target.value)}
                type="text"
                className={inputClass(darkMode)}
              />
            </FormField>

            {/* Status toggle */}
            <FormField label="Status" darkMode={darkMode}>
              <div
                className={`flex items-center gap-3 rounded-xl border px-3 py-2 ${
                  darkMode ? "border-slate-700 bg-slate-800" : "border-slate-300 bg-white"
                }`}
              >
                <input
                  id="isActive"
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 accent-blue-600"
                />
                <label
                  htmlFor="isActive"
                  className={`text-sm ${darkMode ? "text-slate-200" : "text-slate-700"}`}
                >
                  Active
                </label>
              </div>
            </FormField>

            {/* Name */}
            <FormField label="Product Name *" darkMode={darkMode}>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                type="text"
                required
                placeholder="Atlantic Salmon"
                className={inputClass(darkMode)}
              />
            </FormField>

            {/* Category */}
            <FormField label="Category *" darkMode={darkMode}>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                className={inputClass(darkMode)}
              >
                <option value="fish">Fish</option>
                <option value="crab">Crab</option>
                <option value="shellfish">Shellfish</option>
                <option value="prawn">Prawn</option>
                <option value="lobster">Lobster</option>
                <option value="squid">Squid</option>
                <option value="other">Other</option>
              </select>
            </FormField>

            {/* Unit */}
            <FormField label="Unit *" darkMode={darkMode}>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                required
                className={inputClass(darkMode)}
              >
                <option value="kg">kg</option>
                <option value="g">g</option>
                <option value="lbs">lbs</option>
                <option value="pieces">pieces</option>
              </select>
            </FormField>

            {/* Price */}
            <FormField label="Price (sell) *" darkMode={darkMode}>
              <input
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                type="number"
                inputMode="decimal"
                step="0.01"
                required
                placeholder="0.00"
                className={inputClass(darkMode)}
              />
            </FormField>

            {/* Labeled Price */}
            <FormField label="Labeled Price *" darkMode={darkMode}>
              <input
                value={labeledPrice}
                onChange={(e) => setLabeledPrice(e.target.value)}
                type="number"
                inputMode="decimal"
                step="0.01"
                required
                placeholder="0.00"
                className={inputClass(darkMode)}
              />
            </FormField>

            {/* Stock */}
            <FormField label="Stock *" darkMode={darkMode}>
              <input
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                type="number"
                min="0"
                required
                placeholder="0"
                className={inputClass(darkMode)}
              />
            </FormField>

            {/* Alternate Names */}
            <FormField label="Alternate Names" darkMode={darkMode} full>
              <input
                value={altName}
                onChange={(e) => setAltName(e.target.value)}
                type="text"
                placeholder="Salmo salar, local names (comma separated)"
                className={inputClass(darkMode)}
              />
              {altNameChips.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {altNameChips.map((chip, i) => (
                    <span
                      key={i}
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                        darkMode ? "bg-slate-700 text-slate-200" : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              )}
            </FormField>

            {/* Description */}
            <FormField label="Description" darkMode={darkMode} full>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Short description..."
                className={inputClass(darkMode)}
              />
              <div className={`mt-1 text-xs ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                {description.length}/500
              </div>
            </FormField>

            {/* Existing Images (read-only preview) */}
            {existingImages.length > 0 && (
              <FormField label="Current Images" darkMode={darkMode} full>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {existingImages.map((url, idx) => (
                    <div
                      key={`old-${idx}`}
                      className={`relative overflow-hidden rounded-xl ring-1 ${
                        darkMode ? "ring-slate-700 bg-slate-800" : "ring-slate-200 bg-white"
                      }`}
                    >
                      {/* eslint-disable-next-line jsx-a11y/alt-text */}
                      <img src={url} className="h-28 w-full object-cover" />
                    </div>
                  ))}
                </div>
                <p className={`mt-2 text-xs ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                  If you don’t upload new images, these will be kept.
                </p>
              </FormField>
            )}

            {/* Upload new Images */}
            <FormField label="Upload New Images" darkMode={darkMode} full>
              <label
                className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-sm transition ${
                  darkMode
                    ? "border-slate-700 bg-slate-900/30 hover:bg-slate-900/50 text-slate-300"
                    : "border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-600"
                }`}
              >
                <ImageIcon className="h-5 w-5" />
                <span>Click to select images (JPG/PNG) or drop files here</span>
                <input
                  type="file"
                  multiple
                  onChange={(e) => onFilesPicked(e.target.files)}
                  className="hidden"
                />
              </label>

              {images.length > 0 && (
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {images.map((file, idx) => {
                    let url = "";
                    try {
                      url = URL.createObjectURL(file);
                    } catch {
                      url = "";
                    }
                    return (
                      <div
                        key={idx}
                        className={`relative overflow-hidden rounded-xl ring-1 ${
                          darkMode ? "ring-slate-700 bg-slate-800" : "ring-slate-200 bg-white"
                        }`}
                      >
                        {url ? (
                          <img
                            src={url}
                            alt={`preview-${idx}`}
                            className="h-28 w-full object-cover"
                            onLoad={() => URL.revokeObjectURL?.(url)}
                          />
                        ) : (
                          <div className="h-28 grid place-items-center text-xs opacity-70">
                            No preview
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => removeImageAt(idx)}
                          className={`absolute right-1 top-1 rounded-full p-1 shadow transition ${
                            darkMode
                              ? "bg-slate-900/80 text-slate-200 hover:bg-slate-900"
                              : "bg-white text-slate-700 hover:bg-slate-100"
                          }`}
                          title="Remove"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              <p className={`mt-2 text-xs ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                Your uploader will generate URLs; these will replace existing ones if you add new files.
              </p>
            </FormField>
          </div>

          {/* Actions */}
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Link
              to="/admin/products"
              className={`inline-flex w-full sm:w-1/2 items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold ring-1 transition ${
                darkMode
                  ? "ring-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
                  : "ring-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex w-full sm:w-1/2 items-center justify-center rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:opacity-95 disabled:opacity-60"
            >
              {submitting ? "Updating..." : "Update Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ---------- Small presentational helper ---------- */
function FormField({ label, hint, children, full, darkMode }) {
  return (
    <div className={full ? "md:col-span-2" : ""}>
      <label
        className={`mb-1 block text-sm font-medium ${
          darkMode ? "text-slate-200" : "text-slate-700"
        }`}
      >
        {label}
      </label>
      {children}
      {hint && (
        <p className={`mt-1 text-xs ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
          {hint}
        </p>
      )}
    </div>
  );
}

function inputClass(darkMode) {
  return `w-full rounded-xl border px-3 py-2 text-sm outline-none transition
  ${
    darkMode
      ? "border-slate-700 bg-slate-800 text-white placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
      : "border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
  }`;
}
