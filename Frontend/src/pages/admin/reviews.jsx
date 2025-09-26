// Frontend/src/pages/admin/reviews.jsx
import { useEffect, useMemo, useState } from "react";
import {
  RefreshCcw,
  Search,
  Star,
  ExternalLink,
  AlertCircle,
  Filter,
  ChevronLeft,
  ChevronRight,
  X,
  Download, // ✅ added
} from "lucide-react";
import { exportTablePDF } from "../../utils/pdfExporter"; // ✅ added

/* ----------------------- tiny UI helpers ----------------------- */

const cls = (...a) => a.filter(Boolean).join(" ");

function Stars({ value = 0 }) {
  const v = Math.max(0, Math.min(5, Math.round(Number(value) || 0)));
  return (
    <span className="inline-flex items-center text-amber-500" title={`${v} star(s)`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={cls("h-4 w-4", i < v ? "fill-amber-500" : "opacity-30")} />
      ))}
    </span>
  );
}

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="px-4 py-3"><div className="h-4 w-40 bg-slate-200 rounded" /></td>
      <td className="px-4 py-3"><div className="h-4 w-24 bg-slate-200 rounded" /></td>
      <td className="px-4 py-3"><div className="h-4 w-56 bg-slate-200 rounded" /></td>
      <td className="px-4 py-3"><div className="h-4 w-28 bg-slate-200 rounded" /></td>
      <td className="px-4 py-3"><div className="h-4 w-24 bg-slate-200 rounded" /></td>
      <td className="px-4 py-3"><div className="h-8 w-24 bg-slate-200 rounded-full" /></td>
    </tr>
  );
}

function initials(name) {
  const n = (name || "Customer").trim();
  const parts = n.replace(/\s+/g, " ").split(" ").filter(Boolean);
  if (parts.length === 1) return (parts[0][0] || "C").toUpperCase();
  return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
}

/* ----------------------- page component ----------------------- */

