import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
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
 */
export function SidebarHint({ onClick }: SidebarHintProps) {
  const { sidebarCollapsed } = useLayout();
  const isMobile = useIsMobile();
  const { isActive } = useUserActivity(3000);
  const dragControls = useDragControls();
  
  // State
  const [visible, setVisible] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(() => {
    // Check localStorage to see if user has interacted before
    return localStorage.getItem("sidebar-hint-interacted") === "true";
  });
  const [position, setPosition] = useState<{y: number}>(() => {
    // Get saved position from localStorage or use default
    const savedPos = localStorage.getItem("sidebar-hint-position");
    return savedPos ? JSON.parse(savedPos) : { y: isMobile ? window.innerHeight / 2 : 100 };
  });

  // Refs
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialLoadRef = useRef(true);
  const showCount = useRef(0);
  const isDragging = useRef(false);

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

  // Handle drag end - save position
  const handleDragEnd = (event: any, info: any) => {
    isDragging.current = false;
    // Update position
    const newPosition = { y: position.y + info.offset.y };
    setPosition(newPosition);
    // Save position to localStorage
    localStorage.setItem("sidebar-hint-position", JSON.stringify(newPosition));
  };

  // Start dragging
  const handleDragStart = () => {
    isDragging.current = true;
  };

  // Handle click - don't toggle sidebar if we're dragging
  const handleClick = () => {
    if (isDragging.current) return;
    
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
          animate={{ opacity: 1, x: 0, y: position.y }}
          exit={{ opacity: 0, x: -8 }}
          transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
          onClick={handleClick}
          className={cn(
            "fixed z-40 left-0 flex items-center cursor-move sidebar-hint-pulse",
            "h-auto"
          )}
          role="button"
          aria-label="Open sidebar"
          drag="y"
          dragControls={dragControls}
          dragConstraints={{ top: 10, bottom: window.innerHeight - 100 }}
          dragElastic={0.1}
          dragMomentum={false}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          whileDrag={{ scale: 1.05 }}
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