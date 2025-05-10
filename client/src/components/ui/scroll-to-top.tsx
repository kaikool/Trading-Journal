import { useState, useEffect, useRef } from "react";
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
}

/**
 * ScrollToTop component
 * 
 * A simple button that appears when scrolling down
 * and allows returning to the top of the page with one click.
 */
export function ScrollToTop({
  threshold = 400,
  showOnRouteChange = true,
  buttonClassName = ""
}: ScrollToTopProps = {}) {
  const [visible, setVisible] = useState(false);
  const [location] = useLocation();
  const { dialogOpen, shouldPreventScrollAfterDialogClose } = useDialog();
  
  useEffect(() => {
    // Kiểm tra vị trí cuộn để hiển thị/ẩn nút
    const handleScroll = () => {
      const scrollY = window.scrollY;
      
      // Chỉ hiển thị nút khi đã cuộn xuống đủ xa và không có dialog nào đang mở
      const shouldShow = scrollY > threshold && !dialogOpen;
      setVisible(shouldShow);
    };
    
    // Đăng ký sự kiện cuộn
    window.addEventListener("scroll", handleScroll, { passive: true });
    
    // Kiểm tra vị trí ban đầu
    handleScroll();
    
    // Hủy đăng ký khi unmount
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [threshold, dialogOpen]);
  
  // Tạm thời vô hiệu hóa cơ chế auto-scroll khi đổi route
  // Chúng ta sẽ xử lý cuộn lên đầu trang trong App.tsx
  // Cách này tránh các vấn đề với dialog mà không cần kiểm tra DOM
  
  // Ref để theo dõi thời gian click cuối cùng
  const lastClickTimeRef = useRef(0);
  
  // Hàm cuộn lên đầu trang với hiệu ứng mượt mà và phối hợp với DialogContext
  const scrollToTop = () => {
    // Ngăn chặn thực thi nếu dialog đang mở hoặc vừa đóng
    if (dialogOpen || shouldPreventScrollAfterDialogClose()) {
      console.log("[DEBUG] ScrollToTop ignored - dialog is open or just closed");
      return;
    }
    
    // Kiểm tra khoảng thời gian tối thiểu giữa các lần click
    const now = Date.now();
    const MIN_CLICK_INTERVAL = 400; // Giảm xuống từ 500ms để cải thiện phản hồi
    
    if (now - lastClickTimeRef.current > MIN_CLICK_INTERVAL) {
      // Cập nhật thời gian click cuối cùng
      lastClickTimeRef.current = now;
      
      // Ghi lại vị trí hiện tại để kiểm tra hiệu quả
      const currentPosition = window.scrollY;
      console.log("[DEBUG] ScrollToTop clicked, scrolling from position:", currentPosition);
      
      // Sử dụng Promise để xác định khi nào smooth scroll kết thúc
      const performScroll = () => {
        return new Promise<void>((resolve) => {
          // Thực hiện cuộn mượt mà
          window.scrollTo({
            top: 0,
            behavior: "smooth"
          });
          
          // Đặt một timeout để kiểm tra kết quả
          setTimeout(() => {
            // Nếu vị trí vẫn khá xa đầu trang, thực hiện cuộn tức thì
            if (window.scrollY > 100) {
              console.log("[DEBUG] Smooth scroll ineffective (position:", window.scrollY, "), forcing instant scroll");
              window.scrollTo(0, 0);
            }
            resolve();
          }, 400); // Thời gian kiểm tra dài hơn để đảm bảo smooth scroll có cơ hội hoạt động
        });
      };
      
      // Thực hiện cuộn và xử lý kết quả
      performScroll().catch(err => {
        console.error("[ERROR] ScrollToTop failed:", err);
        // Fallback: cuộn cứng nếu có lỗi
        window.scrollTo(0, 0);
      });
    } else {
      console.log("[DEBUG] ScrollToTop ignored - too many clicks");
    }
  };
  
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2 }}
          className={cn(
            "fixed z-50 right-4 bottom-24 md:right-6 md:bottom-6",
            "safe-area-pb safe-area-pr"
          )}
        >
          <Button
            variant="secondary"
            size="icon"
            onClick={scrollToTop}
            aria-label="Cuộn lên đầu trang"
            className={cn(
              "h-10 w-10 rounded-full shadow-md",
              "bg-card/90 backdrop-blur-md",
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