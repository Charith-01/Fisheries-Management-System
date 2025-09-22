import { useState, useEffect } from "react";
import { fishStockService } from "../services/fishStockService";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { ShieldAlert, Plus } from "lucide-react";

export default function FishStockListFisherman({ darkMode = false }) {
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

  return (
    <div className="w-full min-h-screen p-4 bg-gradient-to-br from-sky-50 via-cyan-50 to-blue-50">
      <div className="max-w-6xl mx-auto">
        {/* Card wrapper */}
        <div className={`rounded-2xl p-4 sm:p-6 shadow ring-1 backdrop-blur ${
          darkMode ? 'bg-slate-800/90 ring-slate-700' : 'bg-white/80 ring-slate-100'
        }`}>
          {/* Header / Actions */}
          <div className="mb-4 grid gap-3 md:grid-cols-[1fr_auto]">
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Fish Stock Management</h3>
                <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>View and manage your fish stocks</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              {(user.role === "admin" || user.role === "fisherman") && (
                <Link
                  to="/fisherman/stock/create"
                  className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-all bg-blue-600 text-white hover:bg-blue-700"
                  title="Add new fish stock"
                >
                  <Plus className="h-4 w-4" />
                  Add New
                </Link>
              )}
            </div>
          </div>

          {/* Loading state */}
          {loading && (
            <div className={`rounded-xl ${darkMode ? 'bg-slate-700' : 'bg-slate-50'}`}>
              <TableSkeleton darkMode={darkMode} />
            </div>
          )}

          {/* Empty state */}
          {!loading && fishStocks.length === 0 && (
            <div className={`grid place-items-center rounded-xl p-10 text-center ${darkMode ? 'bg-slate-700' : 'bg-slate-50'}`}>
              <ShieldAlert className="mb-2 h-8 w-8 text-slate-500" />
              <p className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>No fish stocks found.</p>
            </div>
          )}

          {/* Table */}
          {!loading && fishStocks.length > 0 && (
            <div className={`overflow-x-auto rounded-xl ring-1 ${darkMode ? 'ring-slate-700' : 'ring-slate-200'}`}>
              <table className="min-w-full text-sm">
                <thead className={darkMode ? 'bg-slate-700' : 'bg-slate-50'}>
                  <tr>
                    <Th darkMode={darkMode}>Stock ID</Th>
                    <Th darkMode={darkMode}>Name</Th>
                    <Th darkMode={darkMode}>Type</Th>
                    <Th darkMode={darkMode}>Weight</Th>
                    <Th darkMode={darkMode}>Unit</Th>
                    <Th darkMode={darkMode}>Quality</Th>
                    <Th darkMode={darkMode}>Catch Date</Th>
                   
                  </tr>
                </thead>
                <tbody className={darkMode ? 'divide-slate-700' : 'divide-slate-200'}>
                  {fishStocks.map((stock) => (
                    <tr key={stock._id} className={darkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-50'}>
                      <Td darkMode={darkMode} className="whitespace-nowrap">{stock.stockId}</Td>

                      <Td darkMode={darkMode} className="whitespace-nowrap">
                        <span className={`font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{stock.name}</span>
                      </Td>

                      <Td darkMode={darkMode} className="whitespace-nowrap">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                          darkMode ? 'bg-slate-600 text-slate-300' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {stock.type}
                        </span>
                      </Td>

                      <Td darkMode={darkMode} className="whitespace-nowrap">{stock.weight}</Td>

                      <Td darkMode={darkMode} className="whitespace-nowrap">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                          darkMode ? 'bg-slate-600 text-slate-300' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {stock.unit}
                        </span>
                      </Td>

                      <Td darkMode={darkMode} className="whitespace-nowrap">
                        <QualityBadge value={stock.quality} />
                      </Td>

                      <Td darkMode={darkMode} className="whitespace-nowrap">
                        {stock.catchDate ? new Date(stock.catchDate).toLocaleDateString() : "-"}
                      </Td>

                      
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

/* ---------- Subcomponents ---------- */

function Th({ children, darkMode = false, className = "" }) {
  return (
    <th className={`whitespace-nowrap px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide ${
      darkMode ? 'text-slate-300' : 'text-slate-600'
    } ${className}`}>
      {children}
    </th>
  );
}

function Td({ children, darkMode = false, className = "" }) {
  return (
    <td className={`px-3 py-2 align-top ${darkMode ? 'text-slate-300' : 'text-slate-700'} ${className}`}>
      {children}
    </td>
  );
}

function TableSkeleton({ darkMode = false }) {
  const row = (
    <tr>
      {Array.from({ length: 8 }).map((_, i) => (
        <td key={i} className="px-3 py-2">
          <div className={`h-4 w-full rounded ${darkMode ? 'bg-slate-600' : 'bg-slate-200'}`} />
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
                <div className={`h-3 w-24 rounded ${darkMode ? 'bg-slate-600' : 'bg-slate-200'}`} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{Array.from({ length: 8 }).map((_, i) => <tr key={i}>{row}</tr>)}</tbody>
      </table>
    </div>
  );
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