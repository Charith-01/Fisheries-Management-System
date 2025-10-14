import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "../../api/axios";
import { Package, Save, Loader, Calendar } from "lucide-react";
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
        description: "",
        totalQuantity: 1,
        requiresMaintenance: false,
        maintenanceInterval: "",
        nextMaintenanceDate: "",
        notes: ""
    });

    useEffect(() => {
        const fetchEquipmentDetails = async () => {
            try {
                const token = localStorage.getItem("token");
                const response = await axios.get(`/api/equipment/${equipmentID}`,
                    { headers: { Authorization: "Bearer " + token } }
                );
                const equipment = response.data.equipment;
                console.log("Fetched equipment:", equipment); 
                
                setFormData({
                    equipmentID: equipment.equipmentID,
                    name: equipment.name,
                    type: equipment.type,
                    description: equipment.description || "",
                    totalQuantity: equipment.totalQuantity,
                    requiresMaintenance: equipment.requiresMaintenance || false,
                    maintenanceInterval: equipment.maintenanceInterval || "",
                    nextMaintenanceDate: equipment.nextMaintenanceDate ? equipment.nextMaintenanceDate.slice(0,10) : "",
                    notes: equipment.notes || ""
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

    // Calculate next maintenance date when maintenance interval changes
    useEffect(() => {
        if (formData.requiresMaintenance && formData.maintenanceInterval) {
            const today = new Date();
            const nextDate = new Date();
            nextDate.setDate(today.getDate() + parseInt(formData.maintenanceInterval));
            
            setFormData(prev => ({
                ...prev,
                nextMaintenanceDate: nextDate.toISOString().split('T')[0]
            }));
        } else if (!formData.requiresMaintenance) {
            // Clear maintenance date if maintenance is disabled
            setFormData(prev => ({
                ...prev,
                nextMaintenanceDate: "",
                maintenanceInterval: ""
            }));
        }
    }, [formData.requiresMaintenance, formData.maintenanceInterval]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({ 
            ...formData, 
            [name]: type === 'checkbox' ? checked : value 
        });
        if (errors[name]) setErrors({ ...errors, [name]: null });
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = "Equipment name is required";
        if (!formData.type.trim()) newErrors.type = "Type is required";
        if (!formData.totalQuantity || formData.totalQuantity < 1) newErrors.totalQuantity = "Quantity must be at least 1";
        
        // Validate maintenance fields if maintenance is required
        if (formData.requiresMaintenance) {
            if (!formData.maintenanceInterval || formData.maintenanceInterval < 1) {
                newErrors.maintenanceInterval = "Maintenance interval must be at least 1 day";
            }
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return toast.error("Please fix errors");
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem("token");
            
            // Prepare data for submission
            const submitData = {
                ...formData,
                totalQuantity: parseInt(formData.totalQuantity),
                maintenanceInterval: formData.requiresMaintenance ? parseInt(formData.maintenanceInterval) : null,
                nextMaintenanceDate: formData.requiresMaintenance ? formData.nextMaintenanceDate : null
            };
            
            await axios.put(`/api/equipment/${equipmentID}`, submitData, {
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

    const getMaintenanceStatus = () => {
        if (!formData.nextMaintenanceDate) return null;
        
        const nextDate = new Date(formData.nextMaintenanceDate);
        const today = new Date();
        const oneWeekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
        
        if (nextDate < today) {
            return { status: 'OVERDUE', color: 'red' };
        } else if (nextDate <= oneWeekFromNow) {
            return { status: 'DUE SOON', color: 'yellow' };
        } else {
            return { status: 'SCHEDULED', color: 'green' };
        }
    };

    const maintenanceStatus = getMaintenanceStatus();

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${darkMode ? 'border-cyan-400' : 'border-blue-500'}`}></div>
            </div>
        );
    }

    return (
        <div className={`flex flex-col min-h-screen p-6 max-w-4xl mx-auto ${darkMode ? 'bg-slate-900 text-slate-100' : 'bg-gray-50 text-gray-900'}`}>
            <div className="flex items-center mb-6">
                <Package className={darkMode ? 'text-cyan-400 mr-2' : 'text-blue-600 mr-2'} size={24} />
                <h1 className={`text-2xl font-bold ${darkMode ? 'text-cyan-200' : 'text-gray-800'}`}>Edit Equipment: {formData.name}</h1>
            </div>
            
            <form onSubmit={handleSubmit} className={`${darkMode ? 'bg-slate-800' : 'bg-white'} shadow-md rounded-lg p-6`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Equipment ID */}
                    <div>
                        <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>Equipment ID</label>
                        <input 
                            type="text" 
                            value={formData.equipmentID} 
                            readOnly 
                            className={`w-full px-4 py-2 border ${darkMode ? 'border-slate-600 bg-slate-700 text-slate-100' : 'border-gray-300 bg-gray-100'} rounded-md`} 
                        />
                    </div>

                    {/* Equipment Name */}
                    <div>
                        <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>Equipment Name *</label>
                        <input 
                            type="text" 
                            name="name"
                            value={formData.name} 
                            onChange={handleChange}
                            className={`w-full px-4 py-2 border ${errors.name ? 'border-red-500' : darkMode ? 'border-slate-600 bg-slate-700 text-slate-100' : 'border-gray-300'} rounded-md`} 
                        />
                        {errors.name && <p className="mt-1 text-sm text-red-400">{errors.name}</p>}
                    </div>

                    {/* Equipment Type */}
                    <div>
                        <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>Type *</label>
                        <select 
                            name="type"
                            value={formData.type} 
                            onChange={handleChange}
                            className={`w-full px-4 py-2 border ${darkMode ? 'border-slate-600 bg-slate-700 text-slate-100' : 'border-gray-300'} rounded-md`}
                        > 
                            <option value="Navigation">Navigation</option>
                            <option value="Fishing Gear">Fishing Gear</option>
                            <option value="Safety">Safety</option>
                            <option value="Engine">Engine</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    {/* Total Quantity */}
                    <div>
                        <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>Total Quantity *</label>
                        <input 
                            type="number" 
                            name="totalQuantity"
                            value={formData.totalQuantity} 
                            onChange={handleChange}
                            min="1"
                            className={`w-full px-4 py-2 border ${errors.totalQuantity ? 'border-red-500' : darkMode ? 'border-slate-600 bg-slate-700 text-slate-100' : 'border-gray-300'} rounded-md`} 
                        />
                        {errors.totalQuantity && <p className="mt-1 text-sm text-red-400">{errors.totalQuantity}</p>}
                    </div>

                    {/* Description */}
                    <div className="md:col-span-2">
                        <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>Description</label>
                        <textarea 
                            name="description"
                            value={formData.description} 
                            onChange={handleChange}
                            className={`w-full px-4 py-2 border ${darkMode ? 'border-slate-600 bg-slate-700 text-slate-100' : 'border-gray-300'} rounded-md`} 
                            rows={3}
                        />
                    </div>
                </div>

                {/* Maintenance Section */}
                <div className="mt-6 pt-6 border-t">
                    <h3 className={`text-lg font-semibold mb-4 flex items-center ${darkMode ? 'text-cyan-300' : 'text-blue-600'}`}>
                        <Calendar className="mr-2" size={20} />
                        Maintenance Settings
                    </h3>
                    
                    <div className="flex items-center mb-4">
                        <input
                            type="checkbox"
                            id="requiresMaintenance"
                            name="requiresMaintenance"
                            checked={formData.requiresMaintenance}
                            onChange={handleChange}
                            className="mr-3 w-4 h-4"
                        />
                        <label htmlFor="requiresMaintenance" className={`font-medium ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                            This equipment requires regular maintenance
                        </label>
                    </div>

                    {formData.requiresMaintenance && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-lg border">
                            {/* Maintenance Interval */}
                            <div>
                                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                                    Maintenance Interval (days) *
                                </label>
                                <input 
                                    type="number" 
                                    name="maintenanceInterval"
                                    value={formData.maintenanceInterval} 
                                    onChange={handleChange}
                                    min="1"
                                    className={`w-full px-4 py-2 border ${errors.maintenanceInterval ? 'border-red-500' : darkMode ? 'border-slate-600 bg-slate-700 text-slate-100' : 'border-gray-300'} rounded-md`} 
                                />
                                {errors.maintenanceInterval && (
                                    <p className="mt-1 text-sm text-red-400">{errors.maintenanceInterval}</p>
                                )}
                            </div>

                            {/* Next Maintenance Date Display */}
                            <div>
                                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                                    Next Maintenance Date
                                </label>
                                <div className={`p-2 border rounded-md ${darkMode ? 'border-slate-600 bg-slate-700' : 'border-gray-300 bg-gray-100'}`}>
                                    <div className="flex items-center justify-between">
                                        <span className={formData.nextMaintenanceDate ? "" : "opacity-50"}>
                                            {formData.nextMaintenanceDate 
                                                ? new Date(formData.nextMaintenanceDate).toLocaleDateString()
                                                : "Set interval to calculate date"
                                            }
                                        </span>
                                        <Calendar size={16} className="opacity-50" />
                                    </div>
                                </div>
                            </div>

                            {/* Maintenance Status */}
                            {maintenanceStatus && (
                                <div className="md:col-span-2">
                                    <div className={`p-3 rounded-lg border ${
                                        maintenanceStatus.color === 'red' 
                                            ? (darkMode ? 'bg-red-900/20 border-red-700' : 'bg-red-50 border-red-200')
                                            : maintenanceStatus.color === 'yellow'
                                            ? (darkMode ? 'bg-yellow-900/20 border-yellow-700' : 'bg-yellow-50 border-yellow-200')
                                            : (darkMode ? 'bg-green-900/20 border-green-700' : 'bg-green-50 border-green-200')
                                    }`}>
                                        <div className="flex items-center justify-between">
                                            <span className={`font-medium ${darkMode ? 'text-slate-200' : 'text-gray-800'}`}>
                                                Maintenance Status: {maintenanceStatus.status}
                                            </span>
                                            <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                                                maintenanceStatus.color === 'red' 
                                                    ? (darkMode ? 'bg-red-700 text-red-100' : 'bg-red-500 text-white')
                                                    : maintenanceStatus.color === 'yellow'
                                                    ? (darkMode ? 'bg-yellow-700 text-yellow-100' : 'bg-yellow-500 text-white')
                                                    : (darkMode ? 'bg-green-700 text-green-100' : 'bg-green-500 text-white')
                                            }`}>
                                                {maintenanceStatus.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Notes */}
                <div className="mt-6">
                    <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>Notes</label>
                    <textarea 
                        name="notes"
                        value={formData.notes} 
                        onChange={handleChange}
                        className={`w-full px-4 py-2 border ${darkMode ? 'border-slate-600 bg-slate-700 text-slate-100' : 'border-gray-300'} rounded-md`} 
                        rows={3}
                    />
                </div>

                {/* Form Buttons */}
                <div className="mt-8 flex justify-end gap-4">
                    <button 
                        type="button" 
                        onClick={() => navigate("/admin/equipment")}
                        className={`px-4 py-2 border rounded-md ${darkMode ? 'border-slate-600 text-slate-200 hover:bg-slate-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit" 
                        disabled={isSubmitting}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md ${darkMode ? 'bg-cyan-700 hover:bg-cyan-800 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'} ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
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