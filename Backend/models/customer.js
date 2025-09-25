import mongoose from "mongoose";

const customerSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  firstName: {
    type: String,
    // For Google sign-in, names may come combined → not strictly required if provider=google
    required: function () {
      return this.provider !== "google";
    },
  },
  lastName: {
    type: String,
    required: function () {
      return this.provider !== "google";
    },
  },
  role: {
    type: String,
    default: "customer",
  },
  password: {
    type: String,
    minlength: [8, "Password must be at least 8 characters long"],
    required: function () {
      return this.provider !== "google"; // password required only for non-Google users
    },
  },
  address: {
    type: String,
    required: function () {
      return this.provider !== "google";
    },
  },
  phone: {
    type: String,
    required: function () {
      return this.provider !== "google";
    },
  },
  isEmailVerified: {
    type: Boolean,
    required: true,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  isDisabled: {
    type: Boolean,
    required: true,
    default: false,
  },
  lastLogin: {
    type: Date,
    default: Date.now,
  },

  // ---------- New fields for Google OAuth ----------
  googleId: {
    type: String,
    unique: true,
    sparse: true, // allows null for non-Google users
  },
  provider: {
    type: String,
    default: "local", // "local" or "google"
  },
  avatar: {
    type: String,
  },
});

const Customer = mongoose.model("Customer", customerSchema);

export default Customer;
