import React, { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import MobileNavigator from "./MobileNavigator";
import { cn } from "@/lib/utils";

interface MobileLayoutProps {
  children: React.ReactNode;
}

const MobileLayoutContent = ({ children }: MobileLayoutProps) => {
  // Thêm useEffect để ngăn chặn scroll của body và html khi component được mount
  useEffect(() => {
    // Lưu trữ giá trị overflow ban đầu để khôi phục sau này
    const originalOverflow = document.body.style.overflow;
    const originalHTMLOverflow = document.documentElement.style.overflow;
    
    // Vô hiệu hóa scroll trên body và html
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    
    // Cleanup: khôi phục giá trị ban đầu khi component unmount
    return () => {
      document.body.style.overflow = originalOverflow;
      document.documentElement.style.overflow = originalHTMLOverflow;
    };
  }, []);
  
  return (
    <div className="mobile-layout">
      {/* 
        Main content container với ONE TRUE SCROLL
        Chỉ container này được phép có scroll, tất cả container khác bị khóa scroll
      */}
      <main className="mobile-main-content mobile-content-with-navigation" id="one-true-scroll-container">
        <div className="flex-1 flex flex-col w-full">
          {children}
        </div>
        {/* Mobile-content-with-navigation là container scroll duy nhất */}
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