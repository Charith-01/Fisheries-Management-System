// models/Notification.js
import mongoose from "mongoose";


const notificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Notification title is required"],
      trim: true,
    },
    message: {
      type: String,
      required: [true, "Notification message is required"],
    },
    role: {
      type: String,
      enum: ["customer", "fisherman"], // allowed roles
      required: [true, "Role is required"],
    },
    targetEmails: {
      type: [String], // optional, only for customers
      validate: {
        validator: function (emails) {
          // Only allow targetEmails if role is 'customer'
          if (this.role === "customer") return true;
          return emails.length === 0;
        },
        message: "Only customers can have targetEmails",
      },
      default: [],
    },
    isReadBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
,
  },
  {
    timestamps: true, // adds createdAt and updatedAt
  }
);

const Notification= mongoose.model("Notification", notificationSchema);
export default Notification;