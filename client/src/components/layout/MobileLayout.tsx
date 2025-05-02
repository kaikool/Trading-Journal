import React, { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { isPWA } from "@/lib/pwa-helper";
import BottomNav from "./BottomNav";
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
        "flex-1 px-4", // Padding bên cạnh cố định
        // Tối ưu hóa padding top cho từng trường hợp
        isPWAMode 
          ? "pt-safe" // Sử dụng safe area inset top cho PWA
          : "pt-1", // Padding tối thiểu ở chế độ không phải PWA
        // Thêm class cho PWA mode
        isPWAMode && "pwa-main-content"
      )}
      style={{
        // Fine-tuning padding top trong PWA mode để giảm không gian lãng phí
        ...(isPWAMode && {
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 4px)',
        })
      }}>
        {children}
        
        {/* Spacer element để đảm bảo nội dung không bị BottomNav che phủ */}
        <div 
          className={cn(
            "w-full sm:h-[70px] md:h-0 lg:h-0",
            isPWAMode && "pwa-bottom-spacer" // Special class for PWA mode
          )}
          style={{
            // Dynamic height calculation using safe area
            height: isPWAMode 
              ? 'calc(56px + env(safe-area-inset-bottom, 0px) + 4px)' // Thêm 4px để tránh bị sát đáy
              : '60px' // Chiều cao cố định khi không ở PWA mode
          }}
          aria-hidden="true" 
        />
      </main>
      
      {/* Bottom Navigation - sử dụng class thống nhất */}
      <BottomNav isPWAMode={isPWAMode} />
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