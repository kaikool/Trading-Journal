import React, { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { isPWA } from "@/lib/pwa-helper";
import MobileNavigator from "./MobileNavigator";
import { cn } from "@/lib/utils";

interface MobileLayoutProps {
  children: React.ReactNode;
}

const MobileLayoutContent = ({ children }: MobileLayoutProps) => {
  // Detect PWA mode on client side
  const [isPWAMode, setIsPWAMode] = useState(false);
  
  useEffect(() => {
    // Check if we're in PWA mode
    setIsPWAMode(isPWA());
    
    // Thêm class vào body để có thể style toàn bộ app ở chế độ PWA
    if (isPWA()) {
      document.documentElement.classList.add('pwa-mode');
    }
    
    return () => {
      // Cleanup khi component unmount
      document.documentElement.classList.remove('pwa-mode');
    };
  }, []);
  
  return (
    <div className={cn(
      "flex flex-col min-h-screen min-h-[100dvh] bg-background",
      "mobile-layout", // Add a specific class for mobile styling
      isPWAMode && "pwa-mobile-layout" // Additional class for PWA mode
    )}>
      {/* Main content - với padding tối ưu cho PWA */}
      <main className={cn(
        "flex-1", // Remove fixed padding, now handled by pwa-main-content
        // PWA class đã bao gồm tất cả padding cần thiết
        isPWAMode && "pwa-main-content"
      )}>
        {children}
        
        {/* Spacer element để đảm bảo nội dung không bị BottomNav che phủ */}
        {/* Spacer thống nhất - sử dụng CSS class */}
        <div 
          className={cn(
            "w-full",
            isPWAMode ? "pwa-bottom-spacer" : "h-[60px] sm:h-[70px] md:h-0 lg:h-0"
          )}
          aria-hidden="true" 
        />
      </main>
      
      {/* Bottom Navigation - sử dụng class thống nhất */}
      <MobileNavigator isPWAMode={isPWAMode} />
    </div>
  );
};

export default function MobileLayout({ children }: MobileLayoutProps) {
  const isMobile = useIsMobile();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Không render nếu không phải mobile hoặc chưa mounted (tránh hydration mismatch)
  if (!isMobile || !mounted) {
    return <>{children}</>;
  }

  // Render nested component to avoid hook rules issues
  return <MobileLayoutContent>{children}</MobileLayoutContent>;
}