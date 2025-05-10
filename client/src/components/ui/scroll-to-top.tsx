import { useEffect, useState } from "react";
import { Button } from "./button";
import { cn } from "@/lib/utils";
import { ChevronUp } from "lucide-react";
import { useLocation } from "wouter";

interface ScrollToTopProps {
  threshold?: number; // Ngưỡng hiển thị nút (pixel)
  className?: string;
  buttonClassName?: string;
  showOnRouteChange?: boolean; // Có tự động cuộn lên khi route thay đổi không
}

/**
 * Component ScrollToTop - Cung cấp nút cuộn lên đầu trang và xử lý cuộn tự động khi chuyển trang
 * 
 * @param threshold Ngưỡng cuộn xuống để hiển thị nút (mặc định: 300px)
 * @param className Class bổ sung cho container
 * @param buttonClassName Class bổ sung cho nút
 * @param showOnRouteChange Tự động cuộn lên đầu trang khi route thay đổi (mặc định: true)
 */
export function ScrollToTop({
  threshold = 300,
  className,
  buttonClassName,
  showOnRouteChange = true,
}: ScrollToTopProps) {
  const [visible, setVisible] = useState(false);
  const [location] = useLocation();
  
  // Xử lý hiển thị nút dựa trên vị trí cuộn
  useEffect(() => {
    const checkScrollPosition = () => {
      // Cập nhật trạng thái hiển thị dựa vào vị trí cuộn
      const shouldBeVisible = window.scrollY > threshold;
      
      if (shouldBeVisible !== visible) {
        setVisible(shouldBeVisible);
      }
    };
    
    // Kiểm tra ngay lập tức
    checkScrollPosition();
    
    // Đăng ký sự kiện cuộn với passive=true để tối ưu hiệu suất
    window.addEventListener("scroll", checkScrollPosition, { passive: true });
    
    return () => {
      window.removeEventListener("scroll", checkScrollPosition);
    };
  }, [threshold, visible]);
  
  // Xử lý cuộn lên đầu trang khi route thay đổi
  useEffect(() => {
    if (showOnRouteChange) {
      window.scrollTo({
        top: 0,
        behavior: "instant" // Sử dụng instant để tránh animation khi chuyển trang
      });
    }
  }, [location, showOnRouteChange]);
  
  // Hàm xử lý sự kiện click vào nút
  const handleScrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth" // Sử dụng smooth cho trải nghiệm tốt khi click nút
    });
  };
  
  return (
    <div 
      className={cn(
        "fixed right-4 bottom-6 z-50 transition-opacity duration-200",
        visible ? "opacity-100" : "opacity-0 pointer-events-none",
        className
      )}
    >
      <Button
        size="icon"
        variant="secondary"
        onClick={handleScrollToTop}
        aria-label="Cuộn lên đầu trang"
        className={cn(
          "rounded-full w-10 h-10 shadow-md bg-background/80 backdrop-blur-sm",
          "hover:bg-background hover:shadow-lg",
          "focus-visible:ring-2 focus-visible:ring-offset-2",
          "transition-transform hover:scale-105 active:scale-95",
          buttonClassName
        )}
      >
        <ChevronUp className="h-5 w-5" />
      </Button>
    </div>
  );
}