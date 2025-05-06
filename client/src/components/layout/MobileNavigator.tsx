import React, { useState, useEffect, useRef } from "react";
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
import { debug } from "@/lib/debug";

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

  // Prevent touch events from propagating
  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  return (
    <Link
      to={href}
      className={cn(
        "mobile-nav-item no-scroll",
        isActive && "active" // Apply active state styling
      )}
      aria-current={isActive ? "page" : undefined}
      aria-label={`${label} ${isActive ? '(current page)' : ''}`}
      onTouchMove={handleTouchMove}
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
  const [keyboardActive, setKeyboardActive] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const supportsVisualViewport = typeof window !== 'undefined' && 'visualViewport' in window;
  
  // Handle keyboard visibility through multiple detection methods
  useEffect(() => {
    if (!mounted) return;
    
    // Kiểm tra xem có input nào đang focus không khi component mount
    const checkCurrentFocus = () => {
      const activeElement = document.activeElement;
      if (activeElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(activeElement.tagName)) {
        debug('[KeyboardAware] Input already focused on mount, keyboard likely visible');
        setKeyboardActive(true);
      }
    };
    
    // Chạy kiểm tra ngay khi component mount
    checkCurrentFocus();
    
    const handleFocusIn = (e: FocusEvent) => {
      // Check if focused element is an input, textarea, or select
      const target = e.target as HTMLElement;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
        debug('[KeyboardAware] Input focused, keyboard likely visible');
        // Force immediate keyboard active state
        setKeyboardActive(true);
        
        // Đối với iOS, đôi khi sự kiện focusin không kích hoạt khi bàn phím xuất hiện
        // Thêm một timeout nhỏ để đảm bảo trạng thái được cập nhật
        setTimeout(() => {
          setKeyboardActive(true);
        }, 50);
      }
    };
    
    const handleFocusOut = (e: FocusEvent) => {
      // When blur happens, keyboard likely closed
      const target = e.target as HTMLElement;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
        debug('[KeyboardAware] Input blurred, keyboard likely hidden');
        setKeyboardActive(false);
      }
    };
    
    // Lưu trữ chiều cao ban đầu của viewport
    const savedHeight = useRef<number>(window.innerHeight);
    
    // Phát hiện thay đổi kích thước viewport do bàn phím
    const handleResize = () => {
      // Check if viewport height changed significantly (indicates keyboard opened/closed)
      // Note: This is a backup detection method, used together with focusin/focusout
      
      // Phương thức 1: Sử dụng VisualViewport API (Chrome, Safari mới)
      if (supportsVisualViewport && window.visualViewport) {
        const visualViewport = window.visualViewport;
        const windowHeight = window.innerHeight;
        // If viewport is significantly smaller than window, keyboard is likely visible
        const heightDifference = windowHeight - visualViewport.height;
        const isKeyboardVisible = heightDifference > 150; // Typical keyboard height is >150px
        
        if (isKeyboardVisible !== keyboardActive) {
          debug('[KeyboardAware] VisualViewport API: keyboard visible =', isKeyboardVisible);
          setKeyboardActive(isKeyboardVisible);
        }
      } 
      // Phương thức 2: So sánh chiều cao hiện tại với chiều cao ban đầu (phương pháp truyền thống)
      else {
        const currentHeight = window.innerHeight;
        // Nếu viewport bị giảm hơn 20% chiều cao ban đầu, thì bàn phím có thể đang hiển thị
        const heightReduction = savedHeight.current - currentHeight;
        const percentReduction = (heightReduction / savedHeight.current) * 100;
        
        if (percentReduction > 20 && !keyboardActive) {
          debug('[KeyboardAware] Window resize: keyboard visible, reduction =', percentReduction.toFixed(1) + '%');
          setKeyboardActive(true);
        } else if (percentReduction < 10 && keyboardActive) {
          debug('[KeyboardAware] Window resize: keyboard hidden, reduction =', percentReduction.toFixed(1) + '%');
          setKeyboardActive(false);
        }
      }
    };
    
    // Direct click handler for input elements as backup method
    // Một số trình duyệt trên iOS có thể không kích hoạt focusin, nhưng sẽ kích hoạt click
    const handleClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
        debug('[KeyboardAware] Input clicked, keyboard likely to appear');
        setKeyboardActive(true);
      }
    };
    
    // Listen for these events on the document
    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);
    document.addEventListener('click', handleClick);
    document.addEventListener('touchstart', handleClick);
    
    // Use the VisualViewport API if available, otherwise fall back to window resize
    const visualViewport = window.visualViewport;
    if (supportsVisualViewport && visualViewport) {
      visualViewport.addEventListener('resize', handleResize);
    } else {
      window.addEventListener('resize', handleResize);
    }
    
    return () => {
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
      document.removeEventListener('click', handleClick);
      document.removeEventListener('touchstart', handleClick);
      if (supportsVisualViewport && visualViewport) {
        visualViewport.removeEventListener('resize', handleResize);
      } else {
        window.removeEventListener('resize', handleResize);
      }
    };
  }, [mounted, keyboardActive, supportsVisualViewport]);
  
  useEffect(() => {
    setMounted(true);
    
    // Check device performance to optimize animations
    evaluateDevicePerformance().then(performance => {
      setDevicePerformance(performance);
    });
  }, []);

  // Only show when mounted to avoid hydration mismatch
  if (!mounted) return null;

  // Tab bar items configuration with standardized size and appearance
  // Follows unified mobile design guidelines (Material + Apple HIG)
  const navItems = [
    { 
      // Standard 24px icon size with adaptive stroke widths for different states
      icon: <LayoutDashboard size={24} strokeWidth={1.5} />,
      activeIcon: <LayoutDashboard size={24} strokeWidth={2} />,
      label: "Dashboard", 
      href: "/" 
    },
    { 
      icon: <TrendingUp size={24} strokeWidth={1.5} />,
      activeIcon: <TrendingUp size={24} strokeWidth={2} />,
      label: "New Trade", 
      href: "/trade/new" 
    },
    { 
      icon: <History size={24} strokeWidth={1.5} />,
      activeIcon: <History size={24} strokeWidth={2} />,
      label: "History", 
      href: "/trade/history" 
    },
    {
      icon: <BarChart2 size={24} strokeWidth={1.5} />,
      activeIcon: <BarChart2 size={24} strokeWidth={2} />,
      label: "Analytics",
      href: "/analytics"
    },
    { 
      icon: <Settings size={24} strokeWidth={1.5} />,
      activeIcon: <Settings size={24} strokeWidth={2} />,
      label: "Settings", 
      href: "/settings" 
    }
  ];

  // Hàm ngăn chặn cuộn từ thanh điều hướng
  const preventScroll = (e: React.UIEvent<HTMLDivElement>) => {
    // Chặn sự kiện cuộn bằng cách ngăn chặn lan truyền
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <nav 
      ref={navRef}
      className={cn(
        "mobile-nav no-scroll",
        keyboardActive && "keyboard-active" // Apply keyboard-active class when keyboard is visible
      )}
      role="navigation"
      aria-label="Main Navigation"
      onTouchMove={(e) => e.preventDefault()} 
      onScroll={preventScroll}
    >
      <div 
        className={cn(
          "grid w-full h-full no-scroll", 
          devicePerformance === 'low' ? 'grid-cols-3' : 'grid-cols-5'
        )}
        onTouchMove={(e) => e.preventDefault()}
        onScroll={preventScroll}
      >
        {devicePerformance === 'low' ? (
          // Simplified interface for low-performance devices
          // Reduced to 3 tabs as per Apple HIG recommendations for simpler interfaces
          <>
            <MobileNavigatorItem
              icon={<LayoutDashboard size={24} strokeWidth={1.5} />}
              activeIcon={<LayoutDashboard size={24} strokeWidth={2} />}
              label="Dashboard"
              href="/"
              isActive={location === "/" || location === "/dashboard"}
            />
            <MobileNavigatorItem
              icon={<TrendingUp size={24} strokeWidth={1.5} />}
              activeIcon={<TrendingUp size={24} strokeWidth={2} />}
              label="Trades"
              href="/trade/new"
              isActive={location.includes("/trade")}
            />
            <MobileNavigatorItem
              icon={<BarChart2 size={24} strokeWidth={1.5} />}
              activeIcon={<BarChart2 size={24} strokeWidth={2} />}
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