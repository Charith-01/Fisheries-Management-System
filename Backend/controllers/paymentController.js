import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();

import Order from '../models/order.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY );

// Create payment intent
export const createPaymentIntent = async (req, res) => {
  try {
    const { orderId, amount, currency = 'lkr' } = req.body;
    
    // Verify order exists
    const order = await Order.findOne({ orderId });
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // Verify user owns this order (unless admin)
    if (req.user.role !== 'admin' && order.email !== req.user.email) {
      return res.status(403).json({ error: 'You do not have permission to pay for this order' });
    }
    
    // Create a PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount),
      currency,
      metadata: { orderId },
      receipt_email: order.email,
    });
    
    res.json({ 
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
};

// Confirm payment
export const confirmPayment = async (req, res) => {
  try {
    const { orderId, paymentIntentId } = req.body;
    
    // Verify order exists
    const order = await Order.findOne({ orderId });
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // Verify user owns this order (unless admin)
    if (req.user.role !== 'admin' && order.email !== req.user.email) {
      return res.status(403).json({ error: 'You do not have permission to confirm this payment' });
    }
    
    // Verify the payment was successful
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ error: 'Payment not successful' });
    }
    
    // Update order status
    const updatedOrder = await Order.findOneAndUpdate(
      { orderId },
      { 
        status: 'Paid',
        paymentId: paymentIntentId 
      },
      { new: true }
    );
    
    res.json({ 
      message: 'Payment confirmed successfully',
      order: updatedOrder
    });
  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({ error: 'Failed to confirm payment' });
  }
};

// Get payment details
export const getPaymentDetails = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    // Verify order exists
    const order = await Order.findOne({ orderId });
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // Verify user owns this order (unless admin)
    if (req.user.role !== 'admin' && order.email !== req.user.email) {
      return res.status(403).json({ error: 'You do not have permission to view this payment' });
    }
    
    // If payment ID exists, get details from Stripe
    let paymentDetails = null;
    if (order.paymentId) {
      try {
        paymentDetails = await stripe.paymentIntents.retrieve(order.paymentId);
      } catch (stripeError) {
        console.error('Error fetching payment details from Stripe:', stripeError);
        // Continue without Stripe details
      }
    }
    
    res.json({
      order: {
        orderId: order.orderId,
        status: order.status,
        total: order.total,
        date: order.date
      },
      payment: paymentDetails
    });
  } catch (error) {
    console.error('Error fetching payment details:', error);
    res.status(500).json({ error: 'Failed to fetch payment details' });
  }
};

// Webhook handler
export const handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_32e52291476a41baf20b2ee81f5ed4bb62870811056b83171c0af8d345e5e544';

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        const orderId = paymentIntent.metadata.orderId;
        
        if (orderId) {
          // Update order status
          await Order.findOneAndUpdate(
            { orderId },
            { 
              status: 'Paid',
              paymentId: paymentIntent.id 
            }
          );
          console.log(`Order ${orderId} marked as paid via webhook`);
        }
        break;
        
      case 'payment_intent.payment_failed':
        const failedPaymentIntent = event.data.object;
        const failedOrderId = failedPaymentIntent.metadata.orderId;
        
        if (failedOrderId) {
          // Update order status to indicate payment failure
          await Order.findOneAndUpdate(
            { orderId: failedOrderId },
            { 
              status: 'Payment Failed',
              paymentId: failedPaymentIntent.id 
            }
          );
          console.log(`Payment failed for order ${failedOrderId}`);
        }
        break;
        
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
};