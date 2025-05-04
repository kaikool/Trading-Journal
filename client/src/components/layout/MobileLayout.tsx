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
    // Check if we're in PWA mode - không thêm class ở đây vì đã được xử lý trong PWAContainer
    setIsPWAMode(isPWA());
  }, []);
  
  return (
    <div className="mobile-layout">
      {/* Main content area - use unified content class, PWA styling from html.pwa-mode */}
      <main className={isPWAMode ? "pwa-main-content" : "flex-1 px-4"}>
        <div className="flex-1 flex flex-col w-full">
          {children}
        </div>
        
        {/* UNIFIED BOTTOM SPACER - controlled by single CSS rule */}
        <div 
          className="bottom-nav-spacer"
          aria-hidden="true" 
        />
      </main>
      
      {/* Mobile Navigation - positioning controlled solely by global CSS */}
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

  // Không render nếu không phải mobile hoặc chưa mounted (tránh hydration mismatch)
  if (!isMobile || !mounted) {
    return <>{children}</>;
  }

  // Render nested component to avoid hook rules issues
  return <MobileLayoutContent>{children}</MobileLayoutContent>;
}