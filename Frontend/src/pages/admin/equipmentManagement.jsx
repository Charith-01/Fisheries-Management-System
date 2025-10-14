import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "../../api/axios";
import {
  Package,
  Trash2,
  Edit,
  PlusCircle,
  Download,
  Search,
  Filter,
  X,
  FileText,
} from "lucide-react";
import toast from "react-hot-toast";
import { exportTablePDF } from "../../utils/pdfExporter"; // Import the PDF export utility

export default function EquipmentManagement({ darkMode }) {
  const [equipment, setEquipment] = useState([]);
  const [filteredEquipment, setFilteredEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Search & filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [maintenanceFilter, setMaintenanceFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchEquipment();
  }, []);

  useEffect(() => {
    filterEquipment();
  }, [equipment, searchTerm, typeFilter, availabilityFilter, maintenanceFilter]);

  const fetchEquipment = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("/api/equipment", {
        headers: { Authorization: "Bearer " + token },
      });
      setEquipment(response.data);
      setLoading(false);
    } catch (error) {
      toast.error("Failed to fetch equipment");
      console.error("Error fetching equipment:", error);
      setLoading(false);
    }
  };

  const handleDelete = async (equipmentId) => {
    if (window.confirm("Are you sure you want to delete this equipment?")) {
      try {
        const token = localStorage.getItem("token");
        await axios.delete(`/api/equipment/${equipmentId}`, {
          headers: { Authorization: "Bearer " + token },
        });
        toast.success("Equipment deleted successfully");
        fetchEquipment();
      } catch (error) {
        toast.error("Failed to delete equipment");
        console.error("Error deleting equipment:", error);
      }
    }
  };

  const filterEquipment = () => {
    let filtered = equipment;

    // Search
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.name?.toLowerCase().includes(q) ||
          item.equipmentID?.toLowerCase().includes(q) ||
          item.description?.toLowerCase().includes(q)
      );
    }

    // Type
    if (typeFilter !== "all") {
      filtered = filtered.filter((item) => item.type === typeFilter);
    }

    // Availability
    if (availabilityFilter !== "all") {
      filtered = filtered.filter((item) => {
        const status = getAvailabilityStatus(item);
        return status === availabilityFilter;
      });
    }

    // Maintenance
    if (maintenanceFilter !== "all") {
      filtered = filtered.filter((item) =>
        maintenanceFilter === "requires" ? item.requiresMaintenance : !item.requiresMaintenance
      );
    }

    setFilteredEquipment(filtered);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setTypeFilter("all");
    setAvailabilityFilter("all");
    setMaintenanceFilter("all");
  };

  const getAvailabilityStatus = (item) => {
    if (item?.availableQuantity === 0) return "out-of-stock";
    if (item?.availableQuantity < item?.totalQuantity) return "low-stock";
    return "available";
  };

  // Counts for chips
  const getTypeCounts = () => {
    const counts = { all: equipment.length };
    equipment.forEach((i) => (counts[i.type] = (counts[i.type] || 0) + 1));
    return counts;
  };
  const getAvailabilityCounts = () => {
    const counts = { all: equipment.length };
    equipment.forEach((i) => {
      const s = getAvailabilityStatus(i);
      counts[s] = (counts[s] || 0) + 1;
    });
    return counts;
  };
  const getMaintenanceCounts = () => {
    const requires = equipment.filter((i) => i.requiresMaintenance).length;
    return { all: equipment.length, requires, noMaintenance: equipment.length - requires };
  };

  const typeCounts = getTypeCounts();
  const availabilityCounts = getAvailabilityCounts();
  const maintenanceCounts = getMaintenanceCounts();

  // PDF export
  const handleExportPDF = async () => {
    if (!filteredEquipment.length) {
      toast.error("No equipment to export");
      return;
    }
    const rows = filteredEquipment;
    const columns = [
      { header: "Equipment ID", get: (r) => r.equipmentID || "-" },
      { header: "Name", get: (r) => r.name || "-" },
      { header: "Type", get: (r) => r.type || "-" },
      { header: "Total Qty", get: (r) => r.totalQuantity ?? "-" },
      { header: "Available Qty", get: (r) => r.availableQuantity ?? "-" },
      { header: "Maintenance", get: (r) => (r.requiresMaintenance ? "Required" : "Not Required") },
      { header: "Notes", get: (r) => r.notes || "-" },
    ];

    await exportTablePDF({
      title: "Equipment Report",
      meta: { "Exported rows": rows.length, "Total equipment": equipment.length },
      columns,
      rows,
      orientation: "landscape",
      filename: `equipment_report_${new Date().toISOString().slice(0, 10)}.pdf`,
    });
  };

  return (
    <div
      className={`p-6 min-h-screen ${
        darkMode ? "bg-slate-900 text-slate-100" : "bg-gray-50 text-gray-900"
      }`}
    >
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <div>
          <h1 className={`text-2xl font-bold ${darkMode ? "text-cyan-300" : "text-blue-800"}`}>
            Equipment Management
          </h1>
          <p className={`text-sm ${darkMode ? "text-slate-400" : "text-gray-600"} mt-1`}>
            {filteredEquipment.length} of {equipment.length} items
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportPDF}
            type="button"
            className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-all ${
              darkMode
                ? "bg-slate-700 text-white hover:bg-slate-600"
                : "bg-slate-100 text-slate-800 hover:bg-slate-200"
            }`}
            title="Export filtered equipment as PDF"
          >
            <FileText className="h-4 w-4" />
            Export PDF
          </button>
          <button
            onClick={() => navigate("/admin/equipment/addEquipment")}
            className={`flex items-center gap-2 ${
              darkMode
                ? "bg-cyan-700 hover:bg-cyan-800 text-white"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            } py-2 px-4 rounded-lg transition-all`}
          >
            <PlusCircle size={18} />
            Add New Equipment
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className={`mb-6 p-4 rounded-lg ${darkMode ? "bg-slate-800" : "bg-gray-50"}`}>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search
              className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                darkMode ? "text-slate-400" : "text-gray-400"
              }`}
              size={20}
            />
            <input
              type="text"
              placeholder="Search equipment by name, ID, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                darkMode
                  ? "bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-400"
                  : "bg-white border-gray-300 placeholder-gray-400"
              }`}
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
              darkMode ? "bg-slate-700 border-slate-600 hover:bg-slate-600" : "bg-white border-gray-300 hover:bg-gray-50"
            }`}
          >
            <Filter size={18} />
            Filters
            {(typeFilter !== "all" ||
              availabilityFilter !== "all" ||
              maintenanceFilter !== "all") && (
              <span className={`w-2 h-2 rounded-full ${darkMode ? "bg-cyan-400" : "bg-blue-500"}`} />
            )}
          </button>

          {(searchTerm || typeFilter !== "all" || availabilityFilter !== "all" || maintenanceFilter !== "all") && (
            <button
              onClick={clearFilters}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                darkMode ? "bg-red-700 hover:bg-red-600 text-white" : "bg-red-500 hover:bg-red-600 text-white"
              }`}
            >
              <X size={18} />
              Clear
            </button>
          )}
        </div>

        {showFilters && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-600">
            {/* Type */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-slate-300" : "text-gray-700"}`}>
                Equipment Type
              </label>
              <div className="flex flex-wrap gap-2">
                {["all", "Navigation", "Fishing Gear", "Safety", "Engine", "Other"].map((type) => (
                  <button
                    key={type}
                    onClick={() => setTypeFilter(type)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                      typeFilter === type
                        ? darkMode
                          ? "bg-cyan-600 text-white"
                          : "bg-blue-600 text-white"
                        : darkMode
                        ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    {type} {type !== "all" && `(${typeCounts[type] || 0})`}
                  </button>
                ))}
              </div>
            </div>

            {/* Availability */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-slate-300" : "text-gray-700"}`}>
                Availability
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: "all", label: "All" },
                  { value: "available", label: "Available" },
                  { value: "low-stock", label: "Low Stock" },
                  { value: "out-of-stock", label: "Out of Stock" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setAvailabilityFilter(opt.value)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                      availabilityFilter === opt.value
                        ? darkMode
                          ? "bg-cyan-600 text-white"
                          : "bg-blue-600 text-white"
                        : darkMode
                        ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    {opt.label} ({availabilityCounts[opt.value] || 0})
                  </button>
                ))}
              </div>
            </div>

            {/* Maintenance */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-slate-300" : "text-gray-700"}`}>
                Maintenance
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: "all", label: "All" },
                  { value: "requires", label: "Requires Maintenance" },
                  { value: "noMaintenance", label: "No Maintenance" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setMaintenanceFilter(opt.value)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                      maintenanceFilter === opt.value
                        ? darkMode
                          ? "bg-cyan-600 text-white"
                          : "bg-blue-600 text-white"
                        : darkMode
                        ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    {opt.label} ({maintenanceCounts[opt.value] || 0})
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div
            className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${
              darkMode ? "border-cyan-400" : "border-blue-500"
            }`}
          />
        </div>
      ) : filteredEquipment.length === 0 ? (
        <div className={`rounded-lg p-8 text-center ${darkMode ? "bg-slate-800" : "bg-gray-100"}`}>
          <Package size={48} className={`mx-auto mb-4 ${darkMode ? "text-slate-400" : "text-gray-400"}`} />
          <h2 className={`text-xl font-semibold mb-2 ${darkMode ? "text-slate-200" : "text-gray-600"}`}>
            {equipment.length === 0 ? "No Equipment Available" : "No Equipment Matches Your Search"}
          </h2>
          <p className={`${darkMode ? "text-slate-400" : "text-gray-500"} mb-4`}>
            {equipment.length === 0
              ? "There is no equipment in the system yet."
              : "Try adjusting your search or filters to find what you're looking for."}
          </p>
          {(searchTerm || typeFilter !== "all" || availabilityFilter !== "all" || maintenanceFilter !== "all") && (
            <button
              onClick={clearFilters}
              className={`mr-2 px-4 py-2 rounded-lg ${
                darkMode ? "bg-slate-700 hover:bg-slate-600 text-white" : "bg-gray-300 hover:bg-gray-400 text-gray-700"
              }`}
            >
              Clear Filters
            </button>
          )}
          {equipment.length === 0 && (
            <button
              onClick={() => navigate("/admin/equipment/addEquipment")}
              className={`${
                darkMode ? "bg-cyan-700 hover:bg-cyan-800" : "bg-blue-600 hover:bg-blue-700"
              } text-white py-2 px-4 rounded-lg transition-all`}
            >
              Add Your First Equipment
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className={`min-w-full rounded-lg overflow-hidden shadow-lg ${darkMode ? "bg-slate-800" : "bg-white"}`}>
            <thead className={darkMode ? "bg-slate-700" : "bg-gray-100"}>
              <tr>
                <th className="py-3 px-4 text-left">Equipment ID</th>
                <th className="py-3 px-4 text-left">Name</th>
                <th className="py-3 px-4 text-left">Type</th>
                <th className="py-3 px-4 text-left">Total Qty</th>
                <th className="py-3 px-4 text-left">Available Qty</th>
                <th className="py-3 px-4 text-left">Maintenance</th>
                <th className="py-3 px-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEquipment.map((item) => (
                <tr
                  key={item._id}
                  className={darkMode ? "border-b border-slate-700 hover:bg-slate-700" : "border-b border-gray-200 hover:bg-gray-50"}
                >
                  <td className="py-3 px-4">
                    <Link
                      to={`/admin/equipment/${item.equipmentID}`}
                      className={darkMode ? "hover:text-cyan-300" : "hover:text-blue-600"}
                    >
                      {item.equipmentID}
                    </Link>
                  </td>
                  <td className="py-3 px-4">
                    <Link
                      to={`/admin/equipment/${item.equipmentID}`}
                      className={darkMode ? "hover:text-cyan-300" : "hover:text-blue-600"}
                    >
                      {item.name}
                    </Link>
                    {item.description && <p className="text-sm text-gray-500 mt-1 line-clamp-1">{item.description}</p>}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${darkMode ? "bg-slate-700 text-slate-300" : "bg-gray-200 text-gray-700"}`}>
                      {item.type}
                    </span>
                  </td>
                  <td className="py-3 px-4">{item.totalQuantity}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        item.availableQuantity === 0
                          ? darkMode
                            ? "bg-red-900 text-red-200"
                            : "bg-red-100 text-red-800"
                          : item.availableQuantity < item.totalQuantity
                          ? darkMode
                            ? "bg-yellow-900 text-yellow-200"
                            : "bg-yellow-100 text-yellow-800"
                          : darkMode
                          ? "bg-green-900 text-green-200"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {item.availableQuantity}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        item.requiresMaintenance
                          ? darkMode
                            ? "bg-orange-900 text-orange-200"
                            : "bg-orange-100 text-orange-800"
                          : darkMode
                          ? "bg-slate-700 text-slate-300"
                          : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {item.requiresMaintenance ? "Required" : "Not Required"}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-3">
                      <Link
                        to={`/admin/equipment/${item.equipmentID}`}
                        className={darkMode ? "p-1 text-slate-300 hover:text-cyan-400" : "p-1 text-gray-600 hover:text-blue-800"}
                        title="View Details"
                      >
                        <Package size={18} />
                      </Link>
                      <button
                        onClick={() => navigate(`/admin/equipment/editEquipment/${item.equipmentID}`)}
                        className={darkMode ? "p-1 text-cyan-400 hover:text-cyan-200" : "p-1 text-blue-600 hover:text-blue-800"}
                        title="Edit"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.equipmentID)}
                        className={darkMode ? "p-1 text-red-400 hover:text-red-600" : "p-1 text-red-600 hover:text-red-800"}
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
