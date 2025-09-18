import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "../../api/axios";
import { Package, Save, Loader } from "lucide-react";
import toast from "react-hot-toast";

export default function EditEquipmentForm({ darkMode }) {
    const { equipmentID } = useParams();
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [errors, setErrors] = useState({});
    const [formData, setFormData] = useState({
        equipmentID: "",
        name: "",
        type: "Other",
        serial: "",
        status: "Available",
        purchaseDate: "",
        warrantyExpiry: "",
        lastServiced: "",
        notes: "",
        boatNumber: ""
    });

    useEffect(() => {
        const fetchEquipmentDetails = async () => {
            try {
                const token = localStorage.getItem("token");
                const response = await axios.get(`/api/equipment/${equipmentID}`,
                    { headers: { Authorization: "Bearer " + token } }
                );
                const equipment = response.data.equipment;
                setFormData({
                    equipmentID: equipment.equipmentID,
                    name: equipment.name,
                    type: equipment.type,
                    serial: equipment.serial,
                    status: equipment.status,
                    purchaseDate: equipment.purchaseDate ? equipment.purchaseDate.slice(0,10) : "",
                    warrantyExpiry: equipment.warrantyExpiry ? equipment.warrantyExpiry.slice(0,10) : "",
                    lastServiced: equipment.lastServiced ? equipment.lastServiced.slice(0,10) : "",
                    notes: equipment.notes || "",
                    boatNumber: equipment.boatNumber || ""
                });
                setIsLoading(false);
            } catch (error) {
                toast.error("Failed to fetch equipment details");
                console.error("Error fetching equipment details:", error);
                navigate("/admin/equipment");
            }
        };
        fetchEquipmentDetails();
    }, [equipmentID, navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        if (errors[name]) setErrors({ ...errors, [name]: null });
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = "Equipment name is required";
        if (!formData.type.trim()) newErrors.type = "Type is required";
        if (!formData.serial.trim()) newErrors.serial = "Serial is required";
        if (!formData.notes.trim()) newErrors.notes = "Notes are required";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return toast.error("Please fix errors");
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem("token");
            await axios.put(`/api/equipment/${equipmentID}`, formData, {
                headers: { Authorization: "Bearer " + token }
            });
            toast.success("Equipment updated successfully");
            navigate("/admin/equipment");
        } catch (err) {
            console.error(err);
            toast.error("Failed to update equipment");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${darkMode ? 'border-cyan-400' : 'border-blue-500'}`}></div>
            </div>
        );
    }

    return (
        <div className={`flex flex-col min-h-screen p-6 max-w-4xl mx-auto overflow-y-auto ${darkMode ? 'bg-slate-900 text-slate-100' : 'bg-gray-50 text-gray-900'}`}>
            <div className="flex items-center mb-6">
                <Package className={darkMode ? 'text-cyan-400 mr-2' : 'text-blue-600 mr-2'} size={24} />
                <h1 className={`text-2xl font-bold ${darkMode ? 'text-cyan-200' : 'text-gray-800'}`}>Edit Equipment: {formData.name}</h1>
            </div>
            <form onSubmit={handleSubmit} className={`${darkMode ? 'bg-slate-800' : 'bg-white'} shadow-md rounded-lg p-6`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="equipmentID" className={`block text-sm font-medium mb-1 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>Equipment ID</label>
                        <input type="text" id="equipmentID" name="equipmentID" value={formData.equipmentID} readOnly className={`w-full px-4 py-2 border ${darkMode ? 'border-slate-600 bg-slate-700 text-slate-100' : 'border-gray-300 bg-gray-100'} rounded-md`} />
                        <p className={`mt-1 text-xs ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Equipment ID cannot be changed</p>
                    </div>
                    <div>
                        <label htmlFor="name" className={`block text-sm font-medium mb-1 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>Equipment Name *</label>
                        <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} className={`w-full px-4 py-2 border ${errors.name ? 'border-red-500' : darkMode ? 'border-slate-600 bg-slate-700 text-slate-100' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 ${darkMode ? 'focus:ring-cyan-400' : 'focus:ring-blue-500'}`} placeholder="Enter equipment name" />
                        {errors.name && (<p className="mt-1 text-sm text-red-400">{errors.name}</p>)}
                    </div>
                    <div>
                        <label htmlFor="type" className={`block text-sm font-medium mb-1 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>Type *</label>
                        <select id="type" name="type" value={formData.type} onChange={handleChange} className={`w-full px-4 py-2 border ${darkMode ? 'border-slate-600 bg-slate-700 text-slate-100' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 ${darkMode ? 'focus:ring-cyan-400' : 'focus:ring-blue-500'}`}> 
                            <option value="Navigation">Navigation</option>
                            <option value="Fishing Gear">Fishing Gear</option>
                            <option value="Safety">Safety</option>
                            <option value="Engine">Engine</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="serial" className={`block text-sm font-medium mb-1 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>Serial *</label>
                        <input type="text" id="serial" name="serial" value={formData.serial} onChange={handleChange} className={`w-full px-4 py-2 border ${errors.serial ? 'border-red-500' : darkMode ? 'border-slate-600 bg-slate-700 text-slate-100' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 ${darkMode ? 'focus:ring-cyan-400' : 'focus:ring-blue-500'}`} placeholder="Enter serial number" />
                        {errors.serial && (<p className="mt-1 text-sm text-red-400">{errors.serial}</p>)}
                    </div>
                    <div>
                        <label htmlFor="status" className={`block text-sm font-medium mb-1 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>Status</label>
                        <select id="status" name="status" value={formData.status} onChange={handleChange} className={`w-full px-4 py-2 border ${darkMode ? 'border-slate-600 bg-slate-700 text-slate-100' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 ${darkMode ? 'focus:ring-cyan-400' : 'focus:ring-blue-500'}`}> 
                            <option value="Available">Available</option>
                            <option value="In Use">In Use</option>
                            <option value="Under Maintenance">Under Maintenance</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="purchaseDate" className={`block text-sm font-medium mb-1 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>Purchase Date</label>
                        <input type="date" id="purchaseDate" name="purchaseDate" value={formData.purchaseDate} onChange={handleChange} className={`w-full px-4 py-2 border ${darkMode ? 'border-slate-600 bg-slate-700 text-slate-100' : 'border-gray-300'} rounded-md`} />
                    </div>
                    <div>
                        <label htmlFor="warrantyExpiry" className={`block text-sm font-medium mb-1 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>Warranty Expiry</label>
                        <input type="date" id="warrantyExpiry" name="warrantyExpiry" value={formData.warrantyExpiry} onChange={handleChange} className={`w-full px-4 py-2 border ${darkMode ? 'border-slate-600 bg-slate-700 text-slate-100' : 'border-gray-300'} rounded-md`} />
                    </div>
                    <div>
                        <label htmlFor="lastServiced" className={`block text-sm font-medium mb-1 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>Last Serviced</label>
                        <input type="date" id="lastServiced" name="lastServiced" value={formData.lastServiced} onChange={handleChange} className={`w-full px-4 py-2 border ${darkMode ? 'border-slate-600 bg-slate-700 text-slate-100' : 'border-gray-300'} rounded-md`} />
                    </div>
                    <div>
                        <label htmlFor="notes" className={`block text-sm font-medium mb-1 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>Notes *</label>
                        <textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} className={`w-full px-4 py-2 border ${errors.notes ? 'border-red-500' : darkMode ? 'border-slate-600 bg-slate-700 text-slate-100' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 ${darkMode ? 'focus:ring-cyan-400' : 'focus:ring-blue-500'}`} rows={3} placeholder="Enter notes" />
                        {errors.notes && (<p className="mt-1 text-sm text-red-400">{errors.notes}</p>)}
                    </div>
                    <div>
                        <label htmlFor="boatNumber" className={`block text-sm font-medium mb-1 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>Boat Number (optional)</label>
                        <input type="text" id="boatNumber" name="boatNumber" value={formData.boatNumber} onChange={handleChange} className={`w-full px-4 py-2 border ${darkMode ? 'border-slate-600 bg-slate-700 text-slate-100' : 'border-gray-300'} rounded-md`} placeholder="Enter boat number" />
                    </div>
                </div>
                <div className="mt-8 flex justify-end gap-4">
                    <button type="button" onClick={() => navigate("/admin/equipment")}
                        className={`px-4 py-2 border rounded-md transition-all ${darkMode ? 'border-slate-600 text-slate-200 hover:bg-slate-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>Cancel</button>
                    <button type="submit" disabled={isSubmitting}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${darkMode ? 'bg-cyan-700 hover:bg-cyan-800 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'} ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}>
                        {isSubmitting ? (
                            <>
                                <Loader className="animate-spin" size={18} />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save size={18} />
                                Update Equipment
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
