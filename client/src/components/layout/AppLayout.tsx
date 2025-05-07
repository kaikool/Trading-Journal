import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Sidebar } from "./Sidebar";
import { useLayout } from "@/contexts/LayoutContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useScrollDirection } from "@/hooks/use-scroll-direction";

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
  const { direction, isScrolling } = useScrollDirection();
  const [respectSafeArea, setRespectSafeArea] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle safe area behavior based on scroll direction
  useEffect(() => {
    if (direction === 'down' && isScrolling) {
      // When scrolling down, allow content to flow into safe areas
      setRespectSafeArea(false);
    } else if (direction === 'up' && isScrolling) {
      // When scrolling up, restore safe areas
      setRespectSafeArea(true);
    }
  }, [direction, isScrolling]);

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) return null;

  return (
    <div className="relative min-h-screen bg-background">
      {/* Sidebar Component - handles both mobile (drawer) and desktop (fixed) sidebar */}
      <Sidebar />
      
      {/* Main Content Area */}
      <main 
        className={cn(
          "flex-1 transition-all duration-300 ease-in-out min-h-screen",
          // On desktop, add left margin equal to the sidebar width
          !isMobile && "md:ml-[72px]",
          // If sidebar is expanded, increase margin
          !isMobile && !sidebarCollapsed && "md:ml-[256px]",
          // On mobile, no need for header padding anymore
          isMobile && "pt-0"
        )}
      >
        <div 
          className={cn(
            "transition-all duration-300 max-w-7xl mx-auto",
            // Apply safe area padding conditionally
            respectSafeArea ? "p-4 sm:p-6 safe-area-inset" : "p-0 sm:p-0"
          )}
        >
          {children}
        </div>
      </main>
    </div>
  );
}