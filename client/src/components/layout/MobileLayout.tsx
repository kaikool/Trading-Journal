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
      {/* Main content with GitHub-style layout */}
      <main 
        className={cn(
          "flex-1", // Always full height
          // GitHub's compact layout in PWA mode
          isPWA 
            ? "gh-main-content" // GitHub-style minimal padding in PWA
            : "px-4 pt-1 pwa-top-inset" // Regular padding in browser mode
        )}
      >
        {/* GitHub-style content container with 8px grid system */}
        <div 
          className={cn(
            // Only apply the GitHub content class in PWA mode
            isPWA ? "gh-content" : ""
          )}
        >
          {children}
          
          {/* Spacer element - GitHub style uses precise 8px grid spacing */}
          <div 
            className={cn(
              "w-full", 
              isPWA 
                ? "gh-bottom-spacer" // GitHub-style precise bottom spacing
                : "h-[60px] sm:h-[70px] md:h-0 lg:h-0" // Regular spacing outside PWA
            )} 
            aria-hidden="true" 
          />
        </div>
      </main>
      
      {/* Bottom Navigation - GitHub style */}
      <BottomNav />
    </div>
  );
}