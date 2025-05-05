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
  initScrollListener: (containerId: string, element?: HTMLElement | null) => void;
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
    console.log("Scroll event detected:", scrollY);
    
    // Lấy vị trí cuộn trước đó
    const lastScrollY = lastScrollYRef.current;
    // Cập nhật vị trí cuộn trước đó
    lastScrollYRef.current = scrollY;
    
    // Không thay đổi nếu vị trí cuộn quá thấp (ở đầu trang)
    if (scrollY < 10) {
      setHeaderVisible(true);
      setMobileNavVisible(true);
      console.log("Near top, showing elements");
      return;
    }
    
    // Xác định hướng cuộn
    const isScrollingDown = scrollY > lastScrollY;
    console.log("Scrolling direction:", isScrollingDown ? "down" : "up");
    
    // Đặt trạng thái đang cuộn
    isScrollingRef.current = true;
    
    // Debounce để tránh xử lý quá nhiều sự kiện
    if (scrollTimeoutRef.current) {
      window.clearTimeout(scrollTimeoutRef.current);
    }
    
    // Chỉ thay đổi trạng thái khi cuộn đủ xa
    if (Math.abs(scrollY - lastScrollY) > 10) {
      // Ẩn/hiện header và mobile navigation dựa trên hướng cuộn
      if (isScrollingDown) {
        console.log("Hiding elements");
        setHeaderVisible(false);
        setMobileNavVisible(false);
      } else {
        console.log("Showing elements");
        setHeaderVisible(true);
        setMobileNavVisible(true);
      }
    }
    
    // Đặt timeout để reset trạng thái đang cuộn
    scrollTimeoutRef.current = window.setTimeout(() => {
      isScrollingRef.current = false;
    }, 100);
  }, []);
  
  // Hàm khởi tạo listener cho sự kiện cuộn
  const initScrollListener = useCallback((containerId: string, element?: HTMLElement | null) => {
    // Xóa listener cũ nếu có
    removeScrollListener();
    
    // Đảm bảo chúng ta đang kết nối với DOM
    console.log(`Init scroll listener with ${element ? 'element reference' : 'selector: ' + containerId}`);
    
    // Đợi để DOM được render hoàn chỉnh
    setTimeout(() => {
      // Ưu tiên sử dụng tham chiếu DOM được truyền vào
      let container: HTMLElement | null = element || null;
      
      // Nếu không có tham chiếu, thử sử dụng selector
      if (!container && containerId) {
        container = document.querySelector(containerId) as HTMLElement;
      }
      
      if (!container) {
        console.warn('No scroll container found');
        return;
      }
      
      // Lưu tham chiếu đến container
      scrollContainerRef.current = container;
      
      console.log(`Found container, attaching listener`, container);
      
      // Gắn sự kiện cuộn
      container.addEventListener('scroll', handleScroll, { passive: true });
      
      // Lưu hàm cleanup
      cleanupRef.current = () => {
        if (container) {
          container.removeEventListener('scroll', handleScroll);
        }
      };
    }, 500);
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