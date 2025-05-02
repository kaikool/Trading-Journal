import { useState, useEffect } from "react";
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

interface BottomNavItemProps {
  icon: React.ReactNode;
  activeIcon?: React.ReactNode;
  label: string;
  href: string;
  isActive: boolean;
}

export function BottomNavItem({ icon, activeIcon, label, href, isActive }: BottomNavItemProps) {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [isPWA, setIsPWA] = useState(false);
  
  useEffect(() => {
    setReducedMotion(detectReducedMotion());
    
    // Check if running as PWA (Facebook style detection)
    const checkIfPWA = () => {
      return window.matchMedia('(display-mode: standalone)').matches || 
             window.matchMedia('(display-mode: fullscreen)').matches ||
             (window.navigator as any).standalone === true;
    };
    
    setIsPWA(checkIfPWA());
    
    // Monitor display mode changes
    const mediaQueryList = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      setIsPWA(e.matches || window.matchMedia('(display-mode: fullscreen)').matches);
    };
    
    mediaQueryList.addEventListener('change', handleDisplayModeChange);
    return () => {
      mediaQueryList.removeEventListener('change', handleDisplayModeChange);
    };
  }, []);
  
  return (
    <Link
      to={href}
      className={cn(
        // Base styling
        "flex flex-col items-center justify-center w-full relative overflow-visible select-none",
        // Touch optimization
        "focus:outline-none touch-manipulation", 
        // Padding - Facebook style when in PWA
        isPWA 
          ? "px-1 py-1.5" // Facebook compact style
          : "px-1 py-2",  // Normal style
        // Active indicator
        isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
      )}
    >
      {/* Facebook-style indicator for active tab - dot at bottom instead of line on top */}
      {isActive && isPWA && (
        <div 
          className={cn(
            "absolute bottom-0 left-0 right-0 mx-auto", 
            reducedMotion
              ? "w-1.5 h-1.5 bg-primary rounded-full" // Static dot
              : "" // Will be handled by motion.div
          )} 
        />
      )}
      
      {/* Animated dot indicator for Facebook style in PWA - at bottom */}
      {isActive && isPWA && !reducedMotion && (
        <motion.div
          layoutId="bottomNavIndicator"
          className="absolute bottom-0 left-0 right-0 mx-auto w-1.5 h-1.5 bg-primary rounded-full"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", duration: 0.2, bounce: 0.2 }}
        />
      )}
      
      {/* Traditional tab indicator (line on top) for non-PWA */}
      {isActive && !isPWA && !reducedMotion && (
        <motion.div
          layoutId="topNavIndicator"
          className="absolute top-0 left-0 right-0 mx-auto w-12 h-[3px] bg-primary rounded-full"
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: "12px" }}
          transition={{ type: "spring", duration: 0.3, bounce: 0.2 }}
        />
      )}
      
      {/* Static indicator for non-PWA with reduced motion */}
      {isActive && !isPWA && reducedMotion && (
        <div className="absolute top-0 left-0 right-0 mx-auto w-12 h-[3px] bg-primary rounded-full" />
      )}
      
      {/* Facebook-style compact icon and label layout */}
      <div className={cn(
        "flex flex-col items-center",
        isPWA && "fb-nav-item" // Facebook specific class
      )}>
        {/* Icon container - Facebook style */}
        <div className={cn(
          "flex items-center justify-center relative",
          isPWA ? "h-5 mb-0.5" : "h-6 mb-1" // Smaller in Facebook style
        )}>
          <div className={cn(
            "relative flex items-center justify-center",
            isPWA ? "w-[22px] h-[22px]" : "w-5 h-5" // Facebook uses slightly bigger icons
          )}>
            {isActive ? activeIcon || icon : icon}
          </div>
        </div>
        
        {/* Label with Facebook styling */}
        <span 
          className={cn(
            "text-center leading-tight px-0.5",
            // Facebook uses even smaller font
            isPWA ? "text-[9px]" : "text-[10px]",
            // Font weight changes
            isPWA && isActive 
              ? "font-medium"  // Facebook uses medium for active state
              : isPWA 
                ? "font-normal" // Facebook uses normal for inactive
                : "font-medium", // Regular app uses medium
            // Color changes
            isActive ? "text-primary" : "text-muted-foreground"
          )}
          style={{ 
            maxWidth: '100%',
            display: 'block',
            textRendering: 'optimizeLegibility',
            WebkitFontSmoothing: 'antialiased',
            MozOsxFontSmoothing: 'grayscale'
          }}
        >
          {label}
        </span>
      </div>
    </Link>
  );
}

export default function BottomNav() {
  const [location] = useLocation();
  const [mounted, setMounted] = useState(false);
  const [devicePerformance, setDevicePerformance] = useState<'high' | 'medium' | 'low'>('high');
  const [hasHomeIndicator, setHasHomeIndicator] = useState(false);
  const [isPWA, setIsPWA] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    
    // Check if running as PWA
    const isRunningAsPWA = () => {
      return window.matchMedia('(display-mode: standalone)').matches || 
             window.matchMedia('(display-mode: fullscreen)').matches ||
             (window.navigator as any).standalone === true;
    };
    
    setIsPWA(isRunningAsPWA());
    
    // Check device performance to optimize animations
    evaluateDevicePerformance().then(performance => {
      setDevicePerformance(performance);
    });
    
    // Detect if device likely has a home indicator
    // This is a best-effort detection - modern iOS devices have safe-area-inset-bottom > 0
    const detectHomeIndicator = () => {
      try {
        // Try to get computed safe area inset bottom
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
        setHasHomeIndicator(false);
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
    
    // Add specific class for PWA standalone mode
    if (isRunningAsPWA()) {
      document.documentElement.classList.add('pwa-standalone');
    }
    
    // Handle display mode changes (important for PWA)
    const mediaQueryList = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      setIsPWA(e.matches || window.matchMedia('(display-mode: fullscreen)').matches);
      
      if (e.matches) {
        document.documentElement.classList.add('pwa-standalone');
      } else {
        document.documentElement.classList.remove('pwa-standalone');
      }
    };
    
    // Update on resize for orientation changes and media query changes
    mediaQueryList.addEventListener('change', handleDisplayModeChange);
    
    const handleResize = () => {
      setSafeAreaVars();
      detectHomeIndicator();
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      mediaQueryList.removeEventListener('change', handleDisplayModeChange);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

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
  
  // NAVIGATION
  return (
    <nav 
      className={cn(
        "mobile-nav lg:hidden",
        // Use dynamic className with Facebook height
        isPWA ? "h-[--pwa-bottom-nav-height]" : "h-14",
        // Add special class for PWA - Facebook style
        isPWA && "pwa-mobile-nav"
      )}
      style={{
        paddingBottom: hasHomeIndicator ? 'env(safe-area-inset-bottom, 0px)' : '0px',
        // Facebook-style bottom border
        borderTopWidth: isPWA ? '0.5px' : '1px',
        // Apply Facebook shadow style in PWA mode
        boxShadow: isPWA ? '0 -0.5px 0 hsla(0,0%,0%,0.1)' : undefined
      }}
      role="navigation"
      aria-label="Main Navigation"
      data-pwa-mode={isPWA ? "standalone" : "browser"}
    >
      <div 
        className={cn(
          "grid w-full h-full", 
          devicePerformance === 'low' ? 'grid-cols-3' : 'grid-cols-5',
          // Add Facebook-style extra classes
          isPWA && "fb-nav-grid" 
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