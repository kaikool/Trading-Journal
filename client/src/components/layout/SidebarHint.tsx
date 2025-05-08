import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronRightSquare, PanelLeftClose } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLayout } from "@/contexts/LayoutContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useUserActivity } from "@/hooks/use-user-activity";
import { useScrollDirection } from "@/hooks/use-scroll-direction";

interface SidebarHintProps {
  onClick: () => void;
}

/**
 * SidebarHint component - Shows a subtle indicator for the sidebar
 * 
 * Features:
 * - Shows a subtle indicator when sidebar is collapsed
 * - Auto-hides after inactivity
 * - Animates smoothly with Framer Motion
 * - Works on both mobile and desktop
 * - Adaptive design based on user behavior
 */
export function SidebarHint({ onClick }: SidebarHintProps) {
  const { sidebarCollapsed } = useLayout();
  const isMobile = useIsMobile();
  const { isActive } = useUserActivity(2000);
  const { direction: scrollDirection, isScrolling } = useScrollDirection();
  const [visible, setVisible] = useState(false);
  const [pulseEffect, setPulseEffect] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(() => {
    // Check localStorage to see if user has interacted with the sidebar before
    const interacted = localStorage.getItem("sidebar-hint-interacted");
    return interacted === "true";
  });
  const [hasSeenHint, setHasSeenHint] = useState(() => {
    const lastSeen = localStorage.getItem("sidebar-hint-last-seen");
    // Return true if seen in the last 24 hours
    if (lastSeen) {
      const lastSeenDate = new Date(lastSeen);
      const now = new Date();
      const hoursPassed = (now.getTime() - lastSeenDate.getTime()) / (1000 * 60 * 60);
      return hoursPassed < 24;
    }
    return false;
  });
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pulseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialLoadRef = useRef(true);

  // Different behavior for first-time users vs returning users
  useEffect(() => {
    // Skip if on desktop with expanded sidebar
    if (!isMobile && !sidebarCollapsed) {
      setVisible(false);
      return;
    }

    if (initialLoadRef.current) {
      initialLoadRef.current = false;
      
      // For new users, show hint after a short delay 
      if (!hasInteracted) {
        // Show for first-time users after 1 second
        setTimeout(() => {
          setVisible(true);
          // Trigger pulse effect for first-time users
          triggerPulseEffect();
        }, 1500);
      } else if (!hasSeenHint) {
        // For returning users who haven't seen hint today, show after 3 seconds
        setTimeout(() => {
          setVisible(true);
        }, 3000);
      }
      
      // Record that user has seen the hint today
      localStorage.setItem("sidebar-hint-last-seen", new Date().toISOString());
      setHasSeenHint(true);
    }
  }, [hasInteracted, hasSeenHint, isMobile, sidebarCollapsed]);

  // Show/hide based on user activity
  useEffect(() => {
    // Skip if not mobile and sidebar is expanded
    if (!isMobile && !sidebarCollapsed) {
      setVisible(false);
      return;
    }

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Show hint when user becomes active and sidebar is hidden
    if (isActive && (isMobile || sidebarCollapsed)) {
      // Show hint when user is scrolling up (looking for navigation)
      if (isScrolling && scrollDirection === 'up') {
        setVisible(true);
      } 
      
      // Hide after delay, shorter if user has interacted before
      const hideDelay = hasInteracted ? 2000 : 4000;
      timeoutRef.current = setTimeout(() => {
        setVisible(false);
      }, hideDelay);
    } else if (!isActive) {
      // Hide when user is inactive
      setVisible(false);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isActive, isScrolling, scrollDirection, isMobile, sidebarCollapsed, hasInteracted]);

  // Hide immediately if sidebar is expanded on desktop
  useEffect(() => {
    if (!isMobile && !sidebarCollapsed) {
      setVisible(false);
    }
  }, [isMobile, sidebarCollapsed]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (pulseTimeoutRef.current) clearTimeout(pulseTimeoutRef.current);
    };
  }, []);

  // Pulse effect for first-time users to draw attention
  const triggerPulseEffect = () => {
    setPulseEffect(true);
    
    // Turn off pulse effect after 2 seconds
    pulseTimeoutRef.current = setTimeout(() => {
      setPulseEffect(false);
    }, 2000);
  };

  // When user clicks the hint, mark as interacted
  const handleClick = () => {
    if (!hasInteracted) {
      setHasInteracted(true);
      localStorage.setItem("sidebar-hint-interacted", "true");
    }
    onClick();
  };

  // Don't render if sidebar is fully visible on desktop
  if (!isMobile && !sidebarCollapsed) {
    return null;
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, x: -5 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -5 }}
          transition={{ duration: 0.2 }}
          className={cn(
            "fixed z-40 left-0 transform",
            // Position based on device type
            isMobile 
              ? "top-1/2 -translate-y-1/2 h-32" 
              : "top-16 h-12",
            "flex items-center justify-center",
            "cursor-pointer",
            "select-none"
          )}
          onClick={handleClick}
        >
          {/* Main hint indicator */}
          <motion.div 
            className={cn(
              "rounded-r-md overflow-hidden flex items-center",
              pulseEffect && "shadow-md" // More prominent shadow during pulse
            )}
            animate={pulseEffect ? {
              x: [0, 3, 0],
              boxShadow: [
                "0 1px 2px rgba(0,0,0,0.1)",
                "0 4px 8px rgba(0,0,0,0.2)",
                "0 1px 2px rgba(0,0,0,0.1)"
              ]
            } : {}}
            transition={{ 
              duration: 1.5, 
              repeat: pulseEffect ? 3 : 0,
              repeatType: "mirror"
            }}
          >
            {/* Colorful indicator line */}
            <div className={cn(
              "h-full w-1",
              "bg-gradient-to-b from-primary/40 via-primary/80 to-primary/40",
              "shadow-sm"
            )} />
            
            {/* Icon container with glass effect */}
            <div className={cn(
              "h-full flex items-center justify-center",
              "bg-card/30 backdrop-blur-sm px-1",
              "border-r border-t border-b border-border/30",
              "shadow-sm"
            )}>
              <motion.div
                animate={pulseEffect ? { 
                  x: [0, 3, 0],
                  opacity: [0.7, 1, 0.7]
                } : { opacity: 0.7 }}
                transition={{ 
                  duration: 1,
                  repeat: pulseEffect ? 3 : 0,
                  repeatType: "mirror"
                }}
              >
                <ChevronRight className="h-3.5 w-3.5 text-primary" />
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}