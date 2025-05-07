/**
 * Edge Swipe Detector - Hỗ trợ vuốt từ cạnh trái màn hình
 * 
 * Tạo trình phát hiện vuốt từ cạnh trái sang phải để mở sidebar
 * và thay thế hành vi cử chỉ vuốt mặc định của trình duyệt Safari
 */

export interface SwipeDetectorOptions {
  /** Kích thước vùng phát hiện vuốt tính từ cạnh trái (px) */
  edgeSize?: number;
  /** Khoảng cách vuốt ngang tối thiểu để trigger (px) */
  minSwipeDistance?: number;
  /** Khoảng cách vuốt dọc tối đa cho phép (px) */
  maxVerticalDistance?: number;
  /** Callback khi phát hiện vuốt từ cạnh trái */
  onEdgeSwipe?: () => void;
  /** Callback khi phát hiện vuốt từ phải sang trái (nếu sidebar đang mở) */
  onReverseSwipe?: () => void;
}

export function setupEdgeSwipeDetector(options: SwipeDetectorOptions) {
  const {
    edgeSize = 0, // 0px - Phát hiện từ ngay mép cạnh trái
    minSwipeDistance = 50, // Giảm khoảng cách vuốt tối thiểu xuống 50px
    maxVerticalDistance = 150, // Tăng dung sai vuốt dọc
    onEdgeSwipe,
    onReverseSwipe
  } = options;
  
  let touchStartX = 0;
  let touchStartY = 0;
  let touchEndX = 0;
  let touchEndY = 0;
  let sidebarIsOpen = false;
  
  // Chặn cử chỉ vuốt mặc định của trình duyệt Safari
  function disableBrowserSwipeGestures() {
    // Chỉ thêm CSS cần thiết một lần duy nhất
    if (document.getElementById('disable-safari-swipe')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'disable-safari-swipe';
    style.textContent = `
      html, body {
        overscroll-behavior-x: none;
      }
    `;
    document.head.appendChild(style);
    
    // Thêm một dummy state vào history để ngăn Safari quay lại
    window.history.pushState({page: 'initial'}, document.title, window.location.href);
    
    // Bẫy người dùng trong ứng dụng bằng cách bắt sự kiện popstate
    window.addEventListener('popstate', function(e) {
      window.history.pushState({page: 'blocked'}, document.title, window.location.href);
    });
  }
  
  function handleTouchStart(e: TouchEvent) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }
  
  function handleTouchMove(e: TouchEvent) {
    touchEndX = e.touches[0].clientX;
    touchEndY = e.touches[0].clientY;
  }
  
  function handleTouchEnd() {
    // Tính toán khoảng cách và hướng vuốt
    const swipeDistanceX = touchEndX - touchStartX;
    const swipeDistanceY = Math.abs(touchEndY - touchStartY);
    
    // Vuốt từ cạnh trái sang phải
    if (
      touchStartX < edgeSize && // Bắt đầu từ cạnh trái
      swipeDistanceX > minSwipeDistance && // Vuốt đủ xa
      swipeDistanceY < maxVerticalDistance && // Không vuốt quá chếch theo chiều dọc
      !sidebarIsOpen && // Chỉ mở sidebar khi nó đang đóng
      onEdgeSwipe
    ) {
      sidebarIsOpen = true;
      onEdgeSwipe();
    }
    
    // Vuốt từ phải sang trái khi sidebar đang mở
    if (
      swipeDistanceX < -minSwipeDistance && // Vuốt từ phải sang trái
      swipeDistanceY < maxVerticalDistance && // Không vuốt quá chếch theo chiều dọc
      sidebarIsOpen && // Chỉ đóng sidebar khi nó đang mở
      onReverseSwipe
    ) {
      sidebarIsOpen = false;
      onReverseSwipe();
    }
  }
  
  function updateSidebarState(isOpen: boolean) {
    sidebarIsOpen = isOpen;
  }
  
  function addEventListeners() {
    disableBrowserSwipeGestures();
    
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd);
  }
  
  function removeEventListeners() {
    document.removeEventListener('touchstart', handleTouchStart);
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', handleTouchEnd);
  }
  
  // Tự động kích hoạt khi gọi hàm
  addEventListeners();
  
  // Trả về đối tượng không có cấu trúc vòng tròn
  return {
    updateSidebarState: (isOpen: boolean) => {
      sidebarIsOpen = isOpen;
    },
    removeEventListeners: () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    }
  };
}