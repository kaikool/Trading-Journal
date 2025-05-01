import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { logoutUser, auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  LayoutDashboard, 
  TrendingUp, 
  History, 
  BarChart2, 
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

// Constants to keep in sync with Sidebar
const SIDEBAR_WIDTH = "16rem"; // Must match Sidebar.tsx
const SIDEBAR_COLLAPSED_WIDTH = "4.5rem"; // Must match Sidebar.tsx

const navItems = [
  { icon: <LayoutDashboard className="h-5 w-5 mr-2" />, label: "Dashboard", href: "/" },
  { icon: <TrendingUp className="h-5 w-5 mr-2" />, label: "New Trade", href: "/trade/new" },
  { icon: <History className="h-5 w-5 mr-2" />, label: "History", href: "/trade/history" },
  { icon: <Settings className="h-5 w-5 mr-2" />, label: "Settings", href: "/settings" },
];

export default function Navbar() {
  const [location] = useLocation();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [mounted, setMounted] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const user = auth.currentUser;

  // Check if sidebar is collapsed
  useEffect(() => {
    setMounted(true);
    
    // Try to get the collapsed state from localStorage to keep in sync with Sidebar
    const savedCollapsed = localStorage.getItem("sidebar-collapsed");
    if (savedCollapsed) {
      setSidebarCollapsed(savedCollapsed === "true");
    }

    // Listen to localStorage changes for sidebar collapsed state
    const handleStorageChange = () => {
      const collapsed = localStorage.getItem("sidebar-collapsed") === "true";
      setSidebarCollapsed(collapsed);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

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

  // Hide on mobile or when not mounted yet (to prevent hydration issues)
  if (isMobile || !mounted) return null;

  return (
    <div 
      className="sticky top-0 z-30 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      style={{
        marginLeft: sidebarCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH
      }}
    >
      <div className="flex h-14 items-center pl-4 pr-4">
        <nav className="hidden lg:flex items-center gap-4 text-sm mr-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center px-3 py-1.5 rounded-md transition-all",
                location === item.href || 
                (item.href === "/trade/history" && location === "/history")
                  ? "text-foreground font-medium bg-muted" 
                  : "text-foreground/60 hover:text-foreground hover:bg-muted/80"
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-foreground/80 hover:text-foreground">
            <Search className="h-5 w-5" />
            <span className="sr-only">Search</span>
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-foreground/80 hover:text-foreground">
            <Bell className="h-5 w-5" />
            <span className="sr-only">Notifications</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.photoURL || ''} alt={user?.displayName || ''} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
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
    </div>
  );
}