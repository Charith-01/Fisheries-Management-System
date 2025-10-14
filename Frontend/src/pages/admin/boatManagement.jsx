import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { Ship, Trash2, Edit, PlusCircle, Download, Search, Filter, X, FileText } from "lucide-react";
import toast from "react-hot-toast";
import { exportTablePDF } from "../../utils/pdfExporter"; 

export default function BoatsManagement({ darkMode }) {
  const [boats, setBoats] = useState([]);
  const [filteredBoats, setFilteredBoats] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Search & filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [capacityFilter, setCapacityFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchBoats();
  }, []);

  useEffect(() => {
    filterBoats();
  }, [boats, searchTerm, statusFilter, capacityFilter]);

  const fetchBoats = async () => {
    try {
      const response = await api.get("/api/boat");
      setBoats(response.data);
      setLoading(false);
    } catch (error) {
      toast.error("Failed to fetch boats");
      console.error("Error fetching boats:", error);
      setLoading(false);
    }
  };

  const filterBoats = () => {
    let filtered = boats;

    if (searchTerm) {
      filtered = filtered.filter(
        (boat) =>
          boat.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          boat.boatNumber?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((boat) => boat.status === statusFilter);
    }

    if (capacityFilter !== "all") {
      switch (capacityFilter) {
        case "small":
          filtered = filtered.filter((boat) => boat.capacity <= 4);
          break;
        case "medium":
          filtered = filtered.filter((boat) => boat.capacity > 4 && boat.capacity <= 8);
          break;
        case "large":
          filtered = filtered.filter((boat) => boat.capacity > 8);
          break;
        default:
          break;
      }
    }

    setFilteredBoats(filtered);
  };

  const handleDelete = async (boatNumber) => {
    if (window.confirm("Are you sure you want to delete this boat?")) {
      try {
        await api.delete(`/api/boat/${boatNumber}`);
        toast.success("Boat deleted successfully");
        fetchBoats();
      } catch (error) {
        toast.error("Failed to delete boat");
        console.error("Error deleting boat:", error);
      }
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setCapacityFilter("all");
  };

  // PDF export 
  const handleExportPDF = async () => {
    const data = filteredBoats;
    if (!data.length) {
      toast.error("No boats to export");
      return;
    }

    const columns = [
      { header: "Boat Number", get: (r) => r.boatNumber || "-" },
      { header: "Name", get: (r) => r.name || "-" },
      { header: "Capacity", get: (r) => (r?.capacity != null ? `${r.capacity} persons` : "-") },
      { header: "Status", get: (r) => r.status || "-" },
      { header: "Equipment", get: (r) => `${r?.equipmentAssignments?.length || 0} items` },
    ];

    await exportTablePDF({
      title: "Boats",
      meta: { "Exported rows": data.length, "Total boats": boats.length },
      columns,
      rows: data,
      orientation: "landscape",
      filename: `boats_report_${new Date().toISOString().slice(0, 10)}.pdf`,
    });
  };

  const getStatusCounts = () => {
    const counts = { all: boats.length };
    boats.forEach((boat) => {
      counts[boat.status] = (counts[boat.status] || 0) + 1;
    });
    return counts;
  };

  const statusCounts = getStatusCounts();

  return (
    <div className={`p-6 ${darkMode ? "bg-slate-900 text-slate-100" : "bg-white text-slate-800"}`}>
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <div>
          <h1 className={`text-2xl font-bold ${darkMode ? "text-cyan-300" : "text-blue-800"}`}>Boat Management</h1>
          <p className={`text-sm ${darkMode ? "text-slate-400" : "text-gray-600"} mt-1`}>
            {filteredBoats.length} of {boats.length} boats
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleExportPDF}
            type="button"
            className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-all ${
              darkMode ? "bg-slate-700 text-white hover:bg-slate-600" : "bg-slate-100 text-slate-800 hover:bg-slate-200"
            }`}
            title="Export filtered boats as PDF"
          >
            <FileText className="h-4 w-4" />
            Export PDF
          </button>

          <button
            onClick={() => navigate("/admin/boats/addBoat")}
            className={`flex items-center gap-2 ${
              darkMode ? "bg-cyan-700 hover:bg-cyan-800" : "bg-blue-600 hover:bg-blue-700"
            } text-white py-2 px-4 rounded-lg transition-all`}
          >
            <PlusCircle size={18} />
            Add New Boat
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className={`mb-6 p-4 rounded-lg ${darkMode ? "bg-slate-800" : "bg-gray-50"}`}>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search
              className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                darkMode ? "text-slate-400" : "text-gray-400"
              }`}
              size={20}
            />
            <input
              type="text"
              placeholder="Search boats by name or number..."
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
            {(statusFilter !== "all" || capacityFilter !== "all") && (
              <span className={`w-2 h-2 rounded-full ${darkMode ? "bg-cyan-400" : "bg-blue-500"}`}></span>
            )}
          </button>

          {(searchTerm || statusFilter !== "all" || capacityFilter !== "all") && (
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
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-600">
            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-slate-300" : "text-gray-700"}`}>
                Status
              </label>
              <div className="flex flex-wrap gap-2">
                {["all", "active", "inactive", "maintenance", "retired"].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-1 rounded-full text-sm font-medium capitalize transition-all ${
                      statusFilter === status
                        ? darkMode
                          ? "bg-cyan-600 text-white"
                          : "bg-blue-600 text-white"
                        : darkMode
                        ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    {status} {status !== "all" && `(${statusCounts[status] || 0})`}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-slate-300" : "text-gray-700"}`}>
                Capacity
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: "all", label: "All Sizes" },
                  { value: "small", label: "Small (1-4)" },
                  { value: "medium", label: "Medium (5-8)" },
                  { value: "large", label: "Large (9+)" },
                ].map((size) => (
                  <button
                    key={size.value}
                    onClick={() => setCapacityFilter(size.value)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                      capacityFilter === size.value
                        ? darkMode
                          ? "bg-cyan-600 text-white"
                          : "bg-blue-600 text-white"
                        : darkMode
                        ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    {size.label}
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
      ) : filteredBoats.length === 0 ? (
        <div className={`${darkMode ? "bg-slate-800 text-slate-200" : "bg-gray-100 text-gray-600"} rounded-lg p-8 text-center`}>
          <Ship size={48} className={`mx-auto mb-4 ${darkMode ? "text-cyan-400" : "text-gray-400"}`} />
          <h2 className={`text-xl font-semibold mb-2 ${darkMode ? "text-slate-100" : "text-gray-600"}`}>
            {boats.length === 0 ? "No Boats Available" : "No Boats Match Your Search"}
          </h2>
          <p className={`${darkMode ? "text-slate-300" : "text-gray-500"} mb-4`}>
            {boats.length === 0
              ? "There are no boats in the system yet."
              : "Try adjusting your search or filters to find what you're looking for."}
          </p>
          {(searchTerm || statusFilter !== "all" || capacityFilter !== "all") && (
            <button
              onClick={clearFilters}
              className={`mr-2 px-4 py-2 rounded-lg ${
                darkMode ? "bg-slate-700 hover:bg-slate-600 text-white" : "bg-gray-300 hover:bg-gray-400 text-gray-700"
              }`}
            >
              Clear Filters
            </button>
          )}
          {boats.length === 0 && (
            <button
              onClick={() => navigate("/admin/boats/addBoat")}
              className={`${darkMode ? "bg-cyan-700 hover:bg-cyan-800" : "bg-blue-600 hover:bg-blue-700"} text-white py-2 px-4 rounded-lg transition-all`}
            >
              Add Your First Boat
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table
            className={`min-w-full rounded-lg overflow-hidden shadow-lg ${
              darkMode ? "bg-slate-800 text-slate-100" : "bg-white text-slate-800"
            }`}
          >
            <thead className={darkMode ? "bg-slate-700" : "bg-gray-100"}>
              <tr>
                <th className="py-3 px-4 text-left">Image</th>
                <th className="py-3 px-4 text-left">Boat Number</th>
                <th className="py-3 px-4 text-left">Name</th>
                <th className="py-3 px-4 text-left">Capacity</th>
                <th className="py-3 px-4 text-left">Status</th>
                <th className="py-3 px-4 text-left">Equipment</th>
                <th className="py-3 px-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBoats.map((boat) => (
                <tr key={boat._id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <Link to={`/admin/boats/${boat.boatNumber}`}>
                      {boat.images && boat.images.length > 0 ? (
                        <img
                          src={boat.images[0].startsWith("http") ? boat.images[0] : `http://localhost:3000${boat.images[0]}`}
                          alt={`${boat.name} boat`}
                          className="h-16 w-24 object-cover rounded hover:opacity-80 transition-opacity"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://placehold.co/600x400?text=No+Image";
                          }}
                        />
                      ) : (
                        <div className="h-16 w-24 bg-gray-200 flex items-center justify-center rounded hover:bg-gray-300 transition-all">
                          <Ship size={24} className="text-gray-400" />
                        </div>
                      )}
                    </Link>
                  </td>
                  <td className="py-3 px-4">
                    <Link to={`/admin/boats/${boat.boatNumber}`} className="hover:text-blue-600">
                      {boat.boatNumber}
                    </Link>
                  </td>
                  <td className="py-3 px-4">
                    <Link to={`/admin/boats/${boat.boatNumber}`} className="hover:text-blue-600">
                      {boat.name}
                    </Link>
                  </td>
                  <td className="py-3 px-4">{boat.capacity} persons</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold capitalize ${
                        boat.status === "active"
                          ? "bg-green-100 text-green-800"
                          : boat.status === "inactive"
                          ? "bg-gray-100 text-gray-800"
                          : boat.status === "maintenance"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {boat.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        darkMode ? "bg-slate-700 text-slate-300" : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {boat.equipmentAssignments?.length || 0} items
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => navigate(`/admin/boats/editBoat/${boat.boatNumber}`)}
                        className="p-1 text-blue-600 hover:text-blue-800"
                        title="Edit"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(boat.boatNumber)}
                        className="p-1 text-red-600 hover:text-red-800"
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
