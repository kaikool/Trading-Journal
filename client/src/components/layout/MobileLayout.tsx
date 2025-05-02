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
  const [isPWA, setIsPWA] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // PWA detection
    const checkIfPWA = () => {
      return window.matchMedia('(display-mode: standalone)').matches || 
             window.matchMedia('(display-mode: fullscreen)').matches ||
             (window.navigator as any).standalone === true;
    };
    
    setIsPWA(checkIfPWA());
    
    // Watch for display mode changes
    const mediaQueryList = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      setIsPWA(e.matches || window.matchMedia('(display-mode: fullscreen)').matches);
    };
    
    mediaQueryList.addEventListener('change', handleDisplayModeChange);
    
    // Set viewport height CSS variable
    const setViewportHeight = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    
    // Initial call and add resize listener
    setViewportHeight();
    window.addEventListener('resize', setViewportHeight);
    
    return () => {
      mediaQueryList.removeEventListener('change', handleDisplayModeChange);
      window.removeEventListener('resize', setViewportHeight);
    };
  }, []);

  // Don't render if not mobile or not mounted (avoid hydration mismatch)
  if (!isMobile || !mounted) {
    return <>{children}</>;
  }

  // CRITICAL FIX: EXTREMELY SIMPLIFIED LAYOUT FOR PWA MODE
  if (isPWA) {
    return (
      <div id="pwa-root" style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'white',
        overflow: 'auto'
      }}>
        {/* MAIN CONTENT AREA - VERY SIMPLE STRUCTURE */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          width: '100%',
          padding: '16px',
          paddingBottom: '80px' // Space for navigation
        }}>
          {/* DEBUG INFO */}
          <div style={{
            padding: '10px',
            margin: '10px 0 20px 0',
            backgroundColor: '#e6f7ff',
            border: '1px solid #91d5ff',
            borderRadius: '4px',
            fontSize: '14px'
          }}>
            <h3 style={{fontWeight: 'bold', marginBottom: '5px'}}>PWA Debug Panel</h3>
            <p>PWA Mode: <strong>Active</strong></p>
            <p>Screen Width: {typeof window !== 'undefined' ? window.innerWidth : 'N/A'}px</p>
            <p>Content should be visible below:</p>
          </div>
          
          {/* ACTUAL CONTENT */}
          {children}
        </div>
        
        {/* BOTTOM NAV */}
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0, 
          right: 0,
          zIndex: 100,
          backgroundColor: 'white',
          borderTop: '1px solid #eaeaea'
        }}>
          <BottomNav />
        </div>
      </div>
    );
  }

  // NORMAL MOBILE LAYOUT (NON-PWA)
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-1 px-4 pt-2">
        {children}
        <div className="h-[70px]" aria-hidden="true" />
      </main>
      <BottomNav />
    </div>
  );
}