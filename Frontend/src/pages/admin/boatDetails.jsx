import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { Ship, ArrowLeft, Edit, Trash2, Tag, Users, Calendar, Clock, Download } from "lucide-react";
import toast from "react-hot-toast";

export default function BoatDetails({ darkMode }) {
    const { boatNumber } = useParams();
    const navigate = useNavigate();
    const [boat, setBoat] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [equipmentList, setEquipmentList] = useState([]);

    useEffect(() => {
        const fetchBoat = async () => {
            try {
                const response = await api.get(`/api/boat/${boatNumber}`);
                setBoat(response.data.boat);
                setLoading(false);
            } catch (err) {
                setError("Failed to fetch boat details");
                setLoading(false);
                toast.error("Failed to load boat details");
            }
        };
        fetchBoat();
        // Fetch equipment list for mapping
        const fetchEquipment = async () => {
            try {
                const res = await api.get("/api/equipment");
                setEquipmentList(res.data);
            } catch (err) {
                setEquipmentList([]);
            }
        };
        fetchEquipment();
    }, [boatNumber]);

    const handleDelete = async () => {
        if (window.confirm("Are you sure you want to delete this boat?")) {
            try {
                await api.delete(`/api/boat/${boat.boatNumber}`);
                toast.success("Boat deleted successfully");
                navigate("/admin/boats");
            } catch (error) {
                toast.error("Failed to delete boat");
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

    if (error || !boat) {
        return (
            <div className="p-6">
                <div className={`border-l-4 p-4 ${darkMode ? 'bg-red-900/20 border-red-400' : 'bg-red-50 border-red-500'}`}>
                    <div className="flex">
                        <div className="ml-3">
                            <h3 className={`text-sm font-medium ${darkMode ? 'text-red-300' : 'text-red-800'}`}>Error</h3>
                            <div className={`mt-2 text-sm ${darkMode ? 'text-red-200' : 'text-red-700'}`}>
                                <p>{error || "Failed to load boat details"}</p>
                            </div>
                            <div className="mt-4">
                                <button
                                    type="button"
                                    onClick={() => navigate("/admin/boats")}
                                    className={`inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md ${darkMode ? 'text-red-200 bg-red-900/40 hover:bg-red-900/60' : 'text-red-700 bg-red-50 hover:bg-red-100'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500`}
                                >
                                    Go back to boats
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
                    onClick={() => navigate("/admin/boats")}
                    className={`flex items-center ${darkMode ? 'text-cyan-400 hover:text-cyan-200' : 'text-blue-600 hover:text-blue-800'}`}
                >
                    <ArrowLeft className="mr-1" size={18} />
                    Back to Boats
                </button>
                <div className="flex space-x-3">
                    <button
                        onClick={() => {
                            if (!boat) {
                                toast.error("No boat details to export");
                                return;
                            }
                            // Prepare data for Excel
                            const data = [{
                                "Boat Number": boat.boatNumber,
                                "Name": boat.name,
                                "Capacity": boat.capacity,
                                "Status": boat.status,
                                "Equipment": boat.equipmentID && boat.equipmentID.length > 0 ? boat.equipmentID.map(eid => {
                                    const eq = equipmentList.find(eq => eq._id === eid || eq.equipmentID === eid);
                                    return eq ? `${eq.name} (${eq.equipmentID})` : eid;
                                }).join(", ") : "None"
                            }];
                            const worksheet = XLSX.utils.json_to_sheet(data);
                            const workbook = XLSX.utils.book_new();
                            XLSX.utils.book_append_sheet(workbook, worksheet, "Boat Details");
                            const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
                            const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
                            saveAs(blob, `boat_${boat.boatNumber}.xlsx`);
                        }}
                        type="button"
                        className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-all ${
                            darkMode ? "bg-slate-700 text-white hover:bg-slate-600" : "bg-slate-100 text-slate-800 hover:bg-slate-200"
                        }`}
                        title="Export boat details as Excel"
                    >
                        <Download className="h-4 w-4" />
                        Export
                    </button>
                    <button
                        onClick={() => navigate(`/admin/boats/editBoat/${boat.boatNumber}`)}
                        className={`flex items-center px-4 py-2 rounded-md transition-all ${darkMode ? 'bg-cyan-700 hover:bg-cyan-800 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                    >
                        <Edit size={16} className="mr-2" />
                        Edit Boat
                    </button>
                    <button
                        onClick={handleDelete}
                        className={`flex items-center px-4 py-2 rounded-md transition-all ${darkMode ? 'bg-red-700 hover:bg-red-800 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}
                    >
                        <Trash2 size={16} className="mr-2" />
                        Delete Boat
                    </button>
                </div>
            </div>

            <div className={`shadow-md rounded-lg overflow-hidden ${darkMode ? 'bg-slate-800 text-slate-100' : 'bg-white'}`}>
                <div className="md:flex">
                    <div className="md:w-1/2 p-6">
                        <div className="h-96 flex items-center justify-center">
                            {boat.images && boat.images.length > 0 ? (
                                <img src={boat.images[0]} alt={boat.name} className="w-full h-full object-cover rounded" />
                            ) : (
                                <Ship size={64} className={darkMode ? 'text-slate-700' : 'text-gray-300'} />
                            )}
                        </div>
                    </div>
                    <div className="p-6 md:w-1/2">
                        <div className="flex items-center justify-between mb-4">
                            <h1 className={`text-2xl font-bold ${darkMode ? 'text-cyan-200' : 'text-gray-800'}`}>{boat.name}</h1>
                            <span className={`px-3 py-1 rounded-full text-sm font-bold capitalize 
                                ${boat.status === 'active' ? (darkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800') : 
                                boat.status === 'inactive' ? (darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-800') : 
                                boat.status === 'maintenance' ? (darkMode ? 'bg-yellow-900 text-yellow-200' : 'bg-yellow-100 text-yellow-800') :
                                (darkMode ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800')}`
                            }>
                                {boat.status}
                            </span>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center">
                                <Tag className={darkMode ? 'text-slate-400 mr-3' : 'text-gray-500 mr-3'} size={20} />
                                <div>
                                    <h3 className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Boat Number</h3>
                                    <p className="font-medium">{boat.boatNumber}</p>
                                </div>
                            </div>

                            <div className="flex items-center">
                                <Users className={darkMode ? 'text-slate-400 mr-3' : 'text-gray-500 mr-3'} size={20} />
                                <div>
                                    <h3 className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Capacity</h3>
                                    <p className="font-medium">{boat.capacity} persons</p>
                                </div>
                            </div>

                            {boat.createdAt && (
                                <div className="flex items-center">
                                    <Calendar className={darkMode ? 'text-slate-400 mr-3' : 'text-gray-500 mr-3'} size={20} />
                                    <div>
                                        <h3 className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Added on</h3>
                                        <p className="font-medium">
                                            {new Date(boat.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {boat.updatedAt && boat.updatedAt !== boat.createdAt && (
                                <div className="flex items-center">
                                    <Clock className={darkMode ? 'text-slate-400 mr-3' : 'text-gray-500 mr-3'} size={20} />
                                    <div>
                                        <h3 className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Last Updated</h3>
                                        <p className="font-medium">
                                            {new Date(boat.updatedAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {boat.equipmentID && boat.equipmentID.length > 0 && (
                            <div className="mt-6">
                                <h3 className={`font-semibold mb-2 ${darkMode ? 'text-cyan-200' : 'text-gray-700'}`}>Equipment</h3>
                                <div className="flex flex-wrap gap-2">
                                    {boat.equipmentID.map((equipmentId, index) => {
                                        const eq = equipmentList.find(eq => eq._id === equipmentId || eq.equipmentID === equipmentId);
                                        return (
                                            <span
                                                key={index}
                                                className={`px-3 py-1 rounded-full text-sm ${darkMode ? 'bg-cyan-900 text-cyan-200' : 'bg-blue-50 text-blue-700'}`}
                                            >
                                                {eq ? `${eq.name} (${eq.equipmentID})` : equipmentId}
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
