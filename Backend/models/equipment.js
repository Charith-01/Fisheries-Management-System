import mongoose from "mongoose";

const equipmentSchema = new mongoose.Schema({
    equipmentID: {
        type: String,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: ["Navigation", "Fishing Gear", "Safety", "Engine", "Other"],
        default: "Other"
    },
    description: {
        type: String,
        required: false
    },
    totalQuantity: {
        type: Number,
        required: true,
        default: 1,
        min: 0
    },
    availableQuantity: {
        type: Number,
        required: true,
        default: 1,
        min: 0
    },
    // Maintenance fields
    requiresMaintenance: {
        type: Boolean,
        default: false
    },
    maintenanceInterval: {
        type: Number, // in days
        required: false
    },
    nextMaintenanceDate: {
        type: Date,
        required: false
    },
    notes: {
        type: String,
        required: false
    }
}, {
    timestamps: true
});

// Auto-generate Equipment ID like "EQ-001"
equipmentSchema.pre("save", async function (next) {
    if (!this.equipmentID) {
        const count = await mongoose.model("Equipment").countDocuments();
        this.equipmentID = "EQ-" + String(count + 1).padStart(3, "0");
    }
    
    // Set next maintenance date if maintenance is required and interval is provided
    if (this.requiresMaintenance && this.maintenanceInterval && !this.nextMaintenanceDate) {
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + this.maintenanceInterval);
        this.nextMaintenanceDate = nextDate;
    }
    
    // If maintenance interval changes, update next maintenance date
    if (this.isModified('maintenanceInterval') && this.requiresMaintenance && this.maintenanceInterval) {
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + this.maintenanceInterval);
        this.nextMaintenanceDate = nextDate;
    }
    
    next();
});

// Delete existing model if it exists to avoid conflicts
if (mongoose.models.Equipment) {
  delete mongoose.models.Equipment;
}

const Equipment = mongoose.model("Equipment", equipmentSchema);
export default Equipment;