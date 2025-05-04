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
        Main content container with safe-area spacing
        Sử dụng CSS media queries để tự động xử lý việc hiển thị trong PWA
        thay vì dùng JavaScript isPWA()
      */}
      <main className="mobile-main-content mobile-content-with-navigation">
        <div className="flex-1 flex flex-col w-full">
          {children}
        </div>
        {/* 
          Thêm spacer div để đảm bảo nội dung không bị mobile navigator che khuất
          Sử dụng CSS variables để tự động điều chỉnh với các thiết bị khác nhau
        */}
        <div className="mobile-nav-spacer" aria-hidden="true"></div>
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