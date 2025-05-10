import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons/icons";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

interface ScrollToTopProps {
  threshold?: number;
  showOnRouteChange?: boolean;
  buttonClassName?: string;
}

/**
 * ScrollToTop component - Phiên bản mới xây dựng từ đầu
 * 
 * Một nút đơn giản xuất hiện khi cuộn xuống và cho phép
 * quay trở lại đầu trang với một lần nhấp chuột.
 */
export function ScrollToTop({
  threshold = 400,
  showOnRouteChange = true,
  buttonClassName = ""
}: ScrollToTopProps = {}) {
  // State để kiểm soát hiển thị nút
  const [visible, setVisible] = useState(false);
  // State để theo dõi trạng thái scroll đang diễn ra
  const [isScrolling, setIsScrolling] = useState(false);
  const [location] = useLocation();
  
  // Kiểm tra xem trang có đang ở trạng thái cuộn không
  const checkIfScrolling = useCallback(() => {
    // Chỉ cần kiểm tra position Y
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    
    // Hiển thị nút nếu đã cuộn xuống đủ xa
    setVisible(scrollTop > threshold);
  }, [threshold]);
  
  // Xử lý sự kiện scroll
  useEffect(() => {
    // Đăng ký sự kiện cuộn với passive flag để tối ưu hiệu suất
    window.addEventListener("scroll", checkIfScrolling, { passive: true });
    
    // Kiểm tra vị trí ban đầu
    checkIfScrolling();
    
    // Hủy đăng ký khi unmount
    return () => {
      window.removeEventListener("scroll", checkIfScrolling);
    };
  }, [checkIfScrolling]);
  
  // Lấy tham chiếu đến button để kiểm tra sự tập trung
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  
  /**
   * Hàm cuộn lên đầu trang - Cài đặt lại từ đầu để tránh xung đột
   */
  const handleScrollToTop = useCallback(() => {
    // Không thực hiện gì nếu đang trong quá trình cuộn
    if (isScrolling) {
      console.log("[ScrollToTop] Đang scroll, bỏ qua request");
      return;
    }
    
    // Ghi lại vị trí cuộn hiện tại
    const startPosition = window.scrollY || document.documentElement.scrollTop;
    
    // Nếu đã ở đầu trang, không làm gì cả
    if (startPosition <= 0) {
      console.log("[ScrollToTop] Đã ở đầu trang, không cần scroll");
      return;
    }
    
    console.log(`[ScrollToTop] Bắt đầu scroll từ vị trí ${startPosition}px`);
    
    // Đánh dấu đang trong quá trình cuộn
    setIsScrolling(true);
    
    // Thực hiện cuộn mượt
    try {
      // Sử dụng native API để cuộn
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
      
      // Giải pháp dự phòng nếu scrollTo với behavior smooth không hoạt động
      const fallbackScroll = setTimeout(() => {
        // Kiểm tra vị trí hiện tại, nếu chưa về đầu trang thì force scroll
        const currentPos = window.scrollY || document.documentElement.scrollTop;
        if (currentPos > 5) {
          console.log(`[ScrollToTop] Fallback: Scroll đã hoạt động một phần (${currentPos}px còn lại), force scroll`);
          window.scrollTo(0, 0);
        }
      }, 600);
      
      // Đặt lại trạng thái sau khi cuộn hoàn tất
      const resetScrollingState = setTimeout(() => {
        console.log("[ScrollToTop] Đặt lại trạng thái scroll");
        setIsScrolling(false);
        clearTimeout(fallbackScroll);
      }, 1000);
      
      return () => {
        clearTimeout(fallbackScroll);
        clearTimeout(resetScrollingState);
      };
    } catch (error) {
      console.error("[ScrollToTop] Lỗi khi scroll:", error);
      // Fallback nếu có lỗi - scroll tức thì
      window.scrollTo(0, 0);
      setIsScrolling(false);
    }
  }, [isScrolling]);
  
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2 }}
          className="fixed z-50 right-4 bottom-24 md:right-6 md:bottom-6 safe-area-pb safe-area-pr"
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