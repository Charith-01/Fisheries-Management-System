import express from "express";
import verifyJWT from "../middleware/auth.js";
import {
  createExpense,
  getExpenses,
  updateExpense,
  deleteExpense,
} from "../controllers/expenseController.js";

const router = express.Router();

// All routes are protected with JWT
router.post("/", verifyJWT, createExpense);
router.get("/", verifyJWT, getExpenses);
router.put("/:id", verifyJWT, updateExpense);
router.delete("/:id", verifyJWT, deleteExpense);

export default router;
