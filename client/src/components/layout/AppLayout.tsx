import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Sidebar } from "./Sidebar";
import { useLayout } from "@/contexts/LayoutContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useScrollDirection } from "@/hooks/use-scroll-direction";

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
  const { direction, isScrolling } = useScrollDirection();
  const [respectSafeArea, setRespectSafeArea] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Logic điều chỉnh safe area khi cuộn
  useEffect(() => {
    const handleSafeAreaTransition = () => {
      // Trường hợp đặc biệt khi đầu trang luôn tôn trọng top safe area
      const isAtPageTop = window.scrollY < 10;
      
      // Khi ở đầu trang, luôn tôn trọng safe area
      if (isAtPageTop) {
        setRespectSafeArea(true);
        return;
      }
      
      // Trường hợp đặc biệt cho cuối trang để tránh giật
      const isNearPageBottom = 
        window.innerHeight + window.scrollY >= 
        document.documentElement.scrollHeight - 20;
        
      if (isNearPageBottom) {
        return;
      }
      
      // Chỉ thay đổi khi đang cuộn thực sự
      if (!isScrolling) return;
      
      // Khi cuộn xuống, cho phép nội dung chiếm diện tích safe area
      if (direction === 'down') {
        setRespectSafeArea(false);
      } 
      // Khi cuộn lên, chỉ phục hồi safe area khi gần đầu trang
      else if (direction === 'up' && window.scrollY < 100) {
        setRespectSafeArea(true);
      }
    };
    
    // Add debounce to prevent rapid state changes
    const timeoutId = setTimeout(handleSafeAreaTransition, 50);
    return () => clearTimeout(timeoutId);
  }, [direction, isScrolling]);

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) return null;

  return (
    <div className="relative min-h-screen bg-background">
      {/* Sidebar Component - handles both mobile (drawer) and desktop (fixed) sidebar */}
      <Sidebar />
      
      {/* Main Content Area */}
      <main 
        className={cn(
          "flex-1 transition-all duration-300 ease-in-out min-h-screen",
          // On desktop, add left margin equal to the sidebar width
          !isMobile && "md:ml-[72px]",
          // If sidebar is expanded, increase margin
          !isMobile && !sidebarCollapsed && "md:ml-[256px]",
          // On mobile, no need for header padding anymore
          isMobile && "pt-0"
        )}
      >
        {/* Safe area vùng đầu trang */}
        {respectSafeArea && (
          <div className="safe-area-top w-full h-0" />
        )}
        
        <div 
          className={cn(
            "transition-all duration-500 ease-in-out max-w-7xl mx-auto px-4 sm:px-6 safe-area-left safe-area-right",
            // Bottom safe area luôn được áp dụng, top safe area xử lý riêng ở trên
            respectSafeArea 
              ? "pt-4 pb-4 safe-area-bottom" 
              : "pt-0 pb-0"
          )}
        >
          {children}
        </div>
      </main>
    </div>
  );
}