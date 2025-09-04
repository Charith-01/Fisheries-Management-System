import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true }, // e.g., Fuel, Maintenance, Salary
    amount: { type: Number, required: true },
    category: { type: String, enum: ["Fuel", "Maintenance", "Salary", "Other"], default: "Other" },
    description: { type: String },
    date: { type: Date, default: Date.now },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // admin reference
  },
  { timestamps: true }
);

export default mongoose.model("Expense", expenseSchema);
