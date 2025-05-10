import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons/icons";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import { useDialog } from "@/contexts/DialogContext";

interface ScrollToTopProps {
  threshold?: number;
  showOnRouteChange?: boolean;
  buttonClassName?: string;
  debounceDelay?: number; // Thời gian debounce cho click events
}

/**
 * Hàm tiện ích để lấy vị trí cuộn hiện tại
 * @returns Current scroll position in pixels
 */
function getScrollPosition(): number {
  return window.scrollY || document.documentElement.scrollTop;
}

/**
 * ScrollToTop component - Phiên bản tối ưu hóa
 * 
 * Một nút đơn giản xuất hiện khi cuộn xuống và cho phép
 * quay trở lại đầu trang với một lần nhấp chuột. Có tích hợp
 * với DialogContext và cài đặt cơ chế chống lỗi.
 */
export function ScrollToTop({
  threshold = 400,
  showOnRouteChange = true,
  buttonClassName = "",
  debounceDelay = 250 // 250ms debounce mặc định
}: ScrollToTopProps = {}) {
  // State để kiểm soát hiển thị nút
  const [visible, setVisible] = useState(false);
  // State để theo dõi trạng thái scroll đang diễn ra
  const [isScrolling, setIsScrolling] = useState(false);
  const [location] = useLocation();
  const { dialogOpen } = useDialog(); // Tích hợp với DialogContext
  
  // Refs để quản lý timeouts và lưu trữ thông tin
  const timeoutsRef = useRef<{
    debounce: NodeJS.Timeout | null;
    scroll: NodeJS.Timeout | null;
    fallback: NodeJS.Timeout | null;
    reset: NodeJS.Timeout | null;
    safety: NodeJS.Timeout | null;
  }>({
    debounce: null,
    scroll: null,
    fallback: null,
    reset: null,
    safety: null
  });
  
  // Ref cho vị trí cuộn ban đầu
  const scrollInfoRef = useRef<{
    lastClickTime: number;
    startPosition: number;
  }>({
    lastClickTime: 0,
    startPosition: 0
  });
  
  // Lấy tham chiếu đến button để kiểm tra sự tập trung
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  // Kiểm tra xem trang có đang ở trạng thái cuộn không
  const checkScrollPosition = useCallback(() => {
    // Không cập nhật trạng thái nếu dialog đang mở
    if (dialogOpen) return;
    
    // Kiểm tra position Y
    const scrollTop = getScrollPosition();
    
    // Hiển thị nút nếu đã cuộn xuống đủ xa
    setVisible(scrollTop > threshold);
  }, [threshold, dialogOpen]);
  
  // Xử lý sự kiện scroll
  useEffect(() => {
    // Đăng ký sự kiện cuộn với passive flag để tối ưu hiệu suất
    window.addEventListener("scroll", checkScrollPosition, { passive: true });
    
    // Kiểm tra vị trí ban đầu
    checkScrollPosition();
    
    // Hủy đăng ký khi unmount
    return () => {
      window.removeEventListener("scroll", checkScrollPosition);
    };
  }, [checkScrollPosition]);
  
  // Xử lý khi dialog mở/đóng
  useEffect(() => {
    if (dialogOpen) {
      // Ẩn nút khi dialog mở
      setVisible(false);
    } else {
      // Kiểm tra lại vị trí scroll sau khi dialog đóng
      checkScrollPosition();
    }
  }, [dialogOpen, checkScrollPosition]);
  
  // Xóa tất cả các timeout khi component unmount hoặc route thay đổi
  const clearAllTimeouts = useCallback(() => {
    const { debounce, scroll, fallback, reset, safety } = timeoutsRef.current;
    if (debounce) clearTimeout(debounce);
    if (scroll) clearTimeout(scroll);
    if (fallback) clearTimeout(fallback);
    if (reset) clearTimeout(reset);
    if (safety) clearTimeout(safety);
    
    // Reset các tham chiếu
    timeoutsRef.current = {
      debounce: null,
      scroll: null,
      fallback: null,
      reset: null,
      safety: null
    };
  }, []);
  
  // Đặt lại trạng thái scrolling và xóa các timeout
  const resetScrollingState = useCallback(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log("[ScrollToTop] Đặt lại trạng thái scroll");
    }
    setIsScrolling(false);
    clearAllTimeouts();
  }, [clearAllTimeouts]);
  
  // Cleanup khi component unmount
  useEffect(() => {
    return () => {
      clearAllTimeouts();
    };
  }, [clearAllTimeouts]);
  
  // Cleanup khi route thay đổi
  useEffect(() => {
    return () => {
      resetScrollingState();
    };
  }, [location, resetScrollingState]);
  
  /**
   * Hàm cuộn lên đầu trang - Cài đặt với cơ chế chống lỗi
   */
  const handleScrollToTop = useCallback(() => {
    // Kiểm tra debounce - tránh nhiều lần click liên tiếp
    const now = Date.now();
    const timeSinceLastClick = now - scrollInfoRef.current.lastClickTime;
    
    // Nếu đã click gần đây, bỏ qua
    if (timeSinceLastClick < debounceDelay) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[ScrollToTop] Debouncing clicks: chỉ ${timeSinceLastClick}ms từ click trước`);
      }
      return;
    }
    
    // Cập nhật thời gian click cuối cùng
    scrollInfoRef.current.lastClickTime = now;
    
    // Không thực hiện gì nếu đang trong quá trình cuộn
    if (isScrolling) {
      if (process.env.NODE_ENV === 'development') {
        console.log("[ScrollToTop] Đang scroll, bỏ qua request");
      }
      return;
    }
    
    // Không thực hiện gì nếu dialog đang mở
    if (dialogOpen) {
      if (process.env.NODE_ENV === 'development') {
        console.log("[ScrollToTop] Dialog đang mở, bỏ qua scroll");
      }
      return;
    }
    
    // Ghi lại vị trí cuộn hiện tại
    const startPosition = getScrollPosition();
    scrollInfoRef.current.startPosition = startPosition;
    
    // Nếu đã ở đầu trang, không làm gì cả
    if (startPosition <= 0) {
      if (process.env.NODE_ENV === 'development') {
        console.log("[ScrollToTop] Đã ở đầu trang, không cần scroll");
      }
      return;
    }
    
    // Log trong môi trường development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[ScrollToTop] Bắt đầu scroll từ vị trí ${startPosition}px`);
    }
    
    // Đánh dấu đang trong quá trình cuộn
    setIsScrolling(true);
    
    // Thực hiện scroll bằng requestAnimationFrame để tối ưu hiệu suất
    try {
      // Sử dụng native API để cuộn mượt
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
      
      // Giải pháp dự phòng nếu scrollTo với behavior smooth không hoạt động sau 600ms
      const fallbackTimeout = setTimeout(() => {
        const currentPos = getScrollPosition();
        if (currentPos > 5) {
          if (process.env.NODE_ENV === 'development') {
            console.log(`[ScrollToTop] Fallback: Scroll đã hoạt động một phần (${currentPos}px còn lại), force scroll`);
          }
          window.scrollTo(0, 0);
        }
      }, 600);
      
      // Lưu tham chiếu để có thể clear khi cần
      timeoutsRef.current.fallback = fallbackTimeout;
      
      // Đặt lại trạng thái sau khi cuộn hoàn tất
      const resetTimeout = setTimeout(() => {
        resetScrollingState();
      }, 1000);
      
      // Lưu tham chiếu để có thể clear khi cần
      timeoutsRef.current.reset = resetTimeout;
      
      // Safety timeout - đảm bảo trạng thái luôn được đặt lại sau tối đa 2000ms
      const safetyTimeout = setTimeout(() => {
        if (isScrolling) {
          if (process.env.NODE_ENV === 'development') {
            console.log("[ScrollToTop] Safety reset: Đặt lại trạng thái scroll sau 2000ms");
          }
          resetScrollingState();
        }
      }, 2000);
      
      // Lưu tham chiếu để có thể clear khi cần
      timeoutsRef.current.safety = safetyTimeout;
      
    } catch (error) {
      console.error("[ScrollToTop] Lỗi khi scroll:", error);
      // Fallback nếu có lỗi - scroll tức thì và đặt lại trạng thái
      window.scrollTo(0, 0);
      resetScrollingState();
    }
  }, [isScrolling, dialogOpen, debounceDelay, resetScrollingState]);
  
  // Không hiển thị nút nếu dialog đang mở
  if (dialogOpen) {
    return null;
  }
  
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2 }}
          className="fixed z-50 right-4 bottom-24 md:right-6 md:bottom-6 safe-area-pb safe-area-pr"
          style={{ 
            touchAction: "none" // Ngăn các sự kiện touch gây ảnh hưởng không mong muốn 
          }}
        >
          <Button
            ref={buttonRef}
            variant="secondary"
            size="icon"
            onClick={handleScrollToTop}
            aria-label="Cuộn lên đầu trang"
            disabled={isScrolling}
            className={cn(
              "h-10 w-10 rounded-full shadow-md",
              "bg-card/90 backdrop-blur-md",
              isScrolling && "opacity-50 cursor-not-allowed",
              buttonClassName
            )}
          >
            <Icons.ui.chevronUp className="h-5 w-5" />
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}