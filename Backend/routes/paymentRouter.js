import express from "express";
import { createPaymentIntent, handleStripeWebhook } from "../controllers/paymentController.js";

const Prouter = express.Router();


Prouter.post("/createpaymentintent", createPaymentIntent);

Prouter.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  handleStripeWebhook
);

export default Prouter;
