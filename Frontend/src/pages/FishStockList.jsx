import { useState, useEffect } from "react";
import { fishStockService } from "../services/fishStockService";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { ShieldAlert, Plus, Download, Trash2, History } from "lucide-react";
import { exportTablePDF } from "../utils/pdfExporter";

export default function FishStockList() {
  const [fishStocks, setFishStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(null);
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

  // Handle delete with comment
  const handleDelete = async (stockId, stockName) => {
    const deleteComment = prompt(`Please provide a reason for deleting "${stockName}":`);
    
    if (!deleteComment || !deleteComment.trim()) {
      toast.error("Delete comment is required");
      return;
    }

    if (!window.confirm(`Are you sure you want to delete "${stockName}"? This action cannot be undone.`)) {
      return;
    }

    setDeleteLoading(stockId);
    try {
      await fishStockService.deleteFishStock(stockId, deleteComment.trim());
      toast.success("Fish stock deleted successfully");
      fetchFishStocks(); // Refresh the list
    } catch (error) {
      toast.error(error.message || "Failed to delete fish stock");
    } finally {
      setDeleteLoading(null);
    }
  };

  // View update history - IMPROVED VERSION
  const viewHistory = async (stockId, stockName) => {
    try {
      console.log('Fetching history for:', stockId, stockName);
      const response = await fishStockService.getUpdateHistory(stockId);
      
      if (response.success && response.data && response.data.length > 0) {
        // Create a formatted history display
        const historyText = response.data.map((entry, index) => {
          const date = new Date(entry.updatedAt).toLocaleString();
          const updatedBy = entry.updatedBy ? 
            `${entry.updatedBy.firstName} ${entry.updatedBy.lastName}` : 'Unknown';
          
          let changes = '';
          
          // Check if we have changes field (simplified approach)
          if (entry.changes && Object.keys(entry.changes).length > 0) {
            changes = Object.entries(entry.changes)
              .map(([key, value]) => {
                if (key === 'product' && (value === null || value === '')) {
                  return `${key}: Unlinked`;
                }
                return `${key}: ${value}`;
              })
              .join(', ');
          } 
          // Check if we have previousData and newData (detailed approach)
          else if (entry.previousData && entry.newData) {
            const changedFields = [];
            
            // Compare all fields
            const allFields = new Set([
              ...Object.keys(entry.previousData || {}),
              ...Object.keys(entry.newData || {})
            ]);
            
            allFields.forEach(key => {
              const prevValue = entry.previousData[key];
              const newValue = entry.newData[key];
              
              // Handle different data types and null/undefined
              const prevVal = prevValue !== null && prevValue !== undefined ? String(prevValue) : 'null';
              const newVal = newValue !== null && newValue !== undefined ? String(newValue) : 'null';
              
              if (prevVal !== newVal) {
                // Special handling for product field
                if (key === 'product') {
                  if (newVal === 'null' || newVal === '') {
                    changedFields.push(`${key}: Linked → Unlinked`);
                  } else if (prevVal === 'null' || prevVal === '') {
                    changedFields.push(`${key}: Unlinked → Linked`);
                  } else {
                    changedFields.push(`${key}: Changed`);
                  }
                } else {
                  changedFields.push(`${key}: ${prevVal} → ${newVal}`);
                }
              }
            });
            
            changes = changedFields.join('; ');
          }
          
          return `\n${index + 1}. ${date} by ${updatedBy}\n   Comment: ${entry.updateComment}\n   Changes: ${changes || 'No specific changes recorded'}`;
        }).join('\n\n');

        // Create a modal-like display instead of alert for better formatting
        const modal = document.createElement('div');
        modal.style.position = 'fixed';
        modal.style.top = '50%';
        modal.style.left = '50%';
        modal.style.transform = 'translate(-50%, -50%)';
        modal.style.backgroundColor = 'white';
        modal.style.padding = '20px';
        modal.style.borderRadius = '8px';
        modal.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
        modal.style.zIndex = '1000';
        modal.style.maxWidth = '90vw';
        modal.style.maxHeight = '80vh';
        modal.style.overflow = 'auto';
        modal.style.fontFamily = 'monospace';
        modal.style.fontSize = '14px';
        modal.style.whiteSpace = 'pre-wrap';

        const title = document.createElement('h3');
        title.textContent = `Update History for "${stockName}" (${response.count} entries)`;
        title.style.marginBottom = '15px';
        title.style.color = '#333';
        title.style.borderBottom = '2px solid #007bff';
        title.style.paddingBottom = '5px';

        const content = document.createElement('div');
        content.textContent = historyText;
        content.style.lineHeight = '1.5';

        const closeButton = document.createElement('button');
        closeButton.textContent = 'Close';
        closeButton.style.marginTop = '15px';
        closeButton.style.padding = '8px 16px';
        closeButton.style.backgroundColor = '#007bff';
        closeButton.style.color = 'white';
        closeButton.style.border = 'none';
        closeButton.style.borderRadius = '4px';
        closeButton.style.cursor = 'pointer';
        
        closeButton.onclick = () => {
          document.body.removeChild(modal);
          document.body.removeChild(overlay);
        };

        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        overlay.style.zIndex = '999';

        modal.appendChild(title);
        modal.appendChild(content);
        modal.appendChild(closeButton);
        
        document.body.appendChild(overlay);
        document.body.appendChild(modal);

        // Close modal when clicking outside
        overlay.onclick = () => {
          document.body.removeChild(modal);
          document.body.removeChild(overlay);
        };

      } else {
        alert(`No update history found for "${stockName}"`);
      }
    } catch (error) {
      console.error('Error loading update history:', error);
      toast.error("Failed to load update history: " + (error.message || 'Unknown error'));
    }
  };

  // Export PDF
  const exportPDF = () => {
    exportTablePDF({
      title: "Fish Stock Report",
      meta: {
        "Total Stocks": Array.isArray(fishStocks) ? fishStocks.length : 0,
        "Generated By": user.firstName ? `${user.firstName} ${user.lastName}` : "Admin",
        "Generated On": new Date().toLocaleDateString()
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
        { header: "Update Count", get: (s) => s.updateHistory?.length || 0, align: "center" },
      ],
      rows: Array.isArray(fishStocks) ? fishStocks : [],
    });
  };

  return (
    <div className="w-full min-h-screen p-4">
      <div className="max-w-6xl mx-auto">
        {/* Card wrapper */}
        <div className="rounded-2xl p-4 sm:p-6 shadow ring-1 bg-white/80 ring-slate-100">
          {/* Header / Actions */}
          <div className="mb-4 grid gap-3 md:grid-cols-[1fr_auto]">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Fish Stock Management</h3>
                <p className="text-sm text-slate-500">View and manage recorded fish stocks with audit trail</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              {/* Export PDF button */}
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

          {/* Loading state */}
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
                    <Th>Updates</Th>
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

                      <Td className="whitespace-nowrap text-center">
                        <button
                          onClick={() => viewHistory(stock._id, stock.name)}
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold transition-all bg-purple-100 text-purple-800 hover:bg-purple-200"
                          title="View update history"
                        >
                          <History className="h-3 w-3" />
                          {stock.updateHistory?.length || 0}
                        </button>
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
                            <button
                              onClick={() => handleDelete(stock._id, stock.name)}
                              disabled={deleteLoading === stock._id}
                              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all bg-red-100 text-red-800 hover:bg-red-200 disabled:opacity-50"
                              title="Delete stock"
                            >
                              <Trash2 className="h-3 w-3" />
                              {deleteLoading === stock._id ? "Deleting..." : "Delete"}
                            </button>
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

/* ---------- Subcomponents ---------- */

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
      {Array.from({ length: 9 }).map((_, i) => (
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
            {Array.from({ length: 9 }).map((_, i) => (
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