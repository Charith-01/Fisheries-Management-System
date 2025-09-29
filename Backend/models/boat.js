import mongoose from "mongoose";

const boatSchema = new mongoose.Schema({
    boatNumber: {
        type: String,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    capacity: {
        type: Number,
        required: true,
        min: [1, "Capacity must be at least 1"]
    },
    status: {
        type: String,
        enum: ["active", "inactive", "maintenance", "retired"],
        default: "active"
    },
    images: {
        type: [String],
        required: true
    },
    // Store equipment assignments with quantities
    equipmentAssignments: [{
        equipment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Equipment",
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1,
            default: 1
        },
        assignedAt: {
            type: Date,
            default: Date.now
        }
    }]
});

// Pre-save hook to auto-generate boatNumber
boatSchema.pre("save", async function (next) {
  if (!this.boatNumber) {
    const count = await mongoose.model("Boat").countDocuments();
    this.boatNumber = "DHANUSHKA-" + String(count + 1).padStart(3, "0");
  }
  next();
});

// Delete existing model if it exists to avoid conflicts
if (mongoose.models.Boat) {
  delete mongoose.models.Boat;
}

const Boat = mongoose.model("Boat", boatSchema);
export default Boat;