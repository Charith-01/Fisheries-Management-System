import express from 'express';
import {
  createPaymentIntent,
  confirmPayment,
  getPaymentDetails,
  handleWebhook
} from '../controllers/paymentController.js';

const router = express.Router();

// Create payment intent
router.post('/create-intent', createPaymentIntent);

// Confirm payment (client fallback)
router.post('/confirm', confirmPayment);

// Get payment details
router.get('/details/:orderId', getPaymentDetails);

// Webhook handler (kept here for structure; index.js ensures raw body + no auth)
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

export default router;
