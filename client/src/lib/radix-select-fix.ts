/**
 * Giải pháp nhẹ nhàng để tối ưu hóa tương tác Radix UI
 * 
 * Dành cho phiên bản mới của RadixUI nhưng vẫn duy trì tương thích
 * ngược với code hiện tại.
 */

/**
 * Hàm này sẽ áp dụng style fix nhẹ nhàng hơn cho Radix UI
 */
export function applyRadixSelectFix() {
  if (typeof document === 'undefined') {
    return; // Không thực hiện trong môi trường SSR
  }

  // Chỉ chạy một lần
  if (document.getElementById('radix-ui-scroll-helper')) {
    return;
  }

  // Tạo một style element đơn giản hơn
  const style = document.createElement('style');
  style.id = 'radix-ui-scroll-helper';
  style.textContent = `
    /* Đảm bảo focus không gây scroll jump */
    [data-radix-select-content],
    [data-radix-dropdown-menu-content],
    [data-radix-popover-content] {
      /* Các thuộc tính cần thiết */
      z-index: 50;
      scroll-behavior: auto;
    }

    /* Đảm bảo các item được chọn không tự scroll */
    [data-radix-select-item][data-highlighted],
    [data-radix-select-item][aria-selected="true"] {
      scroll-margin: 0;
    }

    /* Chỉ ngăn scroll khi dropdown mở */
    html.radix-ui-portal-open,
    body.radix-ui-portal-open {
      overflow-anchor: none;
    }

    /* Đảm bảo select không gây cuộn trang */
    [data-radix-select-content] {
      position: fixed;
    }
  `;

  // Thêm vào <head>
  document.head.appendChild(style);

  // Sử dụng bộ nghe sự kiện cho các cổng Radix thay vì MutationObserver phức tạp
  document.addEventListener('mousedown', handleRadixInteraction);
  document.addEventListener('keydown', handleRadixInteraction);
  
  // Log đơn giản
  console.debug('[RadixUI] Applied lightweight scroll optimizations');
}

/**
 * Xử lý tương tác với RadixUI portals
 */
function handleRadixInteraction(event: MouseEvent | KeyboardEvent): void {
  // Chỉ xử lý nếu có portals của Radix
  const hasPortals = document.querySelector(
    '[data-radix-select-content], [data-radix-dropdown-menu-content], [data-radix-popover-content]'
  );
  
  if (hasPortals) {
    document.documentElement.classList.add('radix-ui-portal-open');
    document.body.classList.add('radix-ui-portal-open');
  } else {
    document.documentElement.classList.remove('radix-ui-portal-open');
    document.body.classList.remove('radix-ui-portal-open');
  }
}

/**
 * Hàm này sẽ gỡ bỏ style fix
 */
export function removeRadixSelectFix() {
  if (typeof document === 'undefined') {
    return;
  }

  // Xóa style
  const style = document.getElementById('radix-ui-scroll-helper');
  if (style) {
    style.remove();
  }

  // Xóa listeners
  document.removeEventListener('mousedown', handleRadixInteraction);
  document.removeEventListener('keydown', handleRadixInteraction);

  // Xóa classes
  document.documentElement.classList.remove('radix-ui-portal-open');
  document.body.classList.remove('radix-ui-portal-open');
  document.documentElement.classList.remove('radix-select-open'); // Hỗ trợ ngược
  document.body.classList.remove('radix-select-open'); // Hỗ trợ ngược
  
  console.debug('[RadixUI] Removed scroll optimizations');
}