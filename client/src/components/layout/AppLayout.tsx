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
  // Tính toán chiều cao của viewport 
  const [viewportHeight, setViewportHeight] = useState(0);
  
  // Prevent unwanted scrolling when Radix UI components open dropdowns/popups
  usePreventScrollJump({
    // Enable for all environments (web, mobile, PWA)
    enabled: true,
    // Target common Radix UI components that could cause scroll jumps
    selector: [
      '[data-radix-select-content]',       // Select component
      '[data-radix-dropdown-menu-content]', // DropdownMenu component
      '[data-radix-popover-content]',      // Popover component
      '[data-radix-dialog-content]',       // Dialog component
      '[role="dialog"]',                   // General dialogs
      '[role="listbox"]'                   // Listbox components
    ].join(', '),
    // Adjust timing based on app's animations (slightly longer for larger components)
    preventDuration: 450,
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
          // Đảm bảo không có hiệu ứng "nhảy" khi scroll
          overflowY: 'scroll',
          overscrollBehavior: 'none'
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