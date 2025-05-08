import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLayout } from "@/contexts/LayoutContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useUserActivity } from "@/hooks/use-user-activity";

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
 */
export function SidebarHint({ onClick }: SidebarHintProps) {
  const { sidebarCollapsed } = useLayout();
  const isMobile = useIsMobile();
  const { isActive } = useUserActivity(2000);
  const [visible, setVisible] = useState(true);
  const [hasInteracted, setHasInteracted] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Set up auto-hide functionality
  useEffect(() => {
    // Skip if on desktop with expanded sidebar
    if (!isMobile && !sidebarCollapsed) {
      setVisible(false);
      return;
    }

    // Show hint immediately when user becomes active and the sidebar is hidden
    if (isActive && (isMobile || sidebarCollapsed)) {
      setVisible(true);
      
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Hide after delay - longer initial delay for new users, shorter for returning
      const hideDelay = hasInteracted ? 3000 : 5000;
      timeoutRef.current = setTimeout(() => {
        setVisible(false);
      }, hideDelay);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isActive, isMobile, sidebarCollapsed, hasInteracted]);

  // Hide immediately if sidebar is expanded on desktop
  useEffect(() => {
    if (!isMobile && !sidebarCollapsed) {
      setVisible(false);
    }
  }, [isMobile, sidebarCollapsed]);

  // When user clicks the hint, mark as interacted
  const handleClick = () => {
    setHasInteracted(true);
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
            "fixed z-40 top-1/2 left-0 transform -translate-y-1/2",
            "py-16 px-1 flex items-center justify-center",
            "cursor-pointer"
          )}
          onClick={handleClick}
        >
          <div className={cn(
            "h-16 w-1.5 rounded-r-full",
            "bg-gradient-to-r from-primary/30 to-primary/10",
            "backdrop-blur-sm shadow-sm"
          )} />
          
          <motion.div
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 0.7, x: 0 }}
            exit={{ opacity: 0, x: -5 }}
            transition={{ 
              duration: 0.2,
              delay: 0.5,
              repeat: 3,
              repeatType: "mirror"
            }}
            className="absolute left-1.5"
          >
            <ChevronRight className="h-4 w-4 text-primary" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}