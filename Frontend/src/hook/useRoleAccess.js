import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Centralized logout function
export const clearAllAuthData = () => {
  const keysToRemove = [
    "customer", "user", "auth", "auth_user", "token", "authToken",
    "access_token", "jwt", "refresh_token", "userRole", "lastLogin"
  ];
  
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
  
  // Clear any cookies that might be set
  document.cookie.split(";").forEach(cookie => {
    const eqPos = cookie.indexOf("=");
    const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
    document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
  });
  
  // Dispatch storage event to sync across tabs
  window.dispatchEvent(new Event('storage'));
};

// Fixed useRoleAccess hook with delays to prevent flashing
export function useRoleAccess(requiredRole) {
  const navigate = useNavigate();
  
  useEffect(() => {
    const checkAccess = () => {
      try {
        const user = localStorage.getItem("user");
        const customer = localStorage.getItem("customer");
        const token = localStorage.getItem("token");
        
        let userData = null;
        if (user) userData = JSON.parse(user);
        else if (customer) userData = JSON.parse(customer);
        
        const userRole = userData?.role || userData?.user?.role;
        
        // If user is not authenticated at all, redirect to login
        if (!userData && !token) {
          navigate("/login", { replace: true });
          return;
        }
        
        // If user doesn't have the required role for this dashboard
        if (userRole !== requiredRole) {
          console.log(`Access denied. Required: ${requiredRole}, Current: ${userRole}`);
          
          // Redirect to appropriate dashboard based on actual role
          if (userRole === "fisherman") {
            navigate("/fisherman", { replace: true });
          } else if (userRole === "admin") {
            navigate("/admin", { replace: true });
          } else {
            navigate("/", { replace: true }); // Regular users go to home
          }
        }
        // If user has the correct role, they stay on the current dashboard
      } catch (error) {
        console.error("Access check failed:", error);
        navigate("/login", { replace: true });
      }
    };

    // Add delay to prevent race conditions with other auth checks
    const timer = setTimeout(checkAccess, 200);
    return () => clearTimeout(timer);
  }, [navigate, requiredRole]);
  
  const getUserRole = () => {
    try {
      const user = localStorage.getItem("user");
      const customer = localStorage.getItem("customer");
      let userData = null;
      if (user) userData = JSON.parse(user);
      else if (customer) userData = JSON.parse(customer);
      return userData?.role || userData?.user?.role;
    } catch (error) {
      return null;
    }
  };
  
  return { getUserRole };
}