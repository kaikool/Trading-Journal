import { useState, useEffect } from 'react';

export function useUserActivity(inactivityTimeout = 3000) {
  const [isActive, setIsActive] = useState(true);
  const [lastActivity, setLastActivity] = useState(Date.now());
  
  useEffect(() => {
    let inactivityTimer: NodeJS.Timeout | null = null;
    
    // Function to handle user interactions
    const handleUserActivity = () => {
      setIsActive(true);
      setLastActivity(Date.now());
      
      // Reset the inactivity timer
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
      }
      
      // Set a new inactivity timer
      inactivityTimer = setTimeout(() => {
        setIsActive(false);
      }, inactivityTimeout);
    };
    
    // Listen for user interactions
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, handleUserActivity, { passive: true });
    });
    
    // Initial activity timer
    handleUserActivity();
    
    // Cleanup event listeners and timers
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity);
      });
      
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
      }
    };
  }, [inactivityTimeout]);
  
  return { isActive, lastActivity };
}