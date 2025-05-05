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
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Thiết lập scroll listener khi component mount
  useEffect(() => {
    // Đợi một chút để đảm bảo DOM đã render
    const timer = setTimeout(() => {
      // Kết nối scroll container với LayoutContext
      initScrollListener('.mobile-content-with-navigation');
    }, 100);
    
    // Cleanup khi unmount
    return () => {
      clearTimeout(timer);
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
        <div className="flex-1 flex flex-col w-full max-w-md mx-auto">
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