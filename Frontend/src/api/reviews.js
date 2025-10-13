import api from "./axios";

// Fetch all reviews for a given product
export function getReviews(productId) {
  return api.get(`/api/review/${productId}`);
}

// Add or update a review for the logged-in user (per order)
export function addOrUpdateReview(data) {
  // data = { productId, orderId, rating, comment, isAnonymous }
  return api.post("/api/review", data);
}

// Delete the logged-in user's review for a product for a specific order
export function deleteMyReview(productId, orderId) {
  return api.delete(`/api/review/${productId}/${orderId}`);
}

// Admin: delete any review by reviewId
export function adminDeleteReview(reviewId) {
  return api.delete(`/api/review/admin/${reviewId}`);
}
