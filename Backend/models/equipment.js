import mongoose from "mongoose"

const equipmentSchema = new mongoose.Schema({
    equipmentID:{
        type : String,
        required : true,
        unique : true
    },
    name : {
        type : String,
        required : true
    },
    type:{
        type : String,
        required : true,
        enum : ["Navigation","Fishing Gear","Safety","Engine","Other"],
        default : "Other"
    },
    serial:{
        type : String,
        unique : true,
        required : true
    },
    status:{
        type : String,
        enum:["Available","In Use","Under Maintenance"],
        default : "Available"
    },
    purchaseDate:{
        type : Date
    },
    warrantyExpiry : {
        type : Date
    },
    lastServiced : {
        type : Date
    },
    notes:{
        type : String,
        required : true
    },
    boatNumber:{
        type : String,
        ref : "Boat",
        required :false
    }
},
{
    timestamps : true
})

const Equipment = mongoose.model("Equipment",equipmentSchema)

export default Equipment