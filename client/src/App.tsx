import { useEffect, useState, useCallback, lazy, Suspense } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Icons } from "@/components/icons/icons";
import NotFound from "@/pages/not-found";
import ErrorBoundary from "@/components/ui/error-boundary";
import { AppSkeleton, SkeletonLevel } from "@/components/ui/app-skeleton";
import { useLoadingStore, LoadingLevel } from "@/hooks/use-loading-store";
import { LoadingProvider } from "@/components/ui/loading-provider";
import { SplashScreen } from "@/components/ui/splash-screen";
import { initViewportHeight, isPWA } from "@/lib/viewport-height";

import { AppLayout } from "@/components/layout/AppLayout";
import { auth } from "@/lib/firebase";
import { User } from "firebase/auth";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { PWAContainer } from "@/components/pwa/PWAContainer";
import { preloadRoute } from "@/lib/preload";
import { withErrorBoundary } from "@/components/ui/error-boundary";
import AchievementNotificationContainer from "@/components/achievements/AchievementNotificationContainer";
import { LayoutProvider } from "@/contexts/LayoutContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { DialogProvider } from "@/contexts/DialogContext";

// Improved dynamic imports with proper code splitting
// Core/frequently used pages - higher priority
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const TradeHistory = lazy(() => import("@/pages/TradeHistory"));
const Login = lazy(() => import("@/pages/auth/Login"));
const Register = lazy(() => import("@/pages/auth/Register"));

// Less frequently used pages - can be in separate chunks
const TradeForm = lazy(() => import("@/pages/Trade"));
const ViewTrade = lazy(() => import("@/pages/TradeView"));
const Analytics = lazy(() => import("@/pages/Analytics"));
const Settings = lazy(() => import("@/pages/Settings"));
const Strategies = lazy(() => import("@/pages/Strategies"));
const Achievements = lazy(() => import("@/pages/Achievements"));
const Goals = lazy(() => import("@/pages/Goals"));

