import Customer from "../models/customer.js";
import bcrypt from "bcrypt";
import loginController from "./loginController.js";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_KEY || "1234fish";

function sanitizeCustomer(doc) {
  if (!doc) return null;
  const { password, __v, ...rest } = doc.toObject ? doc.toObject() : doc;
  return rest;
}

export function registerCustomer(req, res) {
  const hashedPassword = bcrypt.hashSync(req.body.password, 10);
  console.log(hashedPassword);

  const customer = new Customer({
    email: req.body.email,
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    password: hashedPassword,
    address: req.body.address,
    phone: req.body.phone,
  });

  customer
    .save()
    .then((result) => {
      res.json({
        message: "Customer registered successfully",
        customer: sanitizeCustomer(result),
      });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({
        message: "Error registering customer",
      });
    });
}

export function loginCustomer(req, res) {
  req.body.role = "customer";
  return loginController(req, res);
}

export async function getMe(req, res) {
  try {
    if (!req.user?.email) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const customer = await Customer.findOne({ email: req.user.email });
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }
    return res.json({ customer: sanitizeCustomer(customer) });
  } catch (err) {
    console.error("getMe error:", err);
    return res.status(500).json({ message: "Failed to fetch profile" });
  }
}

export async function updateMe(req, res) {
  try {
    if (!req.user?.email) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const updates = {};
    ["firstName", "lastName", "phone", "address"].forEach((f) => {
      if (req.body[f] !== undefined) updates[f] = req.body[f];
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No valid fields to update" });
    }

    const updated = await Customer.findOneAndUpdate(
      { email: req.user.email },
      { $set: updates },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Customer not found" });
    }

    return res.json({
      message: "Profile updated",
      customer: sanitizeCustomer(updated),
    });
  } catch (err) {
    console.error("updateMe error:", err);
    return res.status(500).json({ message: "Failed to update profile" });
  }
}

export async function changePassword(req, res) {
  try {
    if (!req.user?.email) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "currentPassword and newPassword are required" });
    }
    if (String(newPassword).length < 8) {
      return res
        .status(400)
        .json({ message: "New password must be at least 8 characters" });
    }

    const customer = await Customer.findOne({ email: req.user.email });
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const ok = bcrypt.compareSync(currentPassword, customer.password);
    if (!ok) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    const hashed = bcrypt.hashSync(newPassword, 10);
    customer.password = hashed;
    await customer.save();

    return res.json({ message: "Password changed successfully" });
  } catch (err) {
    console.error("changePassword error:", err);
    return res.status(500).json({ message: "Failed to change password" });
  }
}

export async function deleteMe(req, res) {
  try {
    if (!req.user?.email) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { currentPassword, confirm } = req.body || {};

    if (currentPassword) {
      const customer = await Customer.findOne({ email: req.user.email });
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      const ok = bcrypt.compareSync(currentPassword, customer.password);
      if (!ok) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }
    } else {

      if (!confirm) {
        return res.status(400).json({
          message:
            "Confirmation required. Provide { confirm: true } or include currentPassword.",
        });
      }
    }

    const result = await Customer.deleteOne({ email: req.user.email });
    if (!result?.deletedCount) {
      return res.status(404).json({ message: "Customer not found" });
    }

    return res.json({ message: "Account deleted successfully" });
  } catch (err) {
    console.error("deleteMe error:", err);
    return res.status(500).json({ message: "Failed to delete account" });
  }
}

export async function getAllCustomers(req, res) {
  try {
    const docs = await Customer.find({});
    const customers = docs.map(sanitizeCustomer);
    return res.json({ customers });
  } catch (err) {
    console.error("getAllCustomers error:", err);
    return res.status(500).json({ message: "Failed to fetch customers" });
  }
}

export async function adminDeleteCustomer(req, res) {
  if (req.user == null) {
    res.status(403).json({
      message: "You need to log in to continue",
    });
    return;
  }

  if (req.user.role !== "admin") {
    res.status(403).json({
      message: "You do not have permission to perform this action",
    });
    return;
  }

  try {
    await Customer.findOneAndDelete({ _id: req.params.id });

    res.json({
      message: "Customer deleted successfully",
    });
  } catch (err) {
    console.error("adminDeleteCustomer error:", err);
    res.status(500).json({
      message: "Customer not deleted",
    });
  }
}

export async function adminUpdateCustomer(req, res) {
  if (req.user == null) {
    res.status(403).json({
      message: "You need to log in to continue",
    });
    return;
  }

  if (req.user.role !== "admin") {
    res.status(403).json({
      message: "You do not have permission to perform this action",
    });
    return;
  }

  try {
    await Customer.findOneAndUpdate(
      { _id: req.params.id },
      req.body
    );

    res.json({
      message: "Customer updated successfully",
    });
  } catch (err) {
    console.error("adminUpdateCustomer error:", err);
    res.status(500).json({
      message: "Customer not updated",
    });
  }
}
