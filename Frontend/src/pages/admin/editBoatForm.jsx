import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";
import meadiaUpload from "../../utils/meadiaUpload";
import { Ship, Plus, X, Upload, Save, Loader, Package } from "lucide-react";
import toast from "react-hot-toast";

export default function EditBoatForm({ darkMode }) {
    const { boatNumber } = useParams();
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploadingImages, setIsUploadingImages] = useState(false);
    const [errors, setErrors] = useState({});
    
    const [formData, setFormData] = useState({
        boatNumber: "",
        name: "",
        capacity: "",
        status: "active",
        images: []
    });

    // Equipment state
    const [equipmentAssignments, setEquipmentAssignments] = useState([]);
    const [availableEquipment, setAvailableEquipment] = useState([]);
    const [selectedEquipment, setSelectedEquipment] = useState("");

    // For preview purposes
    const [imageUrls, setImageUrls] = useState([]);
    const [imageFiles, setImageFiles] = useState([]);

    useEffect(() => {
        const fetchBoatDetails = async () => {
            try {
                // Fetch boat details with equipment assignments
                const boatResponse = await api.get(`/api/boat/${boatNumber}`);
                const boat = boatResponse.data.boat;
                
                setFormData({
                    boatNumber: boat.boatNumber,
                    name: boat.name,
                    capacity: boat.capacity,
                    status: boat.status,
                    images: boat.images || []
                });

                // Set equipment assignments
                if (boat.equipmentAssignments) {
                    setEquipmentAssignments(boat.equipmentAssignments.map(assignment => ({
                        equipmentId: assignment.equipment._id,
                        equipmentID: assignment.equipment.equipmentID,
                        equipmentName: assignment.equipment.name,
                        quantity: assignment.quantity,
                        availableQuantity: assignment.equipment.availableQuantity + assignment.quantity // Add back assigned quantity
                    })));
                }

                setImageUrls((boat.images || []).map(url =>
                    url.startsWith('http') ? url : `http://localhost:3000${url}`
                ));
                
                setIsLoading(false);
            } catch (error) {
                toast.error("Failed to fetch boat details");
                console.error("Error fetching boat details:", error);
                navigate("/admin/boats");
            }
        };

        const fetchAvailableEquipment = async () => {
            try {
                const response = await api.get("/api/equipment");
                setAvailableEquipment(response.data);
            } catch (error) {
                console.error("Error fetching equipment:", error);
                toast.error("Failed to load equipment list");
            }
        };

        fetchBoatDetails();
        fetchAvailableEquipment();
    }, [boatNumber, navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        
        if (errors[name]) {
            setErrors({ ...errors, [name]: null });
        }
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        
        if (files.length === 0) return;
        
        setImageFiles([...imageFiles, ...files]);
        const newImageUrls = files.map(file => URL.createObjectURL(file));
        setImageUrls([...imageUrls, ...newImageUrls]);
    };

    const removeImage = (index) => {
        const newImageUrls = [...imageUrls];
        newImageUrls.splice(index, 1);
        setImageUrls(newImageUrls);
        
        if (index >= formData.images.length) {
            const newImageFiles = [...imageFiles];
            newImageFiles.splice(index - formData.images.length, 1);
            setImageFiles(newImageFiles);
        } else {
            const newImages = [...formData.images];
            newImages.splice(index, 1);
            setFormData({ ...formData, images: newImages });
        }
    };

    const addEquipmentAssignment = () => {
        if (!selectedEquipment) return;
        
        const equipment = availableEquipment.find(eq => eq._id === selectedEquipment);
        if (!equipment) return;

        // Check if already assigned
        if (equipmentAssignments.find(a => a.equipmentId === equipment._id)) {
            toast.error("Equipment already assigned to this boat");
            return;
        }

        // Check availability
        if (equipment.availableQuantity <= 0) {
            toast.error("No available units of this equipment");
            return;
        }

        const newAssignment = {
            equipmentId: equipment._id,
            equipmentID: equipment.equipmentID,
            equipmentName: equipment.name,
            quantity: 1,
            availableQuantity: equipment.availableQuantity
        };

        setEquipmentAssignments([...equipmentAssignments, newAssignment]);
        setSelectedEquipment("");
    };

    const updateEquipmentQuantity = (index, newQuantity) => {
        const assignment = equipmentAssignments[index];
        
        if (newQuantity < 1) {
            toast.error("Quantity must be at least 1");
            return;
        }

        // Calculate total currently assigned (excluding this assignment)
        const otherAssignmentsQuantity = equipmentAssignments
            .filter((_, i) => i !== index)
            .reduce((sum, a) => sum + a.quantity, 0);

        const maxAvailable = assignment.availableQuantity + otherAssignmentsQuantity;

        if (newQuantity > maxAvailable) {
            toast.error(`Only ${maxAvailable} units available in total`);
            return;
        }

        const updatedAssignments = [...equipmentAssignments];
        updatedAssignments[index].quantity = newQuantity;
        setEquipmentAssignments(updatedAssignments);
    };

    const removeEquipmentAssignment = async (index) => {
        const assignment = equipmentAssignments[index];
        
        if (assignment.quantity > 0) {
            if (!window.confirm(`Remove ${assignment.quantity} ${assignment.equipmentName} from this boat?`)) {
                return;
            }
        }

        const newAssignments = [...equipmentAssignments];
        newAssignments.splice(index, 1);
        setEquipmentAssignments(newAssignments);
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.name.trim()) {
            newErrors.name = "Boat name is required";
        }
        if (!formData.capacity || formData.capacity < 1) {
            newErrors.capacity = "Capacity must be at least 1";
        }
        if (formData.images.length === 0 && imageFiles.length === 0) {
            newErrors.images = "At least one image is required";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            toast.error("Please fix the errors before submitting");
            return;
        }

        setIsSubmitting(true);

        try {
            let finalFormData = { ...formData };

            // Upload new images if any
            if (imageFiles.length > 0) {
                setIsUploadingImages(true);
                try {
                    const uploadedImageUrls = await Promise.all(imageFiles.map(f => meadiaUpload(f)));
                    finalFormData.images = [...formData.images, ...uploadedImageUrls];
                    setIsUploadingImages(false);
                } catch (uploadError) {
                    setIsUploadingImages(false);
                    console.error("Error uploading images:", uploadError);
                    toast.error("Failed to upload images");
                    setIsSubmitting(false);
                    return;
                }
            }

            // Update boat basic info first
            await api.put(`/api/boat/${boatNumber}`, finalFormData);

            // Handle equipment assignments
            // Get current assignments to compare
            const currentBoatResponse = await api.get(`/api/boat/${boatNumber}`);
            const currentAssignments = currentBoatResponse.data.boat.equipmentAssignments || [];

            // Remove all current equipment assignments
            for (const assignment of currentAssignments) {
                await api.post('/api/equipment/remove', {
                    boatNumber: boatNumber,
                    equipmentID: assignment.equipment.equipmentID,
                    quantity: assignment.quantity
                });
            }

            // Add new equipment assignments
            for (const assignment of equipmentAssignments) {
                await api.post('/api/equipment/assign', {
                    boatNumber: boatNumber,
                    equipmentID: assignment.equipmentID,
                    quantity: assignment.quantity
                });
            }

            toast.success("Boat updated successfully with equipment assignments");
            navigate("/admin/boats");
        } catch (error) {
            console.error("Error updating boat:", error);
            toast.error(error.response?.data?.message || "Failed to update boat");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Filter available equipment 
    const filteredAvailableEquipment = availableEquipment.filter(equipment => 
        !equipmentAssignments.find(a => a.equipmentId === equipment._id) && 
        equipment.availableQuantity > 0
    );

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${darkMode ? 'border-cyan-400' : 'border-blue-500'}`}></div>
            </div>
        );
    }

    return (
        <div className={`p-8 max-w-4xl w-full mx-auto rounded-xl shadow-lg ${darkMode ? 'bg-slate-900 text-slate-100' : 'bg-gray-50 text-gray-800'}`}>
            <div className="flex items-center mb-6">
                <Ship className={darkMode ? "text-cyan-400 mr-2" : "text-blue-600 mr-2"} size={28} />
                <h1 className={`text-3xl font-bold ${darkMode ? 'text-cyan-200' : 'text-gray-800'}`}>Edit Boat: {formData.name}</h1>
            </div>

            <form onSubmit={handleSubmit} className={`shadow-md rounded-lg p-8 ${darkMode ? 'bg-slate-800 text-slate-100' : 'bg-white text-gray-800'}`}>
                {/* Basic Information Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div>
                        <label className="block text-sm font-medium mb-1">Boat Number</label>
                        <input
                            type="text"
                            value={formData.boatNumber}
                            readOnly
                            className={`w-full px-4 py-2 border rounded-md ${darkMode ? 'border-slate-600 bg-slate-700 text-slate-100' : 'border-gray-300 bg-gray-100'}`}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Boat Name *</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className={`w-full px-4 py-2 border rounded-md ${errors.name ? 'border-red-500' : darkMode ? 'border-slate-600 bg-slate-700 text-slate-100' : 'border-gray-300'}`}
                        />
                        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Capacity *</label>
                        <input
                            type="number"
                            name="capacity"
                            value={formData.capacity}
                            onChange={handleChange}
                            min="1"
                            className={`w-full px-4 py-2 border rounded-md ${errors.capacity ? 'border-red-500' : darkMode ? 'border-slate-600 bg-slate-700 text-slate-100' : 'border-gray-300'}`}
                        />
                        {errors.capacity && <p className="mt-1 text-sm text-red-600">{errors.capacity}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Status</label>
                        <select
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            className={`w-full px-4 py-2 border rounded-md ${darkMode ? 'border-slate-600 bg-slate-700 text-slate-100' : 'border-gray-300'}`}
                        >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="maintenance">Maintenance</option>
                            <option value="retired">Retired</option>
                        </select>
                    </div>
                </div>

                {/* Images Section */}
                <div className="mb-8">
                    <label className="block text-sm font-medium mb-1">Boat Images *</label>
                    <div className={`border-2 border-dashed rounded-md p-6 ${errors.images ? 'border-red-500' : darkMode ? 'border-slate-600' : 'border-gray-300'}`}>
                        <Upload className={`mx-auto mb-2 ${darkMode ? 'text-cyan-400' : 'text-gray-400'}`} size={32} />
                        <p className="text-sm text-center text-gray-500 mb-2">Drag and drop images or click to select</p>
                        <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                            id="boat-images"
                        />
                        <label
                            htmlFor="boat-images"
                            className={`cursor-pointer block text-center py-2 px-4 rounded-md ${darkMode ? 'bg-cyan-700 hover:bg-cyan-800 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                        >
                            Add More Images
                        </label>
                    </div>
                    {errors.images && <p className="mt-1 text-sm text-red-600">{errors.images}</p>}

                    {imageUrls.length > 0 && (
                        <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                            {imageUrls.map((url, index) => (
                                <div key={index} className="relative group">
                                    <img
                                        src={url}
                                        alt={`Boat image ${index + 1}`}
                                        className="h-24 w-full object-cover rounded-md"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeImage(index)}
                                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Equipment Assignments Section */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className={`text-lg font-semibold flex items-center ${darkMode ? 'text-cyan-300' : 'text-blue-600'}`}>
                            <Package className="mr-2" size={20} />
                            Equipment Assignments
                        </h3>
                    </div>

                    {/* Add Equipment */}
                    <div className="flex gap-2 mb-4">
                        <select
                            value={selectedEquipment}
                            onChange={(e) => setSelectedEquipment(e.target.value)}
                            className={`flex-1 px-4 py-2 border rounded-md ${darkMode ? 'border-slate-600 bg-slate-700 text-slate-100' : 'border-gray-300'}`}
                        >
                            <option value="">Select equipment to add...</option>
                            {filteredAvailableEquipment.map(equipment => (
                                <option key={equipment._id} value={equipment._id}>
                                    {equipment.name} ({equipment.equipmentID}) - Available: {equipment.availableQuantity}
                                </option>
                            ))}
                        </select>
                        <button
                            type="button"
                            onClick={addEquipmentAssignment}
                            disabled={!selectedEquipment}
                            className={`px-4 py-2 rounded-md flex items-center gap-2 ${!selectedEquipment ? 'bg-gray-400 cursor-not-allowed' : darkMode ? 'bg-cyan-700 hover:bg-cyan-800' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
                        >
                            <Plus size={18} />
                            Add
                        </button>
                    </div>

                    {/* Equipment List */}
                    {equipmentAssignments.length > 0 ? (
                        <div className="space-y-3">
                            {equipmentAssignments.map((assignment, index) => (
                                <div key={assignment.equipmentId} className={`p-4 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600' : 'bg-gray-50 border-gray-200'}`}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="font-semibold">{assignment.equipmentName}</div>
                                            <div className="text-sm opacity-75">{assignment.equipmentID}</div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-2">
                                                <label className="text-sm">Quantity:</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max={assignment.availableQuantity + assignment.quantity}
                                                    value={assignment.quantity}
                                                    onChange={(e) => updateEquipmentQuantity(index, parseInt(e.target.value) || 1)}
                                                    className={`w-20 px-2 py-1 border rounded ${darkMode ? 'border-slate-600 bg-slate-800 text-slate-100' : 'border-gray-300'}`}
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeEquipmentAssignment(index)}
                                                className={`p-2 rounded-full ${darkMode ? 'text-red-400 hover:bg-red-900' : 'text-red-500 hover:bg-red-100'}`}
                                            >
                                                <X size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className={`text-center py-8 rounded-lg border-2 border-dashed ${darkMode ? 'border-slate-600 text-slate-400' : 'border-gray-300 text-gray-500'}`}>
                            <Package size={48} className="mx-auto mb-2 opacity-50" />
                            <p>No equipment assigned to this boat</p>
                        </div>
                    )}
                </div>

                {/* Form Buttons */}
                <div className="flex justify-end gap-4 pt-6 border-t">
                    <button
                        type="button"
                        onClick={() => navigate("/admin/boats")}
                        className={`px-6 py-2 border rounded-md ${darkMode ? 'border-slate-600 text-slate-200 hover:bg-slate-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting || isUploadingImages}
                        className={`flex items-center gap-2 px-6 py-2 rounded-md ${darkMode ? 'bg-cyan-700 hover:bg-cyan-800 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'} ${(isSubmitting || isUploadingImages) ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {isSubmitting || isUploadingImages ? (
                            <>
                                <Loader className="animate-spin" size={18} />
                                {isUploadingImages ? 'Uploading...' : 'Saving...'}
                            </>
                        ) : (
                            <>
                                <Save size={18} />
                                Update Boat
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}