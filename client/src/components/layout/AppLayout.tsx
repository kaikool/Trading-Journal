import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Sidebar } from "./Sidebar";
import { useLayout } from "@/contexts/LayoutContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useScrollDirection } from "@/hooks/use-scroll-direction";
import { usePreventScrollJump } from "@/hooks/use-prevent-scroll-jump";

interface AppLayoutProps {
  children: React.ReactNode;
}

/**
 * AppLayout - The main application layout component
 * 
 * Provides a responsive layout that:
 * 1. On mobile: Shows full-width content with a bottom navigation bar
 * 2. On desktop: Shows a collapsible sidebar with the main content area
 * 
 * This component handles proper spacing, safe areas, and sidebar toggling.
 */
export function AppLayout({ children }: AppLayoutProps) {
  const { sidebarCollapsed } = useLayout();
  const isMobile = useIsMobile();
  const [mounted, setMounted] = useState(false);
  const [respectSafeArea, setRespectSafeArea] = useState(true);
  const [viewportHeight, setViewportHeight] = useState(0);
  
  // Chỉ sử dụng hook ngăn cuộn khi component đã mount
  usePreventScrollJump({
    enabled: mounted,
    selector: [
      '[data-radix-select-content]',
      '[data-radix-dropdown-menu-content]',
      '[data-radix-popover-content]',
      '[data-radix-dialog-content]',
      '[role="dialog"]',
      '[role="listbox"]'
    ].join(', '),
    preventDuration: 450,
    disableScrollIntoView: true,
    maintainFocus: true
  });

  useEffect(() => {
    setMounted(true);
    
    // Luôn tôn trọng safe area để tránh hiệu ứng giật khi cuộn
    setRespectSafeArea(true);
    
    // Cập nhật chiều cao viewport ngay khi component mount
    if (typeof window !== 'undefined') {
      setViewportHeight(window.innerHeight);
      
      // Theo dõi thay đổi kích thước cửa sổ
      const handleResize = () => {
        setViewportHeight(window.innerHeight);
      };
      
      window.addEventListener('resize', handleResize);
      
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }
  }, []);

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) return null;
  
  return (
    <div className="relative min-h-screen bg-background">
      {/* Sidebar Component - handles both mobile (drawer) and desktop (fixed) sidebar */}
      <Sidebar />
      
      {/* Main Content Area */}
      <main 
        className={cn(
          "flex-1 transition-all duration-300 ease-in-out min-h-screen flex flex-col",
          // On desktop, add left margin equal to the sidebar width
          !isMobile && "md:ml-[72px]",
          // If sidebar is expanded, increase margin
          !isMobile && !sidebarCollapsed && "md:ml-[256px]",
          // On mobile, no need for header padding anymore
          isMobile && "pt-0"
        )}
        style={{ 
          minHeight: viewportHeight > 0 ? `${viewportHeight}px` : '100vh',
          // Vấn đề focus trong Select dropdown, thay đổi scroll behavior
          overflowY: 'auto',
          overscrollBehavior: 'none',
          // Tắt hoàn toàn automatic scrolling và scroll anchoring
          scrollBehavior: 'auto'
        }}
      >
        {/* Safe area vùng đầu trang */}
        {respectSafeArea && (
          <div className="safe-area-top w-full h-0" />
        )}
        
        <div 
          className={cn(
            "transition-all duration-500 ease-in-out max-w-7xl mx-auto w-full px-4 sm:px-6 safe-area-left safe-area-right flex-grow",
            // Luôn tôn trọng safe area, top safe area xử lý theo scroll position
            respectSafeArea 
              ? "pt-4 pb-8 safe-area-bottom" 
              : "pt-0 pb-8 safe-area-bottom"
          )}
        >
          {children}
        </div>
      </main>
    </div>
  );
}