// import mongoose from "mongoose"

// const equipmentSchema = new mongoose.Schema({
//     equipmentID:{
//         type : String,
//         required : true,
//         // unique : true
//     },
//     name : {
//         type : String,
//         required : true
//     },
//     type:{
//         type : String,
//         required : true,
//         enum : ["Navigation","Fishing Gear","Safety","Engine","Other"],
//         default : "Other"
//     },
//     serial:{
//         type : String,
//         unique : true,
//         required : true
//     },
//     status:{
//         type : String,
//         enum:["Available","In Use","Under Maintenance"],
//         default : "Available"
//     },
//     purchaseDate:{
//         type : Date
//     },
//     warrantyExpiry : {
//         type : Date
//     },
//     lastServiced : {
//         type : Date
//     },
//     notes:{
//         type : String,
//         required : true
//     },
//     boatNumber:{
//         type : String,
//         ref : "Boat",
//         required :false
//     }
// },
// {
//     timestamps : true
// })

// const Equipment = mongoose.model("Equipment",equipmentSchema)

// export default Equipment



import mongoose from "mongoose";

const equipmentSchema = new mongoose.Schema({
    equipmentID: {
        type: String,
        unique: true
        // not required, will be auto-generated
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
    // serial: {
    //     type: String,
    //     unique: true,
    //     required: true
    // },
    status: {
        type: String,
        enum: ["Available", "In Use", "Under Maintenance"],
        default: "Available"
    },
    purchaseDate: {
        type: Date
    },
    warrantyExpiry: {
        type: Date
    },
    lastServiced: {
        type: Date
    },
    notes: {
        type: String,
        required: true
    },
    boatNumber: {
        type: String,
        ref: "Boat",
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
        console.log("Generated EquipmentID:", this.equipmentID);
    }
    next();
});

const Equipment = mongoose.model("Equipment", equipmentSchema);

export default Equipment;
