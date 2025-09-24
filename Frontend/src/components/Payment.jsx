import { useState, useEffect } from "react";
import {
  useStripe,
  useElements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
} from "@stripe/react-stripe-js";
import api from "../api/axios";
import toast from "react-hot-toast";

export default function Payment({ orderId, amount, email, onSuccess, onCancel }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState(null);
  const [error, setError] = useState(null);

  // Create (or reuse) payment intent when component mounts
  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          toast.error("Please log in to make a payment");
          onCancel && onCancel();
          return;
        }

        // Backend now derives amount from order.total and defaults currency to 'usd' in test mode
        const response = await api.post("/api/payment/create-intent", { orderId });
        setClientSecret(response.data.clientSecret);
      } catch (err) {
        console.error("Error creating payment intent:", err);
        if (err.response?.status === 403 || err.response?.status === 401) {
          toast.error("Your session has expired. Please log in again.");
          localStorage.removeItem("token");
          onCancel && onCancel();
        } else {
          toast.error("Failed to initialize payment. Please try again.");
        }
      }
    };

    if (orderId) createPaymentIntent();
  }, [orderId, onCancel]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!stripe || !elements || !clientSecret) return;

    setProcessing(true);
    setError(null);

    try {
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardNumberElement),
            billing_details: { email },
          },
        }
      );

      if (stripeError) {
        setError(stripeError.message);
        setProcessing(false);
        return;
      }

      if (paymentIntent?.status === "succeeded") {
        try {
          // Inform backend to finalize order state & record income
          await api.post("/api/payment/confirm", {
            orderId,
            paymentIntentId: paymentIntent.id,
          });
        } catch (err) {
          // Even if this fails, webhook will still mark it Paid
          console.error("Error confirming payment:", err?.response?.data || err.message);
        }

        // Update local cache for SuccessPage UX
        try {
          const lastOrder = localStorage.getItem("lastOrder");
          if (lastOrder) {
            const orderData = JSON.parse(lastOrder);
            orderData.status = "Paid";
            orderData.paymentId = paymentIntent.id;
            orderData.paymentDate = new Date().toISOString();
            localStorage.setItem("lastOrder", JSON.stringify(orderData));
          }
        } catch (e) {
          console.error("Error updating localStorage order:", e);
        }

        toast.success("Payment successful!");

        if (onSuccess) {
          onSuccess();
        } else {
          // Fallback redirect if no handler was provided
          window.location.href = `/checkout/success?orderId=${orderId}`;
        }
      } else {
        toast.error(`Payment status: ${paymentIntent?.status || "unknown"}`);
      }
    } catch (err) {
      console.error("Unexpected error during payment processing:", err);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: "16px",
        color: "#424770",
        "::placeholder": { color: "#aab7c4" },
      },
      invalid: { color: "#9e2146" },
    },
  };

  const fmtMoney = (n) =>
    Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2 });

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Complete Payment</h2>
      <p className="text-gray-600 mb-6">
        Order #{orderId} — Rs. {fmtMoney(amount)}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Card Number
          </label>
          <div className="p-3 border border-gray-300 rounded-md">
            <CardNumberElement options={cardElementOptions} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Expiration Date
            </label>
            <div className="p-3 border border-gray-300 rounded-md">
              <CardExpiryElement options={cardElementOptions} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CVC
            </label>
            <div className="p-3 border border-gray-300 rounded-md">
              <CardCvcElement options={cardElementOptions} />
            </div>
          </div>
        </div>

        {error && <div className="text-red-600 text-sm">{error}</div>}

        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            disabled={processing}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            disabled={!stripe || processing || !clientSecret}
          >
            {processing ? "Processing..." : `Pay Rs. ${fmtMoney(amount)}`}
          </button>
        </div>
      </form>

      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-sm font-medium text-blue-800 mb-2">Test Card Numbers:</h3>
        <div className="text-xs text-blue-700 space-y-1">
          <div>• <strong>4242 4242 4242 4242</strong> — Visa (Success)</div>
          <div>• <strong>5555 5555 5555 4444</strong> — Mastercard (Success)</div>
          <div>• <strong>4000 0000 0000 9995</strong> — Always Declined</div>
        </div>
        <p className="text-xs text-blue-600 mt-2">Use any future expiry date and 3-digit CVC</p>
      </div>

      <div className="mt-6 flex justify-center gap-3">
        <img src="/visa.webp" alt="Visa" className="h-8" />
        <img src="/master.webp" alt="Mastercard" className="h-8" />
        <img src="/ae.webp" alt="American Express" className="h-8" />
        <img src="/jcb.webp" alt="JCB" className="h-8" />
      </div>
    </div>
  );
}
