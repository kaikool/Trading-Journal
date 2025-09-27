import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Sidebar } from "@/components/layout/Sidebar"; // chỉnh path nếu khác
import { useLayout } from "@/contexts/LayoutContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { ScrollToTop } from "@/components/ui/scroll-to-top";

interface AppLayoutProps {
  children: React.ReactNode;
}

/**
 * AppLayout:
 * - Desktop: chừa chỗ cho Sidebar 72px (collapsed) / 256px (expanded)
 * - Mobile: dùng Drawer; không tạo scroll container phụ để tránh double-scroll
 * - Dùng 100dvh cho mobile ổn định hơn innerHeight
 */
export function AppLayout({ children }: AppLayoutProps) {
  const { sidebarCollapsed } = useLayout();
  const isMobile = useIsMobile();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <div
      className="relative min-h-[100dvh] bg-background"
      style={{ backgroundColor: "hsl(var(--background))" }}
    >
      <Sidebar className="sidebar-root" />
      <ScrollToTop />

      <main
        role="main"
        id="main-content"
        className={cn(
          "flex min-h-[100dvh] flex-col transition-all duration-300 ease-in-out",
          // Desktop margins khớp sidebar
          !isMobile && "md:ml-[72px]",
          !isMobile && !sidebarCollapsed && "md:ml-[256px]",
          // Mobile không cần padding top
          isMobile && "pt-0"
        )}
        style={{
          backgroundColor: "hsl(var(--background))",
          // Desktop có thể cho scroll riêng; mobile để body quản lý
          overflowY: isMobile ? "visible" : "auto",
          paddingBottom: 0,
        }}
      >
        <div
          className={cn(
            "page-content safe-area-left safe-area-right",
            "w-full max-w-7xl mx-auto",
            "px-4 sm:px-6 pt-4",
            "transition-all duration-500 ease-in-out"
          )}
        >
          {children}
        </div>
      </main>
    </div>
  );
}
