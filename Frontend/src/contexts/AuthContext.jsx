// contexts/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState({
    user: null,
    role: null,
    isLoading: true
  });

  useEffect(() => {
    const checkAuth = () => {
      try {
        const token = localStorage.getItem("token");
        const customer = localStorage.getItem("customer");
        const user = localStorage.getItem("user");
        
        let userData = null;
        let role = null;
        let isAuthenticated = false;

        // Check all possible auth storage locations
        if (user) {
          try {
            userData = JSON.parse(user);
            role = userData.role || userData.user?.role;
            isAuthenticated = true;
          } catch (e) {
            console.error("Error parsing user:", e);
          }
        }

        if (!role && customer) {
          try {
            userData = JSON.parse(customer);
            role = userData.role || userData.user?.role;
            isAuthenticated = true;
          } catch (e) {
            console.error("Error parsing customer:", e);
          }
        }

        if (!role && token) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            role = payload.role || payload.user?.role;
            userData = payload;
            isAuthenticated = true;
          } catch (e) {
            console.error("Error decoding token:", e);
          }
        }

        setAuthState({
          user: userData,
          role,
          isLoading: false,
          isAuthenticated
        });
      } catch (error) {
        console.error("Auth check error:", error);
        setAuthState({
          user: null,
          role: null,
          isLoading: false,
          isAuthenticated: false
        });
      }
    };

    // Check auth immediately and set up storage listener
    checkAuth();

    const handleStorageChange = (e) => {
      if (['token', 'customer', 'user', 'auth'].includes(e.key) || !e.key) {
        checkAuth();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const value = {
    ...authState,
    logout: () => {
      clearAllAuthData();
      setAuthState({
        user: null,
        role: null,
        isLoading: false,
        isAuthenticated: false
      });
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};