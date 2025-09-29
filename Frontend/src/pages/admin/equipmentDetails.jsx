// import { useState, useEffect } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import api from "../../api/axios";
// import { ArrowLeft, Edit, Trash2, Calendar, Clock, Package } from "lucide-react";
// import toast from "react-hot-toast";

// export default function EquipmentDetails({ darkMode }) {
//   const { equipmentID } = useParams();
//   const navigate = useNavigate();
//   const [equipment, setEquipment] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     const fetchEquipment = async () => {
//       try {
//         const response = await api.get(`/api/equipment/${equipmentID}`);
//         setEquipment(response.data.equipment);
//         setLoading(false);
//       } catch (err) {
//         setError("Failed to fetch equipment details");
//         setLoading(false);
//         toast.error("Failed to load equipment details");
//       }
//     };
//     fetchEquipment();
//   }, [equipmentID]);

//   const handleDelete = async () => {
//     if (window.confirm("Are you sure you want to delete this equipment?")) {
//       try {
//         await api.delete(`/api/equipment/${equipment.equipmentID}`);
//         toast.success("Equipment deleted successfully");
//         navigate("/admin/equipment");
//       } catch (error) {
//         toast.error("Failed to delete equipment");
//       }
//     }
//   };

//   if (loading) {
//     return (
//       <div className="flex justify-center items-center min-h-[70vh]">
//         <div className="relative h-14 w-14">
//           <div
//             className={`absolute inset-0 rounded-full border-4 border-t-transparent animate-spin ${
//               darkMode ? "border-cyan-400" : "border-blue-500"
//             }`}
//           />
//         </div>
//       </div>
//     );
//   }

//   if (error || !equipment) {
//     return (
//       <div className="flex justify-center items-center min-h-[60vh]">
//         <div
//           className={`rounded-xl shadow-lg p-8 flex flex-col items-center max-w-md w-full ${
//             darkMode
//               ? "bg-red-950/80 border border-red-700"
//               : "bg-red-50 border border-red-200"
//           }`}
//         >
//           <h3
//             className={`text-lg font-semibold mt-4 ${
//               darkMode ? "text-red-200" : "text-red-800"
//             }`}
//           >
//             Error
//           </h3>
//           <p
//             className={`mt-2 text-center ${
//               darkMode ? "text-red-100" : "text-red-700"
//             }`}
//           >
//             {error || "Failed to load equipment details"}
//           </p>
//           <button
//             type="button"
//             onClick={() => navigate("/admin/equipment")}
//             className={`mt-6 px-5 py-2 rounded-lg font-medium shadow transition-all ${
//               darkMode
//                 ? "bg-red-800 hover:bg-red-700 text-white"
//                 : "bg-red-500 hover:bg-red-600 text-white"
//             }`}
//           >
//             Go back to equipment
//           </button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div
//       className={`min-h-screen flex flex-col items-center justify-center py-10 px-2 ${
//         darkMode
//           ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
//           : "bg-gradient-to-br from-blue-50 via-cyan-50 to-white"
//       }`}
//     >
//       <div
//         className={`w-full max-w-3xl rounded-3xl shadow-2xl border transition-all relative ${
//           darkMode
//             ? "bg-slate-900 border-slate-700 text-slate-100"
//             : "bg-white border-gray-200 text-gray-900"
//         }`}
//       >
//         {/* Top actions (Back + Edit + Delete) */}
//         <div className="flex justify-between items-center p-6 border-b dark:border-slate-700 border-gray-200">
//           <button
//             onClick={() => navigate("/admin/equipment")}
//             className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all shadow-sm ${
//               darkMode
//                 ? "bg-slate-800 hover:bg-slate-700 text-cyan-300"
//                 : "bg-blue-50 hover:bg-blue-100 text-blue-700"
//             }`}
//           >
//             <ArrowLeft size={18} /> Back
//           </button>

//           <div className="flex gap-2">
//             <button
//               onClick={() =>
//                 navigate(`/admin/equipment/editEquipment/${equipment.equipmentID}`)
//               }
//               className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all shadow-sm ${
//                 darkMode
//                   ? "bg-cyan-700 hover:bg-cyan-800 text-white"
//                   : "bg-blue-600 hover:bg-blue-700 text-white"
//               }`}
//             >
//               <Edit size={16} /> Edit
//             </button>
//             <button
//               onClick={handleDelete}
//               className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all shadow-sm ${
//                 darkMode
//                   ? "bg-red-800 hover:bg-red-700 text-white"
//                   : "bg-red-500 hover:bg-red-600 text-white"
//               }`}
//             >
//               <Trash2 size={16} /> Delete
//             </button>
//           </div>
//         </div>

