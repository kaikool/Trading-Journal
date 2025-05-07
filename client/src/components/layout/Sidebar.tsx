import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useLayout } from "@/contexts/LayoutContext";
import { 
  LayoutDashboard, 
  TrendingUp, 
  History, 
  BarChart2,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  ChevronLeft
} from "lucide-react";
import { AppLogo } from "@/components/AppLogo";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { auth } from "@/lib/firebase";
import { logoutUser } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

// Navigation items shared across all sidebar modes
export const navItems = [
  { icon: <LayoutDashboard className="h-5 w-5" />, label: "Dashboard", href: "/" },
  { icon: <TrendingUp className="h-5 w-5" />, label: "New Trade", href: "/trade/new" },
  { icon: <History className="h-5 w-5" />, label: "History", href: "/trade/history" },
  { icon: <BarChart2 className="h-5 w-5" />, label: "Analytics", href: "/analytics" },
  { icon: <Settings className="h-5 w-5" />, label: "Settings", href: "/settings" },
];

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  isActive: boolean;
  collapsed?: boolean;
  onClick?: () => void;
}

// Individual sidebar navigation item
export const SidebarItem = ({ 
  icon, 
  label, 
  href, 
  isActive, 
  collapsed = false, 
  onClick 
}: SidebarItemProps) => (
  <li>
    <Link
      to={href}
      onClick={onClick}
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

interface SidebarProps {
  className?: string;
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
export function Sidebar({ className }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();
  const { toast } = useToast();
  const { sidebarCollapsed, setSidebarCollapsed } = useLayout();
  const isMobile = useIsMobile();
  const [mounted, setMounted] = useState(false);
  const user = auth.currentUser;
  
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
  
  // Prevent hydration mismatch
  if (!mounted) return null;

  // Mobile sidebar version (slide-out drawer)
  if (isMobile) {
    return (
      <>
        {/* Mobile Header */}
        <header className="fixed top-0 left-0 right-0 h-16 z-40 bg-background border-b border-border">
          <div className="flex items-center justify-between px-4 h-full">
            <div className="flex items-center space-x-3">
              <Button
                onClick={toggleSidebar}
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5 text-foreground/90" />
              </Button>
              <div className="font-semibold text-lg flex items-center">
                <AppLogo className="mr-2" size="sm" variant="dark" />
                <span className="truncate">FX Trade Journal</span>
              </div>
            </div>
            <div className="flex items-center">
              <Avatar className="h-9 w-9">
                <AvatarImage src={user?.photoURL || ''} alt={user?.displayName || ''} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>
        
        {/* Mobile Sidebar Overlay */}
        <div 
          className={cn(
            "fixed inset-0 z-50 transition-opacity duration-300 ease-in-out bg-background/80 backdrop-blur-sm",
            isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          )}
          onClick={closeSidebar}
          aria-hidden="true"
        />
        
        {/* Mobile Sidebar Drawer */}
        <aside 
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-72 bg-background border-r border-border transform transition-transform duration-300 ease-in-out",
            isOpen ? "translate-x-0" : "-translate-x-full"
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
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          {/* User Profile Section */}
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
          
          {/* Navigation Items */}
          <nav className="p-4">
            <ul className="space-y-1">
              {navItems.map(item => (
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
                    (item.href === "/settings" && location === "/settings")
                  }
                  onClick={closeSidebar}
                />
              ))}
            </ul>
          </nav>
          
          {/* Logout Button */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full justify-start text-sm font-normal"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </aside>
      </>
    );
  }
  
  // Desktop sidebar version (collapsible sidebar)
  return (
    <aside
      className={cn(
        "hidden md:flex md:flex-col h-screen fixed left-0 top-0 z-30 bg-background border-r border-border transition-all duration-300 ease-in-out",
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
            onClick={toggleSidebar}
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            aria-label="Collapse sidebar"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        )}
      </div>
      
      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto p-3">
        <ul className="space-y-1">
          {navItems.map(item => (
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
              <p className="text-xs text-muted-foreground truncate">{user?.email || ''}</p>
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
            onClick={toggleSidebar}
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            aria-label="Expand sidebar"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      )}
      
      {/* Logout Button */}
      {!sidebarCollapsed && (
        <div className="border-t border-border p-3">
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full justify-start text-sm font-normal"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      )}
    </aside>
  );
}