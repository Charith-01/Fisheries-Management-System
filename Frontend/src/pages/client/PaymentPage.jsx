import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import api from "../../api/axios";
import Payment from "../../components/Payment";
import toast from "react-hot-toast";


const stripePromise = loadStripe(
  "pk_test_51S2DQvGjCGbAdkkDgjBNqw3s69w2GeWQ8pX2elXN0qjIURdKDmdUGZSEUO6H5bUzHIBnJqEQ5uxWOr06slvPv5MM00zKOe5NMH"
);

export default function PaymentPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get("orderId");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        toast.error("No order specified");
        navigate("/");
        return;
      }

      try {
        const response = await api.get(`/api/order/${encodeURIComponent(orderId)}`);
        setOrder(response.data);
      } catch (err) {
        console.error("Error fetching order:", err);
        if (err.response?.status === 403 || err.response?.status === 401) {
          toast.error("Your session has expired. Please log in again.");
          localStorage.removeItem("token");
          navigate("/login");
        } else if (err.response?.status === 404) {
          toast.error("Order not found. Please create a new order.");
          navigate("/checkout");
        } else {
          toast.error("Failed to load order details");
        }
      } finally {
        setLoading(false);
      }
    };

    if (orderId) fetchOrder();
  }, [orderId, navigate]);

  const handlePaymentSuccess = () => {
    navigate(`/checkout/success?orderId=${orderId}`);
  };

  const handlePaymentCancel = () => {
    navigate("/checkout");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        
        <main className="flex-1 flex items-center justify-center">
          <div className="text-lg">Loading order details...</div>
        </main>
       
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col">
       
        <main className="flex-1 flex items-center justify-center">
          <div className="text-lg text-red-600">Failed to load order</div>
          <button
            onClick={() => navigate("/checkout")}
            className="ml-4 px-4 py-2 bg-blue-600 text-white rounded"
          >
            Back to Checkout
          </button>
        </main>
        
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      
      <main className="flex-1 bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <Elements stripe={stripePromise}>
            <Payment
              orderId={order.orderId}
              amount={order.total}
              email={order.email}
              onSuccess={handlePaymentSuccess}
              onCancel={handlePaymentCancel}
            />
          </Elements>
        </div>
      </main>
     
    </div>
  );
}