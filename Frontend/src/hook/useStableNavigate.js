import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

export function useStableNavigate() {
  const navigate = useNavigate();
  
  const stableNavigate = useCallback((to, options = {}) => {
    // Prevent multiple rapid navigations
    if (window.navigationInProgress) return;
    
    window.navigationInProgress = true;
    
    // Use setTimeout to break the synchronous execution chain
    setTimeout(() => {
      navigate(to, options);
      
      // Reset the flag after navigation is complete
      setTimeout(() => {
        window.navigationInProgress = false;
      }, 100);
    }, 10);
  }, [navigate]);
  
  return stableNavigate;
}