import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icons } from "@/components/icons/icons";
import { cn } from "@/lib/utils";
import { useLayout } from "@/contexts/LayoutContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useUserActivity } from "@/hooks/use-user-activity";

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
 * - Fixed position at 1/3 from the bottom of the screen
 */
export function SidebarHint({ onClick }: SidebarHintProps) {
  const { sidebarCollapsed } = useLayout();
  const isMobile = useIsMobile();
  const { isActive } = useUserActivity(3000);
  
  // State
  const [visible, setVisible] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(() => {
    // Check localStorage to see if user has interacted before
    return localStorage.getItem("sidebar-hint-interacted") === "true";
  });
  
  // Calculate fixed position - 1/3 from the bottom of screen
  const [fixedPosition, setFixedPosition] = useState(() => {
    return window.innerHeight * (2/3); // 2/3 of the way down from the top (1/3 from bottom)
  });

  // Update position if window is resized
  useEffect(() => {
    const handleResize = () => {
      setFixedPosition(window.innerHeight * (2/3));
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  // Show/hide based on user activity with improved visibility
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

    // Hiển thị hint khi người dùng đang hoạt động
    if (isActive && (isMobile || sidebarCollapsed)) {
      setVisible(true);
      showCount.current += 1;
      
      // Hiển thị trong thời gian ngắn hơn
      const hideDelay = hasInteracted ? 5000 : 8000;
      
      // Thiết lập timeout để ẩn hint sau một thời gian
      timeoutRef.current = setTimeout(() => {
        setVisible(false);
      }, hideDelay);
    } else if (!isActive) {
      // Vẫn hiển thị trong một khoảng thời gian ngắn khi người dùng không hoạt động
      const inactiveDelay = 3000;
      timeoutRef.current = setTimeout(() => {
        setVisible(false);
      }, inactiveDelay);
    }

    // Hiển thị định kỳ hint mỗi 60 giây nếu người dùng ở trong ứng dụng
    const periodicInterval = setInterval(() => {
      if (isActive && (isMobile || sidebarCollapsed) && !visible) {
        setVisible(true);
        
        // Tự động ẩn sau 5 giây
        setTimeout(() => {
          setVisible(false);
        }, 5000);
      }
    }, 60000); // 60 giây

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      clearInterval(periodicInterval);
    };
  }, [isActive, isMobile, sidebarCollapsed, hasInteracted, visible]);

  // Handle click - mark as interacted and toggle sidebar
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
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0, y: fixedPosition }}
          exit={{ opacity: 0, x: -8 }}
          transition={{ duration: 0.3, type: "tween", ease: "easeOut" }}
          onClick={handleClick}
          className={cn(
            "fixed z-40 left-0 flex items-center cursor-pointer sidebar-hint-pulse",
            "h-auto"
          )}
          role="button"
          aria-label="Open sidebar"
        >
          {/* Button with menu icon */}
          <div className={cn(
            "bg-primary/10 backdrop-blur-md",
            "border border-border",
            "rounded-r-lg shadow-sm",
            "py-1.5 px-2",
            "flex items-center justify-center",
            "transition-all duration-200",
            "hover:bg-muted hover:border-border hover:shadow",
            isMobile ? "w-12" : "w-9"
          )}>
            <div className="flex flex-col items-center">
              <Icons.ui.menu className={cn(
                "text-primary", 
                isMobile ? "h-5 w-5" : "h-4 w-4"
              )} />
              {isMobile && (
                <span className="text-[10px] mt-0.5 text-primary font-medium">Menu</span>
              )}
              {!isMobile && (
                <span className="text-[8px] mt-0.5 text-primary font-medium">Menu</span>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}