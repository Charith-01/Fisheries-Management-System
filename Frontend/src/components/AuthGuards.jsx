import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
// Utility functions
export const clearAllAuthData = () => {
  const keysToRemove = [
    "customer", "user", "auth", "auth_user", "token", "authToken",
    "access_token", "jwt", "refresh_token", "userRole", "lastLogin"
  ];
  
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
  
  document.cookie.split(";").forEach(cookie => {
    const eqPos = cookie.indexOf("=");
    const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
    document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
  });
  
  window.dispatchEvent(new Event('storage'));
};

export const getCurrentUserRole = () => {
  try {
    const user = localStorage.getItem("user");
    const customer = localStorage.getItem("customer");
    
    let userData = null;
    if (user) {
      userData = JSON.parse(user);
    } else if (customer) {
      userData = JSON.parse(customer);
    }
    
    return userData?.role || userData?.user?.role || null;
  } catch (error) {
    return null;
  }
};

export const isAuthenticated = () => {
  const token = localStorage.getItem("token");
  const customer = localStorage.getItem("customer");
  const user = localStorage.getItem("user");
  return !!(token || customer || user);
};

// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-[200px]">
    <div className="text-slate-600">Checking access...</div>
  </div>
);

// 1. Admin Route Guard - Only allows admin users
export function AdminGuard({ children }) {
  const [accessState, setAccessState] = useState({
    hasAccess: false,
    loading: true
  });

  useEffect(() => {
    const checkAccess = () => {
      const authenticated = isAuthenticated();
      const userRole = getCurrentUserRole();
      
      const hasAccess = authenticated && userRole === "admin";
      
      setAccessState({
        hasAccess,
        loading: false
      });
    };

    const timer = setTimeout(checkAccess, 150);
    return () => clearTimeout(timer);
  }, []);

  if (accessState.loading) {
    return <LoadingSpinner />;
  }

  if (!accessState.hasAccess) {
    return <Navigate to="/" replace />;
  }

  return children;
}

// 2. Fisherman Route Guard - Only allows fisherman users
export function FishermanGuard({ children }) {
  const [accessState, setAccessState] = useState({
    hasAccess: false,
    loading: true
  });

  useEffect(() => {
    const checkAccess = () => {
      const authenticated = isAuthenticated();
      const userRole = getCurrentUserRole();
      
      const hasAccess = authenticated && userRole === "fisherman";
      
      setAccessState({
        hasAccess,
        loading: false
      });
    };

    const timer = setTimeout(checkAccess, 150);
    return () => clearTimeout(timer);
  }, []);

  if (accessState.loading) {
    return <LoadingSpinner />;
  }

  if (!accessState.hasAccess) {
    return <Navigate to="/" replace />;
  }

  return children;
}

// 3. Customer Route Guard - Only allows authenticated users (any role except admin/fisherman)
export function CustomerGuard({ children }) {
  const [accessState, setAccessState] = useState({
    hasAccess: false,
    loading: true
  });

  useEffect(() => {
    const checkAccess = () => {
      const authenticated = isAuthenticated();
      const userRole = getCurrentUserRole();
      
      // Allow customers and also users without specific role
      const hasAccess = authenticated && userRole !== "admin" && userRole !== "fisherman";
      
      setAccessState({
        hasAccess,
        loading: false
      });
    };

    const timer = setTimeout(checkAccess, 150);
    return () => clearTimeout(timer);
  }, []);

  if (accessState.loading) {
    return <LoadingSpinner />;
  }

  if (!accessState.hasAccess) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// 4. Authenticated Guard - Allows any authenticated user (all roles)
export function AuthenticatedGuard({ children }) {
  const [accessState, setAccessState] = useState({
    hasAccess: false,
    loading: true
  });

  useEffect(() => {
    const checkAccess = () => {
      const authenticated = isAuthenticated();
      
      setAccessState({
        hasAccess: authenticated,
        loading: false
      });
    };

    const timer = setTimeout(checkAccess, 150);
    return () => clearTimeout(timer);
  }, []);

  if (accessState.loading) {
    return <LoadingSpinner />;
  }

  if (!accessState.hasAccess) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// 5. Public Only Guard - Only allows non-authenticated users (for login/register pages)
export function PublicOnlyGuard({ children }) {
  const [accessState, setAccessState] = useState({
    hasAccess: false,
    loading: true
  });

  useEffect(() => {
    const checkAccess = () => {
      const authenticated = isAuthenticated();
      
      setAccessState({
        hasAccess: !authenticated,
        loading: false
      });
    };

    const timer = setTimeout(checkAccess, 150);
    return () => clearTimeout(timer);
  }, []);

  if (accessState.loading) {
    return <LoadingSpinner />;
  }

  if (!accessState.hasAccess) {
    const userRole = getCurrentUserRole();
    
    // Redirect to appropriate dashboard based on role
    if (userRole === "admin") {
      return <Navigate to="/admin" replace />;
    } else if (userRole === "fisherman") {
      return <Navigate to="/fisherman" replace />;
    } else {
      return <Navigate to="/" replace />;
    }
  }

  return children;
}

// 6. Role-Based Guard - Flexible guard for any specific role
export function RoleGuard({ children, allowedRoles = [] }) {
  const [accessState, setAccessState] = useState({
    hasAccess: false,
    loading: true
  });

  useEffect(() => {
    const checkAccess = () => {
      const authenticated = isAuthenticated();
      const userRole = getCurrentUserRole();
      
      const hasAccess = authenticated && allowedRoles.includes(userRole);
      
      setAccessState({
        hasAccess,
        loading: false
      });
    };

    const timer = setTimeout(checkAccess, 150);
    return () => clearTimeout(timer);
  }, [allowedRoles]);

  if (accessState.loading) {
    return <LoadingSpinner />;
  }

  if (!accessState.hasAccess) {
    return <Navigate to="/" replace />;
  }

  return children;
}