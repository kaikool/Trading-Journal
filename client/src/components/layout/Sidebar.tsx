import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useLayout } from "@/contexts/LayoutContext";
import { useTheme } from "@/contexts/ThemeContext"; 
import { Icons } from "@/components/icons/icons";
import * as LucideIcons from 'lucide-react';
import { AppLogo } from "@/components/AppLogo";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { auth } from "@/lib/firebase";
import { logoutUser } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile, isPWA } from "@/hooks/use-mobile";
import { useUserActivity } from "@/hooks/use-user-activity";
import { SidebarHint } from "./SidebarHint";

// Define navigation items internal to this component
const SIDEBAR_LINKS = [
  { icon: <Icons.nav.dashboard className="h-5 w-5" />, label: "Dashboard", href: "/" },
  { icon: <Icons.nav.newTrade className="h-5 w-5" />, label: "New Trade", href: "/trade/new" },
  { icon: <Icons.nav.history className="h-5 w-5" />, label: "History", href: "/trade/history" },
  { icon: <Icons.nav.analytics className="h-5 w-5" />, label: "Analytics", href: "/analytics" },
  { icon: <Icons.nav.strategies className="h-5 w-5" />, label: "Strategies", href: "/strategies" },
  { icon: <Icons.nav.goals className="h-5 w-5" />, label: "Goals", href: "/goals" },
  { icon: <Icons.nav.achievements className="h-5 w-5" />, label: "Achievements", href: "/achievements" },
  { icon: <Icons.nav.settings className="h-5 w-5" />, label: "Settings", href: "/settings" },
];

// Theme Toggle Button Component
function ThemeToggle({ collapsed = false }: { collapsed?: boolean }) {
  const { theme, setTheme, isDarkMode } = useTheme();
  
  // Handle theme toggle with smooth transition
  const toggleTheme = () => {
    // Chỉ toggle giữa light và dark mode
    const newTheme = isDarkMode ? 'light' : 'dark';
    setTheme(newTheme);
  };
  
  if (collapsed) {
    return (
      <button
        onClick={toggleTheme}
        className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 shadow-sm",
          isDarkMode 
            ? "bg-zinc-800 text-yellow-400 hover:bg-zinc-700 hover:text-yellow-300" 
            : "bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600 hover:from-blue-100 hover:to-blue-200"
        )}
        aria-label="Toggle theme"
      >
        {isDarkMode 
          ? <Icons.ui.moon className="h-4 w-4 transition-transform duration-300" />
          : <Icons.ui.sun className="h-4 w-4 transition-transform duration-300" />
        }
      </button>
    );
  }
  
  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "group w-full rounded-lg flex items-center justify-between px-2.5 py-1.5 transition-all duration-300",
        isDarkMode 
          ? "bg-gradient-to-r from-zinc-900 to-zinc-800" 
          : "bg-gradient-to-r from-blue-50 to-sky-100"
      )}
      aria-label="Toggle theme"
    >
      <div className="flex items-center gap-2">
        <div 
          className={cn(
            "w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300",
            isDarkMode 
              ? "bg-zinc-700 text-yellow-400" 
              : "bg-white text-blue-600 shadow-sm"
          )}
        >
          {isDarkMode 
            ? <Icons.ui.moon className="h-3.5 w-3.5" />
            : <Icons.ui.sun className="h-3.5 w-3.5" />
          }
        </div>
        <span 
          className={cn(
            "text-sm font-medium transition-all duration-300",
            isDarkMode 
              ? "text-zinc-100" 
              : "text-zinc-800"
          )}
        >
          {isDarkMode ? 'Dark' : 'Light'}
        </span>
      </div>
      
      <div
        className={cn(
          "relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out",
          isDarkMode ? "bg-primary" : "bg-zinc-200"
        )}
      >
        <span 
          className="sr-only"
        >
          Use {isDarkMode ? 'light' : 'dark'} mode
        </span>
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none inline-block h-4 w-4 transform rounded-full shadow-sm transition duration-200 ease-in-out",
            isDarkMode 
              ? "translate-x-5 bg-white" 
              : "translate-x-0 bg-white"
          )}
        />
      </div>
    </button>
  );
}

