// controllers/loginController.js
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import Admin from "../models/admin.js";
import Fisherman from "../models/fisherman.js";
import Customer from "../models/customer.js";

dotenv.config();

export default function loginController(req, res) {
  const email = req.body.email;
  const password = req.body.password;
  const role = (req.body.role || "").toLowerCase();

  // pick correct model
  let Model;
  if (role === "admin") {
    Model = Admin;
  } else if (role === "fisherman") {
    Model = Fisherman;
  } else if (role === "customer") {
    Model = Customer;
  } else {
    return res.status(400).json({ message: "Unsupported role" });
  }

  // lookup user
  Model.findOne({ email: email }).then((user) => {
    if (user == null) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isPasswordValid = bcrypt.compareSync(password, user.password || "");
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (user.isDisabled) {
      return res.status(403).json({ message: "Account disabled" });
    }

    // prepare safe user object
    const userData = {
      id: user._id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      address: user.address,
      phone: user.phone,
      createdAt: user.createdAt,
      isDisabled: user.isDisabled,
      isEmailVerified: user.isEmailVerified,
      lastLogin: user.lastLogin
    };

    // sign token
    const token = jwt.sign(
      { sub: user._id, role: user.role },
      process.env.JWT_KEY
    );

    return res.json({
      message: "Login successful",
      token: token,
      user: userData
    });
  }).catch((err) => {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  });
}
