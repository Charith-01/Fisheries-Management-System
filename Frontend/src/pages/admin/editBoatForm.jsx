import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";
import meadiaUpload from "../../utils/meadiaUpload";
import { Ship, Plus, X, Upload, Save, Loader } from "lucide-react";
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
        images: [],
        equipmentID: []
    });

    // For preview purposes
    const [imageUrls, setImageUrls] = useState([]);
    const [imageFiles, setImageFiles] = useState([]);
    const [equipmentItems, setEquipmentItems] = useState([]);
    const [equipmentInput, setEquipmentInput] = useState("");

    // Equipment lookup state
    const [equipmentList, setEquipmentList] = useState([]);
    const [equipmentMap, setEquipmentMap] = useState({});

    useEffect(() => {
        // Fetch all equipment for name lookup
        const fetchEquipment = async () => {
            try {
                const res = await api.get("/api/equipment");
                // Show all equipment in the dropdown
                setEquipmentList(res.data);
                // Map equipmentID to name
                const map = {};
                res.data.forEach(eq => {
                    map[eq.equipmentID] = eq.name;
                });
                setEquipmentMap(map);
            } catch (err) {
                setEquipmentList([]);
                setEquipmentMap({});
            }
        };
        fetchEquipment();
    }, [formData.boatNumber]);

    useEffect(() => {
        const fetchBoatDetails = async () => {
            try {
                const response = await api.get(`/api/boat/${boatNumber}`);
                const boat = response.data.boat;
                setFormData({
                    boatNumber: boat.boatNumber,
                    name: boat.name,
                    capacity: boat.capacity,
                    status: boat.status,
                    images: boat.images || [],
                    equipmentID: boat.equipmentID || []
                });
                setImageUrls((boat.images || []).map(url =>
                    url.startsWith('http') ? url : `http://localhost:3000${url}`
                ));
                setEquipmentItems(boat.equipmentID || []);
                setIsLoading(false);
            } catch (error) {
                toast.error("Failed to fetch boat details");
                console.error("Error fetching boat details:", error);
                navigate("/admin/boats");
            }
        };
        fetchBoatDetails();
    }, [boatNumber, navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        
        // Clear error for this field when user types
        if (errors[name]) {
            setErrors({ ...errors, [name]: null });
        }
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        
        if (files.length === 0) return;
        
        // Store the actual files for later upload
        setImageFiles([...imageFiles, ...files]);

        // Create temporary URLs for preview
        const newImageUrls = files.map(file => URL.createObjectURL(file));
        setImageUrls([...imageUrls, ...newImageUrls]);
        
        // The actual image URLs will be set during form submission
        // after the files are uploaded to the server
    };

    const removeImage = (index) => {
        // Remove from preview URLs
        const newImageUrls = [...imageUrls];
        newImageUrls.splice(index, 1);
        setImageUrls(newImageUrls);
        
        // If this was a newly added file
        if (index >= formData.images.length) {
            const newImageFiles = [...imageFiles];
            newImageFiles.splice(index - formData.images.length, 1);
            setImageFiles(newImageFiles);
        } 
        // If this was an already uploaded image
        else {
            const newImages = [...formData.images];
            newImages.splice(index, 1);
            setFormData({ ...formData, images: newImages });
        }
    };

    const addEquipment = () => {
        if (equipmentInput.trim() === "") return;
        
        // In a real app, you'd validate that this is a valid equipment ID
        const newEquipment = equipmentInput.trim();
        setEquipmentItems([...equipmentItems, newEquipment]);
        setFormData({
            ...formData,
            equipmentID: [...formData.equipmentID, newEquipment]
        });
        setEquipmentInput("");
    };

    const removeEquipment = (index) => {
        const newEquipmentItems = [...equipmentItems];
        newEquipmentItems.splice(index, 1);
        setEquipmentItems(newEquipmentItems);
        
        const newEquipmentIds = [...formData.equipmentID];
        newEquipmentIds.splice(index, 1);
        setFormData({ ...formData, equipmentID: newEquipmentIds });
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
        if (formData.equipmentID.length === 0) {
            newErrors.equipmentID = "At least one equipment is required";
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

            // Convert equipmentID to ObjectIds for backend
            finalFormData.equipmentID = formData.equipmentID.map(eqId => {
                // Try to find by equipmentID or _id
                const eq = equipmentList.find(e => e.equipmentID === eqId || e._id === eqId);
                return eq ? eq._id : eqId;
            });

            // First upload any new images if we have them
            if (imageFiles.length > 0) {
                setIsUploadingImages(true);
                try {
                    // Upload the images and get back URLs
                    const uploadedImageUrls = await Promise.all(imageFiles.map(f => meadiaUpload(f)));
                    // Add the new image URLs to the form data
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
            // Submit the form data to update the boat
            await api.put(`/api/boat/${boatNumber}`, finalFormData);

            toast.success("Boat updated successfully");
            navigate("/admin/boats");
        } catch (error) {
            console.error("Error updating boat:", error);
            toast.error(error.response?.data?.message || "Failed to update boat");
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
        <div className={`p-8 max-w-2xl w-full mx-auto rounded-xl shadow-lg ${darkMode ? 'bg-slate-900 text-slate-100' : 'bg-gray-50 text-gray-800'}`}>
            <div className="flex items-center mb-6">
                <Ship className={darkMode ? "text-cyan-400 mr-2" : "text-blue-600 mr-2"} size={28} />
                <h1 className={`text-3xl font-bold ${darkMode ? 'text-cyan-200' : 'text-gray-800'}`}>Edit Boat: {formData.name}</h1>
            </div>

            <form onSubmit={handleSubmit} className={`shadow-md rounded-lg p-8 ${darkMode ? 'bg-slate-800 text-slate-100' : 'bg-white text-gray-800'}`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Boat Number (Read-only) */}
                    <div>
                        <label htmlFor="boatNumber" className="block text-sm font-medium mb-1">
                            Boat Number
                        </label>
                        <input
                            type="text"
                            id="boatNumber"
                            name="boatNumber"
                            value={formData.boatNumber}
                            readOnly
                            className={`w-full px-4 py-2 border rounded-md ${darkMode ? 'border-slate-600 bg-slate-700 text-slate-100' : 'border-gray-300 bg-gray-100'}`}
                        />
                        <p className="mt-1 text-xs text-gray-500">Boat number cannot be changed</p>
                    </div>

                    {/* Boat Name */}
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium mb-1">
                            Boat Name *
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 ${errors.name ? 'border-red-500' : darkMode ? 'border-slate-600 bg-slate-700 text-slate-100 focus:ring-cyan-400' : 'border-gray-300 focus:ring-blue-500'}`}
                            placeholder="Enter boat name"
                        />
                        {errors.name && (
                            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                        )}
                    </div>

                    {/* Capacity */}
                    <div>
                        <label htmlFor="capacity" className="block text-sm font-medium mb-1">
                            Capacity (persons) *
                        </label>
                        <input
                            type="number"
                            id="capacity"
                            name="capacity"
                            value={formData.capacity}
                            onChange={handleChange}
                            min="1"
                            className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 ${errors.capacity ? 'border-red-500' : darkMode ? 'border-slate-600 bg-slate-700 text-slate-100 focus:ring-cyan-400' : 'border-gray-300 focus:ring-blue-500'}`}
                            placeholder="Enter capacity"
                        />
                        {errors.capacity && (
                            <p className="mt-1 text-sm text-red-600">{errors.capacity}</p>
                        )}
                    </div>

                    {/* Status */}
                    <div>
                        <label htmlFor="status" className="block text-sm font-medium mb-1">
                            Status
                        </label>
                        <select
                            id="status"
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 ${darkMode ? 'border-slate-600 bg-slate-700 text-slate-100 focus:ring-cyan-400' : 'border-gray-300 focus:ring-blue-500'}`}
                        >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="maintenance">Maintenance</option>
                            <option value="retired">Retired</option>
                        </select>
                    </div>
                </div>

                {/* Boat Images */}
                <div className="mt-6">
                    <label className="block text-sm font-medium mb-1">
                        Boat Images *
                    </label>
                    <div className={`border-2 border-dashed rounded-md p-6 flex flex-col items-center ${errors.images ? 'border-red-500' : darkMode ? 'border-slate-600' : 'border-gray-300'}`}>
                        <Upload className={darkMode ? 'text-cyan-400 mb-2' : 'text-gray-400 mb-2'} size={32} />
                        <p className="text-sm text-gray-500 mb-2">Drag and drop images or click to select</p>
                        <input
                            type="file"
                            id="images"
                            name="images"
                            accept="image/*"
                            onChange={handleImageChange}
                            multiple
                            className="hidden"
                        />
                        <label
                            htmlFor="images"
                            className={`cursor-pointer py-2 px-4 rounded-md transition-all ${darkMode ? 'bg-cyan-700 hover:bg-cyan-800 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                        >
                            Add More Images
                        </label>
                    </div>
                    {errors.images && (
                        <p className="mt-1 text-sm text-red-600">{errors.images}</p>
                    )}

                    {/* Image Preview */}
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

                {/* Equipment */}
                <div className="mt-6">
                    <label className="block text-sm font-medium mb-1">
                        Equipment *
                    </label>
                    <div className="flex items-center">
                        <select
                            value=""
                            onChange={e => {
                                const selectedId = e.target.value;
                                if (!selectedId || equipmentItems.includes(selectedId)) return;
                                setEquipmentItems([...equipmentItems, selectedId]);
                                setFormData({ ...formData, equipmentID: [...formData.equipmentID, selectedId] });
                            }}
                            className={`flex-grow px-4 py-2 border rounded-l-md focus:outline-none focus:ring-2 ${errors.equipmentID ? 'border-red-500' : darkMode ? 'border-slate-600 bg-slate-700 text-slate-100 focus:ring-cyan-400' : 'border-gray-300 focus:ring-blue-500'}`}
                        >
                            <option value="">Select Equipment</option>
                            {equipmentList.map(eq => (
                                <option key={eq.equipmentID} value={eq.equipmentID}>
                                    {eq.name} ({eq.equipmentID})
                                </option>
                            ))}
                        </select>
                    </div>
                    {errors.equipmentID && (
                        <p className="mt-1 text-sm text-red-600">{errors.equipmentID}</p>
                    )}

                    {/* Equipment List */}
                    {equipmentItems.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                            {equipmentItems.map((item, index) => {
                                // Try to find by _id or equipmentID in equipmentList
                                let eq = equipmentList.find(eq => eq.equipmentID === item || eq._id === item);
                                // If not found, fallback to equipmentMap (from all equipment fetched earlier)
                                let label = eq
                                    ? `${eq.name} (${eq.equipmentID})`
                                    : (equipmentMap[item] ? `${equipmentMap[item]} (${item})` : item);
                                return (
                                    <div key={index} className={`px-3 py-1 rounded-full flex items-center gap-1 ${darkMode ? 'bg-slate-700 text-slate-100' : 'bg-gray-100'}`}>
                                        <span className="text-sm">{label}</span>
                                        <button
                                            type="button"
                                            onClick={() => removeEquipment(index)}
                                            className={darkMode ? 'text-red-400 hover:text-red-600' : 'text-gray-500 hover:text-red-500'}
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Form Buttons */}
                <div className="mt-8 flex justify-end gap-4">
                    <button
                        type="button"
                        onClick={() => navigate("/admin/boats")}
                        className={`px-4 py-2 border rounded-md transition-all ${darkMode ? 'border-slate-600 bg-slate-700 text-slate-100 hover:bg-slate-600' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting || isUploadingImages}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${darkMode ? 'bg-cyan-700 hover:bg-cyan-800 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'} ${isSubmitting || isUploadingImages ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {isSubmitting || isUploadingImages ? (
                            <>
                                <Loader className="animate-spin" size={18} />
                                {isUploadingImages ? 'Uploading Images...' : 'Saving...'}
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