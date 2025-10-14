import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";

export default function ProtectedRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("token");
      const customer = localStorage.getItem("customer");
      const user = localStorage.getItem("user");
      setIsAuthenticated(!!(token || customer || user));
    };

    // Small delay to prevent race conditions
    const timer = setTimeout(checkAuth, 150);
    return () => clearTimeout(timer);
  }, []);

  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-slate-600">Checking authentication...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}