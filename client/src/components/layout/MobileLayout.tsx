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
      {/* Unified main content container with consistent padding and flex layout */}
      <main className="mobile-main-content">
        <div className="flex-1 flex flex-col w-full">
          {children}
        </div>
        
        {/* Spacer to prevent content from being hidden beneath fixed mobile navigation */}
        <div 
          className="bottom-nav-spacer"
          aria-hidden="true" 
        />
      </main>
      {/* No extra elements between main content and mobile navigator */}
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