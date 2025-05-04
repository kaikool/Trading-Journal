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
import { evaluateDevicePerformance, detectReducedMotion } from "@/lib/performance";

/**
 * MobileNavigatorItem - An individual tab in the tab bar
 * 
 * Follows Apple Human Interface Guidelines for Tab Bar Items:
 * - Standard height/sizing
 * - Clear active indicators
 * - Proper touch targets
 * - Semantic styling based on state
 */
interface MobileNavigatorItemProps {
  icon: React.ReactNode;
  activeIcon?: React.ReactNode;
  label: string;
  href: string;
  isActive: boolean;
}

export function MobileNavigatorItem({ icon, activeIcon, label, href, isActive }: MobileNavigatorItemProps) {
  const [reducedMotion, setReducedMotion] = useState(false);
  
  useEffect(() => {
    setReducedMotion(detectReducedMotion());
  }, []);
  
  return (
    <Link
      to={href}
      className={cn(
        "mobile-nav-item",
        isActive && "active" // Apply active state styling
      )}
      aria-current={isActive ? "page" : undefined}
      aria-label={`${label} ${isActive ? '(current page)' : ''}`}
    >
      {/* Indicator line for active tab - following Apple HIG indicators */}
      {isActive && (
        <div className="mobile-nav-indicator" />
      )}
      
      {/* Icon container - sized according to HIG standards */}
      <div className="mobile-nav-icon">
        {/* Use appropriate icon based on state */}
        {isActive ? activeIcon || icon : icon}
      </div>
      
      {/* Label - sized and styled according to HIG standards */}
      <span className={cn(
        "mobile-nav-label",
        isActive && "active"
      )}>
        {label}
      </span>
    </Link>
  );
}

interface MobileNavigatorProps {
  // No props needed - all styling and behavior is controlled via CSS
}

/**
 * MobileNavigator - Main tab bar component following Apple HIG
 * 
 * Apple's Human Interface Guidelines for Tab Bars recommend:
 * - 5 or fewer tabs (we comply with 5)
 * - Clear, recognizable icons
 * - Short, meaningful labels
 * - Consistent height that respects safe areas
 */
export default function MobileNavigator({}: MobileNavigatorProps = {}) {
  const [location] = useLocation();
  const [mounted, setMounted] = useState(false);
  const [devicePerformance, setDevicePerformance] = useState<'high' | 'medium' | 'low'>('high');
  
  useEffect(() => {
    setMounted(true);
    
    // Check device performance to optimize animations
    evaluateDevicePerformance().then(performance => {
      setDevicePerformance(performance);
    });
  }, []);

  // Only show when mounted to avoid hydration mismatch
  if (!mounted) return null;

  // Tab bar items configuration with standardized size icons
  // Following Apple HIG recommendations for tab bar items
  const navItems = [
    { 
      icon: <LayoutDashboard size="24" strokeWidth={1.75} />,
      activeIcon: <LayoutDashboard size="24" strokeWidth={2} />,
      label: "Dashboard", 
      href: "/" 
    },
    { 
      icon: <TrendingUp size="24" strokeWidth={1.75} />,
      activeIcon: <TrendingUp size="24" strokeWidth={2} />,
      label: "New Trade", 
      href: "/trade/new" 
    },
    { 
      icon: <History size="24" strokeWidth={1.75} />,
      activeIcon: <History size="24" strokeWidth={2} />,
      label: "History", 
      href: "/trade/history" 
    },
    {
      icon: <BarChart2 size="24" strokeWidth={1.75} />,
      activeIcon: <BarChart2 size="24" strokeWidth={2} />,
      label: "Analytics",
      href: "/analytics"
    },
    { 
      icon: <Settings size="24" strokeWidth={1.75} />,
      activeIcon: <Settings size="24" strokeWidth={2} />,
      label: "Settings", 
      href: "/settings" 
    }
  ];

  return (
    <nav 
      className="mobile-nav"
      role="navigation"
      aria-label="Main Navigation"
    >
      <div 
        className={cn(
          "grid w-full h-full", 
          devicePerformance === 'low' ? 'grid-cols-3' : 'grid-cols-5'
        )}
      >
        {devicePerformance === 'low' ? (
          // Simplified interface for low-performance devices
          // Reduced to 3 tabs as per Apple HIG recommendations for simpler interfaces
          <>
            <MobileNavigatorItem
              icon={<LayoutDashboard size="24" strokeWidth={1.75} />}
              activeIcon={<LayoutDashboard size="24" strokeWidth={2} />}
              label="Dashboard"
              href="/"
              isActive={location === "/" || location === "/dashboard"}
            />
            <MobileNavigatorItem
              icon={<TrendingUp size="24" strokeWidth={1.75} />}
              activeIcon={<TrendingUp size="24" strokeWidth={2} />}
              label="Trades"
              href="/trade/new"
              isActive={location.includes("/trade")}
            />
            <MobileNavigatorItem
              icon={<BarChart2 size="24" strokeWidth={1.75} />}
              activeIcon={<BarChart2 size="24" strokeWidth={2} />}
              label="Analytics"
              href="/analytics"
              isActive={location === "/analytics"}
            />
          </>
        ) : (
          // Full menu for medium and high performance devices
          // 5 tabs maximum as per Apple HIG recommendations
          navItems.map(item => (
            <MobileNavigatorItem
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