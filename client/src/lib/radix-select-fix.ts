/**
 * Giải pháp đơn giản để sửa lỗi cuộn tự động của Radix UI Select
 * 
 * Cách tiếp cận: Thêm CSS để ngăn chặn hành vi tự động scroll khi focus
 * và thiết lập thuộc tính position cố định cho Radix UI Select portal.
 */

/**
 * Hàm này sẽ áp dụng style fix cho các dropdown Radix UI
 */
export function applyRadixSelectFix() {
  if (typeof document === 'undefined') {
    return; // Không thực hiện trong môi trường SSR
  }

  // Chỉ chạy một lần
  if (document.getElementById('radix-select-scroll-fix')) {
    return;
  }

  // Tạo một style element
  const style = document.createElement('style');
  style.id = 'radix-select-scroll-fix';
  style.textContent = `
    /* Chặn hành vi cuộn tự động khi focus */
    [data-radix-select-content],
    [data-radix-select-viewport],
    [data-radix-dropdown-menu-content],
    [data-radix-popover-content] {
      scroll-behavior: auto !important;
      overflow-anchor: none !important;
      overflow-behavior: none !important;
      /* Removed -webkit-overflow-scrolling which can cause issues on Safari */
    }

    /* Đảm bảo content được định vị chính xác */
    [data-radix-select-content],
    [data-radix-dropdown-menu-content],
    [data-radix-popover-content] {
      position: fixed !important;
      /* Đặt z-index cao để tránh bị che */
      z-index: 100 !important;
    }

    /* Ngăn chặn FOUC khi mở */
    [data-state="open"][data-radix-select-content],
    [data-state="open"][data-radix-dropdown-menu-content],
    [data-state="open"][data-radix-popover-content] {
      animation: none !important;
      transition: opacity 0.15s !important;
    }

    /* Đảm bảo các item được chọn không tự scroll */
    [data-radix-select-item][data-highlighted],
    [data-radix-select-item][aria-selected="true"] {
      scroll-margin: 0 !important;
      scroll-padding: 0 !important;
    }

    /* Vô hiệu hóa thuộc tính tự động scroll từ root document */
    html.radix-select-open,
    body.radix-select-open {
      scroll-behavior: auto !important;
      overflow-anchor: none !important;
    }
  `;

  // Thêm vào <head>
  document.head.appendChild(style);

  // Theo dõi khi nào select content được mở
  const observer = new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
      if (mutation.type === 'childList') {
        // Phát hiện khi Radix content được thêm vào DOM
        mutation.addedNodes.forEach(node => {
          if (
            node instanceof HTMLElement && 
            (node.hasAttribute('data-radix-select-content') || 
             node.querySelector('[data-radix-select-content]'))
          ) {
            // Thêm class vào body và html để vô hiệu hóa scrolling
            document.documentElement.classList.add('radix-select-open');
            document.body.classList.add('radix-select-open');
          }
        });

        // Phát hiện khi Radix content bị xóa khỏi DOM
        mutation.removedNodes.forEach(node => {
          if (
            node instanceof HTMLElement && 
            (node.hasAttribute('data-radix-select-content') || 
             node.querySelector('[data-radix-select-content]'))
          ) {
            // Xóa class
            document.documentElement.classList.remove('radix-select-open');
            document.body.classList.remove('radix-select-open');
          }
        });
      }
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });

  console.debug('[RadixSelectFix] Applied CSS fixes to prevent scrolling issues');
}

/**
 * Hàm này sẽ gỡ bỏ style fix
 */
export function removeRadixSelectFix() {
  if (typeof document === 'undefined') {
    return;
  }

  const style = document.getElementById('radix-select-scroll-fix');
  if (style) {
    style.remove();
    console.debug('[RadixSelectFix] Removed Radix Select CSS fixes');
  }

  document.documentElement.classList.remove('radix-select-open');
  document.body.classList.remove('radix-select-open');
}