import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { logoutUser } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  TrendingUp,
  History,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { AppLogo } from "@/components/AppLogo";
import { Button } from "@/components/ui/button";
import { useLayout, SIDEBAR_WIDTH, SIDEBAR_COLLAPSED_WIDTH } from "@/contexts/LayoutContext";

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  isActive: boolean;
  collapsed?: boolean;
  onClick?: () => void; // Callback khi click item (cho mobile)
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

export default function Sidebar() {
  const [location] = useLocation();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [mounted, setMounted] = useState(false);
  const { sidebarCollapsed, setSidebarCollapsed } = useLayout();

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleCollapsed = () => {
    setSidebarCollapsed(!sidebarCollapsed);
    
    // Lưu trạng thái sidebar vào localStorage
    localStorage.setItem("sidebar-collapsed", String(!sidebarCollapsed));
  };

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

  // Ẩn sidebar trên mobile vì chúng ta đã có MenuBar
  if (isMobile || !mounted) return null;

  return (
    <aside 
      className={cn(
        "hidden lg:flex lg:flex-col h-screen fixed inset-y-0 left-0 bg-background/95 border-r border-border/40 z-30 transition-all duration-300",
        sidebarCollapsed ? "w-[4.5rem]" : "w-64"
      )}
      style={{ 
        width: sidebarCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH
      }}
    >
      <div className="flex items-center h-16 border-b border-border/40 px-4">
        {!sidebarCollapsed && (
          <div className="flex items-center justify-between w-full">
            <h1 className="text-lg font-semibold text-foreground flex items-center">
              <AppLogo className="mr-2" size="sm" variant="dark" />
              <span className="truncate">FX Trade Journal</span>
            </h1>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={toggleCollapsed}
              aria-label="Thu gọn sidebar"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        )}
        
        {sidebarCollapsed && (
          <div className="flex justify-center w-full">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={toggleCollapsed}
              aria-label="Mở rộng sidebar"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-6 px-3">
        <ul className="space-y-1">
          <SidebarItem
            icon={<LayoutDashboard className="h-5 w-5" />}
            label="Dashboard"
            href="/"
            isActive={location === "/"}
            collapsed={sidebarCollapsed}
          />
          <SidebarItem
            icon={<TrendingUp className="h-5 w-5" />}
            label="New Trade"
            href="/trade/new"
            isActive={location === "/trade/new"}
            collapsed={sidebarCollapsed}
          />
          <SidebarItem
            icon={<History className="h-5 w-5" />}
            label="History"
            href="/trade/history"
            isActive={location === "/trade/history" || location === "/history"}
            collapsed={sidebarCollapsed}
          />
        </ul>

        <div className="mt-8 pt-6 border-t border-border/40">
          <ul className="space-y-1">
            <SidebarItem
              icon={<Settings className="h-5 w-5" />}
              label="Settings"
              href="/settings"
              isActive={location === "/settings"}
              collapsed={sidebarCollapsed}
            />

            <li>
              <button
                onClick={handleLogout}
                className={cn(
                  "flex items-center text-sm rounded-md transition-all text-foreground/80 hover:bg-muted hover:text-foreground px-4 py-3",
                  sidebarCollapsed ? "justify-center" : "w-full"
                )}
                aria-label="Logout"
              >
                <span className="w-5 h-5 flex items-center justify-center">
                  <LogOut className="h-5 w-5" />
                </span>
                {!sidebarCollapsed && <span className="ml-3">Logout</span>}
                {sidebarCollapsed && <span className="sr-only">Logout</span>}
              </button>
            </li>
          </ul>
        </div>
      </nav>
    </aside>
  );
}
