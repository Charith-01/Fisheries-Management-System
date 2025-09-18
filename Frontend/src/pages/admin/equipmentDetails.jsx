
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { Package, ArrowLeft, Edit, Trash2, Calendar, Clock, Tag } from "lucide-react";
import toast from "react-hot-toast";

export default function EquipmentDetails({ darkMode }) {
    const { equipmentID } = useParams();
    const navigate = useNavigate();
    const [equipment, setEquipment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchEquipment = async () => {
            try {
                const response = await api.get(`/api/equipment/${equipmentID}`);
                setEquipment(response.data.equipment);
                setLoading(false);
            } catch (err) {
                setError("Failed to fetch equipment details");
                setLoading(false);
                toast.error("Failed to load equipment details");
            }
        };
        fetchEquipment();
    }, [equipmentID]);

    const handleDelete = async () => {
        if (window.confirm("Are you sure you want to delete this equipment?")) {
            try {
                await api.delete(`/api/equipment/${equipment.equipmentID}`);
                toast.success("Equipment deleted successfully");
                navigate("/admin/equipment");
            } catch (error) {
                toast.error("Failed to delete equipment");
            }
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${darkMode ? 'border-cyan-400' : 'border-blue-500'}`}></div>
            </div>
        );
    }

    if (error || !equipment) {
        return (
            <div className="p-6">
                <div className={`border-l-4 p-4 ${darkMode ? 'bg-red-900/20 border-red-400' : 'bg-red-50 border-red-500'}`}>\
                    <div className="flex">
                        <div className="ml-3">
                            <h3 className={`text-sm font-medium ${darkMode ? 'text-red-300' : 'text-red-800'}`}>Error</h3>
                            <div className={`mt-2 text-sm ${darkMode ? 'text-red-200' : 'text-red-700'}`}>\
                                <p>{error || "Failed to load equipment details"}</p>
                            </div>
                            <div className="mt-4">
                                <button
                                    type="button"
                                    onClick={() => navigate("/admin/equipment")}
                                    className={`inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md ${darkMode ? 'text-red-200 bg-red-900/40 hover:bg-red-900/60' : 'text-red-700 bg-red-50 hover:bg-red-100'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500`}
                                >
                                    Go back to equipment
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="mb-6 flex items-center justify-between">
                <button
                    onClick={() => navigate("/admin/equipment")}
                    className={`flex items-center ${darkMode ? 'text-cyan-400 hover:text-cyan-200' : 'text-blue-600 hover:text-blue-800'}`}
                >
                    <ArrowLeft className="mr-1" size={18} />
                    Back to Equipment
                </button>
                <div className="flex space-x-3">
                    <button
                        onClick={() => navigate(`/admin/equipment/editEquipment/${equipment.equipmentID}`)}
                        className={`flex items-center px-4 py-2 rounded-md transition-all ${darkMode ? 'bg-cyan-700 hover:bg-cyan-800 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                    >
                        <Edit size={16} className="mr-2" />
                        Edit Equipment
                    </button>
                    <button
                        onClick={handleDelete}
                        className={`flex items-center px-4 py-2 rounded-md transition-all ${darkMode ? 'bg-red-700 hover:bg-red-800 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}
                    >
                        <Trash2 size={16} className="mr-2" />
                        Delete Equipment
                    </button>
                </div>
            </div>

            <div className={`shadow-md rounded-lg overflow-hidden ${darkMode ? 'bg-slate-800 text-slate-100' : 'bg-white'}`}>
                <div className="md:flex">
                    <div className="md:w-1/2 p-6">
                        <div className="h-96 flex items-center justify-center">
                            <Package size={64} className={darkMode ? 'text-slate-700' : 'text-gray-300'} />
                        </div>
                    </div>
                    <div className="p-6 md:w-1/2">
                        <div className="flex items-center justify-between mb-4">
                            <h1 className={`text-2xl font-bold ${darkMode ? 'text-cyan-200' : 'text-gray-800'}`}>{equipment.name}</h1>
                            <span className={`px-3 py-1 rounded-full text-sm font-bold capitalize 
                                ${equipment.status === 'Available' ? (darkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800') : 
                                equipment.status === 'In Use' ? (darkMode ? 'bg-yellow-900 text-yellow-200' : 'bg-yellow-100 text-yellow-800') : 
                                (darkMode ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800')}`
                            }>
                                {equipment.status}
                            </span>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center">
                                <Tag className={darkMode ? 'text-slate-400 mr-3' : 'text-gray-500 mr-3'} size={20} />
                                <div>
                                    <h3 className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Equipment ID</h3>
                                    <p className="font-medium">{equipment.equipmentID}</p>
                                </div>
                            </div>

                            <div className="flex items-center">
                                <Tag className={darkMode ? 'text-slate-400 mr-3' : 'text-gray-500 mr-3'} size={20} />
                                <div>
                                    <h3 className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Type</h3>
                                    <p className="font-medium">{equipment.type}</p>
                                </div>
                            </div>

                            <div className="flex items-center">
                                <Tag className={darkMode ? 'text-slate-400 mr-3' : 'text-gray-500 mr-3'} size={20} />
                                <div>
                                    <h3 className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Serial</h3>
                                    <p className="font-medium">{equipment.serial}</p>
                                </div>
                            </div>

                            {equipment.purchaseDate && (
                                <div className="flex items-center">
                                    <Calendar className={darkMode ? 'text-slate-400 mr-3' : 'text-gray-500 mr-3'} size={20} />
                                    <div>
                                        <h3 className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Purchase Date</h3>
                                        <p className="font-medium">
                                            {new Date(equipment.purchaseDate).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {equipment.warrantyExpiry && (
                                <div className="flex items-center">
                                    <Clock className={darkMode ? 'text-slate-400 mr-3' : 'text-gray-500 mr-3'} size={20} />
                                    <div>
                                        <h3 className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Warranty Expiry</h3>
                                        <p className="font-medium">
                                            {new Date(equipment.warrantyExpiry).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {equipment.lastServiced && (
                                <div className="flex items-center">
                                    <Clock className={darkMode ? 'text-slate-400 mr-3' : 'text-gray-500 mr-3'} size={20} />
                                    <div>
                                        <h3 className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Last Serviced</h3>
                                        <p className="font-medium">
                                            {new Date(equipment.lastServiced).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {equipment.notes && (
                                <div className="flex items-center">
                                    <Tag className={darkMode ? 'text-slate-400 mr-3' : 'text-gray-500 mr-3'} size={20} />
                                    <div>
                                        <h3 className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Notes</h3>
                                        <p className="font-medium whitespace-pre-line">{equipment.notes}</p>
                                    </div>
                                </div>
                            )}

                            {equipment.boatNumber && (
                                <div className="flex items-center">
                                    <Tag className={darkMode ? 'text-slate-400 mr-3' : 'text-gray-500 mr-3'} size={20} />
                                    <div>
                                        <h3 className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Boat Number</h3>
                                        <p className="font-medium">{equipment.boatNumber}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
