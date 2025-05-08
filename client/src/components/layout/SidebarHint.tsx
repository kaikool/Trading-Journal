import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from "framer-motion";
import { 
  ChevronRight, 
  PanelLeftOpen, 
  Sparkles, 
  EyeIcon, 
  PlayIcon,
  PauseIcon,
  Fingerprint,
  Lightbulb
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLayout } from "@/contexts/LayoutContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useUserActivity } from "@/hooks/use-user-activity";
import { useScrollDirection } from "@/hooks/use-scroll-direction";

interface SidebarHintProps {
  onClick: () => void;
}

/**
 * SidebarHint component - Hiển thị gợi ý sidebar với các hiệu ứng tương tác
 * 
 * Tính năng:
 * - Hiển thị gợi ý khi sidebar đang ẩn
 * - Tự động ẩn khi không hoạt động
 * - Animation mượt mà với Framer Motion
 * - Hoạt động trên cả mobile và desktop
 * - Thiết kế thích ứng dựa trên hành vi người dùng
 * - Hiệu ứng tương tác thú vị khi hover và chạm
 */
export function SidebarHint({ onClick }: SidebarHintProps) {
  const { sidebarCollapsed } = useLayout();
  const isMobile = useIsMobile();
  const { isActive } = useUserActivity(2000);
  const { direction: scrollDirection, isScrolling } = useScrollDirection();
  
  // Interactive state
  const [visible, setVisible] = useState(false);
  const [interactive, setInteractive] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [sparkleMode, setSparkleMode] = useState(false);
  const [hideStreak, setHideStreak] = useState(0);
  const [unlockLevel, setUnlockLevel] = useState(() => {
    return parseInt(localStorage.getItem("sidebar-hint-level") || "0");
  });
  
  // User interaction history
  const [interactionCount, setInteractionCount] = useState(() => {
    return parseInt(localStorage.getItem("sidebar-hint-count") || "0");
  });
  const [hasInteracted, setHasInteracted] = useState(() => {
    const interacted = localStorage.getItem("sidebar-hint-interacted");
    return interacted === "true";
  });
  const [hasSeenHint, setHasSeenHint] = useState(() => {
    const lastSeen = localStorage.getItem("sidebar-hint-last-seen");
    if (lastSeen) {
      const lastSeenDate = new Date(lastSeen);
      const now = new Date();
      const hoursPassed = (now.getTime() - lastSeenDate.getTime()) / (1000 * 60 * 60);
      return hoursPassed < 24;
    }
    return false;
  });
  
  // Mouse and touch motion tracking
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotation = useTransform(mouseX, [-100, 0, 100], [-10, 0, 10]);
  const scale = useTransform(mouseY, [-100, 0, 100], [0.95, 1, 0.95]);
  const brightness = useTransform(mouseX, [-100, 0, 100], [0.8, 1, 1.2]);
  
  // Drag gesture
  const dragX = useMotionValue(0);
  const dragOpacity = useTransform(dragX, [-40, -20, 0, 20, 40], [0.3, 0.7, 1, 0.7, 0.3]);
  const dragScale = useTransform(dragX, [-40, 0, 40], [0.9, 1, 0.9]);
  const dragRotate = useTransform(dragX, [-40, 0, 40], [-5, 0, 5]);
  const springX = useSpring(dragX, { stiffness: 400, damping: 25 });
  
  // Refs for timers and element references
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const streakRef = useRef<NodeJS.Timeout | null>(null);
  const sparkleRef = useRef<NodeJS.Timeout | null>(null);
  const initialLoadRef = useRef(true);
  
  // Track touch/pointer interactions
  const touchStartRef = useRef<{ x: number, y: number }>({ x: 0, y: 0 });
  const touchTimeRef = useRef<number>(0);

  // Thay đổi hành vi dựa trên người dùng mới hay cũ
  useEffect(() => {
    if (!isMobile && !sidebarCollapsed) {
      setVisible(false);
      return;
    }

    if (initialLoadRef.current) {
      initialLoadRef.current = false;
      
      // Người dùng mới: hiện gợi ý với hiệu ứng nổi bật hơn
      if (!hasInteracted) {
        setTimeout(() => {
          setVisible(true);
          setInteractive(true);
        }, 1000);
      } 
      // Người dùng đã tương tác nhưng chưa xem hôm nay
      else if (!hasSeenHint) {
        setTimeout(() => {
          setVisible(true);
        }, 2000);
      }
      // Người dùng thường xuyên tương tác (cấp độ cao)
      else if (unlockLevel >= 3) {
        setTimeout(() => {
          setVisible(true);
          setSparkleMode(true);
        }, 3000);
      }
      
      // Ghi nhận đã xem hint hôm nay
      localStorage.setItem("sidebar-hint-last-seen", new Date().toISOString());
      setHasSeenHint(true);
    }
  }, [hasInteracted, hasSeenHint, isMobile, sidebarCollapsed, unlockLevel]);

  // Hiện/ẩn dựa trên hoạt động của người dùng
  useEffect(() => {
    if (!isMobile && !sidebarCollapsed) {
      setVisible(false);
      return;
    }

    // Xóa timeout hiện tại
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Hiện gợi ý khi người dùng đang hoạt động và sidebar đang ẩn
    if (isActive && (isMobile || sidebarCollapsed)) {
      // Hiện gợi ý khi cuộn lên hoặc khi người dùng thường xuyên tương tác
      if ((isScrolling && scrollDirection === 'up') || unlockLevel >= 2) {
        setVisible(true);
      } 
      
      // Thời gian hiển thị dựa vào tương tác của người dùng
      let hideDelay = 4000; // Mặc định
      
      // Người dùng thường xuyên (cấp độ cao) thì hiển thị lâu hơn
      if (unlockLevel >= 2) hideDelay = 6000;
      
      // Đã tương tác thì hiển thị ngắn hơn
      if (hasInteracted && unlockLevel < 2) hideDelay = 3000;
      
      timeoutRef.current = setTimeout(() => {
        setVisible(false);
        // Khi ẩn đi, tăng streak ẩn
        setHideStreak(prev => {
          const newStreak = prev + 1;
          
          // Nếu đạt 3 lần ẩn liên tiếp, kích hoạt chế độ tương tác
          if (newStreak >= 3 && unlockLevel < 1) {
            setUnlockLevel(1);
            localStorage.setItem("sidebar-hint-level", "1");
            
            // Hiện lại sau khi đạt streak với chế độ tương tác
            setTimeout(() => {
              setVisible(true);
              setInteractive(true);
            }, 1000);
          }
          
          return newStreak;
        });
      }, hideDelay);
    } else if (!isActive) {
      // Ẩn khi người dùng không hoạt động
      setVisible(false);
    }

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isActive, isScrolling, scrollDirection, isMobile, sidebarCollapsed, hasInteracted, unlockLevel]);

  // Xử lý khi hover
  const handleHoverStart = () => {
    setHovered(true);
    
    // Chỉ kích hoạt hiệu ứng đặc biệt khi đạt cấp độ tương tác
    if (unlockLevel >= 2) {
      setSparkleMode(true);
      
      // Để cho hiệu ứng tắt sau một thời gian
      if (sparkleRef.current) clearTimeout(sparkleRef.current);
      sparkleRef.current = setTimeout(() => {
        setSparkleMode(false);
      }, 2000);
    }
  };

  const handleHoverEnd = () => {
    setHovered(false);
  };

  // Xử lý chạm/touch
  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    // Lưu vị trí ban đầu
    if ('touches' in e) {
      touchStartRef.current = { 
        x: e.touches[0].clientX, 
        y: e.touches[0].clientY 
      };
    } else {
      touchStartRef.current = { 
        x: (e as React.MouseEvent).clientX, 
        y: (e as React.MouseEvent).clientY 
      };
    }
    
    touchTimeRef.current = Date.now();
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    // Cập nhật vị trí di chuyển cho hiệu ứng theo ngón tay
    let clientX, clientY;
    
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    
    // Tính toán vị trí tương đối
    const rect = hintRef.current?.getBoundingClientRect();
    if (rect) {
      const x = clientX - rect.left - rect.width / 2;
      const y = clientY - rect.top - rect.height / 2;
      
      mouseX.set(x);
      mouseY.set(y);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent | React.MouseEvent) => {
    // Tính thời gian chạm
    const touchDuration = Date.now() - touchTimeRef.current;
    
    // Tính khoảng cách di chuyển
    let endX;
    if ('changedTouches' in e) {
      endX = e.changedTouches[0].clientX;
    } else {
      endX = (e as React.MouseEvent).clientX;
    }
    
    const deltaX = endX - touchStartRef.current.x;
    
    // Nếu chạm nhanh (tap)
    if (touchDuration < 300 && Math.abs(deltaX) < 10) {
      // Tăng số lần tương tác
      const newCount = interactionCount + 1;
      setInteractionCount(newCount);
      localStorage.setItem("sidebar-hint-count", String(newCount));
      
      // Kiểm tra cột mốc tương tác để mở khóa thêm tính năng
      if (newCount >= 5 && unlockLevel < 2) {
        setUnlockLevel(2);
        localStorage.setItem("sidebar-hint-level", "2");
        setSparkleMode(true);
        
        if (sparkleRef.current) clearTimeout(sparkleRef.current);
        sparkleRef.current = setTimeout(() => {
          setSparkleMode(false);
        }, 3000);
      }
      
      // Kiểm tra cột mốc tương tác cao
      if (newCount >= 10 && unlockLevel < 3) {
        setUnlockLevel(3);
        localStorage.setItem("sidebar-hint-level", "3");
      }
      
      if (!hasInteracted) {
        setHasInteracted(true);
        localStorage.setItem("sidebar-hint-interacted", "true");
      }
      
      // Reset streak
      setHideStreak(0);
      
      // Mở sidebar
      onClick();
    }
    
    // Reset mouse position
    mouseX.set(0);
    mouseY.set(0);
  };

  // Cleanup khi unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (streakRef.current) clearTimeout(streakRef.current);
      if (sparkleRef.current) clearTimeout(sparkleRef.current);
    };
  }, []);

  // Không render nếu sidebar đã mở (trên desktop)
  if (!isMobile && !sidebarCollapsed) {
    return null;
  }

  // Lựa chọn icon dựa vào cấp độ tương tác
  const getHintIcon = () => {
    if (sparkleMode) return <Sparkles className="h-5 w-5 text-amber-400" />;
    if (unlockLevel >= 3) return <Lightbulb className="h-5 w-5 text-primary" />;
    if (unlockLevel >= 2) return <Fingerprint className="h-5 w-5 text-primary" />;
    if (unlockLevel >= 1) return <PanelLeftOpen className="h-5 w-5 text-primary" />;
    return <ChevronRight className="h-4 w-4 text-primary" />;
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          ref={hintRef}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.3, type: "spring", stiffness: 500 }}
          className={cn(
            "fixed z-40 left-0 transform",
            // Vị trí dựa vào thiết bị
            isMobile 
              ? "top-1/2 -translate-y-1/2" 
              : "top-20",
            "flex items-center justify-center",
            "cursor-pointer",
            "select-none"
          )}
          onTouchStart={handleTouchStart}
          onMouseDown={handleTouchStart}
          onTouchMove={handleTouchMove}
          onMouseMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseUp={handleTouchEnd}
          onHoverStart={handleHoverStart}
          onHoverEnd={handleHoverEnd}
          style={{
            rotate: rotation,
            scale: scale,
            filter: `brightness(${brightness})`,
          }}
        >
          {/* Hiệu ứng sparkle khi đạt cấp độ cao */}
          {sparkleMode && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ 
                duration: 2,
                repeat: 3,
                repeatType: "loop"
              }}
              className="absolute inset-0 -z-10 overflow-hidden"
            >
              {Array(6).fill(0).map((_, i) => (
                <motion.div 
                  key={i}
                  className="absolute w-1 h-1 bg-amber-300 rounded-full"
                  initial={{ 
                    x: 0, 
                    y: 0,
                    scale: 0.2,
                    opacity: 0
                  }}
                  animate={{ 
                    x: [0, (Math.random() - 0.5) * 50], 
                    y: [0, (Math.random() - 0.5) * 50],
                    scale: [0.2, 1.5, 0],
                    opacity: [0, 1, 0]
                  }}
                  transition={{ 
                    duration: 1.5,
                    delay: i * 0.2,
                    repeat: 3,
                    repeatType: "loop"
                  }}
                />
              ))}
            </motion.div>
          )}

          {/* Container chính */}
          <motion.div 
            className={cn(
              "rounded-r-lg overflow-hidden",
              "bg-gradient-to-br from-card to-background",
              "border-r border-t border-b border-border",
              "shadow-lg",
              "py-3 px-3",
              interactive && "transition-all duration-300",
              hovered && "bg-gradient-to-br from-background to-card"
            )}
            whileHover={interactive ? { scale: 1.05, x: 3 } : {}}
            whileTap={interactive ? { scale: 0.95 } : {}}
          >
            {/* Hiệu ứng viền sáng khi hover */}
            {(hovered || sparkleMode) && (
              <motion.div 
                className="absolute inset-0 rounded-r-lg -z-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  background: `radial-gradient(circle at center, ${
                    sparkleMode ? "rgba(251, 191, 36, 0.3)" : "rgba(var(--primary), 0.15)"
                  }, transparent 70%)`,
                }}
              />
            )}

            {/* Icon và nội dung */}
            <div className="flex items-center space-x-2">
              {/* Icon với hiệu ứng */}
              <motion.div
                className={cn(
                  "flex items-center justify-center",
                  "bg-background/40 backdrop-blur-sm",
                  "rounded-md p-1.5",
                  "border border-border/30",
                  "shadow-sm",
                  hovered && "border-primary/30"
                )}
                animate={interactive ? {
                  scale: [1, 1.1, 1],
                } : {}}
                transition={interactive ? {
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "loop",
                } : {}}
              >
                {getHintIcon()}
              </motion.div>

              {/* Text hiển thị với cấp độ cao */}
              {unlockLevel >= 2 && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden whitespace-nowrap"
                >
                  <span className="text-sm font-medium text-foreground/90">
                    {sparkleMode ? "Mở Menu" : "Menu"}
                  </span>
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}