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
    const [equipmentList, setEquipmentList] = useState([]);
    const [equipmentAssignments, setEquipmentAssignments] = useState([]);
    const [formData, setFormData] = useState({
        name: "",
        capacity: "",
        status: "active",
        images: [],
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        const fetchEquipment = async () => {
            try {
                const res = await api.get("/api/equipment");
                setEquipmentList(res.data);
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

    const addEquipmentAssignment = (e) => {
        const selectedEquipmentId = e.target.value;
        if (!selectedEquipmentId) return;
        
        const selectedEquipment = equipmentList.find(eq => eq._id === selectedEquipmentId);
        if (!selectedEquipment) return;

        // Check if already added
        if (equipmentAssignments.find(a => a.equipmentId === selectedEquipmentId)) {
            toast.error("Equipment already added");
            return;
        }

        setEquipmentAssignments([
            ...equipmentAssignments,
            {
                equipmentId: selectedEquipmentId,
                equipmentName: selectedEquipment.name,
                equipmentID: selectedEquipment.equipmentID,
                availableQuantity: selectedEquipment.availableQuantity,
                quantity: 1
            }
        ]);
    };

    const updateEquipmentQuantity = (index, newQuantity) => {
        const updatedAssignments = [...equipmentAssignments];
        if (newQuantity <= updatedAssignments[index].availableQuantity && newQuantity > 0) {
            updatedAssignments[index].quantity = newQuantity;
            setEquipmentAssignments(updatedAssignments);
        }
    };

    const removeEquipmentAssignment = (index) => {
        const newAssignments = [...equipmentAssignments];
        newAssignments.splice(index, 1);
        setEquipmentAssignments(newAssignments);
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = "Boat name is required";
        if (!formData.capacity || formData.capacity < 1) newErrors.capacity = "Capacity must be at least 1";
        if (!imageFiles.length) newErrors.images = "At least one image is required";
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
            
            // Create boat first
            const boatPayload = {
                ...formData,
                images: uploadedUrls,
            };

            const token = localStorage.getItem("token");
            const boatResponse = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/boat`,
                boatPayload,
                {
                    headers: {
                        Authorization: "Bearer " + token,
                    },
                }
            );

            const boat = boatResponse.data.boat;

            // Assign equipment to the boat
            for (const assignment of equipmentAssignments) {
                await axios.post(
                    `${import.meta.env.VITE_BACKEND_URL}/api/equipment/assign`,
                    {
                        boatNumber: boat.boatNumber,
                        equipmentID: assignment.equipmentID,
                        quantity: assignment.quantity
                    },
                    {
                        headers: {
                            Authorization: "Bearer " + token,
                        },
                    }
                );
            }

            toast.success("Boat added successfully with equipment assignments");
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

                    {/* Equipment Assignments */}
                    <div>
                        <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>Equipment Assignments</label>
                        <select
                            onChange={addEquipmentAssignment}
                            className={`w-full px-3 py-2 border rounded ${darkMode ? 'border-slate-600 bg-slate-700 text-slate-100' : 'border-gray-300'}`}
                        >
                            <option value="">Select Equipment to Add</option>
                            {equipmentList
                                .filter(eq => eq.availableQuantity > 0)
                                .map(eq => (
                                <option key={eq._id} value={eq._id}>
                                    {eq.name} ({eq.equipmentID}) - Available: {eq.availableQuantity}
                                </option>
                            ))}
                        </select>
                        
                        {equipmentAssignments.length > 0 && (
                            <div className="mt-3 space-y-2">
                                {equipmentAssignments.map((assignment, index) => (
                                    <div key={index} className={`flex items-center justify-between p-3 rounded ${darkMode ? 'bg-slate-700' : 'bg-gray-100'}`}>
                                        <div>
                                            <div className="font-medium">{assignment.equipmentName}</div>
                                            <div className="text-sm opacity-75">{assignment.equipmentID}</div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                min="1"
                                                max={assignment.availableQuantity}
                                                value={assignment.quantity}
                                                onChange={(e) => updateEquipmentQuantity(index, parseInt(e.target.value))}
                                                className={`w-20 px-2 py-1 border rounded ${darkMode ? 'border-slate-600 bg-slate-800 text-slate-100' : 'border-gray-300'}`}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeEquipmentAssignment(index)}
                                                className={`p-1 rounded ${darkMode ? 'text-red-400 hover:text-red-600' : 'text-red-500 hover:text-red-700'}`}
                                            >
                                                ×
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-2 mt-4">
                        <button type="button" onClick={() => navigate("/admin/boats")} className={`px-4 py-2 border rounded ${darkMode ? 'border-slate-600 bg-slate-700 text-slate-100' : 'border-gray-300'}`}>Cancel</button>
                        <button type="submit" disabled={isSubmitting} className={`px-4 py-2 rounded ${darkMode ? 'bg-cyan-700 text-white' : 'bg-blue-600 text-white'}`}>
                            {isSubmitting ? "Saving..." : "Save Boat"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}