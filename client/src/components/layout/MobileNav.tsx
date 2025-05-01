import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { logoutUser, auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  Menu, 
  X, 
  LayoutDashboard, 
  TrendingUp, 
  History, 
  Settings, 
  LogOut,
  Bell,
  Search
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
import { SidebarItem } from "./Sidebar"; // Sử dụng lại component SidebarItem từ Sidebar
import { SIDEBAR_WIDTH, SIDEBAR_COLLAPSED_WIDTH } from "@/contexts/LayoutContext"; // Lấy hằng số từ LayoutContext

export default function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [mounted, setMounted] = useState(false);
  const user = auth.currentUser;

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
  
  const navItems = [
    { icon: <LayoutDashboard className="h-5 w-5" />, label: "Dashboard", href: "/" },
    { icon: <TrendingUp className="h-5 w-5" />, label: "New Trade", href: "/trade/new" },
    { icon: <History className="h-5 w-5" />, label: "History", href: "/trade/history" },
    { icon: <Settings className="h-5 w-5" />, label: "Settings", href: "/settings" },
  ];

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

  // Chỉ hiển thị trên mobile và khi đã mounted (ngăn hydration mismatch)
  if (!isMobile || !mounted) return null;

  return (
    <>
      {/* Mobile Header */}
      <header className="fixed top-0 left-0 right-0 h-16 z-40 backdrop-blur-sm border-b bg-background/95 border-border/40">
        <div className="flex items-center justify-between px-4 h-full">
          <div className="flex items-center space-x-3">
            <Button
              onClick={toggleMenu}
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

      {/* Mobile Navigation Menu với Animation */}
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
            "fixed inset-y-0 left-0 h-full max-w-xs bg-background border-r border-border shadow-lg overflow-y-auto transition-transform duration-300 ease-in-out transform",
            isOpen ? "translate-x-0" : "-translate-x-full"
          )}
          style={{ width: SIDEBAR_WIDTH }}
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
    </>
  );
}