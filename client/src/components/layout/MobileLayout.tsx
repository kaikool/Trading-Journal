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
      style={{
        // CRITICAL FIX: These styles ensure content is visible in PWA mode
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 'var(--vh, 100vh)',
        width: '100%',
        maxWidth: '100vw',
        position: 'relative',
        overflow: 'visible'
      }}
    >
      {/* Main content with Facebook-style layout - SIMPLIFIED FOR DEBUGGING */}
      <main 
        className={cn(
          "flex-1", // Always full height
          isPWA ? "px-4 pt-1" : "px-4 pt-1 pwa-top-inset" // Simple padding for debugging
        )}
        style={{
          // CRITICAL FIX: Basic styles for content visibility
          flex: '1 0 auto',
          display: 'block',
          width: '100%',
          height: 'auto',
          minHeight: '200px', // Force some height
          overflow: 'visible',
          position: 'relative'
        }}
      >
        {/* Direct children rendering - simplified wrapper structure */}
        <div 
          className="content-wrapper"
          style={{
            // CRITICAL FIX: Basic visible content styling
            display: 'block',
            width: '100%',
            minHeight: '200px',
            paddingBottom: '70px', // Space for navigation
            position: 'relative'
          }}
        >
          {/* DEBUG MARKER - will remove this after visibility is fixed */}
          <div style={{
            padding: '10px',
            margin: '10px 0',
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '4px'
          }}>
            <h3 style={{fontSize: '16px', fontWeight: 'bold', marginBottom: '4px'}}>Debug Panel</h3>
            <p style={{fontSize: '14px'}}>PWA Mode: {isPWA ? 'Yes' : 'No'}</p>
          </div>
          
          {children}
          
          {/* Simple spacer at bottom */}
          <div className="h-[70px]" aria-hidden="true" />
        </div>
      </main>
      
      {/* Bottom Navigation - Facebook style */}
      <BottomNav />
    </div>
  );
}