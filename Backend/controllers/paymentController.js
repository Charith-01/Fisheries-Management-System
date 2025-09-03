import Stripe from "stripe";
import Payment from "../models/payment.js";
import dotenv from "dotenv";

dotenv.config();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const createPaymentIntent = async (req, res) => {
  try {
    const { amount } = req.body; // in cents (1000 = $10)

    // Create Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      automatic_payment_methods: { enabled: true },
    });

    // Save payment record in DB (pending by default)
    const payment = new Payment({
      stripePaymentIntentId: paymentIntent.id,
      amount,
      currency: "usd",
      status: "pending",
    });
    await payment.save();

    res.json({ clientSecret: paymentIntent.client_secret });//used to complete payment in frontend
  } catch (err) {
    console.error("Payment error:", err.message);
    res.status(500).json({ error: "Payment failed" });
  }
};

// Webhook for Stripe events
export const handleStripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle event types
  if (event.type === "payment_intent.succeeded") {
    const intent = event.data.object;
    console.log(" Payment succeeded:", intent.id);

    await Payment.findOneAndUpdate(
      { stripePaymentIntentId: intent.id },
      { status: "succeeded" }
    );
  }

  if (event.type === "payment_intent.payment_failed") {
    const intent = event.data.object;
    console.log(" Payment failed:", intent.id);

    await Payment.findOneAndUpdate(
      { stripePaymentIntentId: intent.id },
      { status: "failed" }
    );
  }

  res.json({ received: true });
};
