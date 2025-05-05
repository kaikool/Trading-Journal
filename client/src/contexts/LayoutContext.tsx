import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from "react";

// Layout constants
export const SIDEBAR_WIDTH = "16rem"; // 256px = 16rem
export const SIDEBAR_COLLAPSED_WIDTH = "4.5rem"; // 72px for collapsed state

// Layout context type
export interface LayoutContextType {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  // Thêm trạng thái hiển thị/ẩn cho header và mobile navigation
  headerVisible: boolean;
  mobileNavVisible: boolean;
  // Scroll event handler để kết nối vào container
  initScrollListener: (containerId: string) => void;
  removeScrollListener: () => void;
}

// Create context with default values
export const LayoutContext = createContext<LayoutContextType>({
  sidebarCollapsed: false,
  setSidebarCollapsed: () => {},
  headerVisible: true,
  mobileNavVisible: true,
  initScrollListener: () => {},
  removeScrollListener: () => {}
});

// Custom hook for child components to use
export function useLayout() {
  return useContext(LayoutContext);
}

// Layout Provider component
export function LayoutProvider({ children }: { children: ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // Trạng thái hiển thị/ẩn cho header và mobile navigation
  const [headerVisible, setHeaderVisible] = useState(true);
  const [mobileNavVisible, setMobileNavVisible] = useState(true);
  
  // Tham chiếu đến scroll container
  const scrollContainerRef = useRef<HTMLElement | null>(null);
  // Tham chiếu đến hàm cleanup
  const cleanupRef = useRef<(() => void) | null>(null);
  // Tham chiếu đến vị trí cuộn trước đó để xác định hướng cuộn
  const lastScrollYRef = useRef(0);
  // Tham chiếu đến timeout ID để debounce
  const scrollTimeoutRef = useRef<number | null>(null);
  // Tham chiếu đến trạng thái đang cuộn
  const isScrollingRef = useRef(false);

  // Read sidebar state from localStorage when component mounts
  useEffect(() => {
    const savedCollapsed = localStorage.getItem("sidebar-collapsed");
    if (savedCollapsed) {
      setSidebarCollapsed(savedCollapsed === "true");
    }
    
    // Cleanup khi unmount
    return () => {
      removeScrollListener();
    };
  }, []);
  
  // Hàm xử lý sự kiện cuộn
  const handleScroll = useCallback((event: Event) => {
    // Bỏ qua nếu không có target
    if (!event.target) return;
    
    // Lấy vị trí cuộn hiện tại
    const scrollY = (event.target as Element).scrollTop;
    // Lấy vị trí cuộn trước đó
    const lastScrollY = lastScrollYRef.current;
    // Cập nhật vị trí cuộn trước đó
    lastScrollYRef.current = scrollY;
    
    // Không thay đổi nếu vị trí cuộn quá thấp (ở đầu trang)
    if (scrollY < 10) {
      setHeaderVisible(true);
      setMobileNavVisible(true);
      return;
    }
    
    // Xác định hướng cuộn
    const isScrollingDown = scrollY > lastScrollY;
    
    // Đặt trạng thái đang cuộn
    isScrollingRef.current = true;
    
    // Debounce để tránh xử lý quá nhiều sự kiện
    if (scrollTimeoutRef.current) {
      window.clearTimeout(scrollTimeoutRef.current);
    }
    
    // Ẩn/hiện header và mobile navigation dựa trên hướng cuộn
    if (isScrollingDown) {
      setHeaderVisible(false);
      setMobileNavVisible(false);
    } else {
      setHeaderVisible(true);
      setMobileNavVisible(true);
    }
    
    // Đặt timeout để reset trạng thái đang cuộn
    scrollTimeoutRef.current = window.setTimeout(() => {
      isScrollingRef.current = false;
    }, 100);
  }, []);
  
  // Hàm khởi tạo listener cho sự kiện cuộn
  const initScrollListener = useCallback((containerId: string) => {
    // Xóa listener cũ nếu có
    removeScrollListener();
    
    // Tìm container bằng ID
    const container = document.querySelector(containerId) as HTMLElement;
    if (!container) {
      console.warn(`Scroll container with ID ${containerId} not found`);
      return;
    }
    
    // Lưu tham chiếu đến container
    scrollContainerRef.current = container;
    
    // Gắn sự kiện cuộn
    container.addEventListener('scroll', handleScroll, { passive: true });
    
    // Lưu hàm cleanup
    cleanupRef.current = () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);
  
  // Hàm xóa listener cho sự kiện cuộn
  const removeScrollListener = useCallback(() => {
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }
    
    if (scrollTimeoutRef.current) {
      window.clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = null;
    }
  }, []);

  return (
    <LayoutContext.Provider 
      value={{ 
        sidebarCollapsed, 
        setSidebarCollapsed,
        headerVisible,
        mobileNavVisible,
        initScrollListener,
        removeScrollListener
      }}
    >
      {children}
    </LayoutContext.Provider>
  );
}