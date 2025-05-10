import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons/icons";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import { useDialog } from "@/contexts/DialogContext";
import { getScrollPosition, scrollToTop, isScrolling as isGlobalScrolling } from "@/lib/scroll-utils";

interface ScrollToTopProps {
  threshold?: number;
  showOnRouteChange?: boolean;
  buttonClassName?: string;
  debounceDelay?: number; // Thời gian debounce cho click events
}

/**
 * ScrollToTop component - Phiên bản đơn giản hóa
 * 
 * Một nút đơn giản xuất hiện khi cuộn xuống và cho phép
 * quay trở lại đầu trang với một lần nhấp chuột.
 * Sử dụng utility functions từ scroll-utils.ts để giữ code đơn giản.
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
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [location] = useLocation();
  const { dialogOpen } = useDialog(); // Tích hợp với DialogContext
  
  // Ref cho thời gian click cuối cùng (debounce)
  const lastClickTimeRef = useRef<number>(0);
  
  // Lấy tham chiếu đến button để kiểm tra sự tập trung
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  // Ref cho cleanup function nếu cần hủy scroll giữa chừng
  const cleanupScrollRef = useRef<(() => void) | null>(null);
  
  // Kiểm tra xem nút có nên hiển thị không dựa trên vị trí cuộn
  const checkScrollPosition = useCallback(() => {
    // Không cập nhật trạng thái nếu dialog đang mở
    if (dialogOpen) return;
    
    // Hiển thị nút nếu đã cuộn xuống đủ xa
    setVisible(getScrollPosition() > threshold);
    
    // Cập nhật trạng thái disabled dựa trên trạng thái cuộn toàn cục
    setIsButtonDisabled(isGlobalScrolling());
  }, [threshold, dialogOpen]);
  
  // Xử lý sự kiện scroll
  useEffect(() => {
    // Đăng ký sự kiện cuộn với passive flag để tối ưu hiệu suất
    window.addEventListener("scroll", checkScrollPosition, { passive: true });
    
    // Kiểm tra vị trí ban đầu
    checkScrollPosition();
    
    // Đăng ký interval để định kỳ kiểm tra trạng thái cuộn toàn cục
    const statusInterval = setInterval(() => {
      setIsButtonDisabled(isGlobalScrolling());
    }, 200);
    
    // Hủy đăng ký khi unmount
    return () => {
      window.removeEventListener("scroll", checkScrollPosition);
      clearInterval(statusInterval);
      
      // Cleanup scroll nếu đang thực hiện
      if (cleanupScrollRef.current) {
        cleanupScrollRef.current();
        cleanupScrollRef.current = null;
      }
    };
  }, [checkScrollPosition]);
  
  // Xử lý khi dialog mở/đóng
  useEffect(() => {
    if (dialogOpen) {
      // Ẩn nút khi dialog mở
      setVisible(false);
      
      // Hủy scroll đang thực hiện nếu có
      if (cleanupScrollRef.current) {
        cleanupScrollRef.current();
        cleanupScrollRef.current = null;
      }
    } else {
      // Kiểm tra lại vị trí scroll sau khi dialog đóng
      checkScrollPosition();
    }
  }, [dialogOpen, checkScrollPosition]);
  
  // Hủy scroll khi route thay đổi
  useEffect(() => {
    return () => {
      // Cleanup scroll nếu đang thực hiện
      if (cleanupScrollRef.current) {
        cleanupScrollRef.current();
        cleanupScrollRef.current = null;
      }
    };
  }, [location]);
  
  /**
   * Xử lý khi người dùng nhấp vào nút cuộn lên đầu trang
   */
  const handleScrollToTop = useCallback(() => {
    // Debounce: Kiểm tra thời gian từ lần click cuối
    const now = Date.now();
    const timeSinceLastClick = now - lastClickTimeRef.current;
    
    // Nếu đã click gần đây, bỏ qua
    if (timeSinceLastClick < debounceDelay) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[ScrollToTop] Debouncing clicks: chỉ ${timeSinceLastClick}ms từ click trước`);
      }
      return;
    }
    
    // Cập nhật thời gian click cuối cùng
    lastClickTimeRef.current = now;
    
    // Nếu đang scroll hoặc dialog đang mở, bỏ qua
    if (isGlobalScrolling() || dialogOpen) {
      return;
    }
    
    // Ngắt scroll hiện tại nếu có
    if (cleanupScrollRef.current) {
      cleanupScrollRef.current();
      cleanupScrollRef.current = null;
    }
    
    // Lấy vị trí cuộn hiện tại
    const startPosition = getScrollPosition();
    
    // Nếu đã ở đầu trang, không làm gì cả
    if (startPosition <= 0) return;
    
    // Log trong môi trường development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[ScrollToTop] Bắt đầu scroll từ vị trí ${startPosition}px`);
    }
    
    // Kích hoạt trạng thái disabled
    setIsButtonDisabled(true);
    
    // Thực hiện scroll bằng utility function
    cleanupScrollRef.current = scrollToTop({
      speed: 'normal',
      onComplete: () => {
        setIsButtonDisabled(false);
        cleanupScrollRef.current = null;
        
        if (process.env.NODE_ENV === 'development') {
          console.log("[ScrollToTop] Đặt lại trạng thái scroll");
        }
      }
    });
  }, [dialogOpen, debounceDelay]);
  
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
            disabled={isButtonDisabled}
            className={cn(
              "h-10 w-10 rounded-full shadow-md",
              "bg-card/90 backdrop-blur-md",
              isButtonDisabled && "opacity-50 cursor-not-allowed",
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