import { useState, useEffect } from 'react';

export type ScrollDirection = 'up' | 'down' | 'idle';

interface ScrollState {
  direction: ScrollDirection;
  lastScrollTop: number;
  scrollY: number;
  isAtTop: boolean;
  isAtBottom: boolean;
  isScrolling: boolean;
}

/**
 * Hook đơn giản để phát hiện hướng cuộn, được tối ưu hóa để tránh re-render không cần thiết
 * 
 * Phiên bản này đã được đơn giản hóa rất nhiều so với bản gốc phức tạp
 * 
 * @param threshold - Ngưỡng scroll để xác định hướng (pixel)
 */
export function useScrollDirection(threshold = 10): ScrollState {
  // State cho các giá trị cần re-render UI
  const [scrollState, setScrollState] = useState<ScrollState>({
    direction: 'idle',
    lastScrollTop: 0,
    scrollY: 0,
    isAtTop: true,
    isAtBottom: false,
    isScrolling: false
  });

  // Đăng ký và hủy đăng ký event listener
  useEffect(() => {
    let lastScrollY = window.scrollY;
    let scrollTimeout: number | null = null;
    
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const isAtTop = scrollY < threshold;
      const isAtBottom = 
        (window.innerHeight + scrollY) >= (document.documentElement.scrollHeight - threshold);
      
      // Xác định hướng cuộn
      const direction = lastScrollY > scrollY ? 'up' : 'down';
      
      // Cập nhật state
      setScrollState({
        direction,
        lastScrollTop: lastScrollY,
        scrollY,
        isAtTop,
        isAtBottom,
        isScrolling: true
      });
      
      // Lưu vị trí cuộn hiện tại
      lastScrollY = scrollY;
      
      // Reset trạng thái scrolling sau 100ms không hoạt động
      if (scrollTimeout) {
        window.clearTimeout(scrollTimeout);
      }
      
      scrollTimeout = window.setTimeout(() => {
        setScrollState(prevState => ({
          ...prevState,
          isScrolling: false
        }));
      }, 150);
    };
    
    // Kiểm tra ngay lập tức
    handleScroll();
    
    // Đăng ký sự kiện với passive=true để tối ưu hiệu suất
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Cleanup function
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeout) {
        window.clearTimeout(scrollTimeout);
      }
    };
  }, [threshold]);

  return scrollState;
}