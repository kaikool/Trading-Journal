import { useEffect, useState } from "react";

type ScrollDirection = "up" | "down" | "none";

/**
 * Hook theo dõi hướng cuộn của người dùng (lên, xuống hoặc không cuộn)
 * Đã được tối ưu hóa cho hiệu suất với các cải tiến:
 * - Sử dụng passive event listener để tránh blocking main thread
 * - Debounce để giảm số lượng re-render không cần thiết
 * - Threshold để tránh phát hiện các chuyển động nhỏ
 */
export function useScrollDirection(threshold = 10, debounceDelay = 50): ScrollDirection {
  const [scrollDirection, setScrollDirection] = useState<ScrollDirection>("none");
  const [lastScrollY, setLastScrollY] = useState<number>(0);
  const [lastEventTime, setLastEventTime] = useState<number>(0);

  useEffect(() => {
    // Theo dõi vị trí cuộn gần đây nhất (sau khi browser update)
    let lastKnownScrollY = window.scrollY;

    // Handler xử lý sự kiện scroll
    const updateScrollDirection = () => {
      const now = Date.now();
      
      // Kiểm tra xem có nên debounce không
      if (now - lastEventTime < debounceDelay) {
        return;
      }
      
      const scrollY = window.scrollY;
      const direction: ScrollDirection = 
        Math.abs(scrollY - lastScrollY) < threshold 
          ? "none"
          : scrollY > lastScrollY 
            ? "down" 
            : "up";
            
      // Chỉ cập nhật nếu có sự thay đổi direction
      if (direction !== scrollDirection) {
        setScrollDirection(direction);
      }
      
      // Ghi nhớ vị trí và thời gian
      setLastScrollY(scrollY);
      setLastEventTime(now);
    };

    // Thêm event listener
    window.addEventListener("scroll", updateScrollDirection, { passive: true });
    
    // Xử lý cleanup
    return () => {
      window.removeEventListener("scroll", updateScrollDirection);
    };
  }, [scrollDirection, lastScrollY, threshold, debounceDelay, lastEventTime]);

  return scrollDirection;
}