import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();

function verifyJWT(req, res, next) {
  try {
    const header = req.headers["authorization"];

    if (!header) {
      req.user = null;  // no token provided
      return next();
    }

    const token = header.replace("Bearer ", "").trim();

    jwt.verify(token, process.env.JWT_KEY, (err, decoded) => {
      if (err) {
        console.warn("JWT verification failed:", err.message);
        req.user = null;
      } else {
        req.user = decoded;
        console.log("✅ JWT verified:", decoded);
      }
      next(); // ✅ Move inside callback, not outside
    });
  } catch (err) {
    console.error("JWT middleware error:", err);
    req.user = null;
    next();
  }
}

export default verifyJWT;