//         {/* Content */}
//         <div className="p-8 flex flex-col gap-6">
//           <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
//             <h1
//               className={`text-3xl font-extrabold tracking-tight ${
//                 darkMode ? "text-cyan-200" : "text-blue-900"
//               }`}
//             >
//               {equipment.name}
//             </h1>
//             <div className="flex gap-2">
//               <span
//                 className={`px-4 py-1 rounded-full text-base font-bold capitalize shadow-sm border
//                     ${
//                       equipment.availableQuantity === 0
//                         ? darkMode
//                           ? "bg-red-900 text-red-200 border-red-700"
//                           : "bg-red-100 text-red-800 border-red-200"
//                         : equipment.availableQuantity < equipment.totalQuantity
//                         ? darkMode
//                           ? "bg-yellow-900 text-yellow-200 border-yellow-700"
//                           : "bg-yellow-100 text-yellow-800 border-yellow-200"
//                         : darkMode
//                         ? "bg-green-900 text-green-200 border-green-700"
//                         : "bg-green-100 text-green-800 border-green-200"
//                     }`}
//               >
//                 {equipment.availableQuantity} / {equipment.totalQuantity} Available
//               </span>
//             </div>
//           </div>
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//             <DetailItem
//               label="Equipment ID"
//               value={equipment.equipmentID}
//               darkMode={darkMode}
//               icon={<Package size={18} />}
//             />
//             <DetailItem label="Type" value={equipment.type} darkMode={darkMode} />
//             <DetailItem 
//               label="Total Quantity" 
//               value={equipment.totalQuantity} 
//               darkMode={darkMode} 
//             />
//             <DetailItem 
//               label="Available Quantity" 
//               value={equipment.availableQuantity} 
//               darkMode={darkMode} 
//             />
//             {/* {equipment.requiresMaintenance && (
//               <>
//                 <DetailItem
//                   label="Maintenance Interval"
//                   value={`${equipment.maintenanceInterval} days`}
//                   darkMode={darkMode}
//                   icon={<Clock size={18} />}
//                 />
//                 {equipment.lastMaintenanceDate && (
//                   <DetailItem
//                     label="Last Maintenance"
//                     value={new Date(equipment.lastMaintenanceDate).toLocaleDateString()}
//                     darkMode={darkMode}
//                     icon={<Calendar size={18} />}
//                   />
//                 )}
//               </>
//             )} */}
//             // In EquipmentDetails.jsx, update the maintenance section:
//             {equipment.requiresMaintenance && (
//                 <>
//                     <DetailItem
//                         label="Maintenance Interval"
//                         value={`${equipment.maintenanceInterval} days`}
//                         darkMode={darkMode}
//                         icon={<Calendar size={18} />}
//                     />
//                     <DetailItem
//                         label="Next Maintenance"
//                         value={
//                             equipment.nextMaintenanceDate 
//                                 ? new Date(equipment.nextMaintenanceDate).toLocaleDateString()
//                                 : "Not scheduled"
//                         }
//                         darkMode={darkMode}
//                         icon={<Calendar size={18} />}
//                     />
//                     {equipment.nextMaintenanceDate && (
//                         <div className="md:col-span-2">
//                             <div className={`p-4 rounded-lg border ${
//                                 new Date(equipment.nextMaintenanceDate) < new Date() 
//                                     ? (darkMode ? 'bg-red-900/20 border-red-700' : 'bg-red-50 border-red-200')
//                                     : new Date(equipment.nextMaintenanceDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
//                                     ? (darkMode ? 'bg-yellow-900/20 border-yellow-700' : 'bg-yellow-50 border-yellow-200')
//                                     : (darkMode ? 'bg-green-900/20 border-green-700' : 'bg-green-50 border-green-200')
//                             }`}>
//                                 <div className="flex items-center justify-between">
//                                     <span className={`font-medium ${
//                                         darkMode ? 'text-slate-200' : 'text-gray-800'
//                                     }`}>
//                                         Maintenance Status:
//                                     </span>
//                                     <span className={`px-3 py-1 rounded-full text-sm font-bold ${
//                                         new Date(equipment.nextMaintenanceDate) < new Date() 
//                                             ? (darkMode ? 'bg-red-700 text-red-100' : 'bg-red-500 text-white')
//                                             : new Date(equipment.nextMaintenanceDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
//                                             ? (darkMode ? 'bg-yellow-700 text-yellow-100' : 'bg-yellow-500 text-white')
//                                             : (darkMode ? 'bg-green-700 text-green-100' : 'bg-green-500 text-white')
//                                     }`}>
//                                         {new Date(equipment.nextMaintenanceDate) < new Date() 
//                                             ? 'OVERDUE'
//                                             : new Date(equipment.nextMaintenanceDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
//                                             ? 'DUE SOON'
//                                             : 'SCHEDULED'
//                                         }
//                                     </span>
//                                 </div>
//                             </div>
//                         </div>
//                     )}
//                 </>
//             )}
//             <DetailItem
//               label="Description"
//               value={equipment.description || "No description"}
//               darkMode={darkMode}
//               multiline
//             />
//             <DetailItem
//               label="Notes"
//               value={equipment.notes || "No notes"}
//               darkMode={darkMode}
//               multiline
//             />
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// function DetailItem({ label, value, darkMode, icon, multiline }) {
//   return (
//     <div
//       className={`flex items-start gap-3 p-4 rounded-xl shadow-sm border transition-all ${
//         darkMode
//           ? "bg-slate-800 border-slate-700"
//           : "bg-gray-50 border-gray-200"
//       }`}
//     >
//       {icon && <span className="mt-1">{icon}</span>}
//       <div>
//         <div
//           className={`text-xs font-semibold uppercase tracking-wider mb-1 ${
//             darkMode ? "text-cyan-400" : "text-blue-600"
//           }`}
//         >
//           {label}
//         </div>
//         <div
//           className={`text-base ${multiline ? "whitespace-pre-line" : ""} ${
//             darkMode ? "text-slate-100" : "text-gray-900"
//           }`}
//         >
//           {value}
//         </div>
//       </div>
//     </div>
//   );
// }


