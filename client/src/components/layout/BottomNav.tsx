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
        // Padding - GitHub style when in PWA
        isPWA 
          ? "px-1 py-1" // GitHub uses tighter spacing
          : "px-1 py-2", // Normal style
        // Active indicator
        isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
      )}
    >
      {/* GitHub-style indicator for active tab - small pill at bottom */}
      {isActive && isPWA && (
        <div 
          className={cn(
            "absolute bottom-0 left-0 right-0 mx-auto", 
            reducedMotion
              ? "w-6 h-1 bg-primary rounded-full" // Static pill shape (GitHub style)
              : "" // Will be handled by motion.div
          )} 
        />
      )}
      
      {/* Animated pill indicator for GitHub style in PWA - at bottom */}
      {isActive && isPWA && !reducedMotion && (
        <motion.div
          layoutId="bottomNavIndicator"
          className="absolute bottom-0 left-0 right-0 mx-auto w-6 h-1 bg-primary rounded-full"
          initial={{ opacity: 0, scaleX: 0.5 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ type: "spring", duration: 0.2, bounce: 0.1 }}
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
      
      {/* GitHub-style compact icon and label layout */}
      <div className={cn(
        "flex flex-col items-center",
        isPWA && "gh-nav-item" // GitHub specific class
      )}>
        {/* Icon container - GitHub style */}
        <div className={cn(
          "flex items-center justify-center relative",
          isPWA ? "h-5 mb-[2px]" : "h-6 mb-1" // GitHub uses precise 2px spacing
        )}>
          <div className={cn(
            "relative flex items-center justify-center",
            isPWA ? "w-5 h-5" : "w-5 h-5" // GitHub uses consistent 20px icons
          )}>
            {isActive ? activeIcon || icon : icon}
          </div>
        </div>
        
        {/* Label with GitHub styling */}
        <span 
          className={cn(
            "text-center leading-tight px-0.5",
            // GitHub uses slightly larger font than Facebook
            isPWA ? "text-[10px]" : "text-[10px]",
            // Font weight changes - GitHub uses semibold for active
            isPWA && isActive 
              ? "font-semibold"  // GitHub uses semibold for active state
              : isPWA 
                ? "font-medium" // GitHub uses medium for inactive
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

  return (
    <nav 
      className={cn(
        "mobile-nav lg:hidden",
        // Use GitHub's height for bottom nav in PWA mode
        isPWA ? "h-[--pwa-bottom-nav-height]" : "h-14",
        // Add GitHub-specific PWA class 
        isPWA && "pwa-mobile-nav"
      )}
      style={{
        paddingBottom: hasHomeIndicator ? 'env(safe-area-inset-bottom, 0px)' : '0px',
        // GitHub-style cleaner border
        borderTopWidth: isPWA ? '1px' : '1px',
        // GitHub-style subtle shadow
        boxShadow: isPWA ? '0 -1px 2px rgba(0,0,0,0.05)' : undefined
      }}
      role="navigation"
      aria-label="Main Navigation"
      data-pwa-mode={isPWA ? "standalone" : "browser"}
    >
      <div 
        className={cn(
          "grid w-full h-full", 
          devicePerformance === 'low' ? 'grid-cols-3' : 'grid-cols-5',
          // Add GitHub-style nav grid
          isPWA && "gh-nav-grid" 
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