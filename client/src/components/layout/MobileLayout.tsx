import React, { useState, useEffect, useRef } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import MobileNavigator from "./MobileNavigator";
import { cn } from "@/lib/utils";
import { useLayout } from "@/contexts/LayoutContext";

interface MobileLayoutProps {
  children: React.ReactNode;
}

const MobileLayoutContent = ({ children }: MobileLayoutProps) => {
  const { initScrollListener, removeScrollListener } = useLayout();
  const contentRef = useRef<HTMLElement>(null);
  
  // Thiết lập scroll listener khi component mount
  useEffect(() => {
    console.log("MobileLayout mounted, setting up scroll listener");
    
    // Thêm một sự kiện cuộn trực tiếp
    const handleDirectScroll = () => {
      console.log("Direct scroll detected");
      
      // Lấy vị trí cuộn hiện tại
      const scrollY = window.scrollY;
      const lastScrollY = contentRef.current?.getAttribute('data-last-scroll') || '0';
      const lastScrollYNum = parseInt(lastScrollY);
      
      // Lưu vị trí cuộn mới
      contentRef.current?.setAttribute('data-last-scroll', scrollY.toString());
      
      // Điều chỉnh trạng thái UI
      if (scrollY < 10) {
        // Always show when near top
        document.documentElement.classList.remove('hide-header');
        document.documentElement.classList.remove('hide-nav');
      } else {
        // Show/hide based on scroll direction
        if (scrollY > lastScrollYNum + 10) {
          // Scrolling down - hide
          document.documentElement.classList.add('hide-header');
          document.documentElement.classList.add('hide-nav'); 
        } else if (scrollY < lastScrollYNum - 10) {
          // Scrolling up - show
          document.documentElement.classList.remove('hide-header');
          document.documentElement.classList.remove('hide-nav');
        }
      }
    };
    
    // Đợi một chút để đảm bảo DOM đã render
    const timer = setTimeout(() => {
      // Thêm sự kiện scroll trực tiếp vào window
      window.addEventListener('scroll', handleDirectScroll, { passive: true });
      
      // Cũng thử kết nối qua LayoutContext
      if (contentRef.current) {
        console.log("Container ref found:", contentRef.current);
        initScrollListener('', contentRef.current);
      }
    }, 500);
    
    // Cleanup khi unmount
    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleDirectScroll);
      removeScrollListener();
    };
  }, [initScrollListener, removeScrollListener]);
  
  return (
    <div className="mobile-layout app-layout-container">
      {/* 
        Main content container with safe-area spacing
        Sử dụng CSS media queries để tự động xử lý việc hiển thị trong PWA
        thay vì dùng JavaScript isPWA()
      */}
      <main 
        className="app-content-container mobile-content-with-navigation" 
        ref={contentRef}
        id="mobile-content-container"
      >
        <div className="flex-1 flex flex-col w-full max-w-md mx-auto pt-16">
          {children}
        </div>
        {/* Main content container now has standardized bottom padding directly in mobile-content-with-navigation class */}
      </main>
      <MobileNavigator />
    </div>
  );
};

export default function MobileLayout({ children }: MobileLayoutProps) {
  const isMobile = useIsMobile();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render on non-mobile devices or before mounting to avoid hydration mismatch
  if (!isMobile || !mounted) {
    return <>{children}</>;
  }

  // Render nested component to avoid hook rules issues
  return <MobileLayoutContent>{children}</MobileLayoutContent>;
}