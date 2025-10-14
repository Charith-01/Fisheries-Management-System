// components/RouteGuard.jsx
import { useAuth } from '../contexts/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';

export function RouteGuard({ 
  children, 
  requiredRole = null, 
  allowAuthenticated = true,
  allowUnauthenticated = false 
}) {
  const { isAuthenticated, role, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  // If route requires specific role
  if (requiredRole) {
    if (!isAuthenticated) {
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
    
    if (role !== requiredRole) {
      // Redirect to appropriate dashboard based on actual role
      if (role === 'admin') return <Navigate to="/admin" replace />;
      if (role === 'fisherman') return <Navigate to="/fisherman" replace />;
      return <Navigate to="/" replace />;
    }
    
    return children;
  }

  // If route requires authentication but no specific role
  if (allowAuthenticated && !allowUnauthenticated) {
    if (!isAuthenticated) {
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
    return children;
  }

  // If route should only be accessible to unauthenticated users (like login)
  if (allowUnauthenticated) {
    if (isAuthenticated) {
      // Redirect to appropriate dashboard
      if (role === 'admin') return <Navigate to="/admin" replace />;
      if (role === 'fisherman') return <Navigate to="/fisherman" replace />;
      return <Navigate to="/" replace />;
    }
    return children;
  }

  return children;
}