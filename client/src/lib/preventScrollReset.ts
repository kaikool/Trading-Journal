/**
 * Tiện ích ngăn chặn hành vi cuộn tự động khi mở Radix UI Select
 * 
 * Giải pháp này áp dụng monkey patch trực tiếp lên các phương thức của trình duyệt:
 * 1. Element.prototype.scrollIntoView - Ngăn Radix tự cuộn khi focus
 * 2. Element.prototype.focus - Ngăn focus tự động cuộn và thay đổi vị trí
 * 3. window.scrollTo/scrollBy - Ngăn các phương thức cuộn toàn cục từ Radix
 * 
 * Áp dụng đặc biệt cho Radix UI Select, Popover, Dialog và các dropdown components,
 * nhưng vẫn giữ nguyên hành vi thông thường cho các phần khác của ứng dụng.
 */

/**
 * Khởi tạo hệ thống ngăn chặn cuộn tự động cho Radix UI
 */
export function initPreventRadixScroll() {
  if (typeof window === 'undefined' || typeof Element === 'undefined') {
    return; // Không thực hiện trong môi trường SSR
  }

  // Đảm bảo chỉ áp dụng một lần
  if ((window as any).__preventRadixScrollInitialized) {
    return;
  }

  // OVERRIDE 1: scrollIntoView
  // Lưu lại phương thức gốc
  const originalScrollIntoView = Element.prototype.scrollIntoView;
  (window as any).__originalScrollIntoView = originalScrollIntoView;
  
  // Override phương thức scrollIntoView
  Element.prototype.scrollIntoView = function(
    this: Element, 
    arg?: boolean | ScrollIntoViewOptions
  ) {
    // Kiểm tra nếu element thuộc về Radix UI component
    if (
      this.closest?.('[data-radix-select-content]') ||
      this.closest?.('[data-radix-dropdown-menu-content]') ||
      this.closest?.('[data-radix-popover-content]') ||
      this.closest?.('[data-radix-dialog-content]') ||
      this.getAttribute?.('role') === 'dialog' ||
      this.getAttribute?.('role') === 'listbox' ||
      this.getAttribute?.('role') === 'option' ||
      this.closest?.('[role="listbox"]') ||
      this.closest?.('[role="option"]') ||
      // Các trường hợp đặc biệt cho Select
      (this.getAttribute?.('aria-selected') === 'true' && this.parentElement?.getAttribute?.('role') === 'listbox')
    ) {
      // Không làm gì cả - chặn hoàn toàn scrollIntoView
      console.debug('[PreventScroll] Blocked scrollIntoView for Radix UI component');
      return;
    }
    
    // Nếu không phải Radix UI element, sử dụng hành vi mặc định
    return originalScrollIntoView.call(this, arg);
  };

  // OVERRIDE 2: focus
  // Lưu lại phương thức focus gốc
  const originalFocus = HTMLElement.prototype.focus;
  (window as any).__originalFocus = originalFocus;

  // Override phương thức focus để chặn cuộn khi focus vào Radix UI elements
  HTMLElement.prototype.focus = function(this: HTMLElement, options?: FocusOptions) {
    // Kiểm tra nếu element thuộc về Radix UI component
    if (
      this.closest?.('[data-radix-select-content]') ||
      this.closest?.('[data-radix-dropdown-menu-content]') ||
      this.closest?.('[data-radix-popover-content]') ||
      this.closest?.('[data-radix-dialog-content]') ||
      this.getAttribute?.('role') === 'dialog' ||
      this.getAttribute?.('role') === 'listbox' ||
      this.getAttribute?.('role') === 'option') {
      
      // Buộc options preventScroll = true để tránh cuộn tự động
      const preventScrollOptions = { ...(options || {}), preventScroll: true };
      console.debug('[PreventScroll] Modified focus to preventScroll for Radix UI');
      return originalFocus.call(this, preventScrollOptions);
    }
    
    // Nếu không phải Radix UI element, giữ nguyên hành vi focus
    return originalFocus.call(this, options);
  };

  // OVERRIDE 3: scrollTo/scrollBy
  // Lưu lại phương thức gốc
  const originalScrollTo = window.scrollTo;
  const originalScrollBy = window.scrollBy;
  (window as any).__originalScrollTo = originalScrollTo;
  (window as any).__originalScrollBy = originalScrollBy;

  // Tạo biến static để theo dõi khi nào Radix dropdown đang mở
  let isRadixOpen = false;
  
  // Observer để phát hiện khi Radix components được thêm/xóa khỏi DOM
  const radixObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        // Kiểm tra các node được thêm vào
        for (const node of Array.from(mutation.addedNodes)) {
          if (node instanceof HTMLElement) {
            const isRadixContent = 
              node.hasAttribute('data-radix-select-content') ||
              node.hasAttribute('data-radix-dropdown-menu-content') ||
              node.hasAttribute('data-radix-popover-content') ||
              node.hasAttribute('data-radix-dialog-content') ||
              node.querySelector('[data-radix-select-content], [role="listbox"], [role="dialog"]');
              
            if (isRadixContent) {
              isRadixOpen = true;
              console.debug('[PreventScroll] Detected Radix UI content opened');
            }
          }
        }
        
        // Kiểm tra các node bị xóa
        for (const node of Array.from(mutation.removedNodes)) {
          if (node instanceof HTMLElement) {
            const isRadixContent = 
              node.hasAttribute('data-radix-select-content') ||
              node.hasAttribute('data-radix-dropdown-menu-content') ||
              node.hasAttribute('data-radix-popover-content') ||
              node.hasAttribute('data-radix-dialog-content') ||
              node.querySelector('[data-radix-select-content], [role="listbox"], [role="dialog"]');
              
            if (isRadixContent) {
              isRadixOpen = false;
              console.debug('[PreventScroll] Detected Radix UI content closed');
            }
          }
        }
      }
    }
  });

  // Theo dõi thay đổi trong DOM để phát hiện Radix UI components
  radixObserver.observe(document.body, { childList: true, subtree: true });
  (window as any).__radixObserver = radixObserver;

  // Override window.scrollTo
  window.scrollTo = function(
    this: Window,
    xOrOptions: number | ScrollToOptions, 
    y?: number
  ) {
    if (isRadixOpen) {
      console.debug('[PreventScroll] Blocked scrollTo while Radix UI component is open');
      return;
    }
    return originalScrollTo.call(this, xOrOptions, y);
  };

  // Override window.scrollBy
  window.scrollBy = function(
    this: Window,
    xOrOptions: number | ScrollByOptions, 
    y?: number
  ) {
    if (isRadixOpen) {
      console.debug('[PreventScroll] Blocked scrollBy while Radix UI component is open');
      return;
    }
    return originalScrollBy.call(this, xOrOptions, y);
  };

  // Ghi nhớ đã khởi tạo
  (window as any).__preventRadixScrollInitialized = true;
  
  console.debug('[PreventScroll] Initialized preventRadixScroll system');
}

