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
import { isPWA } from "@/lib/pwa-helper";

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
        isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
      )}
    >
      {/* Indicator line for active tab */}
      {isActive && (
        <div className="mobile-nav-indicator" />
      )}
      
      {/* Icon and label */}
      <div className="mobile-nav-icon">
        {isActive ? activeIcon || icon : icon}
      </div>
      
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
          <>
            <MobileNavigatorItem
              icon={<LayoutDashboard className="h-5 w-5" />}
              label="Dashboard"
              href="/"
              isActive={location === "/" || location === "/dashboard"}
            />
            <MobileNavigatorItem
              icon={<TrendingUp className="h-5 w-5" />}
              label="Trades"
              href="/trade/new"
              isActive={location.includes("/trade")}
            />
            <MobileNavigatorItem
              icon={<BarChart2 className="h-5 w-5" />}
              label="Analytics"
              href="/analytics"
              isActive={location === "/analytics"}
            />
          </>
        ) : (
          // Full menu for medium and high performance devices
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