export default function AdminReviewsPage() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]); // flat reviews
  const [error, setError] = useState("");

  // filters/sort/search
  const [q, setQ] = useState("");
  const [ratingFilter, setRatingFilter] = useState("all"); // all | 5|4|3|2|1
  const [productFilter, setProductFilter] = useState("all");
  const [sortBy, setSortBy] = useState("dateDesc"); // dateDesc|dateAsc|ratingDesc|ratingAsc

  // pagination
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // slide-over "View" panel state
  const [viewer, setViewer] = useState(null); // { productId, productName } | null

  async function fetchAll() {
    setLoading(true);
    setError("");
    try {
      // 1) get all products
      const prodRes = await fetch(import.meta.env.VITE_BACKEND_URL + "/api/product/all");
      const prodJson = await prodRes.json();
      const products = Array.isArray(prodJson?.data) ? prodJson.data : [];

      // 2) fetch reviews per product in parallel
      const bag = [];
      await Promise.all(
        products.map(async (p) => {
          const pid = p?.productId;
          if (!pid) return;
          try {
            const r = await fetch(
              `${import.meta.env.VITE_BACKEND_URL}/api/review/${encodeURIComponent(pid)}`
            );
            const j = await r.json();
            const list = Array.isArray(j?.data) ? j.data : [];
            list.forEach((rv) => {
              bag.push({
                _id: rv?._id,
                rating: Number(rv?.rating) || 0,
                comment: rv?.comment || "",
                createdAt: rv?.createdAt ? new Date(rv.createdAt) : null,
                userName: rv?.user?.name || (rv?.user?.email ? rv.user.email.split("@")[0] : "Customer"),
                userEmail: rv?.user?.email || "",
                productId: pid,
                productName: p?.name || pid,
              });
            });
          } catch {
            // ignore single product review errors
          }
        })
      );

      // newest first by default
      bag.sort((a, b) => (b.createdAt?.getTime?.() || 0) - (a.createdAt?.getTime?.() || 0));
      setRows(bag);
    } catch (e) {
      setError("Failed to load reviews.");
    } finally {
      setLoading(false);
      setPage(1);
    }
  }

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // derive product list for filter
  const productOptions = useMemo(() => {
    const set = new Map();
    rows.forEach((r) => {
      if (r.productId && r.productName && !set.has(r.productId)) {
        set.set(r.productId, r.productName);
      }
    });
    return Array.from(set.entries()).map(([id, name]) => ({ id, name }));
  }, [rows]);

  // filter + search + sort
  const filtered = useMemo(() => {
    let out = rows;

    if (productFilter !== "all") {
      out = out.filter((r) => r.productId === productFilter);
    }

    if (ratingFilter !== "all") {
      const rv = Number(ratingFilter);
      out = out.filter((r) => r.rating === rv);
    }

    const s = q.trim().toLowerCase();
    if (s) {
      out = out.filter(
        (r) =>
          r.productName?.toLowerCase().includes(s) ||
          r.userName?.toLowerCase().includes(s) ||
          r.userEmail?.toLowerCase().includes(s) ||
          r.comment?.toLowerCase().includes(s) ||
          r.productId?.toLowerCase().includes(s)
      );
    }

    switch (sortBy) {
      case "dateAsc":
        out = [...out].sort(
          (a, b) => (a.createdAt?.getTime?.() || 0) - (b.createdAt?.getTime?.() || 0)
        );
        break;
      case "ratingDesc":
        out = [...out].sort((a, b) => b.rating - a.rating);
        break;
      case "ratingAsc":
        out = [...out].sort((a, b) => a.rating - b.rating);
        break;
      default:
        // dateDesc
        out = [...out].sort(
          (a, b) => (b.createdAt?.getTime?.() || 0) - (a.createdAt?.getTime?.() || 0)
        );
        break;
    }

    return out;
  }, [rows, q, productFilter, ratingFilter, sortBy]);

  // pagination slice
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  // reviews for the selected product (viewer)
  const viewerReviews = useMemo(() => {
    if (!viewer) return [];
    return rows
      .filter((r) => r.productId === viewer.productId)
      .sort((a, b) => (b.createdAt?.getTime?.() || 0) - (a.createdAt?.getTime?.() || 0));
  }, [viewer, rows]);

  // ✅ PDF Export (does not change any existing logic)
  const handleExportPDF = async () => {
    if (!filtered.length) return;
    await exportTablePDF({
      title: "Reviews Report",
      meta: {
        Search: q,               // (kept for parity; exporter currently omits these from header)
        "Rating Filter": ratingFilter === "all" ? "All" : `${ratingFilter} star(s)`,
        "Product Filter": productFilter === "all"
          ? "All"
          : (productOptions.find(p => p.id === productFilter)?.name || productFilter),
        Sort: ({
          dateDesc: "Newest first",
          dateAsc: "Oldest first",
          ratingDesc: "Rating ↓",
          ratingAsc: "Rating ↑",
        })[sortBy],
      },
      columns: [
        { header: "Product", accessor: "productName" },
        { header: "Product ID", accessor: "productId" },
        { header: "Rating", get: (r) => `${r.rating}.0`, align: "center", width: 60 },
        { header: "Comment", accessor: "comment", width: 280 },
        { header: "User", accessor: "userName", width: 120 },
        { header: "Email", accessor: "userEmail", width: 160 },
        { header: "Date", get: (r) => (r.createdAt ? r.createdAt.toLocaleDateString() : "—"), width: 90 },
      ],
      rows: filtered,
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold text-slate-900">All Reviews</h1>
        <span className="text-sm text-slate-500">
          {loading ? "Loading…" : `${rows.length} total`}
        </span>
        <div className="ml-auto flex items-center gap-2">
          {/* ✅ PDF button (added) */}
          <button
            onClick={handleExportPDF}
            className="h-10 px-3 inline-flex items-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200 ring-1 ring-slate-200"
            title="Download PDF"
          >
            <Download className="h-4 w-4" />
            Export
          </button>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder="Search by product, user, comment…"
              className="h-10 w-72 rounded-xl border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-sky-500/30"
            />
          </div>

          <select
            value={productFilter}
            onChange={(e) => {
              setProductFilter(e.target.value);
              setPage(1);
            }}
            className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-800 focus:ring-2 focus:ring-sky-500/30"
            title="Filter by product"
          >
            <option value="all">All products</option>
            {productOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <select
            value={ratingFilter}
            onChange={(e) => {
              setRatingFilter(e.target.value);
              setPage(1);
            }}
            className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-800 focus:ring-2 focus:ring-sky-500/30"
            title="Filter by rating"
          >
            <option value="all">All ratings</option>
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={String(n)}>
                {n} stars
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-800 focus:ring-2 focus:ring-sky-500/30"
            title="Sort"
          >
            <option value="dateDesc">Newest first</option>
            <option value="dateAsc">Oldest first</option>
            <option value="ratingDesc">Rating ↓</option>
            <option value="ratingAsc">Rating ↑</option>
          </select>

          <button
            onClick={fetchAll}
            className="h-10 w-10 grid place-items-center rounded-xl bg-slate-100 hover:bg-slate-200 ring-1 ring-slate-200"
            title="Refresh"
            aria-label="Refresh"
          >
            <RefreshCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Table / Empty / Error */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {error && (
          <div className="p-6 flex items-center gap-2 text-rose-700 bg-rose-50 border-b border-rose-100">
            <AlertCircle className="h-5 w-5" />
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Product</th>
                <th className="px-4 py-3 text-left font-semibold">
                  <div className="inline-flex items-center gap-1">
                    <Filter className="h-3.5 w-3.5" /> Rating
                  </div>
                </th>
                <th className="px-4 py-3 text-left font-semibold">Comment</th>
                <th className="px-4 py-3 text-left font-semibold">User</th>
                <th className="px-4 py-3 text-left font-semibold">Date</th>
                <th className="px-4 py-3 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {loading &&
                Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)}

              {!loading && pageRows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                    No reviews found for current filters.
                  </td>
                </tr>
              )}

              {!loading &&
                pageRows.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 align-top">
                      <div className="font-medium text-slate-900 line-clamp-1">
                        {r.productName}
                      </div>
                      <div className="text-xs text-slate-500">{r.productId}</div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="inline-flex items-center gap-2">
                        <Stars value={r.rating} />
                        <span className="text-xs text-slate-500">{r.rating}.0</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="max-w-[520px] text-slate-700 line-clamp-3">
                        {r.comment || <span className="italic text-slate-400">—</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-sky-100 text-sky-700 grid place-items-center text-xs font-bold">
                          {initials(r.userName)}
                        </div>
                        <div>
                          <div className="font-medium text-slate-900 line-clamp-1">
                            {r.userName}
                          </div>
                          <div className="text-xs text-slate-500 line-clamp-1">
                            {r.userEmail}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      {r.createdAt
                        ? r.createdAt.toLocaleDateString()
                        : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setViewer({ productId: r.productId, productName: r.productName })}
                          className="inline-flex items-center gap-1 rounded-full border border-slate-300 px-3 py-1.5 text-xs hover:bg-slate-50"
                          title="View reviews for this product"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* footer / pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50 text-sm">
          <div className="text-slate-600">
            {filtered.length > 0 ? (
              <>
                Showing{" "}
                <span className="font-semibold">
                  {1 + (page - 1) * pageSize}
                </span>{" "}
                –{" "}
                <span className="font-semibold">
                  {Math.min(page * pageSize, filtered.length)}
                </span>{" "}
                of <span className="font-semibold">{filtered.length}</span>
              </>
            ) : (
              "No results"
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-slate-700 disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </button>
            <div className="px-2 text-slate-600">
              Page <span className="font-semibold">{page}</span> / {totalPages}
            </div>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-slate-700 disabled:opacity-50"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Slide-over viewer (stays in admin) */}
      {viewer && (
        <>
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-[1px] z-40"
            onClick={() => setViewer(null)}
          />
          <aside
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-xl bg-white shadow-2xl ring-1 ring-slate-200 animate-[slideIn_.2s_ease]"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-500">Product</div>
                <div className="font-semibold text-slate-900">{viewer.productName}</div>
                <div className="text-xs text-slate-500">{viewer.productId}</div>
              </div>
              <button
                onClick={() => setViewer(null)}
                className="h-9 w-9 grid place-items-center rounded-lg hover:bg-slate-100"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-y-auto h-full p-4 space-y-3">
              {viewerReviews.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  No reviews for this product.
                </div>
              ) : (
                viewerReviews.map((r) => (
                  <div
                    key={r._id}
                    className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-sky-100 text-sky-700 grid place-items-center text-xs font-bold">
                          {initials(r.userName)}
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">{r.userName}</div>
                          <div className="text-xs text-slate-500">
                            {r.userEmail || "—"}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Stars value={r.rating} />
                        <div className="text-xs text-slate-500">
                          {r.createdAt ? r.createdAt.toLocaleDateString() : "—"}
                        </div>
                      </div>
                    </div>
                    {r.comment && (
                      <p className="mt-3 text-sm text-slate-700 whitespace-pre-wrap">
                        {r.comment}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </aside>

          <style>{`
            @keyframes slideIn { from { transform: translateX(20px); opacity: 0 } to { transform: translateX(0); opacity: 1 } }
          `}</style>
        </>
      )}
    </div>
  );
}
