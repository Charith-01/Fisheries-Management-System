import mongoose from "mongoose";

const customerSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  firstName: {
    type: String,
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
      return this.provider !== "google";
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

  googleId: {
    type: String,
    unique: true,
    sparse: true,
  },
  provider: {
    type: String,
    default: "local",
  },
  avatar: {
    type: String,
  },
});

const Customer = mongoose.model("Customer", customerSchema);

export default Customer;