// Individual sidebar navigation item
function SidebarItem({ 
  icon, 
  label, 
  href, 
  isActive, 
  collapsed = false, 
  onClick 
}: {
  icon: React.ReactNode;
  label: string;
  href: string;
  isActive: boolean;
  collapsed?: boolean;
  onClick?: () => void;
}) {
  // Handle click event with PWA improvements
  const handleClick = (e: React.MouseEvent) => {
    // Prevent click event from propagating through the sidebar
    e.stopPropagation();
    e.preventDefault(); // Prevent default link behavior
    
    // Execute onClick callback if provided
    if (onClick) onClick();
    
    // Use isPWA function imported from hook
    const inPWAMode = isPWA();
    
    // Perform manual navigation to avoid issues with PWA
    if (inPWAMode) {
      // Add small timeout to ensure UI effects are displayed before navigation
      setTimeout(() => {
        // Fix navigation in PWA mode by replacing the entire location
        window.location.replace(href);
      }, 50); // Increase wait time to ensure UI effects complete
    } else {
      // Use history API directly for faster navigation in web environment
      window.history.pushState({}, '', href);
      // Trigger popstate event so wouter detects URL change
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  return (
    <li>
      <Link
        to={href}
        onClick={handleClick}
        className={cn(
          "flex items-center px-4 py-3 text-sm rounded-md transition-all",
          collapsed ? "justify-center" : "",
          isActive
            ? "text-primary-foreground bg-primary shadow-sm font-medium"
            : "text-foreground/80 hover:bg-muted hover:text-foreground"
        )}
      >
        <span className="w-5 h-5 flex items-center justify-center">
          {icon}
        </span>
        {!collapsed && <span className="ml-3">{label}</span>}
        {collapsed && (
          <span className="sr-only">{label}</span>
        )}
      </Link>
    </li>
  );
}

/**
 * Sidebar Component
 * 
 * A unified sidebar navigation system that adapts to:
 * 1. Mobile - renders as a slide-out drawer
 * 2. Desktop - renders as a collapsible sidebar
 * 
 * Uses LayoutContext to manage collapse state that persists across sessions
 */
export function Sidebar({ className }: { className?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();
  const { toast } = useToast();
  const { sidebarCollapsed, setSidebarCollapsed } = useLayout();
  const isMobile = useIsMobile();
  const [mounted, setMounted] = useState(false);
  const user = auth.currentUser;
  // Đơn giản hóa: bỏ qua useScrollDirection phức tạp
  const { isActive } = useUserActivity(2000);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock scrolling when mobile sidebar is open
  useEffect(() => {
    if (isMobile && isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, isMobile]);

  // Save collapsed state to localStorage when changed
  useEffect(() => {
    if (!isMobile) {
      localStorage.setItem("sidebar-collapsed", String(sidebarCollapsed));
    }
  }, [sidebarCollapsed, isMobile]);

  const toggleSidebar = () => {
    if (isMobile) {
      setIsOpen(!isOpen);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  const closeSidebar = () => setIsOpen(false);

  const handleLogout = async () => {
    try {
      await logoutUser();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
      window.location.href = "/auth/login";
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Logout failed",
        description: error instanceof Error ? error.message : "Something went wrong",
      });
    }
  };

  const initials = user?.displayName 
    ? user.displayName.split(' ').map(n => n[0]).join('').toUpperCase() 
    : user?.email?.charAt(0).toUpperCase() || '?';
  
  // Đã loại bỏ cơ chế swipe để mở sidebar, chỉ giữ lại nút SidebarHint
  // và các phương thức mở/đóng sidebar bằng nút

  // Prevent hydration mismatch
  if (!mounted) return null;

  // Mobile sidebar version (slide-out drawer) - chỉ mở bằng nút SidebarHint
  if (isMobile) {
    return (
      <>
        {/* Sidebar Hint - subtle indicator at the edge of screen */}
        <SidebarHint onClick={() => setIsOpen(true)} />
        
        {/* Mobile Sidebar Overlay */}
        <div 
          className={cn(
            "fixed inset-0 z-50 transition-opacity duration-300 ease-in-out bg-background/80 backdrop-blur-sm",
            isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          )}
          onClick={closeSidebar}
          aria-hidden="true"
        />
        
        {/* Mobile Sidebar Drawer - luôn tôn trọng safe area top và bottom */}
        <aside 
          className={cn(
            "fixed left-0 z-50 w-72 bg-background border-r border-border transform transition-transform duration-300 ease-in-out",
            "top-0 bottom-0 safe-area-top safe-area-bottom flex flex-col",
            isOpen ? "translate-x-0" : "-translate-x-full",
            // Đảm bảo mobile sidebar được ưu tiên cao hơn và nhận tất cả sự kiện khi mở
            isOpen ? "pointer-events-auto" : "pointer-events-none"
          )}
        >
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-4 border-b border-border h-16">
            <div className="font-semibold text-lg flex items-center">
              <AppLogo className="mr-2" size="sm" variant="dark" />
              <span>FX Trade Journal</span>
            </div>
            <Button 
              onClick={closeSidebar}
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              aria-label="Close menu"
            >
              <Icons.ui.close className="h-5 w-5" />
            </Button>
          </div>
          
          {/* Phần User Profile */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user?.photoURL || ''} alt={user?.displayName || ''} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <p className="text-sm font-medium">{user?.displayName || 'User'}</p>
                <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                  {user?.email || ''}
                </p>
              </div>
            </div>
          </div>
          
          {/* Phần còn lại của sidebar có thể scroll */}
          <div className="flex-1 overflow-y-auto">
            <nav className="p-4">
              <ul className="space-y-1">
                {SIDEBAR_LINKS.map(item => (
                  <SidebarItem
                    key={item.href}
                    icon={item.icon}
                    label={item.label}
                    href={item.href}
                    isActive={
                      (item.href === "/" && (location === "/" || location === "/dashboard")) ||
                      (item.href === "/trade/new" && (location === "/trade/new")) ||
                      (item.href === "/trade/history" && (
                        location === "/trade/history" ||
                        location === "/history" ||
                        location.includes("/trade/view") ||
                        location.includes("/trade/edit")
                      )) ||
                      (item.href === "/analytics" && location === "/analytics") ||
                      (item.href === "/strategies" && location === "/strategies") ||
                      (item.href === "/goals" && location === "/goals") ||
                      (item.href === "/achievements" && location === "/achievements") ||
                      (item.href === "/settings" && location === "/settings")
                    }
                    onClick={closeSidebar}
                  />
                ))}
              </ul>
            </nav>
          </div>
          
          {/* Theme toggle button - tối ưu padding cho mobile */}
          <div className="border-t border-border px-4 py-3">
            <ThemeToggle />
          </div>
          
          {/* Logout Button - fixed to bottom with safe area */}
          <div className="border-t border-border p-4">
            <Button
              onClick={(e) => {
                e.stopPropagation(); // Ngăn chặn sự kiện truyền xuống dưới
                handleLogout();
              }}
              variant="outline"
              className="w-full justify-start text-sm font-normal relative"
            >
              <Icons.nav.logout className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </aside>
      </>
    );
  }
  
  // Desktop sidebar version (collapsible sidebar) - luôn tôn trọng safe area
  return (
    <>
      {/* Sidebar hint for collapsed desktop sidebar */}
      {sidebarCollapsed && (
        <SidebarHint onClick={toggleSidebar} />
      )}
      
      <aside
        className={cn(
          "hidden md:flex md:flex-col h-screen fixed left-0 z-30 bg-background border-r border-border transition-all duration-300 ease-in-out",
          "top-0 bottom-0 safe-area-top safe-area-bottom",
          sidebarCollapsed ? "w-[72px]" : "w-[256px]",
          className
        )}
      >
        {/* Sidebar Header */}
        <div className={cn(
          "flex items-center h-16 px-4 border-b border-border",
          sidebarCollapsed ? "justify-center" : "justify-between"
        )}>
          {!sidebarCollapsed && (
            <div className="font-semibold text-lg flex items-center">
              <AppLogo className="mr-2" size="sm" variant="dark" />
              <span className="truncate">FX Trade Journal</span>
            </div>
          )}
          {sidebarCollapsed && (
            <AppLogo size="sm" variant="dark" />
          )}
          
          {!sidebarCollapsed && (
            <Button
              onClick={(e) => {
                e.stopPropagation(); // Ngăn chặn sự kiện truyền xuống dưới
                toggleSidebar();
              }}
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              aria-label="Collapse sidebar"
            >
              <Icons.ui.chevronLeft className="h-5 w-5" />
            </Button>
          )}
        </div>
        
        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto p-3">
          <ul className="space-y-1">
            {SIDEBAR_LINKS.map(item => (
              <SidebarItem
                key={item.href}
                icon={item.icon}
                label={item.label}
                href={item.href}
                collapsed={sidebarCollapsed}
                isActive={
                  (item.href === "/" && (location === "/" || location === "/dashboard")) ||
                  (item.href === "/trade/new" && (location === "/trade/new")) ||
                  (item.href === "/trade/history" && (
                    location === "/trade/history" ||
                    location === "/history" ||
                    location.includes("/trade/view") ||
                    location.includes("/trade/edit")
                  )) ||
                  (item.href === "/analytics" && location === "/analytics") ||
                  (item.href === "/strategies" && location === "/strategies") ||
                  (item.href === "/achievements" && location === "/achievements") ||
                  (item.href === "/settings" && location === "/settings")
                }
              />
            ))}
          </ul>
        </nav>
        
        {/* User Profile Section */}
        <div className={cn(
          "border-t border-border p-3",
          sidebarCollapsed ? "flex justify-center py-3" : "block"
        )}>
          {!sidebarCollapsed ? (
            <div className="flex items-center space-x-3 px-2 py-2">
              <Avatar className="h-9 w-9">
                <AvatarImage src={user?.photoURL || ''} alt={user?.displayName || ''} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.displayName || 'User'}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email || ''}
                </p>
              </div>
            </div>
          ) : (
            <Avatar className="h-9 w-9">
              <AvatarImage src={user?.photoURL || ''} alt={user?.displayName || ''} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
        
        {/* Collapse Button (in expanded mode) */}
        {sidebarCollapsed && (
          <div className="border-t border-border p-3 flex justify-center">
            <Button
              onClick={(e) => {
                e.stopPropagation(); // Ngăn chặn sự kiện truyền xuống dưới
                toggleSidebar();
              }}
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              aria-label="Expand sidebar"
            >
              <Icons.ui.chevronRight className="h-5 w-5" />
            </Button>
          </div>
        )}
        
        {/* Theme toggle button */}
        {!sidebarCollapsed && (
          <div className="border-t border-border p-2">
            <ThemeToggle />
          </div>
        )}
        
        {/* Theme toggle (collapsed) */}
        {sidebarCollapsed && (
          <div className="border-t border-border p-2 flex justify-center">
            <ThemeToggle collapsed={true} />
          </div>
        )}

        {/* Logout Button */}
        {!sidebarCollapsed && (
          <div className="border-t border-border p-3">
            <Button
              onClick={(e) => {
                e.stopPropagation(); // Ngăn chặn sự kiện truyền xuống dưới
                handleLogout();
              }}
              variant="outline"
              className="w-full justify-start text-sm font-normal relative"
            >
              <Icons.nav.logout className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        )}
      </aside>
    </>
  );
}