/**
 * Giải phóng hệ thống ngăn chặn cuộn khi không cần thiết nữa
 */
export function destroyPreventRadixScroll() {
  if (typeof window === 'undefined' || typeof Element === 'undefined') {
    return;
  }
  
  // Khôi phục tất cả các phương thức đã bị override
  
  // 1. Khôi phục scrollIntoView
  if ((window as any).__originalScrollIntoView) {
    Element.prototype.scrollIntoView = (window as any).__originalScrollIntoView;
    delete (window as any).__originalScrollIntoView;
    console.debug('[PreventScroll] Restored original scrollIntoView method');
  }
  
  // 2. Khôi phục focus
  if ((window as any).__originalFocus) {
    HTMLElement.prototype.focus = (window as any).__originalFocus;
    delete (window as any).__originalFocus;
    console.debug('[PreventScroll] Restored original focus method');
  }
  
  // 3. Khôi phục scrollTo/scrollBy
  if ((window as any).__originalScrollTo) {
    window.scrollTo = (window as any).__originalScrollTo;
    delete (window as any).__originalScrollTo;
    console.debug('[PreventScroll] Restored original scrollTo method');
  }
  
  if ((window as any).__originalScrollBy) {
    window.scrollBy = (window as any).__originalScrollBy;
    delete (window as any).__originalScrollBy;
    console.debug('[PreventScroll] Restored original scrollBy method');
  }
  
  // 4. Hủy bỏ observer nếu có
  if ((window as any).__radixObserver) {
    (window as any).__radixObserver.disconnect();
    delete (window as any).__radixObserver;
    console.debug('[PreventScroll] Disconnected Radix observer');
  }
  
  // Xóa flag đã khởi tạo
  delete (window as any).__preventRadixScrollInitialized;
  
  console.debug('[PreventScroll] Fully restored all original scroll methods');
}