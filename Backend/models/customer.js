import mongoose from "mongoose";

const customerSchema = new mongoose.Schema({
    email : {
        type : String,
        required : true,
        unique : true
    },
    firstName : {
        type : String,
        required : true
    },
    lastName : {
        type : String,
        required : true
    },
    role : {
        type : String,
        default : 'customer'
    },
    password : {
        type : String,
        required : [true, 'Password is required'],
        minlength : [8, 'Password must be at least 8 characters long']
    },
    address : {
        type : String,
        required : true
    },
    phone : {
        type : String,
        required : true,
    },
    isEmailVerified : {
        type : Boolean,
        required : true,
        default : false
    },
    createdAt : {
        type : Date,
        default : Date.now
    },
    isDisabled : {
        type : Boolean,
        required : true,
        default : false
    },
    lastLogin : {
        type : Date,
        default : Date.now
    }

});

const Customer = mongoose.model("Customer", customerSchema);

export default Customer;
