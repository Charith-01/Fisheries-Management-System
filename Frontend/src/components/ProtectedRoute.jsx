import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  // Check if user is authenticated
  const isAuthenticated = () => {
    const token = localStorage.getItem("token");
    const customer = localStorage.getItem("customer");
    return !!(token || customer);
  };

  if (!isAuthenticated()) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" replace />;
  }

  return children;
}