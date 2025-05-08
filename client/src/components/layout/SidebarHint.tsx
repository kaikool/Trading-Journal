import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icons } from "@/components/icons/icons";
import { cn } from "@/lib/utils";
import { useLayout } from "@/contexts/LayoutContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useUserActivity } from "@/hooks/use-user-activity";
import { useScrollDirection } from "@/hooks/use-scroll-direction";

interface SidebarHintProps {
  onClick: () => void;
}

/**
 * SidebarHint component - Shows a minimal, elegant hint for the sidebar
 * 
 * Features:
 * - Elegant, subtle design that doesn't interfere with the UI
 * - Smart behavior based on user interaction
 * - Shows in the right moments and hides when not needed
 */
export function SidebarHint({ onClick }: SidebarHintProps) {
  const { sidebarCollapsed } = useLayout();
  const isMobile = useIsMobile();
  const { isActive } = useUserActivity(3000);
  const { direction: scrollDirection, isScrolling } = useScrollDirection();
  
  // State
  const [visible, setVisible] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(() => {
    // Check localStorage to see if user has interacted before
    return localStorage.getItem("sidebar-hint-interacted") === "true";
  });

  // Refs
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialLoadRef = useRef(true);
  const showCount = useRef(0);

  // Show on initial load if appropriate
  useEffect(() => {
    if (!isMobile && !sidebarCollapsed) {
      setVisible(false);
      return;
    }

    if (initialLoadRef.current) {
      initialLoadRef.current = false;
      
      // For first-time users, show with a slight delay
      setTimeout(() => {
        setVisible(true);
      }, hasInteracted ? 2000 : 1000);
    }
  }, [hasInteracted, isMobile, sidebarCollapsed]);

  // Show/hide based on user activity and scrolling
  useEffect(() => {
    if (!isMobile && !sidebarCollapsed) {
      setVisible(false);
      return;
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Show hint when user is scrolling up (looking for navigation)
    if (isActive && (isMobile || sidebarCollapsed)) {
      if (isScrolling && scrollDirection === 'up') {
        setVisible(true);
        showCount.current += 1;
      }
      
      // Automatically hide after a delay
      const hideDelay = hasInteracted ? 3000 : 5000;
      timeoutRef.current = setTimeout(() => {
        setVisible(false);
      }, hideDelay);
    } else if (!isActive) {
      // Hide when user is inactive
      setVisible(false);
    }

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isActive, isScrolling, scrollDirection, isMobile, sidebarCollapsed, hasInteracted]);

  // Handle click
  const handleClick = () => {
    if (!hasInteracted) {
      setHasInteracted(true);
      localStorage.setItem("sidebar-hint-interacted", "true");
    }
    onClick();
  };

  // Don't render if sidebar is visible on desktop
  if (!isMobile && !sidebarCollapsed) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, x: -5 }}
          animate={{ opacity: 0.9, x: 0 }}
          exit={{ opacity: 0, x: -5 }}
          transition={{ duration: 0.2 }}
          onClick={handleClick}
          className={cn(
            "fixed z-40 left-0 flex items-center cursor-pointer",
            isMobile ? "top-1/2 -translate-y-1/2 h-16" : "top-24 h-12"
          )}
          role="button"
          aria-label="Open sidebar"
        >
          {/* Subtle indicator */}
          <div className="h-full flex items-center">
            {/* Subtle vertical line indicator */}
            <div className={cn(
              isMobile ? "h-10" : "h-6",
              "w-0.5 rounded-r-full",
              "bg-gradient-to-b from-primary/20 via-primary/40 to-primary/20",
            )} />
            
            {/* Small button with arrow */}
            <div className={cn(
              "bg-card/5 backdrop-blur-sm",
              "border-r border-t border-b border-border/10",
              "rounded-r-md shadow-sm",
              "py-1 pl-0.5 pr-1.5",
              "flex items-center justify-center",
              "transition-all duration-200",
              "hover:bg-card/10 hover:border-border/20 hover:shadow"
            )}>
              <Icons.ui.chevronRight className="h-3 w-3 text-primary/60" />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}