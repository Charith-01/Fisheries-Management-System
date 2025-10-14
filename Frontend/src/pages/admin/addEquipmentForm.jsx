import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../api/axios";
import toast from "react-hot-toast";

export default function AddEquipmentForm({ darkMode }) {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    // const [formData, setFormData] = useState({
    //     name: "",
    //     type: "Other",
    //     description: "",
    //     totalQuantity: 1,
    //     requiresMaintenance: false,
    //     maintenanceInterval: "",
    //     notes: ""
    // });
    // In AddEquipmentForm.jsx, add the same useEffect for automatic calculation
    const [formData, setFormData] = useState({
        name: "",
        type: "Other",
        description: "",
        totalQuantity: 1,
        requiresMaintenance: false,
        maintenanceInterval: "",
        nextMaintenanceDate: "",
        notes: ""
    });

    // Add this useEffect in AddEquipmentForm.jsx
    useEffect(() => {
        if (formData.requiresMaintenance && formData.maintenanceInterval) {
            const today = new Date();
            const nextDate = new Date();
            nextDate.setDate(today.getDate() + parseInt(formData.maintenanceInterval));
            
            setFormData(prev => ({
                ...prev,
                nextMaintenanceDate: nextDate.toISOString().split('T')[0]
            }));
        }
    }, [formData.requiresMaintenance, formData.maintenanceInterval]);

    const [errors, setErrors] = useState({});

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
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return toast.error("Please fix errors");

        setIsSubmitting(true);
        try {
            const token = localStorage.getItem("token");
            await axios.post(
                "/api/equipment",
                formData,
                {
                    headers: {
                        Authorization: "Bearer " + token,
                    },
                }
            );
            toast.success("Equipment added successfully");
            navigate("/admin/equipment");
        } catch (err) {
            console.error(err);
            toast.error("Failed to add equipment");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={`flex justify-center mt-10 min-h-screen ${darkMode ? 'bg-slate-900 text-slate-100' : 'bg-gray-50 text-gray-900'}`}>
            <div className={`w-full max-w-xl shadow-md rounded-lg p-6 ${darkMode ? 'bg-slate-800' : 'bg-white'}`}>
                <h2 className={`text-xl font-bold mb-4 ${darkMode ? 'text-cyan-300' : ''}`}>Add New Equipment</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="name" className={`block text-sm font-medium mb-1 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>Equipment Name *</label>
                        <input
                            type="text"
                            name="name"
                            placeholder="Equipment Name"
                            value={formData.name}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 border rounded ${errors.name ? "border-red-500" : darkMode ? 'border-slate-600 bg-slate-700 text-slate-100' : "border-gray-300"}`}
                        />
                        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                    </div>

                    <div>
                        <label htmlFor="type" className={`block text-sm font-medium mb-1 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>Type *</label>
                        <select
                            name="type"
                            value={formData.type}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 border rounded ${darkMode ? 'border-slate-600 bg-slate-700 text-slate-100' : 'border-gray-300'}`}
                        >
                            <option value="Navigation">Navigation</option>
                            <option value="Fishing Gear">Fishing Gear</option>
                            <option value="Safety">Safety</option>
                            <option value="Engine">Engine</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="description" className={`block text-sm font-medium mb-1 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>Description</label>
                        <textarea
                            name="description"
                            placeholder="Description"
                            value={formData.description}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 border rounded ${darkMode ? 'border-slate-600 bg-slate-700 text-slate-100' : "border-gray-300"}`}
                            rows={3}
                        />
                    </div>

                    <div>
                        <label htmlFor="totalQuantity" className={`block text-sm font-medium mb-1 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>Total Quantity *</label>
                        <input
                            type="number"
                            name="totalQuantity"
                            placeholder="Total Quantity"
                            value={formData.totalQuantity}
                            onChange={handleChange}
                            min="1"
                            className={`w-full px-3 py-2 border rounded ${errors.totalQuantity ? "border-red-500" : darkMode ? 'border-slate-600 bg-slate-700 text-slate-100' : "border-gray-300"}`}
                        />
                        {errors.totalQuantity && <p className="mt-1 text-sm text-red-600">{errors.totalQuantity}</p>}
                    </div>

                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            name="requiresMaintenance"
                            checked={formData.requiresMaintenance}
                            onChange={handleChange}
                            className="mr-2"
                        />
                        <label htmlFor="requiresMaintenance" className={`text-sm ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>Requires Maintenance</label>
                    </div>

                    {formData.requiresMaintenance && (
                        <div>
                            <label htmlFor="maintenanceInterval" className={`block text-sm font-medium mb-1 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>Maintenance Interval (days)</label>
                            <input
                                type="number"
                                name="maintenanceInterval"
                                placeholder="Maintenance Interval in days"
                                value={formData.maintenanceInterval}
                                onChange={handleChange}
                                min="1"
                                className={`w-full px-3 py-2 border rounded ${darkMode ? 'border-slate-600 bg-slate-700 text-slate-100' : "border-gray-300"}`}
                            />
                        </div>
                    )}

                    <div>
                        <label htmlFor="notes" className={`block text-sm font-medium mb-1 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>Notes</label>
                        <textarea
                            name="notes"
                            placeholder="Notes"
                            value={formData.notes}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 border rounded ${darkMode ? 'border-slate-600 bg-slate-700 text-slate-100' : "border-gray-300"}`}
                            rows={3}
                        />
                    </div>

                    <div className="flex justify-end gap-2 mt-4">
                        <button type="button" onClick={() => navigate("/admin/equipment")}
                            className={`px-4 py-2 border rounded ${darkMode ? 'border-slate-600 text-slate-200' : 'border-gray-300'}`}>Cancel</button>
                        <button type="submit" disabled={isSubmitting}
                            className={`px-4 py-2 rounded ${darkMode ? 'bg-cyan-700 hover:bg-cyan-800 text-white' : 'bg-blue-600 text-white'}`}>
                            {isSubmitting ? "Saving..." : "Save Equipment"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
