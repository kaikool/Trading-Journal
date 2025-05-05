import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { logoutUser, auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLayout } from "@/contexts/LayoutContext";
import { 
  Menu, 
  X, 
  LayoutDashboard, 
  TrendingUp, 
  History, 
  Settings, 
  LogOut,
  Bell,
  Search,
  BarChart2
} from "lucide-react";
import { AppLogo } from "@/components/AppLogo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  isActive: boolean;
  collapsed?: boolean;
  onClick?: () => void; 
}

export const SidebarItem = ({ icon, label, href, isActive, collapsed = false, onClick }: SidebarItemProps) => (
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

// Common navigation items
export const navItems = [
  { icon: <LayoutDashboard className="h-5 w-5" />, label: "Dashboard", href: "/" },
  { icon: <TrendingUp className="h-5 w-5" />, label: "New Trade", href: "/trade/new" },
  { icon: <History className="h-5 w-5" />, label: "History", href: "/trade/history" },
  { icon: <BarChart2 className="h-5 w-5" />, label: "Analytics", href: "/analytics" },
  { icon: <Settings className="h-5 w-5" />, label: "Settings", href: "/settings" },
];

interface MenuBarProps {
  mode?: 'mobile' | 'desktop';
}

export default function MenuBar({ mode = 'mobile' }: MenuBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [mounted, setMounted] = useState(false);
  const user = auth.currentUser;
  const isDesktop = mode === 'desktop';
  const { headerVisible } = useLayout();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Khóa scroll khi menu mở
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

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

  // Chặn hydration mismatch
  if (!mounted) return null;
  
  // Nếu là chế độ mobile thì chỉ hiển thị khi đang ở mobile
  if (mode === 'mobile' && !isMobile) return null;
  // Nếu là chế độ desktop thì chỉ hiển thị khi đang ở desktop
  if (mode === 'desktop' && isMobile) return null;

  // Xác định class cho header dựa trên mode
  const headerClass = isDesktop 
    ? "h-16 shadow-sm bg-background border-b border-border z-40" 
    : "fixed top-0 left-0 right-0 h-16 z-40 mobile-header bg-background/95 backdrop-blur-sm border-b border-border/40";

  return (
    <>
      {/* Header - Dùng cho cả mobile và desktop */}
      <header className={cn(
        headerClass,
        mode === 'mobile' && "transition-transform duration-300",
        mode === 'mobile' && !headerVisible && "-translate-y-full"
      )}>
        <div className="flex items-center justify-between px-4 h-full">
          <div className="flex items-center space-x-3">
            {mode === 'mobile' && (
              <Button
                onClick={toggleMenu}
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5 text-foreground/90" />
              </Button>
            )}
            <div className="font-semibold text-lg flex items-center">
              <AppLogo className="mr-2" size="sm" variant="dark" />
              <span className="truncate">FX Trade Journal</span>
            </div>
            
            {/* Desktop Navigation - horizontal links */}
            {isDesktop && (
              <div className="ml-10 hidden md:flex space-x-1">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      "px-3 py-2 text-sm rounded-md transition-all flex items-center",
                      (location === item.href || 
                        (item.href === "/trade/history" && location === "/history"))
                        ? "text-primary-foreground bg-primary shadow-sm font-medium"
                        : "text-foreground/80 hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <span className="w-5 h-5 flex items-center justify-center mr-1">
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center">
            <Button variant="ghost" size="icon" className="h-9 w-9 mr-1" aria-label="Search">
              <Search className="h-5 w-5 text-foreground/80" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9 mr-2" aria-label="Notifications">
              <Bell className="h-5 w-5 text-foreground/80" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user?.photoURL || ''} alt={user?.displayName || ''} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-60" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.displayName || 'User'}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email || ''}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/settings" className="flex items-center">
                    <Settings className="mr-2 h-5 w-5" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="flex items-center">
                  <LogOut className="mr-2 h-5 w-5" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Menu (cho mobile mode) */}
      {mode === 'mobile' && (
        <div 
          className={cn(
            "fixed inset-0 z-50 transition-opacity duration-300 ease-in-out",
            isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          )}
        >
          {/* Overlay nền */}
          <div 
            className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-all duration-300"
            onClick={closeMenu}
            aria-hidden="true"
          />
          
          {/* Sidebar Drawer */}
          <div 
            className={cn(
              "mobile-sidebar fixed inset-y-0 left-0 h-full max-w-xs border-r border-border overflow-y-auto transform",
              isOpen ? "translate-x-0" : "-translate-x-full",
              "w-64"
            )}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            {/* Sidebar Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h1 className="text-lg font-semibold flex items-center">
                <AppLogo className="mr-2" size="sm" variant="dark" />
                <span className="truncate">FX Trade Journal</span>
              </h1>
              <Button 
                onClick={closeMenu}
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            {/* Navigation Links */}
            <nav className="py-6 px-4">
              <ul className="space-y-1.5">
                {navItems.map((item) => (
                  <SidebarItem
                    key={item.href}
                    icon={item.icon}
                    label={item.label}
                    href={item.href}
                    isActive={location === item.href || 
                      (item.href === "/trade/history" && location === "/history")}
                    onClick={closeMenu}
                  />
                ))}
              </ul>
              
              {/* Logout Button */}
              <div className="mt-8 pt-6 border-t border-border">
                <button
                  onClick={() => {
                    closeMenu();
                    handleLogout();
                  }}
                  className="flex w-full items-center px-4 py-3 text-sm rounded-md text-foreground/80 hover:bg-muted hover:text-foreground transition-all"
                >
                  <span className="w-5 h-5 flex items-center justify-center">
                    <LogOut className="h-5 w-5" />
                  </span>
                  <span className="ml-3">Logout</span>
                </button>
              </div>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}