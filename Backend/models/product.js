import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    productId : {
        type : String,
        required : true,
        unique : true
    },
    name : {
        type : String,
        required : true
    },
    altNames : {
        type : [String],
        default : []
    },
    category : {
        type : String,
        required : true,
        default : "fish",
        enum : ["fish", "crab", "shellfish", "prawn", "lobster", "squid", "other"]
    },
    unit : {
        type : String,
        required : true,
        default : "kg",
        enum : ["kg", "g", "lbs", "pieces"]
    },
    price : {
        type : Number,
        required : true
    },
    labeledPrice : {
        type : Number,
        required : true
    },
    description : {
        type : String,
        default : ""
    },
    images : {
        type : [String],
        required : true,
        default : ["https://www.shoshinsha-design.com/wp-content/uploads/2020/05/noimage.png"]
    },
    stock : {
        type : Number,
        required : true,
        default : 0
    },
    createdAt : {
        type : Date,
        default : Date.now
    },
    isActive : {
        type : Boolean,
        default : true
    }
});

const Product = mongoose.model("Product", productSchema);

export default Product;