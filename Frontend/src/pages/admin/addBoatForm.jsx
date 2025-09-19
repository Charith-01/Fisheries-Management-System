import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import axios from "axios";
import meadiaUpload from "../../utils/meadiaUpload";
import toast from "react-hot-toast";

export default function AddBoatForm({ darkMode }) {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [imageFiles, setImageFiles] = useState([]);
    const [imageUrls, setImageUrls] = useState([]);
    const [equipmentInput, setEquipmentInput] = useState("");
    const [equipmentItems, setEquipmentItems] = useState([]);
    const [formData, setFormData] = useState({
        boatNumber: "",
        name: "",
        capacity: "",
        status: "active",
        images: [],
        equipmentID: []
    });
    const [errors, setErrors] = useState({});
    // Equipment list for dropdown
    const [equipmentList, setEquipmentList] = useState([]);


    useEffect(() => {
        const fetchEquipment = async () => {
            try {
                const res = await api.get("/api/equipment");
                // Only allow equipment not assigned to any boat
                setEquipmentList(res.data.filter(eq => !eq.boatNumber || eq.boatNumber === ""));
            } catch (err) {
                setEquipmentList([]);
            }
        };
        fetchEquipment();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        if (errors[name]) setErrors({ ...errors, [name]: null });
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;
        setImageFiles([...imageFiles, ...files]);
        setImageUrls([...imageUrls, ...files.map(f => URL.createObjectURL(f))]);
    };

    const removeImage = (index) => {
        const newFiles = [...imageFiles];
        const newUrls = [...imageUrls];
        newFiles.splice(index, 1);
        newUrls.splice(index, 1);
        setImageFiles(newFiles);
        setImageUrls(newUrls);
    };

    const addEquipment = (e) => {
        const selectedObjectId = e.target.value;
        if (!selectedObjectId || equipmentItems.includes(selectedObjectId)) return;
        const updatedItems = [...equipmentItems, selectedObjectId];
        setEquipmentItems(updatedItems);
        setFormData({ ...formData, equipmentID: updatedItems });
        if (errors.equipmentID) setErrors({ ...errors, equipmentID: null });
    };

    const removeEquipment = (index) => {
        const newItems = [...equipmentItems];
        newItems.splice(index, 1);
        setEquipmentItems(newItems);
        setFormData({ ...formData, equipmentID: newItems });
        if (errors.equipmentID && newItems.length > 0) setErrors({ ...errors, equipmentID: null });
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.boatNumber.trim()) newErrors.boatNumber = "Boat number is required";
        if (!formData.name.trim()) newErrors.name = "Boat name is required";
        if (!formData.capacity || formData.capacity < 1) newErrors.capacity = "Capacity must be at least 1";
        if (!imageFiles.length) newErrors.images = "At least one image is required";
        if (!formData.equipmentID || formData.equipmentID.length === 0) newErrors.equipmentID = "At least one equipment is required";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return toast.error("Please fix errors");

        setIsSubmitting(true);
        try {
            // Upload images
            const uploadedUrls = await Promise.all(imageFiles.map(f => meadiaUpload(f)));
            const payload = { ...formData, images: uploadedUrls };

            // Get token if required
            const token = localStorage.getItem("token");

            // Correct backend URL
            await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/boat`,
                payload,
                {
                    headers: {
                        // "Authorization": token ? `Bearer ${token}` : "",
                        Authorization: "Bearer " + token,
                    },
                }
            );

            toast.success("Boat added successfully");
            navigate("/admin/boats");
        } catch (err) {
            console.error(err);
            toast.error("Failed to add boat");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={`flex justify-center mt-10 ${darkMode ? 'bg-slate-900 text-slate-100' : ''}`}>
            <div className={`w-full max-w-xl shadow-md rounded-lg p-6 ${darkMode ? 'bg-slate-800 text-slate-100' : 'bg-white text-slate-800'}`}>
                <h2 className={`text-xl font-bold mb-4 ${darkMode ? 'text-cyan-300' : ''}`}>Add New Boat</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="text"
                        name="boatNumber"
                        placeholder="Boat Number *"
                        value={formData.boatNumber}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 border rounded ${errors.boatNumber ? "border-red-500" : darkMode ? "border-slate-600 bg-slate-700 text-slate-100" : "border-gray-300"}`}
                    />
                    <input
                        type="text"
                        name="name"
                        placeholder="Boat Name *"
                        value={formData.name}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 border rounded ${errors.name ? "border-red-500" : darkMode ? "border-slate-600 bg-slate-700 text-slate-100" : "border-gray-300"}`}
                    />
                    <input
                        type="number"
                        name="capacity"
                        placeholder="Capacity (persons) *"
                        value={formData.capacity}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 border rounded ${errors.capacity ? "border-red-500" : darkMode ? "border-slate-600 bg-slate-700 text-slate-100" : "border-gray-300"}`}
                    />
                    <select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 border rounded ${darkMode ? 'border-slate-600 bg-slate-700 text-slate-100' : 'border-gray-300'}`}
                    >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="retired">Retired</option>
                    </select>

                    {/* Images */}
                    <div className={`border-2 border-dashed rounded p-4 text-center ${errors.images ? "border-red-500" : darkMode ? "border-slate-600" : "border-gray-300"}`}>
                        <p className="mb-2">Drag and drop images or click to select</p>
                        <input type="file" multiple className="hidden" id="boat-images" onChange={handleImageChange} />
                        <label htmlFor="boat-images" className={`cursor-pointer px-4 py-2 rounded ${darkMode ? 'bg-cyan-700 text-white' : 'bg-blue-600 text-white'}`}>Select Images</label>
                    </div>
                    {imageUrls.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                            {imageUrls.map((url, i) => (
                                <div key={i} className="relative">
                                    <img src={url} alt="" className="h-24 w-24 object-cover rounded" />
                                    <button type="button" onClick={() => removeImage(i)} className={`absolute top-0 right-0 rounded-full w-5 h-5 ${darkMode ? 'bg-red-700 text-white' : 'bg-red-500 text-white'}`}>x</button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Equipment Dropdown */}
                    <div className="flex gap-2 items-center">
                        <select
                            value=""
                            onChange={addEquipment}
                            className={`flex-grow px-3 py-2 border rounded-l ${errors.equipmentID ? 'border-red-500' : darkMode ? 'border-slate-600 bg-slate-700 text-slate-100' : 'border-gray-300'}`}
                        >
                            <option value="">Select Equipment</option>
                            {equipmentList.map(eq => (
                                <option key={eq._id} value={eq._id}>
                                    {eq.name} ({eq.equipmentID})
                                </option>
                            ))}
                        </select>
                    </div>
                    {errors.equipmentID && (
                        <p className="mt-1 text-sm text-red-600">{errors.equipmentID}</p>
                    )}
                    {equipmentItems.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                            {equipmentItems.map((item, i) => {
                                const eq = equipmentList.find(eq => eq._id === item);
                                return (
                                    <div key={i} className={`px-3 py-1 rounded-full flex items-center gap-1 ${darkMode ? 'bg-slate-700 text-slate-100' : 'bg-gray-100'}`}>
                                        <span>{eq ? `${eq.name} (${eq.equipmentID})` : item}</span>
                                        <button type="button" onClick={() => removeEquipment(i)} className={`${darkMode ? 'text-red-400' : 'text-red-500'}`}>x</button>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <div className="flex justify-end gap-2 mt-4">
                        <button type="button" onClick={() => navigate("/admin/boats")} className={`px-4 py-2 border rounded ${darkMode ? 'border-slate-600 bg-slate-700 text-slate-100' : 'border-gray-300'}`}>Cancel</button>
                        <button type="submit" disabled={isSubmitting} className={`px-4 py-2 rounded ${darkMode ? 'bg-cyan-700 text-white' : 'bg-blue-600 text-white'}`}>{isSubmitting ? "Saving..." : "Save Boat"}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