// Note: Layout components are now imported from @/contexts/LayoutContext
// Tạo layout component được bọc bởi ErrorBoundary
const SafeAppLayout = withErrorBoundary(AppLayout);

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
  const [location] = useLocation();
  const prefersReducedMotion = useReducedMotion();
  const isMobile = useIsMobile();
  const currentRoute = location;
  
  // Sử dụng Zustand store để quản lý loading
  const startLoading = useLoadingStore(state => state.startLoading);
  const stopLoading = useLoadingStore(state => state.stopLoading);
  
  // Add transition state to improve route changes
  const [isPageReady, setIsPageReady] = useState<boolean>(true);
  const [prevLocation, setPrevLocation] = useState<string>(location);
  
  // Theo dõi trạng thái hoàn thành của splash screen
  const [appReady, setAppReady] = useState(false);
  
  // Tối ưu hóa việc chuyển trang
  useEffect(() => {
    // Khi location thay đổi, đánh dấu trang đang loading và scroll lên đầu trang
    if (prevLocation !== location) {
      // Đánh dấu trang chưa sẵn sàng và hiển thị chỉ báo loading
      setIsPageReady(false);
      
      // Lưu lại route hiện tại
      setPrevLocation(location);
      
      // Dialog KHÔNG được coi là page, nên chỉ scroll khi thực sự chuyển page
      // Kiểm tra xem URL có thay đổi không (không phải modal/dialog)
      const isRealPageChange = prevLocation.split('?')[0] !== location.split('?')[0];
      
      if (isRealPageChange) {
        // Tạo một trễ nhỏ để đảm bảo DOM đã render
        setTimeout(() => {
          // No logging needed
          
          // Sử dụng API có sẵn của trình duyệt để cuộn lên đầu
          window.scrollTo({
            top: 0,
            behavior: 'auto' // Sử dụng 'auto' thay vì 'smooth' để cảm giác chuyển trang nhanh hơn
          });
        }, 50);
      }
      
      // Luôn đặt một timeout để đảm bảo chỉ báo loading sẽ biến mất
      document.documentElement.classList.add('page-transition');
      const readyTimer = setTimeout(() => {
        setIsPageReady(true);
        document.documentElement.classList.remove('page-transition');
      }, 300); // Thời gian dài hơn để đảm bảo trang đã được tải
      
      return () => {
        clearTimeout(readyTimer);
        document.documentElement.classList.remove('page-transition');
      };
    }
  }, [location]);
  
  // Đảm bảo luôn đặt lại isPageReady = true sau một khoảng thời gian
  useEffect(() => {
    if (!isPageReady) {
      // Áp dụng lớp này để ngăn nháy sáng trong suốt quá trình chuyển đổi
      document.documentElement.classList.add('page-transition');
      
      const safetyTimer = setTimeout(() => {
        setIsPageReady(true);
        document.documentElement.classList.remove('page-transition');
      }, 1000); // Khung an toàn tối đa 1 giây
      
      return () => {
        clearTimeout(safetyTimer);
        document.documentElement.classList.remove('page-transition');
      };
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

  // Khởi tạo viewport height cho hiển thị đồng nhất trên các thiết bị
  useEffect(() => {
    // Khởi tạo cơ chế tính toán viewport height chính xác
    initViewportHeight();
    
    // Thêm class đặc biệt cho body nếu đang chạy trong PWA mode
    if (isPWA()) {
      document.body.classList.add('pwa-mode');
      document.documentElement.classList.add('is-pwa');
    }
    
    // Log thông tin hữu ích cho debug
    console.log('App startup took:', `${performance.now().toFixed(1)}ms before preloading routes`);
  }, []);
  
  // Quản lý quá trình khởi tạo ứng dụng với loading system mới
  useEffect(() => {
    // Bắt đầu trạng thái loading cho toàn bộ ứng dụng
    const appLoadingId = 'app-initialization';
    startLoading(appLoadingId, LoadingLevel.APP);
    
    // Theo dõi đăng nhập từ Firebase
    const unsubscribe = auth.onAuthStateChanged((authUser) => {
      setUser(authUser);
      setLoading(false);
      
      // Hoàn thành trạng thái loading cho toàn bộ ứng dụng
      stopLoading(appLoadingId, LoadingLevel.APP);
    });

    return () => {
      unsubscribe();
      stopLoading(appLoadingId, LoadingLevel.APP);
    };
  }, [startLoading, stopLoading]);

  // Check if user is on auth page
  const isAuthPage = location.startsWith("/auth");
  const isPublicPage = isAuthPage;
  const hasUser = user;

  // If not on auth/public page and user is not logged in, redirect to login page
  useEffect(() => {
    if (!loading && !hasUser && !isPublicPage) {
      console.log("Not authenticated, navigation to login required");
      // For desktop/larger screens, add a small delay to ensure the app has time to render first
      if (window.innerWidth > 768) {
        // Give the app time to hydrate and render first
        setTimeout(() => {
          window.location.href = "/auth/login";
        }, 300);
      } else {
        // For mobile, redirect immediately for faster experience
        window.location.href = "/auth/login";
      }
    }
  }, [loading, hasUser, isPublicPage]);

  // Sử dụng Splash Screen tối giản
  if (loading) {
    return <SplashScreen brandName="FOREX PRO" text="Initializing" />;
  }
  
  // Render page content with enhanced animations
  const renderPageContent = () => (
    <div
      key={currentRoute}
      className={cn(
        "transition-opacity app-main-content",
        "min-h-[calc(100vh-4rem)]",
        // Thêm className để hiển thị loading state
        !isPageReady && "pointer-events-none opacity-80"
      )}
      style={{
        transition: prefersReducedMotion ? 'none' : 'opacity 0.15s ease-out'
      }}
    >
      {/* Hiển thị trạng thái loading khi chuyển trang */}
      {!isPageReady && (
        <>
          {/* Hiển thị thanh progress ở đầu trang - tinh tế */}
          <div className="fixed top-0 left-0 right-0 h-[2px] bg-transparent z-50">
            <div className="h-full bg-primary/30 animate-subtle-progress"></div>
          </div>
        </>
      )}
      
      <ErrorBoundary>
        <Suspense fallback={
          <div className="container max-w-7xl mx-auto px-4 sm:px-6 mt-8">
            {/* Hiển thị skeleton cơ bản cho lazy loading */}
            <AppSkeleton level={SkeletonLevel.PAGE} animation="pulse" hasTitle hasFooter />
          </div>
        }>
          <Switch>
            {/* Auth routes */}
            <Route path="/auth/login" component={Login} />
            <Route path="/auth/register" component={Register} />
            
            {/* Protected routes */}
            <Route path="/" component={Dashboard} />
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/trade/new" component={TradeForm} />
            <Route path="/trade/edit/:tradeId" component={ViewTrade} />
            <Route path="/trade/view/:tradeId" component={ViewTrade} />
            <Route path="/history" component={TradeHistory} />
            <Route path="/analytics" component={Analytics} />
            {/* Settings page render */}
            <Route path="/settings" component={Settings} />
            {/* Strategies page */}
            <Route path="/strategies" component={Strategies} />
            {/* Achievements page */}
            <Route path="/achievements" component={Achievements} />
            {/* Goals page */}
            <Route path="/goals" component={Goals} />
            
            {/* Fallback to 404 */}
            <Route path="/:rest*" component={NotFound} />
          </Switch>
        </Suspense>
      </ErrorBoundary>
    </div>
  );
  
  // Auth pages không cần layout
  if (isAuthPage) {
    return renderPageContent();
  }
  
  return (
    <>
      {/* ScrollToTop được quản lý bởi ScrollToTop component trong AppLayout */}
      
      {/* Unified layout system with new Sidebar - bọc bởi ErrorBoundary */}
      <SafeAppLayout>
        {renderPageContent()}
      </SafeAppLayout>
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
          <DialogProvider>
            <LoadingProvider>
              <MainContent />
              <Toaster />
              <PWAContainer />
              <AchievementNotificationContainer />
            </LoadingProvider>
          </DialogProvider>
        </LayoutProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;