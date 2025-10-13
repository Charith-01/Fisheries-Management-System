import mongoose from "mongoose";

const MsgSchema = new mongoose.Schema({
  role: { type: String, enum: ["user", "model"], required: true },
  text: { type: String, required: true }
},{ _id:false });

const ChatSessionSchema = new mongoose.Schema({
  sessionId: { type: String, unique: true, index: true },
  messages: { type: [MsgSchema], default: [] },
  updatedAt: { type: Date, default: Date.now, index: true }
});

// Auto-prune after 30 days
ChatSessionSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 30*24*3600 });

export default mongoose.model("ChatSession", ChatSessionSchema);
