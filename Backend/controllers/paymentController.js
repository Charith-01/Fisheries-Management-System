import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();

import Income from '../models/income.js';
import Order from '../models/order.js';
import Notification from '../models/notification.js'; // Import Notification model

// ✅ Initialize Stripe with SECRET key from .env
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Helper function to create notification
const createPaymentNotification = async (order, status, message) => {
  try {
    await Notification.create({
      title: `Payment ${status}`,
      message: message,
      role: "customer",
      targetEmails: [order.email],
      isReadBy: [] // Initialize as empty array
    });
    console.log(`Payment notification created for ${order.email}`);
  } catch (error) {
    console.error('Error creating payment notification:', error);
    // Don't throw error, just log it
  }
};

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
    
    // Create a PaymentIntent using SERVER'S Stripe key
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
    
    // Retrieve payment details from Stripe using SERVER'S key
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    // Update order with payment information
    const updatedOrder = await Order.findOneAndUpdate(
      { orderId },
      { 
        paymentStatus: paymentIntent.status,
        stripePaymentIntentId: paymentIntent.id,
        paymentId: paymentIntent.id,
        paymentDate: new Date(),
        status: paymentIntent.status === 'succeeded' ? 'Paid' : 'Pending'
      },
      { new: true }
    );
    
    if (!updatedOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // Verify user owns this order (unless admin)
    if (req.user.role !== 'admin' && updatedOrder.email !== req.user.email) {
      return res.status(403).json({ error: 'You do not have permission to confirm this payment' });
    }
    
    // ✅ CREATE INCOME RECORD FOR SUCCESSFUL PAYMENTS
    if (paymentIntent.status === 'succeeded') {
      try {
        // Check if income record already exists to avoid duplicates
        const existingIncome = await Income.findOne({ orderId });
        
        if (!existingIncome) {
          await Income.create({
            orderId,
            stripePaymentId: paymentIntent.id,
            amount: paymentIntent.amount / 100, // Convert from cents
            currency: paymentIntent.currency.toUpperCase(),
            paymentMethod: 'card',
            status: 'completed',
            customerEmail: updatedOrder.email,
            customerName: updatedOrder.name,
            items: updatedOrder.billItems,
            description: `Payment for order ${orderId}`,
            date: new Date()
          });
          
          console.log('Income record created for order:', orderId);
          
          // Send success notification to customer
          await createPaymentNotification(
            updatedOrder, 
            'Successful', 
            `Your payment for order #${orderId} was successful. Thank you for your purchase!`
          );
        } else {
          console.log('Income record already exists for order:', orderId);
        }
      } catch (incomeError) {
        console.error('Error creating income record:', incomeError);
        // Don't fail the payment confirmation if income recording fails
      }
    } else if (paymentIntent.status === 'failed') {
      // Send failure notification to customer
      await createPaymentNotification(
        updatedOrder, 
        'Failed', 
        `Your payment for order #${orderId} failed. Please try again or contact support.`
      );
    }
    
    res.json({ 
      message: 'Payment confirmed successfully',
      paymentStatus: paymentIntent.status,
      order: updatedOrder
    });
  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({ error: 'Failed to confirm payment' });
  }
};

// Webhook handler - UPDATED TO PREVENT DUPLICATES
export const handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        const orderId = paymentIntent.metadata.orderId;
        
        if (orderId) {
          // Find the order
          const order = await Order.findOne({ orderId });
          
          if (order) {
            // Update order status
            await Order.findOneAndUpdate(
              { orderId },
              { 
                status: 'Paid',
                paymentStatus: 'succeeded',
                paymentId: paymentIntent.id,
                paymentDate: new Date()
              }
            );
            
            // CHECK FOR EXISTING INCOME RECORD BEFORE CREATING
            const existingIncome = await Income.findOne({ orderId });
            if (!existingIncome) {
              await Income.create({
                orderId,
                stripePaymentId: paymentIntent.id,
                amount: paymentIntent.amount / 100,
                currency: paymentIntent.currency.toUpperCase(),
                paymentMethod: 'card',
                status: 'completed',
                customerEmail: order.email,
                customerName: order.name,
                items: order.billItems,
                description: `Payment for order ${orderId}`,
                date: new Date()
              });
              
              console.log(`Income record created via webhook for order ${orderId}`);
            } else {
              console.log(`Income record already exists for order ${orderId}`);
            }
            
            // Send success notification to customer via webhook
            await createPaymentNotification(
              order, 
              'Successful', 
              `Your payment for order #${orderId} was successful. Thank you for your purchase!`
            );
          }
        }
        break;
        
      case 'payment_intent.payment_failed':
        const failedPaymentIntent = event.data.object;
        const failedOrderId = failedPaymentIntent.metadata.orderId;
        
        if (failedOrderId) {
          const order = await Order.findOne({ orderId: failedOrderId });
          
          if (order) {
            await Order.findOneAndUpdate(
              { orderId: failedOrderId },
              { 
                status: 'Payment Failed',
                paymentStatus: 'failed',
                paymentId: failedPaymentIntent.id 
              }
            );
            
            // Send failure notification to customer via webhook
            await createPaymentNotification(
              order, 
              'Failed', 
              `Your payment for order #${failedOrderId} failed. Please try again or contact support.`
            );
            
            console.log(`Payment failed for order ${failedOrderId}`);
          }
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

// Get payment details (keep this as is)
export const getPaymentDetails = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await Order.findOne({ orderId });
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    if (req.user.role !== 'admin' && order.email !== req.user.email) {
      return res.status(403).json({ error: 'You do not have permission to view this payment' });
    }
    
    let paymentDetails = null;
    if (order.paymentId) {
      try {
        paymentDetails = await stripe.paymentIntents.retrieve(order.paymentId);
      } catch (stripeError) {
        console.error('Error fetching payment details from Stripe:', stripeError);
      }
    }
    
    res.json({
      order: {
        orderId: order.orderId,
        status: order.status,
        paymentStatus: order.paymentStatus,
        total: order.total,
        date: order.date,
        paymentDate: order.paymentDate
      },
      payment: paymentDetails
    });
  } catch (error) {
    console.error('Error fetching payment details:', error);
    res.status(500).json({ error: 'Failed to fetch payment details' });
  }
};