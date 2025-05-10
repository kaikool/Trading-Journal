import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Component hiển thị nút cuộn lên đầu trang, với hiệu ứng ẩn/hiện dựa trên vị trí cuộn
 * Phiên bản đơn giản hóa 2023 với chỉ một mục đích: giúp người dùng cuộn lên đầu trang
 * khi họ muốn, thay vì dựa vào auto-scroll
 */
export function ScrollToTop() {
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  // Theo dõi vị trí cuộn để hiển thị/ẩn nút
  useEffect(() => {
    const handleScroll = () => {
      // Hiển thị nút khi người dùng đã cuộn xuống ít nhất 300px
      const scrollThreshold = 300;
      const shouldShow = window.scrollY > scrollThreshold;
      
      if (shouldShow !== showScrollTop) {
        setShowScrollTop(shouldShow);
      }
    };
    
    window.addEventListener("scroll", handleScroll, { passive: true });
    
    // Kiểm tra ban đầu
    handleScroll();
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [showScrollTop]);
  
  // Xử lý khi người dùng click vào nút
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };
  
  return (
    <Button
      onClick={scrollToTop}
      variant="secondary"
      size="icon"
      className={cn(
        "fixed bottom-6 right-6 z-50 h-10 w-10 rounded-full shadow-md transition-all duration-300 dark:bg-slate-800 dark:hover:bg-slate-700",
        showScrollTop 
          ? "translate-y-0 opacity-100" 
          : "translate-y-16 opacity-0 pointer-events-none"
      )}
      aria-label="Cuộn lên đầu trang"
    >
      <ArrowUp className="h-5 w-5" />
    </Button>
  );
}