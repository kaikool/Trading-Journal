import { useState, useEffect } from "react";
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
  
  useEffect(() => {
    // Kiểm tra vị trí cuộn để hiển thị/ẩn nút
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setVisible(scrollY > threshold);
    };
    
    // Đăng ký sự kiện cuộn
    window.addEventListener("scroll", handleScroll, { passive: true });
    
    // Kiểm tra vị trí ban đầu
    handleScroll();
    
    // Hủy đăng ký khi unmount
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);
  
  // Xử lý khi route thay đổi
  useEffect(() => {
    if (showOnRouteChange) {
      // Tự động cuộn lên đầu trang khi route thay đổi
      window.scrollTo({ top: 0 });
    }
  }, [location, showOnRouteChange]);
  
  // Hàm cuộn lên đầu trang êm dịu
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
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