import api from "./axios";

// Create Stripe Payment Intent
export const createPaymentIntent = async ({ orderId, currency = "usd" }) => {
  const res = await api.post("/payment/create-intent", { orderId, currency });
  return res.data;
};

// Confirm payment (fallback if needed)
export const confirmPayment = async ({ orderId, paymentIntentId }) => {
  const res = await api.post("/payment/confirm", { orderId, paymentIntentId });
  return res.data;
};

// Get payment details for an order
export const getPaymentDetails = async (orderId) => {
  const res = await api.get(`/payment/details/${orderId}`);
  return res.data;
};
