import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();

import Income from '../models/income.js';
import Order from '../models/order.js';
import Notification from '../models/notification.js';
import Payment from '../models/payment.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Helper: create notification (non-blocking)
const createPaymentNotification = async (order, status, message) => {
  try {
    await Notification.create({
      title: `Payment ${status}`,
      message,
      role: "customer",
      targetEmails: [order.email],
      isReadBy: []
    });
  } catch (error) {
    console.error('Error creating payment notification:', error);
  }
};

// Create payment intent (uses order.total, not client amount)
export const createPaymentIntent = async (req, res) => {
  try {
    const { orderId, currency } = req.body;

    if (!req.user) {
      return res.status(403).json({ error: 'You need to log in to continue' });
    }

    const order = await Order.findOne({ orderId });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    if (req.user.role !== 'admin' && order.email !== req.user.email) {
      return res.status(403).json({ error: 'You do not have permission to pay for this order' });
    }

    if (order.status !== 'Pending') {
      return res.status(400).json({ error: 'Only pending orders can be paid' });
    }

    const amountInMinor = Math.round(Number(order.total || 0) * 100);
    if (!Number.isFinite(amountInMinor) || amountInMinor <= 0) {
      return res.status(400).json({ error: 'Invalid order total' });
    }

    const usedCurrency = (currency || 'usd').toLowerCase();

    // Reuse existing PI if present and not canceled
    let paymentIntent;
    if (order.paymentId) {
      try {
        const existing = await stripe.paymentIntents.retrieve(order.paymentId);
        if (existing && existing.status && existing.status !== 'canceled') {
          paymentIntent = existing;
        }
      } catch { /* ignore and create new */ }
    }

    if (!paymentIntent) {
      paymentIntent = await stripe.paymentIntents.create({
        amount: amountInMinor,
        currency: usedCurrency,
        automatic_payment_methods: { enabled: true },
        metadata: { orderId: order.orderId },
        receipt_email: order.email
      });

      order.paymentId = paymentIntent.id;
      order.stripePaymentIntentId = paymentIntent.id;
      await order.save();

      // Persist a Payment doc for traceability (mirrors Order.orderId)
      try {
        await Payment.findOneAndUpdate(
          { stripePaymentIntentId: paymentIntent.id },
          {
            orderPublicId: order.orderId,
            amount: amountInMinor / 100,
            currency: usedCurrency,
            status: 'pending'
          },
          { upsert: true, new: true }
        );
      } catch (e) {
        console.error('Payment doc upsert failed:', e);
      }
    }

    return res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
};

// Confirm payment (client-side fallback after Stripe confirmation)
export const confirmPayment = async (req, res) => {
  try {
    const { orderId, paymentIntentId } = req.body;

    if (!req.user) {
      return res.status(403).json({ error: 'You need to log in to continue' });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (!paymentIntent) {
      return res.status(404).json({ error: 'Payment Intent not found' });
    }

    // Update order with payment info
    const updatedOrder = await Order.findOneAndUpdate(
      { orderId },
      {
        paymentStatus: paymentIntent.status,
        stripePaymentIntentId: paymentIntent.id,
        paymentId: paymentIntent.id,
        paymentDate: new Date(),
        status: paymentIntent.status === 'succeeded' ? 'Paid' : (paymentIntent.status === 'requires_payment_method' ? 'Pending' : 'Payment Failed')
      },
      { new: true }
    );

    if (!updatedOrder) return res.status(404).json({ error: 'Order not found' });

    if (req.user.role !== 'admin' && updatedOrder.email !== req.user.email) {
      return res.status(403).json({ error: 'You do not have permission to confirm this payment' });
    }

    // Update Payment doc
    try {
      await Payment.findOneAndUpdate(
        { stripePaymentIntentId: paymentIntent.id },
        { orderPublicId: orderId, status: paymentIntent.status === 'succeeded' ? 'succeeded' : 'failed' },
        { upsert: true }
      );
    } catch (e) {
      console.error('Payment doc update failed:', e);
    }

    // Income & notifications
    if (paymentIntent.status === 'succeeded') {
      try {
        const existingIncome = await Income.findOne({ orderId });
        if (!existingIncome) {
          await Income.create({
            orderId,
            stripePaymentId: paymentIntent.id,
            amount: paymentIntent.amount / 100,
            currency: paymentIntent.currency.toUpperCase(),
            paymentMethod: 'card',
            status: 'completed',
            customerEmail: updatedOrder.email,
            customerName: updatedOrder.name,
            items: updatedOrder.billItems,
            description: `Payment for order ${orderId}`,
            date: new Date()
          });

          await createPaymentNotification(
            updatedOrder,
            'Successful',
            `Your payment for order #${orderId} was successful. Thank you for your purchase!`
          );
        }
      } catch (incomeError) {
        console.error('Error creating income record:', incomeError);
      }
    } else if (paymentIntent.status === 'requires_payment_method' || paymentIntent.status === 'canceled') {
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

// Webhook (uses raw body; index.js keeps raw for this route)
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
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        const orderId = paymentIntent.metadata?.orderId;

        if (orderId) {
          const order = await Order.findOne({ orderId });
          if (order) {
            await Order.findOneAndUpdate(
              { orderId },
              {
                status: 'Paid',
                paymentStatus: 'succeeded',
                paymentId: paymentIntent.id,
                stripePaymentIntentId: paymentIntent.id,
                paymentDate: new Date()
              }
            );

            // Payment doc
            try {
              await Payment.findOneAndUpdate(
                { stripePaymentIntentId: paymentIntent.id },
                {
                  orderPublicId: orderId,
                  amount: paymentIntent.amount / 100,
                  currency: (paymentIntent.currency || 'usd').toLowerCase(),
                  status: 'succeeded'
                },
                { upsert: true }
              );
            } catch (e) {
              console.error('Payment doc upsert (webhook) failed:', e);
            }

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
            }

            await createPaymentNotification(
              order,
              'Successful',
              `Your payment for order #${orderId} was successful. Thank you for your purchase!`
            );
          }
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const failedPaymentIntent = event.data.object;
        const failedOrderId = failedPaymentIntent.metadata?.orderId;

        if (failedOrderId) {
          const order = await Order.findOne({ orderId: failedOrderId });
          if (order) {
            await Order.findOneAndUpdate(
              { orderId: failedOrderId },
              {
                status: 'Payment Failed',
                paymentStatus: 'failed',
                paymentId: failedPaymentIntent.id,
                stripePaymentIntentId: failedPaymentIntent.id
              }
            );

            try {
              await Payment.findOneAndUpdate(
                { stripePaymentIntentId: failedPaymentIntent.id },
                { orderPublicId: failedOrderId, status: 'failed' },
                { upsert: true }
              );
            } catch (e) {
              console.error('Payment doc (failed) upsert error:', e);
            }

            await createPaymentNotification(
              order,
              'Failed',
              `Your payment for order #${failedOrderId} failed. Please try again or contact support.`
            );
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
};

// Get payment details for an order
export const getPaymentDetails = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!req.user) {
      return res.status(403).json({ error: 'You need to log in to continue' });
    }

    const order = await Order.findOne({ orderId });
    if (!order) return res.status(404).json({ error: 'Order not found' });

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
