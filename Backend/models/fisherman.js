import mongoose from "mongoose";

const fishermanSchema = new mongoose.Schema({
    email : {
        type: String,
        required: true,
        unique: true
    },
    firstName : {
        type: String,
        required: true
    },
    lastName : {
        type: String,
        required: true
    },
    password : {
        type : String,
        required : [true, 'Password is required'],
        minlength : [8, 'Password must be at least 8 characters long']
    },
    address : {
        type: String,
        required: true
    },
    phone : {
        type: String,
        required: true,
    },
    role : {
        type: String,
        default: "fisherman"
    },
    licenseNumber : {
        type: String,
        required: true
    },
    boatNumber : {
        type: String,
        required: true
    },
    position : {
        type: String,
        required: true,
        default: "crew",
        enum: ["crew", "skipper"]
    },
    isEmailVerified : {
        type: Boolean,
        default: false
    },
    createdAt : {
        type: Date,
        default: Date.now
    },
    isDisabled : {
        type: Boolean,
        default: false
    }
});

const Fisherman = mongoose.model("Fisherman", fishermanSchema);

export default Fisherman;