import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { ArrowLeft, Edit, Trash2, Calendar, Clock, Package, AlertTriangle, CheckCircle } from "lucide-react";
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
        console.log("Equipment details response:", response.data); // Debug log
        setEquipment(response.data.equipment);
        setLoading(false);
      } catch (err) {
        setError("Failed to fetch equipment details");
        setLoading(false);
        toast.error("Failed to load equipment details");
        console.error("Error fetching equipment:", err);
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

  const getMaintenanceStatus = () => {
    if (!equipment.nextMaintenanceDate) return null;
    
    const nextDate = new Date(equipment.nextMaintenanceDate);
    const today = new Date();
    const oneWeekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    if (nextDate < today) {
      return { status: 'OVERDUE', color: 'red', icon: AlertTriangle };
    } else if (nextDate <= oneWeekFromNow) {
      return { status: 'DUE SOON', color: 'yellow', icon: AlertTriangle };
    } else {
      return { status: 'SCHEDULED', color: 'green', icon: CheckCircle };
    }
  };

  const maintenanceStatus = equipment ? getMaintenanceStatus() : null;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <div className="relative h-14 w-14">
          <div
            className={`absolute inset-0 rounded-full border-4 border-t-transparent animate-spin ${
              darkMode ? "border-cyan-400" : "border-blue-500"
            }`}
          />
        </div>
      </div>
    );
  }

  if (error || !equipment) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div
          className={`rounded-xl shadow-lg p-8 flex flex-col items-center max-w-md w-full ${
            darkMode
              ? "bg-red-950/80 border border-red-700"
              : "bg-red-50 border border-red-200"
          }`}
        >
          <h3
            className={`text-lg font-semibold mt-4 ${
              darkMode ? "text-red-200" : "text-red-800"
            }`}
          >
            Error
          </h3>
          <p
            className={`mt-2 text-center ${
              darkMode ? "text-red-100" : "text-red-700"
            }`}
          >
            {error || "Failed to load equipment details"}
          </p>
          <button
            type="button"
            onClick={() => navigate("/admin/equipment")}
            className={`mt-6 px-5 py-2 rounded-lg font-medium shadow transition-all ${
              darkMode
                ? "bg-red-800 hover:bg-red-700 text-white"
                : "bg-red-500 hover:bg-red-600 text-white"
            }`}
          >
            Go back to equipment
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-center py-10 px-2 ${
        darkMode
          ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
          : "bg-gradient-to-br from-blue-50 via-cyan-50 to-white"
      }`}
    >
      <div
        className={`w-full max-w-4xl rounded-3xl shadow-2xl border transition-all relative ${
          darkMode
            ? "bg-slate-900 border-slate-700 text-slate-100"
            : "bg-white border-gray-200 text-gray-900"
        }`}
      >
        {/* Top actions (Back + Edit + Delete) */}
        <div className="flex justify-between items-center p-6 border-b dark:border-slate-700 border-gray-200">
          <button
            onClick={() => navigate("/admin/equipment")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all shadow-sm ${
              darkMode
                ? "bg-slate-800 hover:bg-slate-700 text-cyan-300"
                : "bg-blue-50 hover:bg-blue-100 text-blue-700"
            }`}
          >
            <ArrowLeft size={18} /> Back
          </button>

          <div className="flex gap-2">
            <button
              onClick={() =>
                navigate(`/admin/equipment/editEquipment/${equipment.equipmentID}`)
              }
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all shadow-sm ${
                darkMode
                  ? "bg-cyan-700 hover:bg-cyan-800 text-white"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              <Edit size={16} /> Edit
            </button>
            <button
              onClick={handleDelete}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all shadow-sm ${
                darkMode
                  ? "bg-red-800 hover:bg-red-700 text-white"
                  : "bg-red-500 hover:bg-red-600 text-white"
              }`}
            >
              <Trash2 size={16} /> Delete
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1
                className={`text-3xl font-extrabold tracking-tight ${
                  darkMode ? "text-cyan-200" : "text-blue-900"
                }`}
              >
                {equipment.name}
              </h1>
              <p className={`mt-2 ${darkMode ? "text-slate-400" : "text-gray-600"}`}>
                {equipment.type} • {equipment.equipmentID}
              </p>
            </div>
            
            {/* Quantity Status */}
            <div className="flex gap-4">
              <div className={`text-center p-3 rounded-lg ${
                darkMode ? "bg-slate-800" : "bg-gray-100"
              }`}>
                <div className={`text-sm ${darkMode ? "text-slate-400" : "text-gray-600"}`}>Total</div>
                <div className="text-xl font-bold">{equipment.totalQuantity}</div>
              </div>
              <div className={`text-center p-3 rounded-lg ${
                equipment.availableQuantity === 0 
                  ? (darkMode ? "bg-red-900/20" : "bg-red-50")
                  : equipment.availableQuantity < equipment.totalQuantity
                  ? (darkMode ? "bg-yellow-900/20" : "bg-yellow-50")
                  : (darkMode ? "bg-green-900/20" : "bg-green-50")
              }`}>
                <div className={`text-sm ${
                  darkMode ? "text-slate-400" : "text-gray-600"
                }`}>Available</div>
                <div className={`text-xl font-bold ${
                  equipment.availableQuantity === 0 
                    ? (darkMode ? "text-red-300" : "text-red-600")
                    : equipment.availableQuantity < equipment.totalQuantity
                    ? (darkMode ? "text-yellow-300" : "text-yellow-600")
                    : (darkMode ? "text-green-300" : "text-green-600")
                }`}>
                  {equipment.availableQuantity}
                </div>
              </div>
            </div>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <DetailItem
              label="Equipment ID"
              value={equipment.equipmentID}
              darkMode={darkMode}
              icon={<Package size={18} />}
            />
            <DetailItem 
              label="Type" 
              value={equipment.type} 
              darkMode={darkMode} 
            />
            <DetailItem 
              label="Total Quantity" 
              value={equipment.totalQuantity} 
              darkMode={darkMode} 
            />
            <DetailItem 
              label="Available Quantity" 
              value={equipment.availableQuantity} 
              darkMode={darkMode} 
            />
            
            {/* Description */}
            <div className="md:col-span-2">
              <DetailItem
                label="Description"
                value={equipment.description || "No description provided"}
                darkMode={darkMode}
                multiline
              />
            </div>

            {/* Maintenance Information */}
            {equipment.requiresMaintenance && (
              <>
                <DetailItem
                  label="Maintenance Interval"
                  value={`${equipment.maintenanceInterval} days`}
                  darkMode={darkMode}
                  icon={<Calendar size={18} />}
                />
                <DetailItem
                  label="Next Maintenance"
                  value={
                    equipment.nextMaintenanceDate 
                      ? new Date(equipment.nextMaintenanceDate).toLocaleDateString()
                      : "Not scheduled"
                  }
                  darkMode={darkMode}
                  icon={<Clock size={18} />}
                />
                
                {/* Maintenance Status */}
                {maintenanceStatus && (
                  <div className="md:col-span-2">
                    <div className={`p-4 rounded-xl border-2 ${
                      maintenanceStatus.color === 'red' 
                        ? (darkMode ? 'bg-red-900/20 border-red-700' : 'bg-red-50 border-red-200')
                        : maintenanceStatus.color === 'yellow'
                        ? (darkMode ? 'bg-yellow-900/20 border-yellow-700' : 'bg-yellow-50 border-yellow-200')
                        : (darkMode ? 'bg-green-900/20 border-green-700' : 'bg-green-50 border-green-200')
                    }`}>
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-full ${
                          maintenanceStatus.color === 'red' 
                            ? (darkMode ? 'bg-red-700' : 'bg-red-500')
                            : maintenanceStatus.color === 'yellow'
                            ? (darkMode ? 'bg-yellow-700' : 'bg-yellow-500')
                            : (darkMode ? 'bg-green-700' : 'bg-green-500')
                        }`}>
                          <maintenanceStatus.icon 
                            size={24} 
                            className="text-white" 
                          />
                        </div>
                        <div className="flex-1">
                          <h3 className={`text-lg font-semibold ${
                            darkMode ? 'text-slate-200' : 'text-gray-800'
                          }`}>
                            Maintenance Status
                          </h3>
                          <p className={`mt-1 ${
                            darkMode ? 'text-slate-400' : 'text-gray-600'
                          }`}>
                            Next maintenance scheduled for {new Date(equipment.nextMaintenanceDate).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`px-4 py-2 rounded-full text-sm font-bold ${
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
              </>
            )}

            {/* Notes */}
            <div className="md:col-span-2">
              <DetailItem
                label="Notes"
                value={equipment.notes || "No additional notes"}
                darkMode={darkMode}
                multiline
              />
            </div>

            {/* Timestamps */}
            {equipment.createdAt && (
              <DetailItem
                label="Created Date"
                value={new Date(equipment.createdAt).toLocaleDateString()}
                darkMode={darkMode}
                icon={<Calendar size={18} />}
              />
            )}
            {equipment.updatedAt && equipment.updatedAt !== equipment.createdAt && (
              <DetailItem
                label="Last Updated"
                value={new Date(equipment.updatedAt).toLocaleDateString()}
                darkMode={darkMode}
                icon={<Clock size={18} />}
              />
            )}
          </div>

          {/* Equipment Usage Info */}
          {equipment.availableQuantity < equipment.totalQuantity && (
            <div className="mt-8 p-4 rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-700">
              <div className="flex items-center gap-3">
                <Package className="text-blue-600 dark:text-blue-400" size={20} />
                <div>
                  <h4 className="font-semibold text-blue-800 dark:text-blue-300">
                    Equipment in Use
                  </h4>
                  <p className="text-blue-700 dark:text-blue-400 text-sm">
                    {equipment.totalQuantity - equipment.availableQuantity} out of {equipment.totalQuantity} units are currently assigned to boats
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* No Maintenance Warning */}
          {!equipment.requiresMaintenance && (
            <div className="mt-8 p-4 rounded-lg border border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-700">
              <div className="flex items-center gap-3">
                <AlertTriangle className="text-yellow-600 dark:text-yellow-400" size={20} />
                <div>
                  <h4 className="font-semibold text-yellow-800 dark:text-yellow-300">
                    No Maintenance Schedule
                  </h4>
                  <p className="text-yellow-700 dark:text-yellow-400 text-sm">
                    This equipment is not scheduled for regular maintenance. Consider enabling maintenance tracking for better equipment management.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// DetailItem Component
function DetailItem({ label, value, darkMode, icon, multiline }) {
  return (
    <div
      className={`flex items-start gap-4 p-4 rounded-xl shadow-sm border transition-all ${
        darkMode
          ? "bg-slate-800 border-slate-700 hover:bg-slate-750"
          : "bg-gray-50 border-gray-200 hover:bg-gray-100"
      }`}
    >
      {icon && (
        <div className={`p-2 rounded-lg ${
          darkMode ? "bg-slate-700 text-cyan-400" : "bg-blue-100 text-blue-600"
        }`}>
          {icon}
        </div>
      )}
      <div className="flex-1">
        <div
          className={`text-xs font-semibold uppercase tracking-wider mb-2 ${
            darkMode ? "text-cyan-400" : "text-blue-600"
          }`}
        >
          {label}
        </div>
        <div
          className={`text-base ${multiline ? "whitespace-pre-line" : ""} ${
            darkMode ? "text-slate-100" : "text-gray-900"
          }`}
        >
          {value}
        </div>
      </div>
    </div>
  );
}