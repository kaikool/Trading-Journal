import React, { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { isPWA } from "@/lib/pwa-helper";
import BottomNav from "./BottomNav";
import { cn } from "@/lib/utils";

interface MobileLayoutProps {
  children: React.ReactNode;
}

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

  // Detect PWA mode for additional CSS
  const [isPWAMode, setIsPWAMode] = useState(false);
  
  // Check for PWA status after mounting
  useEffect(() => {
    if (mounted) {
      setIsPWAMode(isPWA());
    }
  }, [mounted]);

  return (
    <div className={cn(
      "flex flex-col min-h-screen min-h-[100dvh] bg-background",
      "mobile-layout", // Add a specific class for PWA styling
      isPWAMode && "pwa-mobile-layout" // Additional class for PWA mode
    )}>
      {/* Main content - với padding tối ưu cho PWA */}
      <main className={cn(
        "flex-1 px-4 pt-1", // Chỉ giữ padding bên và padding top tối thiểu
        "pwa-top-inset", // Padding top cho safe area (notch/dynamic island)
        isPWAMode && "pt-safe" // Add safe area padding directly when in PWA mode
      )}>
        {children}
        
        {/* Spacer element để đảm bảo nội dung không bị BottomNav che phủ */}
        <div 
          className="w-full sm:h-[70px] md:h-0 lg:h-0" 
          style={{
            // Dynamic height calculation using safe area on PWA mode
            height: isPWAMode ? 'calc(60px + env(safe-area-inset-bottom, 0px))' : '60px'
          }}
          aria-hidden="true" 
        />
      </main>
      
      {/* Bottom Navigation - sử dụng class thống nhất */}
      <BottomNav isPWAMode={isPWAMode} />
    </div>
  );
}