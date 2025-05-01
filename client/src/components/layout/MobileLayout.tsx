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

  useEffect(() => {
    setMounted(true);
  }, []);

  // Không render nếu không phải mobile hoặc chưa mounted (tránh hydration mismatch)
  if (!isMobile || !mounted) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col min-h-screen min-h-[100dvh] bg-background">
      {/* Main content - với padding tối ưu cho PWA */}
      <main className={cn(
        "flex-1 px-4 pt-1", // Chỉ giữ padding bên và padding top tối thiểu
        "pwa-top-inset", // Padding top cho safe area (notch/dynamic island)
        "pb-safe" // Sử dụng safe area inset bottom thay vì padding cố định
      )}>
        {children}
      </main>
      
      {/* Bottom Navigation - sử dụng class thống nhất */}
      <BottomNav />
    </div>
  );
}