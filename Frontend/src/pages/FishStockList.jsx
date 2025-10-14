import { useState, useEffect } from "react";
import { fishStockService } from "../services/fishStockService";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { ShieldAlert, Plus, Download } from "lucide-react"; // ✅ added Download
import { exportTablePDF } from "../utils/pdfExporter"; // ✅ added

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

  // ✅ Export PDF (no other logic touched)
  const exportPDF = () => {
    exportTablePDF({
      title: "Fish Stock Report",
      meta: {
        "Total Stocks": Array.isArray(fishStocks) ? fishStocks.length : 0,
      },
      columns: [
        { header: "Stock ID", get: (s) => s.stockId || "-" },
        { header: "Name", get: (s) => s.name || "-" },
        { header: "Type", get: (s) => s.type || "-" },
        { header: "Weight", get: (s) => (s.weight != null ? String(s.weight) : "-"), align: "right" },
        { header: "Unit", get: (s) => s.unit || "-", align: "center" },
        { header: "Quality", get: (s) => s.quality || "-" },
        {
          header: "Catch Date",
          get: (s) => (s.catchDate ? new Date(s.catchDate).toLocaleDateString() : "-"),
        },
      ],
      rows: Array.isArray(fishStocks) ? fishStocks : [],
    });
  };

  return (
    <div className="w-full min-h-screen p-4">
      <div className="max-w-6xl mx-auto">
        {/* Card wrapper (matches AdminCustomersPage look) */}
        <div className="rounded-2xl p-4 sm:p-6 shadow ring-1 bg-white/80 ring-slate-100">
          {/* Header / Actions */}
          <div className="mb-4 grid gap-3 md:grid-cols-[1fr_auto]">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Fish Stock Management</h3>
                <p className="text-sm text-slate-500">View and manage recorded fish stocks</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              {/* ✅ Export PDF button */}
              <button
                onClick={exportPDF}
                type="button"
                className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-all bg-slate-100 text-slate-800 hover:bg-slate-200"
                title="Export current list as PDF"
              >
                <Download className="h-4 w-4" />
                Export PDF
              </button>

              {(user.role === "admin" || user.role === "fisherman") && (
                <Link
                  to="/fishstock/create"
                  className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-all bg-blue-600 text-white hover:bg-blue-700"
                  title="Add new fish stock"
                >
                  <Plus className="h-4 w-4" />
                  Add New
                </Link>
              )}
            </div>
          </div>

          {/* Loading state (skeleton table to match AdminCustomersPage) */}
          {loading && (
            <div className="rounded-xl bg-slate-50">
              <TableSkeleton />
            </div>
          )}

          {/* Empty state */}
          {!loading && fishStocks.length === 0 && (
            <div className="grid place-items-center rounded-xl p-10 text-center bg-slate-50">
              <ShieldAlert className="mb-2 h-8 w-8 text-slate-500" />
              <p className="text-sm text-slate-600">No fish stocks found.</p>
            </div>
          )}

          {/* Table */}
          {!loading && fishStocks.length > 0 && (
            <div className="overflow-x-auto rounded-xl ring-1 ring-slate-200">
              <table className="min-w-full text-sm text-slate-800">
                <thead className="bg-slate-50">
                  <tr>
                    <Th>Stock ID</Th>
                    <Th>Name</Th>
                    <Th>Type</Th>
                    <Th>Weight</Th>
                    <Th>Unit</Th>
                    <Th>Quality</Th>
                    <Th>Catch Date</Th>
                    {user.role === "admin" && <Th>Actions</Th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {fishStocks.map((stock) => (
                    <tr key={stock._id} className="hover:bg-slate-50">
                      <Td className="whitespace-nowrap">{stock.stockId}</Td>

                      <Td className="whitespace-nowrap">
                        <span className="font-semibold">{stock.name}</span>
                      </Td>

                      <Td className="whitespace-nowrap">
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-slate-100 text-slate-700">
                          {stock.type}
                        </span>
                      </Td>

                      <Td className="whitespace-nowrap">{stock.weight}</Td>

                      <Td className="whitespace-nowrap">
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-slate-100 text-slate-700">
                          {stock.unit}
                        </span>
                      </Td>

                      <Td className="whitespace-nowrap">
                        <QualityBadge value={stock.quality} />
                      </Td>

                      <Td className="whitespace-nowrap">
                        {stock.catchDate ? new Date(stock.catchDate).toLocaleDateString() : "-"}
                      </Td>

                      {user.role === "admin" && (
                        <Td className="whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Link
                              to={`/fishstock/edit/${stock._id}`}
                              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all bg-amber-100 text-amber-800 hover:bg-amber-200"
                              title="Edit stock"
                            >
                              Edit
                            </Link>
                          </div>
                        </Td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- Subcomponents to mirror AdminCustomersPage feel ---------- */

function Th({ children, className = "" }) {
  return (
    <th className={`whitespace-nowrap px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide ${className}`}>
      {children}
    </th>
  );
}

function Td({ children, className = "" }) {
  return <td className={`px-3 py-2 align-top ${className}`}>{children}</td>;
}

function TableSkeleton() {
  const row = (
    <tr>
      {Array.from({ length: 8 }).map((_, i) => (
        <td key={i} className="px-3 py-2">
          <div className="h-4 w-full rounded bg-slate-200" />
        </td>
      ))}
    </tr>
  );

  return (
    <div className="overflow-x-auto rounded-xl ring-1 ring-transparent">
      <table className="min-w-full">
        <thead>
          <tr>
            {Array.from({ length: 8 }).map((_, i) => (
              <th key={i} className="px-3 py-2">
                <div className="h-3 w-24 rounded bg-slate-200" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{Array.from({ length: 8 }).map((_, i) => <FragmentLike key={i}>{row}</FragmentLike>)}</tbody>
      </table>
    </div>
  );
}

// Tiny helper to avoid importing Fragment
function FragmentLike({ children }) {
  return children;
}

function QualityBadge({ value }) {
  const cls =
    value === "Premium"
      ? "bg-emerald-100 text-emerald-700"
      : value === "Grade A"
      ? "bg-blue-100 text-blue-700"
      : value === "Grade B"
      ? "bg-amber-100 text-amber-700"
      : "bg-rose-100 text-rose-700";

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${cls}`}>
      {value || "-"}
    </span>
  );
}
