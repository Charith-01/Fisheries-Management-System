import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";

export default function EnhancedRoleProtectedRoute({ children, allowedRoles = [] }) {
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    role: null,
    loading: true
  });

  useEffect(() => {
    const checkAuth = () => {
      try {
        const token = localStorage.getItem("token");
        const customer = localStorage.getItem("customer");
        const user = localStorage.getItem("user");
        
        let isAuthenticated = !!(token || customer || user);
        let role = null;

        // Try to extract role from user data
        if (user) {
          try {
            const userData = JSON.parse(user);
            role = userData.role || userData.user?.role || userData.data?.role;
          } catch (e) {
            console.error("Error parsing user:", e);
          }
        }

        // Try to extract role from customer data
        if (!role && customer) {
          try {
            const customerData = JSON.parse(customer);
            role = customerData.role || customerData.user?.role || customerData.data?.role;
          } catch (e) {
            console.error("Error parsing customer:", e);
          }
        }

        // Try to extract role from token
        if (!role && token) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            role = payload.role || payload.user?.role || payload.data?.role;
          } catch (e) {
            console.error("Error decoding token:", e);
          }
        }

        setAuthState({
          isAuthenticated,
          role,
          loading: false
        });
      } catch (error) {
        console.error("Auth check error:", error);
        setAuthState({
          isAuthenticated: false,
          role: null,
          loading: false
        });
      }
    };

    // Small delay to prevent race conditions with useRoleAccess hook
    const timer = setTimeout(checkAuth, 150);
    return () => clearTimeout(timer);
  }, [allowedRoles]);

  if (authState.loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-slate-600">Checking authorization...</div>
      </div>
    );
  }

  if (!authState.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && (!authState.role || !allowedRoles.includes(authState.role))) {
    return <Navigate to="/" replace />;
  }

  return children;
}