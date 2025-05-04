import React, { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import MobileNavigator from "./MobileNavigator";
import { cn } from "@/lib/utils";

interface MobileLayoutProps {
  children: React.ReactNode;
}

const MobileLayoutContent = ({ children }: MobileLayoutProps) => {
  return (
    <div className="mobile-layout">
      {/* 
        Main content container using safe-area rules
        Mọi khoảng cách đều đã được xử lý bởi safe-area, không cần spacer thêm
      */}
      <main className="mobile-main-content">
        <div className="flex-1 flex flex-col w-full">
          {children}
        </div>
        {/* 
          Đã loại bỏ bottom-nav-spacer không cần thiết
          Safe-area CSS với biến --safe-bottom đã xử lý khoảng cách này
        */}
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