import { useEffect, useState, useCallback, lazy, Suspense, useContext } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Loader2 } from "lucide-react";
import NotFound from "@/pages/not-found";


import MobileLayout from "@/components/layout/MobileLayout";
import MenuBar from "@/components/layout/MenuBar";
import { auth } from "@/lib/firebase";
import { User } from "firebase/auth";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { PWAContainer } from "@/components/pwa/PWAContainer";
import { preloadRoute } from "@/lib/preload";
import AchievementNotificationContainer from "@/components/achievements/AchievementNotificationContainer";
import { LayoutProvider, useLayout } from "@/contexts/LayoutContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { DataCacheProvider } from "@/contexts/DataCacheContext";

// Improved dynamic imports with chunking comments for better code splitting
// Core/frequently used pages - higher priority
const Dashboard = lazy(() => import(/* webpackChunkName: "dashboard" */ "@/pages/Dashboard"));
const TradeHistory = lazy(() => import(/* webpackChunkName: "trade-history" */ "@/pages/TradeHistory"));
const Login = lazy(() => import(/* webpackChunkName: "auth" */ "@/pages/auth/Login"));
const Register = lazy(() => import(/* webpackChunkName: "auth" */ "@/pages/auth/Register"));

// Less frequently used pages - can be in separate chunks
const NewTrade = lazy(() => import(/* webpackChunkName: "trade-operations" */ "@/pages/NewTrade"));
const ViewTrade = lazy(() => import(/* webpackChunkName: "trade-view" */ "@/pages/ViewTradeOptimized"));
const Analytics = lazy(() => import(/* webpackChunkName: "analytics" */ "@/pages/Analytics"));
const Settings = lazy(() => import(/* webpackChunkName: "settings" */ "@/pages/Settings"));

// Note: Layout components are now imported from @/contexts/LayoutContext

// Optimized hook to detect reduced motion preference
function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  
  // Create event handler with useCallback to avoid creating new function on re-render
  const handleChange = useCallback((event: MediaQueryListEvent) => {
    setPrefersReducedMotion(event.matches);
  }, []);
  
  useEffect(() => {
    // Check MediaQuery API compatibility
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    // Set initial value
    setPrefersReducedMotion(mediaQuery.matches);
    
    // Use passive event listener when possible
    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange, { passive: true });
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, [handleChange]);
  
  return prefersReducedMotion;
}

