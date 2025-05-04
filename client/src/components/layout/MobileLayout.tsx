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
      <main className="mobile-main-content mobile-content-with-navigation has-mobile-nav-spacing">
        <div className="flex-1 flex flex-col w-full">
          {children}
        </div>
        {/* 
          Sử dụng CSS class has-mobile-nav-spacing thay vì thêm spacer div riêng
          Điều này giúp tránh tạo thêm DOM nodes không cần thiết và sử dụng
          CSS variables để đảm bảo khoảng cách phù hợp trên mọi thiết bị
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