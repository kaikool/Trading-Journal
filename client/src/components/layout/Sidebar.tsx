import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useLayout } from "@/contexts/LayoutContext";
import { Icons } from "@/components/icons/icons";
import { AppLogo } from "@/components/AppLogo";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { auth } from "@/lib/firebase";
import { logoutUser } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile, isPWA } from "@/hooks/use-mobile";
import { useScrollDirection } from "@/hooks/use-scroll-direction";
import { useUserActivity } from "@/hooks/use-user-activity";
import { SidebarHint } from "./SidebarHint";

// Define navigation items internal to this component
const SIDEBAR_LINKS = [
  { icon: <Icons.nav.dashboard className="h-5 w-5" />, label: "Dashboard", href: "/" },
  { icon: <Icons.nav.newTrade className="h-5 w-5" />, label: "New Trade", href: "/trade/new" },
  { icon: <Icons.nav.history className="h-5 w-5" />, label: "History", href: "/trade/history" },
  { icon: <Icons.nav.analytics className="h-5 w-5" />, label: "Analytics", href: "/analytics" },
  { icon: <Icons.nav.strategies className="h-5 w-5" />, label: "Strategies", href: "/strategies" },
  { icon: <Icons.nav.achievements className="h-5 w-5" />, label: "Achievements", href: "/achievements" },
  { icon: <Icons.nav.settings className="h-5 w-5" />, label: "Settings", href: "/settings" },
];

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
  // Xử lý sự kiện click với cải tiến cho PWA
  const handleClick = (e: React.MouseEvent) => {
    // Ngăn sự kiện click lan truyền xuyên qua sidebar
    e.stopPropagation();
    e.preventDefault(); // Ngăn chặn hành vi mặc định của link
    
    // Thực hiện callback onClick nếu được cung cấp
    if (onClick) onClick();
    
    // Kiểm tra nếu đang chạy trong PWA mode
    const isPwa = window.matchMedia('(display-mode: standalone)').matches || 
                  (window.navigator as any).standalone === true;
    
    // Thực hiện điều hướng theo cách thủ công để tránh vấn đề với PWA
    if (isPwa) {
      // Thêm timeout nhỏ để đảm bảo các hiệu ứng UI được hiển thị trước khi điều hướng
      setTimeout(() => {
        window.location.href = href;
      }, 10);
    } else {
      // Sử dụng history API trực tiếp cho điều hướng nhanh hơn
      window.history.pushState({}, '', href);
      // Kích hoạt sự kiện popstate để wouter phát hiện thay đổi URL
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
  const { direction, isScrolling } = useScrollDirection();
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
  
  // Các biến để xử lý vuốt từ cạnh trái để hiện sidebar
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const touchStartY = useRef(0);
  const touchEndY = useRef(0);
  const edgeSwipeZone = 20; // Vùng nhận diện vuốt từ cạnh trái (px)
  
  // Xử lý sự kiện vuốt (swipe) cho mobile
  const handleTouchStart = (e: TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };
  
  const handleTouchMove = (e: TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
    touchEndY.current = e.touches[0].clientY;
  };
  
  const handleTouchEnd = () => {
    // Tính toán khoảng cách và hướng vuốt
    const swipeDistanceX = touchEndX.current - touchStartX.current;
    const swipeDistanceY = Math.abs(touchEndY.current - touchStartY.current);
    
    // Chỉ xử lý vuốt từ trái qua phải, từ cạnh trái màn hình
    if (
      touchStartX.current < edgeSwipeZone && // Bắt đầu từ cạnh trái
      swipeDistanceX > 70 && // Vuốt đủ xa
      swipeDistanceY < 100 && // Không vuốt quá chếch theo chiều dọc
      !isOpen // Chỉ mở sidebar khi nó đang đóng
    ) {
      setIsOpen(true);
    }
    
    // Nếu vuốt từ phải qua trái khi sidebar đang mở
    if (
      swipeDistanceX < -70 && // Vuốt từ phải sang trái
      swipeDistanceY < 100 && // Không vuốt quá chếch theo chiều dọc
      isOpen // Chỉ đóng sidebar khi nó đang mở
    ) {
      setIsOpen(false);
    }
  };
  
  // Khu vực "hot zone" ở góc trái dưới để hiện sidebar 
  const handleBodyClick = (e: MouseEvent) => {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    // Khi user chạm vào góc trái dưới (khu vực 30% chiều rộng x 30% chiều cao)
    const isInHotZone = e.clientX < windowWidth * 0.3 && e.clientY > windowHeight * 0.7;
    
    if (isInHotZone) {
      // Mở sidebar khi click vào hot zone
      setIsOpen(true);
    }
  };

  // Đăng ký các event listeners
  useEffect(() => {
    // Đăng ký sự kiện cho touch events để hỗ trợ vuốt từ cạnh trái
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd);
    
    // Đăng ký sự kiện click để hỗ trợ hot zone
    document.body.addEventListener('click', handleBodyClick);
    
    return () => {
      // Hủy đăng ký tất cả event listeners khi component unmount
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.body.removeEventListener('click', handleBodyClick);
    };
  }, [isOpen]);

  // Prevent hydration mismatch
  if (!mounted) return null;

  // Mobile sidebar version (slide-out drawer) - không cần nút menu vì đã có vuốt từ cạnh trái
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
                      (item.href === "/achievements" && location === "/achievements") ||
                      (item.href === "/settings" && location === "/settings")
                    }
                    onClick={closeSidebar}
                  />
                ))}
              </ul>
            </nav>
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