import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { Edit, Trash2, Plus, Tag, Download, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const CATEGORIES = ["all", "fish", "crab", "shellfish", "prawn", "lobster", "squid", "other"];
const STATUS = ["all", "active", "inactive"];

export default function AdminProductsPage({ darkMode }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");

  useEffect(() => {
    axios
      .get(import.meta.env.VITE_BACKEND_URL + "/api/product/all")
      .then((res) => setProducts(Array.isArray(res.data?.data) ? res.data.data : []))
      .catch((err) => setError(err?.response?.data?.message || "Failed to load products"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = Array.isArray(products) ? products : [];
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((p) => {
        const hay = [p?.name, (p?.altNames || []).join(" "), p?.category, p?.productId, p?.description]
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      });
    }
    if (category !== "all") list = list.filter((p) => p?.category === category);
    if (status !== "all") {
      const want = status === "active";
      list = list.filter((p) => Boolean(p?.isActive) === want);
    }
    return list;
  }, [products, query, category, status]);

  const exportCSV = () => {
    const headers = ["productId", "name", "category", "unit", "price", "labeledPrice", "stock", "isActive", "createdAt"];
    const rows = filtered.map((p) => [
      p.productId,
      escapeCSV(p.name),
      p.category,
      p.unit,
      toMoney(p.price),
      toMoney(p.labeledPrice),
      p.stock,
      p.isActive ? "true" : "false",
      p.createdAt ? new Date(p.createdAt).toISOString() : "",
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `products_report_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className={`rounded-2xl p-4 sm:p-6 shadow ring-1 backdrop-blur ${
        darkMode ? "bg-slate-800/90 ring-slate-700" : "bg-white/80 ring-slate-100"
      }`}
    >
      <div className="mb-4 grid gap-3 md:grid-cols-[1fr_auto]">
        <div className="flex items-center justify-between">
          <div>
            <h3 className={`text-lg font-bold ${darkMode ? "text-white" : "text-slate-900"}`}>Products</h3>
            <p className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Manage your seafood catalog</p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={exportCSV}
            type="button"
            className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-all ${
              darkMode ? "bg-slate-700 text-white hover:bg-slate-600" : "bg-slate-100 text-slate-800 hover:bg-slate-200"
            }`}
            title="Export current view as CSV"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
          <Link
            to="/admin/addProduct"
            className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-all ${
              darkMode ? "bg-blue-600 text-white hover:bg-blue-500" : "bg-blue-600 text-white hover:bg-blue-500"
            }`}
          >
            <Plus className="h-4 w-4" />
            Add product
          </Link>
        </div>
      </div>

      <div
        className={`mb-4 grid gap-2 rounded-xl p-3 ring-1 ${
          darkMode ? "ring-slate-700 bg-slate-900/20" : "ring-slate-200 bg-slate-50"
        } md:grid-cols-[1fr_200px_160px_auto]`}
      >
        <div className="relative">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, ID, category…"
            className={`w-full rounded-lg border px-3 py-2 text-sm outline-none ${
              darkMode
                ? "border-slate-700 bg-slate-800 text-white placeholder:text-slate-400"
                : "border-slate-300 bg-white placeholder:text-slate-400"
            }`}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className={`absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 ${
                darkMode ? "hover:bg-slate-700" : "hover:bg-slate-100"
              }`}
              title="Clear"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className={`rounded-lg border px-3 py-2 text-sm ${
            darkMode ? "border-slate-700 bg-slate-800 text-white" : "border-slate-300 bg-white text-slate-800"
          }`}
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c === "all" ? "All categories" : c}
            </option>
          ))}
        </select>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className={`rounded-lg border px-3 py-2 text-sm ${
            darkMode ? "border-slate-700 bg-slate-800 text-white" : "border-slate-300 bg-white text-slate-800"
          }`}
        >
          {STATUS.map((s) => (
            <option key={s} value={s}>
              {s === "all" ? "All statuses" : s === "active" ? "Active" : "Inactive"}
            </option>
          ))}
        </select>

        <div className="flex items-center justify-end text-sm">
          <span className={darkMode ? "text-slate-300" : "text-slate-600"}>
            Showing <strong>{filtered.length}</strong> of <strong>{products.length}</strong>
          </span>
        </div>
      </div>

      {loading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className={`animate-pulse overflow-hidden rounded-2xl ring-1 ${
                darkMode ? "ring-slate-700 bg-slate-800/70" : "ring-slate-100 bg-white"
              }`}
            >
              <div className={`h-40 ${darkMode ? "bg-slate-700/60" : "bg-slate-100"}`} />
              <div className="space-y-3 p-4">
                <div className={`h-5 w-2/3 rounded ${darkMode ? "bg-slate-700" : "bg-slate-200"}`} />
                <div className={`h-4 w-1/2 rounded ${darkMode ? "bg-slate-700" : "bg-slate-200"}`} />
                <div className={`h-8 w-full rounded ${darkMode ? "bg-slate-700" : "bg-slate-200"}`} />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && error && (
        <div
          className={`mb-2 rounded-xl border p-3 text-sm ${
            darkMode ? "border-red-700/40 bg-red-900/20 text-red-200" : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {error}
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className={`grid place-items-center rounded-xl p-10 text-center ${darkMode ? "bg-slate-900/30" : "bg-slate-50"}`}>
          <Tag className={`mb-2 h-8 w-8 ${darkMode ? "text-slate-300" : "text-slate-500"}`} />
          <p className={`text-sm ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
            No matching products. Adjust filters or add a new item.
          </p>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filtered.map((p) => (
            <ProductCard key={p.productId} product={p} darkMode={darkMode} />
          ))}
        </div>
      )}
    </div>
  );
}

function ProductCard({ product, darkMode }) {
  const {
    name,
    productId,
    images = [],
    category,
    unit = "kg",
    price,
    labeledPrice,
    stock = 0,
    isActive = true,
    altNames = [],
    description = "",
  } = product || {};

  const img = Array.isArray(images) && images.length > 0 ? images[0] : "";
  const hasDiscount = typeof labeledPrice === "number" && typeof price === "number" && labeledPrice > price;

  async function deleteProduct(id) {

    const ok = window.confirm(
      `Are you sure you want to delete "${name}" (ID: ${id})?\nThis action cannot be undone.`
    );
    if (!ok) return;

    const token = localStorage.getItem("token");
    if (token == null) {
      toast.error("Please login to delete a product");
      return;
    }
    try {
      await axios.delete(import.meta.env.VITE_BACKEND_URL + "/api/product/delete/" + id, {
        headers: { Authorization: "Bearer " + token },
      });
      toast.success("Product deleted successfully");
      window.location.reload();
    } catch (err) {
      console.log(err);
      const msg = err?.response?.data?.message || "Product deleting failed";
      toast.error(msg);
    }
  }

  const navigate = useNavigate();

  return (
    <div
      className={`group relative rounded-2xl ring-1 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 ${
        darkMode ? "bg-slate-800/90 ring-slate-700" : "bg-white/90 ring-slate-100"
      }`}
    >
      <div className="relative overflow-hidden rounded-t-2xl">
        <img
          src={img}
          alt={name}
          onError={(e) => {
            e.currentTarget.src = "https://www.shoshinsha-design.com/wp-content/uploads/2020/05/noimage.png";
          }}
          className="h-44 w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />
        <span
          className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-semibold shadow ${
            darkMode ? "bg-slate-900/80 text-slate-100" : "bg-white/90 text-slate-700"
          }`}
        >
          {category}
        </span>
        <span
          className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-xs font-semibold shadow ${
            isActive ? "bg-blue-600 text-white" : "bg-slate-400 text-white"
          }`}
        >
          {isActive ? "Active" : "Inactive"}
        </span>
      </div>

      <div className="space-y-2 p-4 pb-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4 className={`line-clamp-1 text-base font-semibold ${darkMode ? "text-white" : "text-slate-900"}`}>{name}</h4>
            {altNames?.length > 0 && (
              <p className={`line-clamp-1 text-xs ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                aka: {altNames.slice(0, 3).join(", ")}
                {altNames.length > 3 ? "…" : ""}
              </p>
            )}
          </div>
          <span
            className={`shrink-0 rounded-lg px-2 py-1 text-[10px] font-semibold ${
              darkMode ? "bg-slate-700 text-slate-200" : "bg-slate-100 text-slate-600"
            }`}
          >
            #{productId}
          </span>
        </div>

        <div className="flex flex-wrap items-end gap-x-2 gap-y-1">
          <p className="text-xl font-extrabold text-blue-600">
            Rs.{toMoney(price)} <span className="text-xs font-medium text-blue-600/80">/{unit}</span>
          </p>
          {hasDiscount && (
            <p className={`text-sm line-through ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Rs.{toMoney(labeledPrice)}</p>
          )}
        </div>

        {description && <p className={`line-clamp-2 text-sm ${darkMode ? "text-slate-300" : "text-slate-600"}`}>{description}</p>}

        <div className="mt-2 flex items-center justify-between">
          <span className={`text-xs ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
            Stock: <span className={`${darkMode ? "text-slate-200" : "text-slate-700"} font-semibold`}>{stock} {unit}</span>
          </span>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {navigate("/admin/updateProduct", {state:product})}}
            className="cursor-pointer group/btn inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition-all hover:bg-blue-500"
          >
            <Edit className="h-4 w-4 transition-transform group-hover/btn:-translate-y-0.5" />
            Edit
          </button>
          <button
            type="button"
            onClick={() => {
              deleteProduct(productId);
            }}
            className={`cursor-pointer group/btn inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-all ${
              darkMode ? "bg-red-700/80 text-white hover:bg-red-600" : "bg-red-100 text-red-700 hover:bg-red-200"
            }`}
          >
            <Trash2 className="h-4 w-4 transition-transform group-hover/btn:-translate-y-0.5" />
            Delete
          </button>
        </div>
      </div>

      <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-blue-500/10 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100" />
    </div>
  );
}

function toMoney(v) {
  const n = Number(v ?? 0);
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function escapeCSV(s) {
  if (s == null) return "";
  const str = String(s);
  const needs = /[",\n]/.test(str);
  return needs ? `"${str.replace(/"/g, '""')}"` : str;
}
