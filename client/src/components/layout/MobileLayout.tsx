import React, { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import BottomNav from "./BottomNav";
import { cn } from "@/lib/utils";

interface MobileLayoutProps {
  children: React.ReactNode;
}

export default function MobileLayout({ children }: MobileLayoutProps) {
  const isMobile = useIsMobile();
  const [mounted, setMounted] = useState(false);
  const [isPWA, setIsPWA] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Kiểm tra xem có đang chạy trong chế độ PWA không
    const checkIfPWA = () => {
      return window.matchMedia('(display-mode: standalone)').matches || 
             window.matchMedia('(display-mode: fullscreen)').matches ||
             (window.navigator as any).standalone === true;
    };
    
    setIsPWA(checkIfPWA());
    
    // Theo dõi thay đổi chế độ hiển thị (display mode)
    const mediaQueryList = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      setIsPWA(e.matches || window.matchMedia('(display-mode: fullscreen)').matches);
    };
    
    mediaQueryList.addEventListener('change', handleDisplayModeChange);
    
    return () => {
      mediaQueryList.removeEventListener('change', handleDisplayModeChange);
    };
  }, []);

  // Không render nếu không phải mobile hoặc chưa mounted (tránh hydration mismatch)
  if (!isMobile || !mounted) {
    return <>{children}</>;
  }

  return (
    <div 
      className={cn(
        "flex flex-col min-h-screen min-h-[100dvh] bg-background", 
        isPWA ? "pwa-standalone-container" : ""
      )}
    >
      {/* Main content with Facebook-style layout */}
      <main 
        className={cn(
          "flex-1", // Always full height
          // Điều chỉnh padding dựa trên Facebook style khi trong PWA
          isPWA 
            ? "fb-main-content pwa-container" // Facebook-style padding trong PWA + container fix
            : "px-4 pt-1 pwa-top-inset" // Padding thông thường khi không phải PWA
        )}
        style={{
          // CRITICAL FIX: Ensure modals and popovers are visible in PWA mode
          overflow: 'visible',
          position: 'relative',
          zIndex: 1
        }}
      >
        {/* Facebook-style content container with fixes for component visibility */}
        <div 
          className={cn(
            // Chỉ áp dụng lớp fb-content trong PWA và đảm bảo modals sẽ hiển thị
            isPWA ? "fb-content pwa-content" : "",
            "pwa-container" // Apply this class to ensure proper z-index and overflow
          )}
          style={{
            // CRITICAL FIX: Ensure modals and popovers can render outside this container
            overflow: 'visible',
            position: 'relative',
            zIndex: 'auto'
          }}
        >
          {children}
          
          {/* Spacer element - Facebook style bottom spacing */}
          <div 
            className={cn(
              "w-full", 
              isPWA 
                ? "fb-bottom-spacer" // Facebook-style bottom spacing
                : "h-[60px] sm:h-[70px] md:h-0 lg:h-0" // Normal spacing
            )} 
            aria-hidden="true" 
          />
        </div>
      </main>
      
      {/* Bottom Navigation - Facebook style */}
      <BottomNav />
    </div>
  );
}