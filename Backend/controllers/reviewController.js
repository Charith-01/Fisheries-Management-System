import mongoose from "mongoose";
import Product from "../models/product.js";
import Review from "../models/review.js";
import Order from "../models/order.js";
import Customer from "../models/customer.js";

/** recompute avg & count */
async function recomputeProductRating(productObjectId) {
  const stats = await Review.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(productObjectId) } },
    { $group: { _id: "$product", avg: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);

  const avg = stats[0]?.avg ?? 0;
  const count = stats[0]?.count ?? 0;

  await Product.updateOne(
    { _id: productObjectId },
    { $set: { averageRating: Number(avg.toFixed(2)), reviewCount: count } }
  );
}

/** resolve user identity */
async function getUserIdentity(req) {
  const u = req.user || {};
  let userId = u._id || u.id || u.userId || null;
  let email = u.email || null;

  if (!userId && email) {
    const cust = await Customer.findOne({ email }).select("_id").lean();
    if (cust) userId = cust._id;
  }
  if (userId && !email) {
    const cust = await Customer.findById(userId).select("email").lean();
    if (cust) email = cust.email;
  }
  return { userId, email };
}

/** POST/PUT: create or update one review per (product, user, order) */
export async function addOrUpdateReview(req, res) {
  try {
    if (!req.user) {
      return res.status(403).json({ message: "You need to log in to continue" });
    }

    const { userId, email } = await getUserIdentity(req);
    if (!userId || !email) {
      return res
        .status(403)
        .json({ message: "Invalid token: user not found. Please log in again." });
    }

    const { productId, rating, comment, isAnonymous, orderId } = req.body || {};
    if (!productId || typeof rating !== "number" || !orderId) {
      return res.status(400).json({
        message: "productId, orderId and numeric rating are required",
      });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: "rating must be between 1 and 5" });
    }

    const product = await Product.findOne({ productId });
    if (!product) return res.status(404).json({ message: "Product not found" });

    // Verify this exact order belongs to the user, is processed, and includes the product
    const processedStatuses = ["Delivered", "Completed", "delivered", "completed"];
    const order = await Order.findOne({
      orderId,
      email,
      status: { $in: processedStatuses },
      "billItems.productId": productId,
    }).lean();

    if (!order) {
      return res.status(403).json({
        message:
          "You can only review this product for a completed order that contains it",
      });
    }

    const anonFlag = Boolean(isAnonymous);

    // Upsert by (product, user, orderId)
    const review = await Review.findOneAndUpdate(
      { product: product._id, user: userId, orderId },
      {
        $set: {
          rating,
          comment: comment || "",
          userEmail: email,
          isAnonymous: anonFlag,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    await Product.updateOne(
      { _id: product._id },
      { $addToSet: { reviews: review._id } }
    );

    await recomputeProductRating(product._id);

    return res.json({ message: "Review saved successfully", review });
  } catch (err) {
    console.error("addOrUpdateReview error:", err);
    if (err?.code === 11000) {
      // unique per (product,user,orderId)
      return res.status(409).json({
        message:
          "You have already reviewed this product for this order. You can edit your review.",
      });
    }
    return res.status(500).json({ message: "Failed to save review" });
  }
}

/** GET: list reviews for a product (with anonymity shaping) */
export async function getProductReviews(req, res) {
  try {
    const { productId } = req.params || {};
    const product = await Product.findOne({ productId });
    if (!product) return res.status(404).json({ message: "Product not found" });

    const reviews = await Review.find({ product: product._id })
      .populate({ path: "user", select: "firstName lastName email" })
      .sort({ createdAt: -1 })
      .lean();

    const shaped = reviews.map((r) => {
      const nameFromUser =
        [r?.user?.firstName, r?.user?.lastName].filter(Boolean).join(" ").trim();
      const emailName = r?.user?.email ? String(r.user.email).split("@")[0] : undefined;

      const displayName = r.isAnonymous
        ? "Anonymous"
        : nameFromUser || emailName || "Customer";

      if (r.isAnonymous) {
        const { user, ...rest } = r;
        return { ...rest, displayName };
      }
      return { ...r, displayName };
    });

    return res.json({
      message: "Reviews fetched successfully",
      data: shaped,
      averageRating: product.averageRating ?? 0,
      reviewCount: product.reviewCount ?? 0,
    });
  } catch (err) {
    console.error("getProductReviews error:", err);
    return res.status(500).json({ message: "Failed to fetch reviews" });
  }
}

/** DELETE: user deletes their review for a specific order */
export async function deleteReview(req, res) {
  try {
    if (!req.user) {
      return res.status(403).json({ message: "You need to log in to continue" });
    }

    const { userId } = await getUserIdentity(req);
    if (!userId) {
      return res
        .status(403)
        .json({ message: "Invalid token: user not found. Please log in again." });
    }

    const { productId, reviewId, orderId } = req.params || {};
    let review;
    let product;

    if (reviewId && req.user.role === "admin") {
      // Admin path: delete by reviewId
      review = await Review.findById(reviewId);
      if (!review) return res.status(404).json({ message: "Review not found" });
      product = await Product.findById(review.product);
    } else {
      // User path: require productId + orderId
      if (!orderId) {
        return res
          .status(400)
          .json({ message: "orderId is required to delete this review" });
      }

      product = await Product.findOne({ productId });
      if (!product) return res.status(404).json({ message: "Product not found" });

      review = await Review.findOne({
        product: product._id,
        user: userId,
        orderId,
      });
      if (!review) return res.status(404).json({ message: "Review not found" });
    }

    await Review.deleteOne({ _id: review._id });

    await Product.updateOne(
      { _id: product._id },
      { $pull: { reviews: review._id } }
    );

    await recomputeProductRating(product._id);

    return res.json({ message: "Review deleted successfully" });
  } catch (err) {
    console.error("deleteReview error:", err);
    return res.status(500).json({ message: "Failed to delete review" });
  }
}
