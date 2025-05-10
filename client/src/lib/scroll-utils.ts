/**
 * ScrollUtils - Các tiện ích đơn giản để xử lý scroll trong ứng dụng
 * 
 * Module này cung cấp các hàm cơ bản để quản lý scroll một cách nhất quán
 * mà không cần tạo context phức tạp.
 */

// Flag toàn cục để theo dõi trạng thái scroll
let isScrollingActive = false;

/**
 * Lấy vị trí cuộn hiện tại một cách nhất quán trên tất cả trình duyệt
 */
export function getScrollPosition(): number {
  return window.scrollY || document.documentElement.scrollTop;
}

/**
 * Đánh dấu bắt đầu một hoạt động scroll
 */
export function markScrollStart(): void {
  if (isScrollingActive) return;
  
  isScrollingActive = true;
  document.documentElement.setAttribute('data-scrolling', 'true');
  document.body.classList.add('scroll-in-progress');
}

/**
 * Đánh dấu kết thúc một hoạt động scroll
 */
export function markScrollEnd(): void {
  isScrollingActive = false;
  document.documentElement.removeAttribute('data-scrolling');
  document.body.classList.remove('scroll-in-progress');
}

/**
 * Kiểm tra xem hiện tại có đang thực hiện scroll không
 */
export function isScrolling(): boolean {
  return isScrollingActive;
}

/**
 * Scroll đến đầu trang với animation mượt mà, nhất quán trên các trình duyệt
 * 
 * @param options Tùy chọn scroll
 * @returns Cleanup function để hủy scroll nếu cần
 */
export function scrollToTop(options: {
  onComplete?: () => void;
  speed?: 'fast' | 'normal' | 'slow';
  force?: boolean;
}): () => void {
  const { onComplete, speed = 'normal', force = false } = options;
  
  // Nếu đang scroll và không force, thì không làm gì
  if (isScrollingActive && !force) {
    return () => {}; // No-op cleanup
  }
  
  // Kiểm tra vị trí hiện tại
  const startPosition = getScrollPosition();
  if (startPosition <= 0) {
    // Đã ở đầu trang rồi, gọi callback nếu có
    if (onComplete) onComplete();
    return () => {}; // No-op cleanup
  }
  
  // Đánh dấu bắt đầu scroll
  markScrollStart();
  
  // Xác định hệ số dựa trên speed
  let factor = 6; // Mặc định là 'normal'
  if (speed === 'fast') factor = 4;
  if (speed === 'slow') factor = 8;
  
  // Các tham chiếu đến timeout/animation để có thể hủy
  let animationFrame: number | null = null;
  let fallbackTimeout: NodeJS.Timeout | null = null;
  let safetyTimeout: NodeJS.Timeout | null = null;
  
  // Hàm để hủy tất cả các process liên quan
  const cancelAll = () => {
    if (animationFrame) cancelAnimationFrame(animationFrame);
    if (fallbackTimeout) clearTimeout(fallbackTimeout);
    if (safetyTimeout) clearTimeout(safetyTimeout);
    
    // Đánh dấu kết thúc scroll
    markScrollEnd();
  };
  
  // Animation scroll mượt mà
  const doSmoothScroll = () => {
    const currentPosition = getScrollPosition();
    
    // Đã gần đến đầu trang, hoàn thành scroll
    if (currentPosition < 5) {
      window.scrollTo(0, 0);
      cancelAll();
      if (onComplete) onComplete();
      return;
    }
    
    // Tính bước cuộn dựa trên vị trí hiện tại
    // Càng gần đến đích, bước càng nhỏ -> tạo hiệu ứng easing
    const step = Math.max(Math.floor(currentPosition / factor), 1);
    
    // Thực hiện cuộn
    window.scrollTo(0, currentPosition - step);
    
    // Tiếp tục animation
    animationFrame = requestAnimationFrame(doSmoothScroll);
  };
  
  // Bắt đầu animation
  animationFrame = requestAnimationFrame(doSmoothScroll);
  
  // Fallback nếu animation không hoạt động sau khoảng thời gian
  fallbackTimeout = setTimeout(() => {
    const currentPos = getScrollPosition();
    if (currentPos > 5) {
      // Force scroll tức thì
      window.scrollTo(0, 0);
      cancelAll();
      if (onComplete) onComplete();
    }
  }, 800);
  
  // Safety timeout - luôn đảm bảo scroll kết thúc sau tối đa 2000ms
  safetyTimeout = setTimeout(() => {
    if (isScrollingActive) {
      window.scrollTo(0, 0);
      cancelAll();
      if (onComplete) onComplete();
    }
  }, 2000);
  
  // Return cleanup function
  return cancelAll;
}

/**
 * Scroll đến một vị trí cụ thể 
 * Tương tự scrollToTop nhưng cho phép scroll đến bất kỳ vị trí nào
 */
export function scrollToPosition(options: {
  top: number;
  onComplete?: () => void;
  speed?: 'fast' | 'normal' | 'slow';
  force?: boolean;
}): () => void {
  const { top, onComplete, speed = 'normal', force = false } = options;
  
  // Tương tự như scrollToTop, nhưng đích đến là 'top' thay vì 0
  // (Phần này có thể triển khai tương tự scrollToTop)
  
  // Giải pháp đơn giản:
  window.scrollTo({
    top,
    behavior: 'smooth'
  });
  
  // Giả lập callback sau một thời gian
  const timeout = setTimeout(() => {
    if (onComplete) onComplete();
  }, 500);
  
  // Return cleanup
  return () => clearTimeout(timeout);
}