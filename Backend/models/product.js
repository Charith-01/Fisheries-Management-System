import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  productId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  altNames: {
    type: [String],
    default: []
  },
  price: {
    type: Number,
    required: true
  },
  labeledPrice: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    default: ""
  },
  images: {
    type: [String],
    required: true,
    default: ["https://www.shoshinsha-design.com/wp-content/uploads/2020/05/noimage.png"]
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },

  // ⭐ Review-related fields
  reviews: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Review"
    }
  ],
  averageRating: {
    type: Number,
    default: 0
  },
  reviewCount: {
    type: Number,
    default: 0
  }

}, { timestamps: true });

const Product = mongoose.model("Product", productSchema);
export default Product;
