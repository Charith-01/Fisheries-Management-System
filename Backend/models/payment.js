import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: false }, // optional if no order table yet
    stripePaymentIntentId: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "usd" },
    status: { type: String, enum: ["pending", "succeeded", "failed"], default: "pending" }
  },
  { timestamps: true }
);

export default mongoose.model("Payment", paymentSchema);
