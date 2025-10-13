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
        
        console.log("🔐 AUTH DEBUG - LocalStorage contents:");
        console.log("Token:", token);
        console.log("Customer:", customer);
        console.log("User:", user);
        
        let isAuthenticated = !!(token || customer || user);
        let role = null;

        // Try to extract role from user data
        if (user) {
          try {
            const userData = JSON.parse(user);
            console.log("📋 Parsed user data:", userData);
            role = userData.role || userData.user?.role || userData.data?.role;
            console.log("🎯 Role from user:", role);
          } catch (e) {
            console.error("❌ Error parsing user:", e);
          }
        }

        // Try to extract role from customer data
        if (!role && customer) {
          try {
            const customerData = JSON.parse(customer);
            console.log("📋 Parsed customer data:", customerData);
            role = customerData.role || customerData.user?.role || customerData.data?.role;
            console.log("🎯 Role from customer:", role);
          } catch (e) {
            console.error("❌ Error parsing customer:", e);
          }
        }

        // Try to extract role from token
        if (!role && token) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            console.log("📋 Token payload:", payload);
            role = payload.role || payload.user?.role || payload.data?.role;
            console.log("🎯 Role from token:", role);
          } catch (e) {
            console.error("❌ Error decoding token:", e);
          }
        }

        console.log("🔍 Final Auth Check:", { 
          isAuthenticated, 
          role, 
          allowedRoles,
          hasAccess: allowedRoles.length > 0 ? allowedRoles.includes(role) : true
        });

        setAuthState({
          isAuthenticated,
          role,
          loading: false
        });
      } catch (error) {
        console.error("🚨 Auth check error:", error);
        setAuthState({
          isAuthenticated: false,
          role: null,
          loading: false
        });
      }
    };

    checkAuth();
  }, [allowedRoles]);

  if (authState.loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-slate-600">Checking authorization...</div>
      </div>
    );
  }

  if (!authState.isAuthenticated) {
    console.log("❌ Not authenticated - redirecting to home");
    return <Navigate to="/" replace />;
  }

  if (allowedRoles.length > 0 && (!authState.role || !allowedRoles.includes(authState.role))) {
    console.log(`🚫 Access denied. User role: ${authState.role}, Required: ${allowedRoles}`);
    return <Navigate to="/" replace />;
  }

  console.log("✅ Access granted - rendering protected content");
  return children;
}