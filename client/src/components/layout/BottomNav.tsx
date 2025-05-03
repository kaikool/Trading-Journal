import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  TrendingUp, 
  History, 
  Settings,
  BarChart2
} from "lucide-react";
import { motion } from "framer-motion";
import { evaluateDevicePerformance, detectReducedMotion } from "@/lib/performance";
import { isPWA } from "@/lib/pwa-helper";

interface BottomNavItemProps {
  icon: React.ReactNode;
  activeIcon?: React.ReactNode;
  label: string;
  href: string;
  isActive: boolean;
}

export function BottomNavItem({ icon, activeIcon, label, href, isActive }: BottomNavItemProps) {
  const [reducedMotion, setReducedMotion] = useState(false);
  
  useEffect(() => {
    setReducedMotion(detectReducedMotion());
  }, []);
  
  return (
    <Link
      to={href}
      className={cn(
        "flex flex-col items-center justify-center px-1 py-2 w-full relative overflow-hidden",
        "focus:outline-none touch-manipulation", // Optimization for touch devices
        isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
      )}
    >
      {/* Indicator line for active tab */}
      {isActive && !reducedMotion && (
        <motion.div
          layoutId="bottomNavIndicator"
          className="absolute top-0 left-0 right-0 mx-auto w-12 h-[3px] bg-primary rounded-full"
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: "12px" }}
          transition={{ type: "spring", duration: 0.3, bounce: 0.2 }}
        />
      )}
      
      {/* Static indicator for reduced motion preference */}
      {isActive && reducedMotion && (
        <div className="absolute top-0 left-0 right-0 mx-auto w-12 h-[3px] bg-primary rounded-full" />
      )}
      
      {/* Icon and label */}
      <div className="flex flex-col items-center overflow-hidden">
        <div className="flex items-center justify-center h-6 mb-1.5 overflow-hidden">
          {isActive ? activeIcon || icon : icon}
        </div>
        
        <span className={cn(
          "text-[10px] font-medium transition-colors overflow-hidden whitespace-nowrap",
          isActive ? "text-primary font-semibold" : "text-muted-foreground"
        )}>
          {label}
        </span>
      </div>
    </Link>
  );
}

interface BottomNavProps {
  isPWAMode?: boolean;
}

export default function BottomNav({ isPWAMode = false }: BottomNavProps = {}) {
  const [location] = useLocation();
  const [mounted, setMounted] = useState(false);
  const [devicePerformance, setDevicePerformance] = useState<'high' | 'medium' | 'low'>('high');
  const [hasHomeIndicator, setHasHomeIndicator] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    
    // Check device performance to optimize animations
    evaluateDevicePerformance().then(performance => {
      setDevicePerformance(performance);
    });
    
    // Detect if device likely has a home indicator
    // This is a best-effort detection - modern iOS devices have safe-area-inset-bottom > 0
    const detectHomeIndicator = () => {
      try {
        // Check for PWA mode first as it always needs safe area insets
        const pwaMode = isPWA() || isPWAMode;
        
        if (pwaMode) {
          // PWA mode always needs safe area handling
          setHasHomeIndicator(true);
          return;
        }
        
        // Otherwise, try to get computed safe area inset bottom
        const safeAreaInsetBottom = parseInt(
          getComputedStyle(document.documentElement).getPropertyValue('--safe-bottom') ||
          getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-bottom') ||
          '0'
        );
        
        // Alternatively check for iOS device and modern iOS version
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        const isModernDevice = window.innerWidth >= 375 && window.devicePixelRatio >= 2;
        
        // If either condition is true, we likely have a home indicator
        setHasHomeIndicator(safeAreaInsetBottom > 0 || (isIOS && isModernDevice));
      } catch (e) {
        console.error('Error detecting home indicator:', e);
        // Default to true for safety in case of errors
        setHasHomeIndicator(true);
      }
    };
    
    // Set CSS variables for safe areas to make them accessible in JS
    const setSafeAreaVars = () => {
      document.documentElement.style.setProperty(
        '--safe-bottom', 
        getComputedStyle(document.documentElement).getPropertyValue('env(safe-area-inset-bottom, 0px)')
      );
    };
    
    setSafeAreaVars();
    detectHomeIndicator();
    
    // Update on resize for orientation changes
    const handleResize = () => {
      setSafeAreaVars();
      detectHomeIndicator();
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [isPWAMode]);

  // Only show when mounted to avoid hydration mismatch
  if (!mounted) return null;

  const navItems = [
    { 
      icon: <LayoutDashboard className="h-5 w-5" />, 
      activeIcon: <LayoutDashboard className="h-5 w-5 text-primary" />,
      label: "Dashboard", 
      href: "/" 
    },
    { 
      icon: <TrendingUp className="h-5 w-5" />, 
      activeIcon: <TrendingUp className="h-5 w-5 text-primary" />,
      label: "New Trade", 
      href: "/trade/new" 
    },
    { 
      icon: <History className="h-5 w-5" />, 
      activeIcon: <History className="h-5 w-5 text-primary" />,
      label: "History", 
      href: "/trade/history" 
    },
    {
      icon: <BarChart2 className="h-5 w-5" />,
      activeIcon: <BarChart2 className="h-5 w-5 text-primary" />,
      label: "Analytics",
      href: "/analytics"
    },
    { 
      icon: <Settings className="h-5 w-5" />, 
      activeIcon: <Settings className="h-5 w-5 text-primary" />,
      label: "Settings", 
      href: "/settings" 
    }
  ];

  return (
    <nav 
      className={cn(
        "mobile-nav lg:hidden",
        isPWAMode && "pwa-mode"
      )}
      role="navigation"
      aria-label="Main Navigation"
    >
      <div 
        className={cn(
          "grid w-full", 
          devicePerformance === 'low' ? 'grid-cols-3' : 'grid-cols-5'
        )}
      >
        {devicePerformance === 'low' ? (
          // Simplified interface for low-performance devices
          <>
            <BottomNavItem
              icon={<LayoutDashboard className="h-5 w-5" />}
              label="Dashboard"
              href="/"
              isActive={location === "/" || location === "/dashboard"}
            />
            <BottomNavItem
              icon={<TrendingUp className="h-5 w-5" />}
              label="Trades"
              href="/trade/new"
              isActive={location.includes("/trade")}
            />
            <BottomNavItem
              icon={<BarChart2 className="h-5 w-5" />}
              label="Analytics"
              href="/analytics"
              isActive={location === "/analytics"}
            />
          </>
        ) : (
          // Full menu for medium and high performance devices
          navItems.map(item => (
            <BottomNavItem
              key={item.href}
              icon={item.icon}
              activeIcon={item.activeIcon}
              label={item.label}
              href={item.href}
              isActive={
                // Dashboard tab active
                (item.href === "/" && (location === "/" || location === "/dashboard")) ||
                
                // New Trade tab active
                (item.href === "/trade/new" && (location === "/trade/new" || location.includes("/trade/new"))) ||
                
                // Trade History tab active
                (item.href === "/trade/history" && (
                  location === "/trade/history" ||
                  location === "/history" ||
                  location.includes("/trade/view") ||
                  location.includes("/trade/edit")
                )) ||
                
                // Analytics tab active
                (item.href === "/analytics" && location === "/analytics") ||
                
                // Settings tab active
                (item.href === "/settings" && location === "/settings")
              }
            />
          ))
        )}
      </div>
    </nav>
  );
}