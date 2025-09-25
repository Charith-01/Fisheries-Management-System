import express from "express";
import {
  addOrUpdateReview,
  getProductReviews,
  deleteReview,
} from "../controllers/reviewController.js";
import verifyJWT from "../middleware/auth.js";

const reviewRouter = express.Router();

// Public: list reviews for a product
// GET /api/review/:productId
reviewRouter.get("/:productId", getProductReviews);

// Protected: create or update the current user's review (per order)
// POST /api/review
reviewRouter.post("/", verifyJWT, addOrUpdateReview);

// Protected (user): delete the current user's review for a product & order
// DELETE /api/review/:productId/:orderId
reviewRouter.delete("/:productId/:orderId", verifyJWT, deleteReview);

// Admin-only: delete any review by reviewId
// DELETE /api/review/admin/:reviewId
reviewRouter.delete("/admin/:reviewId", verifyJWT, deleteReview);

export default reviewRouter;
