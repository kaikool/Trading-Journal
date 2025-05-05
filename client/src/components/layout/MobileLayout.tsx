import React, { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import MobileNavigator from "./MobileNavigator";
import { cn } from "@/lib/utils";

interface MobileLayoutProps {
  children: React.ReactNode;
}

const MobileLayoutContent = ({ children }: MobileLayoutProps) => {
  return (
    <div className="mobile-layout app-layout-container">
      {/* 
        Main content container with safe-area spacing
        Sử dụng CSS media queries để tự động xử lý việc hiển thị trong PWA
        thay vì dùng JavaScript isPWA()
      */}
      <main className="app-content-container mobile-content-with-navigation">
        <div className="flex-1 flex flex-col w-full max-w-md mx-auto">
          {children}
        </div>
        {/* Main content container now has standardized bottom padding directly in mobile-content-with-navigation class */}
      </main>
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

  // Don't render on non-mobile devices or before mounting to avoid hydration mismatch
  if (!isMobile || !mounted) {
    return <>{children}</>;
  }

  // Render nested component to avoid hook rules issues
  return <MobileLayoutContent>{children}</MobileLayoutContent>;
}