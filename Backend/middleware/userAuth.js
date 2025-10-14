import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export default function userAuth(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    return res.status(401).json({ message: "Missing token" });
  }

  const token = authHeader.replace("Bearer ", "").trim();

  try {
    const decoded = jwt.verify(token, process.env.JWT_KEY);
    req.user = decoded; // includes {_id, role, email, ...}
    next();
  } catch (err) {
    console.error("Invalid token:", err.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}
