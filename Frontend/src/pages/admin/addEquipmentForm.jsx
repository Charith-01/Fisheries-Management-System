import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../api/axios";
import toast from "react-hot-toast";

export default function AddEquipmentForm({ darkMode }) {
    const [boatList, setBoatList] = useState([]);
    useEffect(() => {
        const fetchBoats = async () => {
            try {
                const res = await axios.get("/api/boat");
                setBoatList(res.data);
            } catch (err) {
                setBoatList([]);
            }
        };
        fetchBoats();
    }, []);
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        equipmentID: "",
        name: "",
        type: "Other",
        // serial: "",
        status: "Available",
        purchaseDate: "",
        warrantyExpiry: "",
        lastServiced: "",
        notes: "",
        boatNumber: ""
    });
    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        const { name, value } = e.target;
        let updated = { ...formData, [name]: value };
        // If boatNumber changes, auto-update status
        if (name === 'boatNumber') {
            updated.status = value ? 'In Use' : 'Available';
        }
        setFormData(updated);
        if (errors[name]) setErrors({ ...errors, [name]: null });
    };

    const validateForm = () => {
        const newErrors = {};
        // if (!formData.equipmentID.trim()) newErrors.equipmentID = "Equipment ID is required";
        if (!formData.name.trim()) newErrors.name = "Equipment name is required";
        if (!formData.type.trim()) newErrors.type = "Type is required";
        // if (!formData.serial.trim()) newErrors.serial = "Serial is required";
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
                    <label htmlFor="name" className={`block text-sm font-medium mb-1 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>Equipment ID *</label>
                    {/* <input
                        type="text"
                        name="equipmentID"
                        placeholder="Equipment ID"
                        value={formData.equipmentID}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 border rounded ${errors.equipmentID ? "border-red-500" : darkMode ? 'border-slate-600 bg-slate-700 text-slate-100' : "border-gray-300"}`}
                    /> */}
                    <label htmlFor="name" className={`block text-sm font-medium mb-1 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>Equipment Name *</label>
                    <input
                        type="text"
                        name="name"
                        placeholder="Equipment Name"
                        value={formData.name}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 border rounded ${errors.name ? "border-red-500" : darkMode ? 'border-slate-600 bg-slate-700 text-slate-100' : "border-gray-300"}`}
                    />
                    <label htmlFor="name" className={`block text-sm font-medium mb-1 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>Type *</label>
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
                    {/* <label htmlFor="name" className={`block text-sm font-medium mb-1 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>Serial *</label>
                    <input
                        type="text"
                        name="serial"
                        placeholder="Serial"
                        value={formData.serial}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 border rounded ${errors.serial ? "border-red-500" : darkMode ? 'border-slate-600 bg-slate-700 text-slate-100' : "border-gray-300"}`}
                    /> */}
                    <label htmlFor="name" className={`block text-sm font-medium mb-1 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>Status *</label>
                    <select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 border rounded ${darkMode ? 'border-slate-600 bg-slate-700 text-slate-100' : 'border-gray-300'}`}
                    >
                        <option value="Available">Available</option>
                        <option value="In Use">In Use</option>
                        <option value="Under Maintenance">Under Maintenance</option>
                    </select>
                    <label htmlFor="name" className={`block text-sm font-medium mb-1 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>Purchase Date *</label>
                    <input
                        type="date"
                        name="purchaseDate"
                        placeholder="Purchase Date"
                        value={formData.purchaseDate}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 border rounded ${darkMode ? 'border-slate-600 bg-slate-700 text-slate-100' : 'border-gray-300'}`}
                    />
                    <label htmlFor="name" className={`block text-sm font-medium mb-1 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>Warrenty Expiry *</label>
                    <input
                        type="date"
                        name="warrantyExpiry"
                        placeholder="Warranty Expiry"
                        value={formData.warrantyExpiry}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 border rounded ${darkMode ? 'border-slate-600 bg-slate-700 text-slate-100' : 'border-gray-300'}`}
                    />
                    <label htmlFor="name" className={`block text-sm font-medium mb-1 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>Last  Serviced *</label>
                    <input
                        type="date"
                        name="lastServiced"
                        placeholder="Last Serviced"
                        value={formData.lastServiced}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 border rounded ${darkMode ? 'border-slate-600 bg-slate-700 text-slate-100' : 'border-gray-300'}`}
                    />
                    <label htmlFor="name" className={`block text-sm font-medium mb-1 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>Notes *</label>
                    <textarea
                        name="notes"
                        placeholder="Notes *"
                        value={formData.notes}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 border rounded ${errors.notes ? "border-red-500" : darkMode ? 'border-slate-600 bg-slate-700 text-slate-100' : "border-gray-300"}`}
                        rows={3}
                    />
                    {/* <label htmlFor="name" className={`block text-sm font-medium mb-1 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>Boat Number </label>
                    <select
                        name="boatNumber"
                        value={formData.boatNumber}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 border rounded ${darkMode ? 'border-slate-600 bg-slate-700 text-slate-100' : 'border-gray-300'}`}
                    >
                        <option value="">No Boat Assigned</option>
                        {boatList.map(boat => (
                            <option key={boat.boatNumber} value={boat.boatNumber}>
                                {boat.name} ({boat.boatNumber})
                            </option>
                        ))}
                    </select> */}
                    <div className="flex justify-end gap-2 mt-4">
                        <button type="button" onClick={() => navigate("/admin/equipment")}
                            className={`px-4 py-2 border rounded ${darkMode ? 'border-slate-600 text-slate-200' : 'border-gray-300'}`}>Cancel</button>
                        <button type="submit" disabled={isSubmitting}
                            className={`px-4 py-2 rounded ${darkMode ? 'bg-cyan-700 hover:bg-cyan-800 text-white' : 'bg-blue-600 text-white'}`}>{isSubmitting ? "Saving..." : "Save Equipment"}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
