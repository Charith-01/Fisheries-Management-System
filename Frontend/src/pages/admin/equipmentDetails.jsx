import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { Package, ArrowLeft, Edit, Trash2, Calendar, Clock, Tag, Download } from "lucide-react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
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


    // if (loading) {
    //     return (
    //         <div className="flex justify-center items-center min-h-[60vh]">
    //             <div className={`animate-spin rounded-full h-14 w-14 border-t-4 border-b-4 ${darkMode ? 'border-cyan-400' : 'border-blue-500'}`}></div>
    //         </div>
    //     );
    // }

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${darkMode ? 'border-cyan-400' : 'border-blue-500'}`}></div>
            </div>
        );
    }

    if (error || !equipment) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <div className={`rounded-xl shadow-lg p-8 flex flex-col items-center max-w-md w-full ${darkMode ? 'bg-red-950/80 border border-red-700' : 'bg-red-50 border border-red-200'}`}>\
                    <Package size={48} className={darkMode ? 'text-red-400' : 'text-red-500'} />
                    <h3 className={`text-lg font-semibold mt-4 ${darkMode ? 'text-red-200' : 'text-red-800'}`}>Error</h3>
                    <p className={`mt-2 text-center ${darkMode ? 'text-red-100' : 'text-red-700'}`}>{error || "Failed to load equipment details"}</p>
                    <button
                        type="button"
                        onClick={() => navigate("/admin/equipment")}
                        className={`mt-6 px-5 py-2 rounded-lg font-medium shadow transition-all ${darkMode ? 'bg-red-800 hover:bg-red-700 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}
                    >
                        Go back to equipment
                    </button>
                </div>
            </div>
        );
    }


    return (
        <div className={`min-h-screen flex flex-col items-center justify-center py-10 px-2 ${darkMode ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' : 'bg-gradient-to-br from-blue-50 via-cyan-50 to-white'}`}>
            <div className={`w-full max-w-3xl rounded-3xl shadow-2xl border transition-all ${darkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-gray-200 text-gray-900'}`}>
                <div className="flex flex-col md:flex-row gap-0 md:gap-8">
                    {/* Left: Icon and Actions */}
                    <div className={`flex flex-col items-center justify-center md:w-1/3 p-8 border-b md:border-b-0 md:border-r transition-all ${darkMode ? 'border-slate-700' : 'border-gray-100'}`}>
                        <div className={`rounded-full p-6 shadow-lg mb-4 ${darkMode ? 'bg-slate-800' : 'bg-blue-50'}`}>
                            <Package size={64} className={darkMode ? 'text-cyan-400' : 'text-blue-600'} />
                        </div>
                        <div className="flex flex-col gap-3 w-full">
                            <button
                                onClick={() => navigate("/admin/equipment")}
                                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all shadow-sm ${darkMode ? 'bg-slate-800 hover:bg-slate-700 text-cyan-300' : 'bg-blue-50 hover:bg-blue-100 text-blue-700'}`}
                            >
                                <ArrowLeft size={18} /> Back to Equipment
                            </button>
                            <button
                                onClick={() => {
                                    if (!equipment) {
                                        toast.error("No equipment details to export");
                                        return;
                                    }
                                    const data = [{
                                        "Equipment ID": equipment.equipmentID,
                                        "Name": equipment.name,
                                        "Type": equipment.type,
                                        "Status": equipment.status,
                                        "Serial": equipment.serial,
                                        "Purchase Date": equipment.purchaseDate ? new Date(equipment.purchaseDate).toLocaleDateString() : "",
                                        "Warranty Expiry": equipment.warrantyExpiry ? new Date(equipment.warrantyExpiry).toLocaleDateString() : "",
                                        "Last Serviced": equipment.lastServiced ? new Date(equipment.lastServiced).toLocaleDateString() : "",
                                        "Notes": equipment.notes || ""
                                    }];
                                    const worksheet = XLSX.utils.json_to_sheet(data);
                                    const workbook = XLSX.utils.book_new();
                                    XLSX.utils.book_append_sheet(workbook, worksheet, "Equipment Details");
                                    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
                                    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
                                    saveAs(blob, `equipment_${equipment.equipmentID}.xlsx`);
                                }}
                                type="button"
                                className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-all ${
                                    darkMode ? "bg-slate-700 text-white hover:bg-slate-600" : "bg-slate-100 text-slate-800 hover:bg-slate-200"
                                }`}
                                title="Export equipment details as Excel"
                            >
                                <Download className="h-4 w-4" />
                                Export
                            </button>
                            <button
                                onClick={() => navigate(`/admin/equipment/editEquipment/${equipment.equipmentID}`)}
                                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all shadow-sm ${darkMode ? 'bg-cyan-700 hover:bg-cyan-800 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                            >
                                <Edit size={16} /> Edit
                            </button>
                            <button
                                onClick={handleDelete}
                                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all shadow-sm ${darkMode ? 'bg-red-800 hover:bg-red-700 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}
                            >
                                <Trash2 size={16} /> Delete
                            </button>
                        </div>
                    </div>
                    {/* Right: Details */}
                    <div className="flex-1 p-8 flex flex-col gap-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
                            <h1 className={`text-3xl font-extrabold tracking-tight ${darkMode ? 'text-cyan-200' : 'text-blue-900'}`}>{equipment.name}</h1>
                            <span className={`px-4 py-1 rounded-full text-base font-bold capitalize shadow-sm border
                                ${equipment.status === 'Available' ? (darkMode ? 'bg-green-900 text-green-300 border-green-700' : 'bg-green-100 text-green-800 border-green-200') :
                                equipment.status === 'In Use' ? (darkMode ? 'bg-yellow-900 text-yellow-200 border-yellow-700' : 'bg-yellow-100 text-yellow-800 border-yellow-200') :
                                (darkMode ? 'bg-red-900 text-red-200 border-red-700' : 'bg-red-100 text-red-800 border-red-200')}`
                            }>
                                {equipment.status}
                            </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <DetailItem label="Equipment ID" value={equipment.equipmentID} darkMode={darkMode} />
                            <DetailItem label="Type" value={equipment.type} darkMode={darkMode} />
                            <DetailItem label="Serial" value={equipment.serial} darkMode={darkMode} />
                            {/* <DetailItem label="Boat Number" value={equipment.boatNumber || '-'} darkMode={darkMode} /> */}
                            <DetailItem label="Purchase Date" value={equipment.purchaseDate ? new Date(equipment.purchaseDate).toLocaleDateString() : '-'} darkMode={darkMode} icon={<Calendar size={18} />} />
                            <DetailItem label="Warranty Expiry" value={equipment.warrantyExpiry ? new Date(equipment.warrantyExpiry).toLocaleDateString() : '-'} darkMode={darkMode} icon={<Clock size={18} />} />
                            <DetailItem label="Last Serviced" value={equipment.lastServiced ? new Date(equipment.lastServiced).toLocaleDateString() : '-'} darkMode={darkMode} icon={<Clock size={18} />} />
                            <DetailItem label="Notes" value={equipment.notes || '-'} darkMode={darkMode} multiline />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function DetailItem({ label, value, darkMode, icon, multiline }) {
    return (
        <div className={`flex items-start gap-3 p-4 rounded-xl shadow-sm border transition-all ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
            {icon && <span className="mt-1">{icon}</span>}
            <div>
                <div className={`text-xs font-semibold uppercase tracking-wider mb-1 ${darkMode ? 'text-cyan-400' : 'text-blue-600'}`}>{label}</div>
                <div className={`text-base ${multiline ? 'whitespace-pre-line' : ''} ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>{value}</div>
            </div>
        </div>
    );
}
