import { useEffect, useRef } from 'react';

/**
 * Hook nâng cao để ngăn chặn cuộn trang tự động khi mở Radix UI dropdown.
 * 
 * Hook này hoạt động bằng cách:
 * 1. Thiết lập MutationObserver để phát hiện khi nội dung Radix UI được thêm vào DOM
 * 2. Khi dropdown/popup mở, ghi lại vị trí cuộn hiện tại
 * 3. Sử dụng preventDefault trên các sự kiện cuộn để chặn các hành vi cuộn tự động
 * 4. Bổ sung các phương thức ghi đè để chặn hoàn toàn các API scrollIntoView() và focus()
 * 5. Sau một độ trễ nhỏ, giải phóng khóa cuộn đồng thời duy trì vị trí
 * 
 * Hoạt động với nhiều thành phần Radix bao gồm Select, Popover, DropdownMenu, v.v.
 * 
 * @param options Tùy chọn cấu hình
 * @param options.enabled Liệu hook này có hoạt động hay không (mặc định: true)
 * @param options.selector CSS selector để khớp với portals/popups cần theo dõi (mặc định: '[data-radix-select-content]')
 * @param options.preventDuration Thời gian chặn cuộn tự động, tính bằng ms (mặc định: 400)
 * @param options.disableScrollIntoView Vô hiệu hóa scrollIntoView API (mặc định: true)
 * @param options.maintainFocus Giữ nguyên vị trí focus hiện tại (mặc định: true)
 */
export function usePreventScrollJump({
  enabled = true,
  selector = '[data-radix-select-content]',
  preventDuration = 400,
  disableScrollIntoView = true,
  maintainFocus = true,
}: {
  enabled?: boolean;
  selector?: string;
  preventDuration?: number;
  disableScrollIntoView?: boolean;
  maintainFocus?: boolean;
} = {}) {
  // Store refs to avoid rerenders while maintaining state
  const preventScrollRef = useRef(false);
  const scrollTopRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const observerRef = useRef<MutationObserver | null>(null);
  const originalScrollIntoViewRef = useRef<Function | null>(null);
  const originalFocusRef = useRef<Function | null>(null);
  const bodyClassModifiedRef = useRef(false);
  
  useEffect(() => {
    if (!enabled) return;
    
    // Lưu trữ các phương thức gốc để khôi phục sau này
    if (disableScrollIntoView && !originalScrollIntoViewRef.current) {
      originalScrollIntoViewRef.current = Element.prototype.scrollIntoView;
    }
    
    if (maintainFocus && !originalFocusRef.current) {
      originalFocusRef.current = HTMLElement.prototype.focus;
    }
    
    // Ghi đè Element.scrollIntoView để ngăn chặn cuộn tự động
    if (disableScrollIntoView) {
      Element.prototype.scrollIntoView = function(this: Element, arg?: boolean | ScrollIntoViewOptions) {
        if (preventScrollRef.current) {
          console.debug('[usePreventScrollJump] Blocked scrollIntoView');
          return;
        }
        return originalScrollIntoViewRef.current?.apply(this, [arg]);
      };
    }
    
    // Ghi đè HTMLElement.focus để ngăn chặn các hiệu ứng cuộn liên quan đến focus
    if (maintainFocus) {
      HTMLElement.prototype.focus = function(this: HTMLElement, options?: FocusOptions) {
        if (preventScrollRef.current) {
          // Chỉ focus khi element là select item hoặc trigger
          const isSelectRelated = 
            this.hasAttribute('data-radix-select-item') || 
            this.hasAttribute('data-radix-select-trigger') ||
            this.hasAttribute('role') && (this.getAttribute('role') === 'option');
            
          if (isSelectRelated) {
            // Sử dụng preventScroll cho các yếu tố liên quan đến select
            return originalFocusRef.current?.apply(this, [{ preventScroll: true }]);
          } else {
            // Ghi log nhưng vẫn tiếp tục focus để không phá vỡ các yếu tố khác
            console.debug('[usePreventScrollJump] Modified focus behavior during select dropdown');
            return originalFocusRef.current?.apply(this, [{ preventScroll: true }]);
          }
        }
        return originalFocusRef.current?.apply(this, [options]);
      };
    }
    
    // Handler for scroll events - prevents scrolling when activated
    const handleScroll = (e: Event) => {
      if (preventScrollRef.current) {
        // Prevent the default scroll behavior
        e.preventDefault();
        
        // Maintain the scroll position we captured when dropdown opened
        window.scrollTo(0, scrollTopRef.current);
        return false;
      }
      return true;
    };
    
    // Start preventing scroll jumps
    const startPreventingScroll = () => {
      // Capture the current scroll position
      scrollTopRef.current = window.scrollY;
      preventScrollRef.current = true;
      
      // Thêm class vào body để thông báo trạng thái chặn cuộn
      if (!bodyClassModifiedRef.current) {
        document.body.classList.add('prevent-scroll-jump');
        bodyClassModifiedRef.current = true;
      }
      
      // After a delay, allow scrolling again
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      
      timerRef.current = window.setTimeout(() => {
        preventScrollRef.current = false;
        
        // Loại bỏ class khi hết giai đoạn ngăn cuộn
        if (bodyClassModifiedRef.current) {
          document.body.classList.remove('prevent-scroll-jump');
          bodyClassModifiedRef.current = false;
        }
      }, preventDuration);
    };
    
    // Khởi tạo style để xử lý CSS nếu chưa tồn tại
    if (!document.getElementById('prevent-scroll-jump-style')) {
      const style = document.createElement('style');
      style.id = 'prevent-scroll-jump-style';
      style.textContent = `
        body.prevent-scroll-jump {
          overflow-anchor: none !important;
          scroll-behavior: auto !important;
        }
        
        /* Đảm bảo dropdown hiển thị đúng */
        [data-radix-select-content],
        [data-radix-popover-content],
        [data-radix-dropdown-content] {
          position: fixed;
          z-index: 999;
        }
      `;
      document.head.appendChild(style);
    }
    
    // Setup MutationObserver to watch for Select/Dropdown portals
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // Check if any of the added nodes is a Select content
          for (let i = 0; i < mutation.addedNodes.length; i++) {
            const node = mutation.addedNodes[i];
            if (node instanceof Element) {
              if (node.querySelector?.(selector) || node.matches?.(selector)) {
                startPreventingScroll();
                break; // Chỉ cần kích hoạt một lần cho mỗi batch mutations
              }
            }
          }
        }
      });
    });
    
    // Start observing the document body for all changes
    observer.observe(document.body, { 
      childList: true, 
      subtree: true 
    });
    
    // Save observer to ref for cleanup
    observerRef.current = observer;
    
    // Add capture phase scroll event listener (runs before regular listeners)
    window.addEventListener('scroll', handleScroll, { capture: true, passive: false });
    
    // Cleanup function
    return () => {
      window.removeEventListener('scroll', handleScroll, { capture: true });
      
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      
      // Khôi phục lại phương thức gốc
      if (disableScrollIntoView && originalScrollIntoViewRef.current) {
        Element.prototype.scrollIntoView = originalScrollIntoViewRef.current as any;
      }
      
      if (maintainFocus && originalFocusRef.current) {
        HTMLElement.prototype.focus = originalFocusRef.current as any;
      }
      
      // Đảm bảo loại bỏ class
      if (bodyClassModifiedRef.current) {
        document.body.classList.remove('prevent-scroll-jump');
        bodyClassModifiedRef.current = false;
      }
    };
  }, [enabled, selector, preventDuration, disableScrollIntoView, maintainFocus]);
}