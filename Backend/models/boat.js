// import mongoose from "mongoose"

// const boatSchema = new mongoose.Schema({
//     boatNumber:{
//         type: String,
//         required: true,
//         unique: true
//     },
//     name:{
//         type: String,
//         required: true
//     },
//     capacity:{
//         type: Number,
//         required: true,
//         min:[1,"Capacity must be at least 1"]
//     },
//     status:{
//         type:String,
//         enum: ["active","inactive","maintenance","retired"],
//         default: "active"
//     },
//     images:{
//         type:[String],
//         required: true
//     },
//     equipmentID:[{
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "Equipment", 
//         required: true
//     }]
// })

// const Boat = mongoose.model("boat",boatSchema)

// export default Boat


import mongoose from "mongoose";

const boatSchema = new mongoose.Schema({
    boatNumber: {
        type: String,
        // required: true,
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
    equipmentID: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Equipment",
        required: true
    }]
});

// ✅ Pre-save hook to auto-generate boatNumber
boatSchema.pre("save", async function (next) {
  if (!this.boatNumber) {
    const count = await mongoose.model("boat").countDocuments();
    this.boatNumber = "DHANUSHKA-" + String(count + 1).padStart(3, "0");
  }
  next();
});


const Boat = mongoose.model("boat", boatSchema);
export default Boat;
