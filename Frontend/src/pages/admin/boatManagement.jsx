import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { Ship, Trash2, Edit, PlusCircle, Download } from "lucide-react";
import toast from "react-hot-toast";

export default function BoatsManagement({ darkMode }) {
    const [boats, setBoats] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchBoats();
    }, []);

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

    const handleDelete = async (boatNumber) => {
        if (window.confirm("Are you sure you want to delete this boat?")) {
            try {
                await api.delete(`/api/boat/${boatNumber}`);
                toast.success("Boat deleted successfully");
                fetchBoats(); // Refresh the boat list
            } catch (error) {
                toast.error("Failed to delete boat");
                console.error("Error deleting boat:", error);
            }
        }
    };

    // Export boats to Excel
    const handleExportExcel = () => {
        if (!boats.length) {
            toast.error("No boats to export");
            return;
        }
        // Prepare data for Excel (exclude images, include main fields)
        const data = boats.map(({ boatNumber, name, capacity, status }) => ({
            "Boat Number": boatNumber,
            "Name": name,
            "Capacity": capacity,
            "Status": status,
        }));
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Boats");
        const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
        const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
        saveAs(blob, "boats.xlsx");
    };

    return (
        <div className={`p-6 ${darkMode ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-800'}`}>
            <div className="flex flex-wrap justify-between items-center mb-6 gap-2">
                <h1 className={`text-2xl font-bold ${darkMode ? 'text-cyan-300' : 'text-blue-800'}`}>Boat Management</h1>
                <div className="flex gap-2">
                    <button
                        onClick={handleExportExcel}
                        type="button"
                        className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-all ${
                            darkMode ? "bg-slate-700 text-white hover:bg-slate-600" : "bg-slate-100 text-slate-800 hover:bg-slate-200"
                        }`}
                        title="Export all boats as Excel"
                    >
                        <Download className="h-4 w-4" />
                        Export
                    </button>
                    <button 
                        onClick={() => navigate("/admin/boats/addBoat")}
                        className={`flex items-center gap-2 ${darkMode ? 'bg-cyan-700 hover:bg-cyan-800' : 'bg-blue-600 hover:bg-blue-700'} text-white py-2 px-4 rounded-lg transition-all`}
                    >
                        <PlusCircle size={18} />
                        Add New Boat
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${darkMode ? 'border-cyan-400' : 'border-blue-500'}`}></div>
                </div>
            ) : boats.length === 0 ? (
                <div className={`${darkMode ? 'bg-slate-800 text-slate-200' : 'bg-gray-100 text-gray-600'} rounded-lg p-8 text-center`}>
                    <Ship size={48} className={`mx-auto mb-4 ${darkMode ? 'text-cyan-400' : 'text-gray-400'}`} />
                    <h2 className={`text-xl font-semibold mb-2 ${darkMode ? 'text-slate-100' : 'text-gray-600'}`}>No Boats Available</h2>
                    <p className={`mb-4 ${darkMode ? 'text-slate-300' : 'text-gray-500'}`}>There are no boats in the system yet.</p>
                    <button 
                        onClick={() => navigate("/admin/boats/addBoat")}
                        className={`${darkMode ? 'bg-cyan-700 hover:bg-cyan-800' : 'bg-blue-600 hover:bg-blue-700'} text-white py-2 px-4 rounded-lg transition-all`}
                    >
                        Add Your First Boat
                    </button>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className={`min-w-full rounded-lg overflow-hidden shadow-lg ${darkMode ? 'bg-slate-800 text-slate-100' : 'bg-white text-slate-800'}` }>
                        <thead className={darkMode ? 'bg-slate-700' : 'bg-gray-100'}>
                            <tr>
                                <th className="py-3 px-4 text-left">Image</th>
                                <th className="py-3 px-4 text-left">Boat Number</th>
                                <th className="py-3 px-4 text-left">Name</th>
                                <th className="py-3 px-4 text-left">Capacity</th>
                                <th className="py-3 px-4 text-left">Status</th>
                                <th className="py-3 px-4 text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {boats.map((boat) => (
                                <tr key={boat._id} className="border-b border-gray-200 hover:bg-gray-50">
                                    <td className="py-3 px-4">
                                        <Link to={`/admin/boats/${boat.boatNumber}`}>
                                            {boat.images && boat.images.length > 0 ? (
                                                <img 
                                                    src={boat.images[0].startsWith('http') ? boat.images[0] : `http://localhost:3000${boat.images[0]}`}
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
                                        <span className={`px-2 py-1 rounded text-xs font-semibold capitalize
                                            ${boat.status === 'active' ? 'bg-green-100 text-green-800' : 
                                            boat.status === 'inactive' ? 'bg-gray-100 text-gray-800' : 
                                            boat.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-red-100 text-red-800'}`
                                        }>
                                            {boat.status}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="flex items-center space-x-3">
                                            <Link 
                                                to={`/admin/boats/${boat.boatNumber}`}
                                                className="p-1 text-gray-600 hover:text-blue-800"
                                                title="View Details"
                                            >
                                                <Ship size={18} />
                                            </Link>
                                            <button 
                                                onClick={() => navigate(`/admin/boats/editBoat/${boat.boatNumber}`)}
                                                // onClick={() => navigate(`/admin/boats/editBoats`)}
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
