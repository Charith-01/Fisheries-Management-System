import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "../../api/axios";
import { Package, Trash2, Edit, PlusCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function EquipmentManagement({ darkMode }) {
    const [equipment, setEquipment] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchEquipment();
    }, []);

    const fetchEquipment = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get("/api/equipment", {
                headers: { Authorization: "Bearer " + token }
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
                await axios.delete(`/api/equipment/${equipmentId}`,
                    { headers: { Authorization: "Bearer " + token } }
                );
                toast.success("Equipment deleted successfully");
                fetchEquipment();
            } catch (error) {
                toast.error("Failed to delete equipment");
                console.error("Error deleting equipment:", error);
            }
        }
    };

    return (
        <div className={`p-6 min-h-screen ${darkMode ? 'bg-slate-900 text-slate-100' : 'bg-gray-50 text-gray-900'}`}>
            <div className="flex justify-between items-center mb-6">
                <h1 className={`text-2xl font-bold ${darkMode ? 'text-cyan-300' : 'text-blue-800'}`}>Equipment Management</h1>
                <button 
                    onClick={() => navigate("/admin/equipment/addEquipment")}
                    className={`flex items-center gap-2 ${darkMode ? 'bg-cyan-700 hover:bg-cyan-800 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'} py-2 px-4 rounded-lg transition-all`}
                >
                    <PlusCircle size={18} />
                    Add New Equipment
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${darkMode ? 'border-cyan-400' : 'border-blue-500'}`}></div>
                </div>
            ) : equipment.length === 0 ? (
                <div className={`rounded-lg p-8 text-center ${darkMode ? 'bg-slate-800' : 'bg-gray-100'}`}> 
                    <Package size={48} className={`mx-auto mb-4 ${darkMode ? 'text-slate-400' : 'text-gray-400'}`} />
                    <h2 className={`text-xl font-semibold mb-2 ${darkMode ? 'text-slate-200' : 'text-gray-600'}`}>No Equipment Available</h2>
                    <p className={`${darkMode ? 'text-slate-400' : 'text-gray-500'} mb-4`}>There is no equipment in the system yet.</p>
                    <button 
                        onClick={() => navigate("/admin/equipment/addEquipment")}
                        className={`${darkMode ? 'bg-cyan-700 hover:bg-cyan-800 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'} py-2 px-4 rounded-lg transition-all`}
                    >
                        Add Your First Equipment
                    </button>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className={`min-w-full rounded-lg overflow-hidden shadow-lg ${darkMode ? 'bg-slate-800' : 'bg-white'}`}>
                        <thead className={darkMode ? 'bg-slate-700' : 'bg-gray-100'}>
                            <tr>
                                <th className="py-3 px-4 text-left">Equipment ID</th>
                                <th className="py-3 px-4 text-left">Name</th>
                                <th className="py-3 px-4 text-left">Type</th>
                                <th className="py-3 px-4 text-left">Status</th>
                                <th className="py-3 px-4 text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {equipment.map((item) => (
                                <tr key={item._id} className={darkMode ? 'border-b border-slate-700 hover:bg-slate-700' : 'border-b border-gray-200 hover:bg-gray-50'}>
                                    <td className="py-3 px-4">
                                        <Link to={`/admin/equipment/${item.equipmentID}`} className={darkMode ? 'hover:text-cyan-300' : 'hover:text-blue-600'}>
                                            {item.equipmentID}
                                        </Link>
                                    </td>
                                    <td className="py-3 px-4">
                                        <Link to={`/admin/equipment/${item.equipmentID}`} className={darkMode ? 'hover:text-cyan-300' : 'hover:text-blue-600'}>
                                            {item.name}
                                        </Link>
                                    </td>
                                    <td className="py-3 px-4">{item.type}</td>
                                    <td className="py-3 px-4">
                                        <span className={`px-2 py-1 rounded text-xs font-semibold capitalize
                                            ${item.status === 'available' ? (darkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800') : 
                                            item.status === 'maintenance' ? (darkMode ? 'bg-yellow-900 text-yellow-200' : 'bg-yellow-100 text-yellow-800') :
                                            (darkMode ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800')}`
                                        }>
                                            {item.status}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="flex items-center space-x-3">
                                            <Link 
                                                to={`/admin/equipment/${item.equipmentID}`}
                                                className={darkMode ? 'p-1 text-slate-300 hover:text-cyan-400' : 'p-1 text-gray-600 hover:text-blue-800'}
                                                title="View Details"
                                            >
                                                <Package size={18} />
                                            </Link>
                                            <button 
                                                onClick={() => navigate(`/admin/equipment/editEquipment/${item.equipmentID}`)}
                                                className={darkMode ? 'p-1 text-cyan-400 hover:text-cyan-200' : 'p-1 text-blue-600 hover:text-blue-800'}
                                                title="Edit"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(item.equipmentID)}
                                                className={darkMode ? 'p-1 text-red-400 hover:text-red-600' : 'p-1 text-red-600 hover:text-red-800'}
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