function MainContent() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useLocation();
  const prefersReducedMotion = useReducedMotion();
  const { sidebarCollapsed } = useLayout();
  const isMobile = useIsMobile();
  const currentRoute = location;
  
  // Add transition state to improve route changes
  const [isPageReady, setIsPageReady] = useState<boolean>(true);
  const [prevLocation, setPrevLocation] = useState<string>(location);
  
  // Tối ưu hóa việc chuyển trang
  useEffect(() => {
    // Khi location thay đổi, đánh dấu trang đang loading
    if (prevLocation !== location) {
      // Đánh dấu trang chưa sẵn sàng và hiển thị chỉ báo loading
      setIsPageReady(false);
      
      // Lưu lại route hiện tại
      setPrevLocation(location);
      
      // Luôn đặt một timeout để đảm bảo chỉ báo loading sẽ biến mất
      const readyTimer = setTimeout(() => {
        setIsPageReady(true);
      }, 300); // Thời gian dài hơn để đảm bảo trang đã được tải
      
      return () => {
        clearTimeout(readyTimer); 
      };
    }
  }, [location]);
  
  // Đảm bảo luôn đặt lại isPageReady = true sau một khoảng thời gian
  useEffect(() => {
    if (!isPageReady) {
      const safetyTimer = setTimeout(() => {
        setIsPageReady(true);
      }, 1000); // Khung an toàn tối đa 1 giây
      
      return () => clearTimeout(safetyTimer);
    }
  }, [isPageReady]);
  
  // Preload route modules when location changes
  useEffect(() => {
    // Preload potentially next route modules when current route is viewed
    const preloadNextRoutes = () => {
      // Map of current route to likely next routes
      const routeMap: Record<string, string[]> = {
        '/': ['/trade/history', '/analytics'],
        '/dashboard': ['/trade/history', '/analytics'],
        '/trade/history': ['/trade/new', '/analytics'],
        '/analytics': ['/trade/history', '/settings'],
        '/trade/new': ['/trade/history'],
      };
      
      // Get potential next routes based on current location
      let routesToPreload: string[] = [];
      
      // Find exact match first
      if (routeMap[location]) {
        routesToPreload = routeMap[location];
      } else {
        // Try to find partial match
        Object.keys(routeMap).forEach(route => {
          if (location.startsWith(route) && route !== '/') {
            routesToPreload = routeMap[route];
          }
        });
      }
      
      // Preload each potential next route
      if (routesToPreload.length > 0) {
        // Only preload 1-2 routes maximum to avoid excessive loading
        routesToPreload.slice(0, isMobile ? 1 : 2).forEach(route => {
          // Use requestIdleCallback when available to avoid blocking main thread
          if ('requestIdleCallback' in window) {
            (window as any).requestIdleCallback(() => {
              preloadRoute(route);
            }, { timeout: 2000 });
          } else {
            // Fallback to setTimeout with a delay
            setTimeout(() => {
              preloadRoute(route);
            }, 1000);
          }
        });
      }
    };
    
    // Wait for component to finish rendering then preload
    // Tăng thời gian delay để ưu tiên render UI trước
    const timer = setTimeout(preloadNextRoutes, 600);
    return () => clearTimeout(timer);
  }, [location, isMobile]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((authUser) => {
      setUser(authUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Check if user is on auth page
  const isAuthPage = location.startsWith("/auth");
  const isPublicPage = isAuthPage;
  const hasUser = user;

  // If not on auth/public page and user is not logged in, redirect to login page
  useEffect(() => {
    if (!loading && !hasUser && !isPublicPage) {
      window.location.href = "/auth/login";
    }
  }, [loading, hasUser, isPublicPage]);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-primary/20 mb-4"></div>
          <div className="h-4 w-24 bg-muted rounded"></div>
        </div>
      </div>
    );
  }
  
  // Render page content without animation libs
  const renderPageContent = () => (
    <div
      key={currentRoute}
      className={cn(
        "transition-opacity",
        // Trong mobile layout áp dụng min-height, trong desktop không cần vì đã xử lý ở container parent
        isMobile ? "min-h-[calc(100vh-4rem)]" : "",
        // Trong mobile layout không cần các padding này vì đã được xử lý bởi MobileLayout
        isMobile ? "" : "px-4 pb-6 sm:px-6 sm:pb-8 lg:px-8",
        // Thêm className để hiển thị loading state
        !isPageReady && "pointer-events-none opacity-80"
      )}
      style={{
        transition: prefersReducedMotion ? 'none' : 'opacity 0.15s ease-out'
      }}
    >
      {/* Hiển thị mini loader khi trang đang chuyển - chỉ thanh nhỏ ở trên cùng */}
      {!isPageReady && !prefersReducedMotion && (
        <div className="fixed inset-x-0 top-0 z-50 h-0.5 overflow-hidden">
          <div className="w-full h-full bg-primary/10 relative">
            <div className="absolute inset-y-0 left-0 bg-primary animate-indeterminate-progress w-full"></div>
          </div>
        </div>
      )}
      
      <Suspense fallback={
        <div className="flex items-center justify-center h-[70vh]">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Đang tải...</p>
          </div>
        </div>
      }>
        <Switch>
          {/* Auth routes */}
          <Route path="/auth/login" component={Login} />
          <Route path="/auth/register" component={Register} />
          
          {/* Protected routes */}
          <Route path="/" component={Dashboard} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/trade/new" component={NewTrade} />
          <Route path="/trade/edit/:tradeId" component={ViewTrade} />
          <Route path="/trade/view/:tradeId" component={ViewTrade} />
          <Route path="/trade/history" component={TradeHistory} />
          <Route path="/history" component={TradeHistory} />
          <Route path="/analytics" component={Analytics} />
          {/* Settings page render */}
          <Route path="/settings" component={Settings} />
          
          {/* Fallback to 404 */}
          <Route path="/:rest*" component={NotFound} />
        </Switch>
      </Suspense>
    </div>
  );
  
  // Auth pages không cần layout
  if (isAuthPage) {
    return renderPageContent();
  }
  
  return (
    <>
      {/* Nút Scroll To Top sử dụng JavaScript thuần trong scroll-fix.ts */}
      
      {/* Nếu là mobile, sử dụng MobileLayout với thanh điều hướng dưới cùng */}
      {isMobile ? (
        <MobileLayout>
          {renderPageContent()}
        </MobileLayout>
      ) : (
        // Nếu là desktop, sử dụng MenuBar ở mode desktop và hiển thị nội dung bên dưới
        // Sử dụng app-layout-container thống nhất cho cả mobile và desktop
        <div className="flex flex-col w-full app-layout-container">
          <MenuBar mode="desktop" />
          <div className="mt-16 app-content-container max-w-7xl mx-auto"> {/* Tạo khoảng cách bằng chiều cao của MenuBar (h-16) */}
            {renderPageContent()}
          </div>
        </div>
      )}
    </>
  );
}

function App() {
  // Configure performance optimization when application starts
  useEffect(() => {
    import('./lib/queryClient').then(({ updateQueryClientConfig }) => {
      updateQueryClientConfig().catch(console.error);
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LayoutProvider>
          <DataCacheProvider>
            <MainContent />
            <Toaster />
            <PWAContainer />
            <AchievementNotificationContainer />
          </DataCacheProvider>
        </LayoutProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
