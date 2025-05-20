/**
 * Tiện ích để tính toán chính xác chiều cao viewport trên các thiết bị khác nhau
 * 
 * Đây là giải pháp cho vấn đề khó chịu với 100vh trên các trình duyệt mobile
 * nơi thanh địa chỉ và thanh điều hướng của trình duyệt ảnh hưởng đến chiều cao thực tế
 */

// Thiết lập biến CSS --vh (viewport height) sẽ được sử dụng thay cho 100vh
export function initViewportHeight(): void {
  // Hàm cập nhật chiều cao viewport
  const setViewportHeight = () => {
    // Tính toán 1% chiều cao viewport thực tế
    const vh = window.innerHeight * 0.01;
    // Thiết lập biến CSS --vh để sử dụng trong toàn ứng dụng
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  };

  // Thiết lập ban đầu
  setViewportHeight();

  // Cập nhật mỗi khi resize cửa sổ, thay đổi hướng thiết bị, hoặc khi bàn phím ảo xuất hiện/biến mất
  window.addEventListener('resize', setViewportHeight);
  window.addEventListener('orientationchange', setViewportHeight);
  
  // Xử lý đặc biệt cho trang PWA/Standalone để đảm bảo hiển thị đúng fullscreen
  if (window.matchMedia('(display-mode: standalone)').matches) {
    document.documentElement.classList.add('pwa-mode');
    document.body.classList.add('pwa-body');
  }
}

// Kiểm tra xem ứng dụng có đang chạy ở chế độ standalone/PWA hay không 
export function isPWA(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches || 
         window.matchMedia('(display-mode: fullscreen)').matches ||
         !!(window.navigator as any).standalone; // Safari iOS
}