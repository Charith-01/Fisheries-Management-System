import mongoose  from "mongoose";

const adminSchema = new mongoose.Schema({
    email : {
        type: String,
        required: true,
        unique: true
    },
    password : {
        type: String,
        required: true
    },
    role : {
        type: String,
        default: "admin"
    },
    createdAt : {
        type: Date,
        default: Date.now
    },
    isEmailVerified : {
        type: Boolean,
        default: false
    }
});

const Admin = mongoose.model("Admin", adminSchema);

export default Admin;
