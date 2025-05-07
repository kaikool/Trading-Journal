import { useState, useEffect, useRef, useCallback } from 'react';

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
 * Tối ưu hook useScrollDirection để tránh giật lag khi cuộn trang
 * 
 * Cải tiến:
 * 1. Sử dụng RequestAnimationFrame thay vì trực tiếp xử lý scroll event
 * 2. Tạo throttle/debounce cho scroll event handler
 * 3. Tránh re-render không cần thiết bằng cách chỉ cập nhật state khi thực sự cần
 * 4. Sử dụng refs để theo dõi giá trị trung gian
 * 5. Tránh tạo hàm mới trong mỗi lần render
 * 
 * @param threshold - Ngưỡng scroll để xác định hướng (pixel)
 * @param idleTimeout - Thời gian không hoạt động để đặt thành 'idle' (ms)
 */
export function useScrollDirection(threshold = 5, idleTimeout = 1000): ScrollState {
  // State cho các giá trị cần re-render UI
  const [scrollState, setScrollState] = useState<ScrollState>({
    direction: 'idle',
    lastScrollTop: 0,
    scrollY: 0,
    isAtTop: true,
    isAtBottom: false,
    isScrolling: false
  });

  // Refs để theo dõi giá trị mà không gây re-render
  const scrollTimerRef = useRef<number | null>(null);
  const idleTimerRef = useRef<number | null>(null);
  const ticking = useRef(false);
  const lastScrollTopRef = useRef(0);
  const lastDirectionRef = useRef<ScrollDirection>('idle');
  const rafIdRef = useRef<number | null>(null);

  // Hàm xử lý scroll được tối ưu với requestAnimationFrame
  const handleScroll = useCallback(() => {
    if (!ticking.current) {
      // Sử dụng requestAnimationFrame để giảm thiểu số lần xử lý
      rafIdRef.current = requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        const scrollTop = scrollY || document.documentElement.scrollTop;
        const isAtTop = scrollTop < threshold;
        const isAtBottom = 
          (window.innerHeight + scrollTop) >= (document.documentElement.scrollHeight - threshold);
        
        // Xác định hướng cuộn dựa trên giá trị lưu trong ref
        const direction = lastScrollTopRef.current > scrollTop ? 'up' : 'down';
        
        // Chỉ cập nhật state nếu thực sự có sự thay đổi đáng kể
        if (Math.abs(lastScrollTopRef.current - scrollTop) > threshold || 
            direction !== lastDirectionRef.current ||
            isAtTop !== scrollState.isAtTop ||
            isAtBottom !== scrollState.isAtBottom) {
          
          // Cập nhật refs
          lastScrollTopRef.current = scrollTop;
          lastDirectionRef.current = direction;
          
          // Cập nhật state
          setScrollState(prev => ({
            ...prev,
            direction,
            lastScrollTop: scrollTop,
            scrollY,
            isAtTop,
            isAtBottom,
            isScrolling: true
          }));

          // Reset scrolling state sau một khoảng thời gian
          if (scrollTimerRef.current) {
            window.clearTimeout(scrollTimerRef.current);
          }
          
          scrollTimerRef.current = window.setTimeout(() => {
            setScrollState(prev => ({
              ...prev,
              isScrolling: false
            }));
            scrollTimerRef.current = null;
          }, 100);

          // Reset về idle sau khoảng thời gian không hoạt động
          if (idleTimerRef.current) {
            window.clearTimeout(idleTimerRef.current);
          }
          
          idleTimerRef.current = window.setTimeout(() => {
            if (lastDirectionRef.current !== 'idle') {
              setScrollState(prev => ({
                ...prev,
                direction: 'idle'
              }));
              lastDirectionRef.current = 'idle';
            }
            idleTimerRef.current = null;
          }, idleTimeout);
        }
        
        ticking.current = false;
      });
    }
    
    ticking.current = true;
  }, [threshold, idleTimeout, scrollState.isAtTop, scrollState.isAtBottom]);

  // Đăng ký và hủy đăng ký event listener
  useEffect(() => {
    // Khởi tạo giá trị ban đầu
    lastScrollTopRef.current = window.scrollY || document.documentElement.scrollTop;
    
    // Đăng ký event với passive: true để tối ưu hiệu suất
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Cleanup function
    return () => {
      window.removeEventListener('scroll', handleScroll);
      
      // Xóa tất cả các timeout và animationFrame
      if (scrollTimerRef.current) {
        window.clearTimeout(scrollTimerRef.current);
      }
      
      if (idleTimerRef.current) {
        window.clearTimeout(idleTimerRef.current);
      }
      
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [handleScroll]);

  return scrollState;
}