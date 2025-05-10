import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons/icons";
import { cn } from "@/lib/utils";
import { useDialog } from "@/contexts/DialogContext";

interface ScrollToTopProps {
  threshold?: number;
  buttonClassName?: string;
}

/**
 * ScrollToTop component - Phiên bản đơn giản
 * 
 * Một nút đơn giản xuất hiện khi cuộn xuống và cho phép
 * quay trở lại đầu trang với một lần nhấp chuột.
 */
export function ScrollToTop({
  threshold = 400,
  buttonClassName = ""
}: ScrollToTopProps = {}) {
  // State để kiểm soát hiển thị nút
  const [visible, setVisible] = useState(false);
  // State đơn giản để vô hiệu hóa nút khi đang scroll
  const [isScrolling, setIsScrolling] = useState(false);
  const { dialogOpen } = useDialog();
  
  // Kiểm tra vị trí cuộn để hiển thị/ẩn nút
  useEffect(() => {
    const checkScroll = () => {
      // Không cập nhật nếu dialog đang mở
      if (dialogOpen) return;
      
      // Hiển thị nút khi cuộn xuống quá ngưỡng
      setVisible(window.scrollY > threshold);
    };
    
    // Đăng ký sự kiện với passive flag để tối ưu hiệu suất
    window.addEventListener("scroll", checkScroll, { passive: true });
    
    // Kiểm tra ban đầu
    checkScroll();
    
    // Dọn dẹp khi unmount
    return () => {
      window.removeEventListener("scroll", checkScroll);
    };
  }, [threshold, dialogOpen]);
  
  // Ẩn nút khi dialog mở
  useEffect(() => {
    if (dialogOpen) {
      setVisible(false);
    }
  }, [dialogOpen]);
  
  // Xử lý khi nhấp nút
  const handleScrollToTop = () => {
    // Không làm gì nếu đang scroll
    if (isScrolling) return;
    
    // Lấy vị trí cuộn hiện tại
    const currentPosition = window.scrollY || document.documentElement.scrollTop;
    
    // Nếu đã ở đầu trang, không làm gì cả
    if (currentPosition <= 0) return;
    
    // Log cho debugging
    if (process.env.NODE_ENV === 'development') {
      console.log(`[ScrollToTop] Bắt đầu scroll từ vị trí ${currentPosition}px`);
    }
    
    // Đánh dấu đang scrolling
    setIsScrolling(true);
    
    // Sử dụng API có sẵn của trình duyệt
    window.scrollTo({
      top: 0, 
      behavior: 'smooth'
    });
    
    // Đặt lại trạng thái sau 600ms
    setTimeout(() => {
      setIsScrolling(false);
      
      if (process.env.NODE_ENV === 'development') {
        console.log("[ScrollToTop] Đặt lại trạng thái scroll");
      }
    }, 600);
  };
  
  // Không hiển thị nút nếu dialog đang mở hoặc không visible
  if (!visible || dialogOpen) {
    return null;
  }
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.2 }}
        className="fixed z-50 right-4 bottom-24 md:right-6 md:bottom-6 safe-area-pb safe-area-pr"
      >
        <Button
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
    </AnimatePresence>
  );
}