import express from "express";
import {
  loginCustomer,
  registerCustomer,
  getMe,
  updateMe,
  changePassword,
  deleteMe,
  getAllCustomers,
  adminDeleteCustomer,
  adminUpdateCustomer,
} from "../controllers/customerController.js";
import verifyJWT from "../middleware/auth.js";

const customerRouter = express.Router();

customerRouter.post("/register", registerCustomer);
customerRouter.post("/login", loginCustomer);

customerRouter.get("/me", verifyJWT, getMe);
customerRouter.put("/me", verifyJWT, updateMe);
customerRouter.post("/change-password", verifyJWT, changePassword);
customerRouter.delete("/me", verifyJWT, deleteMe);
customerRouter.get("/all", verifyJWT, getAllCustomers);
customerRouter.delete("/:id", verifyJWT, adminDeleteCustomer);

export default customerRouter;
