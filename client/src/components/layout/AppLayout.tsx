import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Sidebar } from "./Sidebar";
import { useLayout } from "@/contexts/LayoutContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { ScrollToTop } from "@/components/ui/scroll-to-top";

interface AppLayoutProps {
  children: React.ReactNode;
}

/**
 * AppLayout - The main application layout component
 *
 * Provides a responsive layout that:
 * 1. On mobile: Shows full-width content with a bottom navigation bar
 * 2. On desktop: Shows a collapsible sidebar with the main content area
 *
 * This component handles proper spacing, safe areas, and sidebar toggling.
 */
export function AppLayout({ children }: AppLayoutProps) {
  const { sidebarCollapsed } = useLayout();
  const isMobile = useIsMobile();
  const [mounted, setMounted] = useState(false);
  const [respectSafeArea, setRespectSafeArea] = useState(true);
  const [viewportHeight, setViewportHeight] = useState(0);

  useEffect(() => {
    setMounted(true);
    setRespectSafeArea(true);

    if (typeof window !== "undefined") {
      setViewportHeight(window.innerHeight);
      const handleResize = () => setViewportHeight(window.innerHeight);
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  if (!mounted) return null;

  return (
    <div
      className="relative min-h-screen bg-background"
      style={{ backgroundColor: "hsl(var(--background))" }} // đảm bảo nền phủ tận safe-area
    >
      {/* Sidebar */}
      <Sidebar className="sidebar-root" />

      {/* Scroll to top button */}
      <ScrollToTop />

      <main
        className={cn(
          "flex-1 transition-all duration-300 ease-in-out min-h-screen flex flex-col",
          !isMobile && "md:ml-[72px]",
          !isMobile && !sidebarCollapsed && "md:ml-[256px]",
          isMobile && "pt-0"
        )}
        style={{
          minHeight: viewportHeight > 0 ? `${viewportHeight}px` : "100vh",
          overflowY: "auto",
          // TRẢ NỘI DUNG VỀ SÁT ĐÁY: không đệm safe-bottom ở layout
          paddingBottom: 0,
          // giữ nền đồng bộ với wrapper để không thấy dải khác màu
          backgroundColor: "hsl(var(--background))",
        }}
      >
        <div
          className={cn(
            "transition-all duration-500 ease-in-out max-w-7xl mx-auto w-full px-4 sm:px-6 safe-area-left safe-area-right flex-grow page-content",
            respectSafeArea ? "pt-4" : "pt-0"
          )}
        >
          {children}
        </div>
      </main>
    </div>
  );
}
