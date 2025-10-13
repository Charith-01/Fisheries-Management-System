import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    userEmail: { 
      type: String 
    },
    orderId: {
      type: String,
      required: true,
      trim: true,
    },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      default: "",
    },
    isAnonymous: {
      type: Boolean,
      default: false,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);
reviewSchema.index({ product: 1, user: 1, orderId: 1 }, { unique: true });

reviewSchema.index({ orderId: 1 });
reviewSchema.index({ product: 1 });

const Review = mongoose.model("Review", reviewSchema);
export default Review;
