import React, { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import MobileNavigator from "./MobileNavigator";
import { cn } from "@/lib/utils";
import { isPWA } from "@/lib/pwa-helper";

interface MobileLayoutProps {
  children: React.ReactNode;
}

const MobileLayoutContent = ({ children }: MobileLayoutProps) => {
  // Kiểm tra xem ứng dụng có đang chạy ở chế độ PWA không
  const [isPWAMode, setIsPWAMode] = useState(false);
  
  useEffect(() => {
    // Xác định nếu đang ở chế độ PWA để tối ưu hóa layout
    setIsPWAMode(isPWA());
  }, []);
  
  return (
    <div className="mobile-layout">
      {/* Unified main content container with consistent padding and flex layout */}
      <main className="mobile-main-content">
        <div className="flex-1 flex flex-col w-full">
          {children}
        </div>
        
        {/* 
          Spacer để ngăn nội dung bị ẩn dưới thanh điều hướng cố định
          Trong chế độ PWA, không cần thêm spacer vì đã có CSS xử lý 
        */}
        {!isPWAMode && (
          <div 
            className="bottom-nav-spacer"
            aria-hidden="true" 
          />
        )}
      </main>
      {/* Không có phần tử thừa giữa nội dung chính và thanh điều hướng */}
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