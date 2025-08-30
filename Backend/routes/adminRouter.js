import express from "express";
import { loginAdmin, registerAdmin } from "../controllers/adminController.js";

const adminRouter = express.Router();

adminRouter.post("/register", registerAdmin);
adminRouter.post("/login", loginAdmin);

export default adminRouter;
