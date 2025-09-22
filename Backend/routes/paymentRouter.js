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

// Confirm payment
router.post('/confirm', confirmPayment);

// Get payment details
router.get('/details/:orderId', getPaymentDetails);

// Webhook handler (needs raw body for verification)
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

export default router;