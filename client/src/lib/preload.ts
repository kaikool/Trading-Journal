/**
 * Utility module để quản lý preloading tài nguyên
 * Cải thiện hiệu suất bằng cách prefetch modules và tài nguyên quan trọng
 */

// Các route phổ biến được sử dụng trong ứng dụng
const COMMON_ROUTES = [
  '/dashboard',
  '/trade/history',
  '/analytics',
  '/settings',
];

// Map của route đến component cần preload với webpackChunkName
// Sử dụng comment để đảm bảo webpack sẽ tạo chunk riêng cho từng route
const ROUTE_TO_MODULE_MAP: Record<string, () => Promise<unknown>> = {
  '/dashboard': () => import(/* webpackChunkName: "page-dashboard" */ '../pages/Dashboard'),
  '/trade/history': () => import(/* webpackChunkName: "page-trade-history" */ '../pages/TradeHistory'),
  '/trade/new': () => import(/* webpackChunkName: "page-new-trade" */ '../pages/NewTrade'),
  '/analytics': () => import(/* webpackChunkName: "page-analytics" */ '../pages/Analytics'),
  '/settings': () => import(/* webpackChunkName: "page-settings" */ '../pages/Settings'),
};

// Map của routes đến modules phụ thuộc cần preload, mỗi dependency cũng có webpackChunkName 
// để đảm bảo code splitting hiệu quả
const ROUTE_DEPENDENCIES: Record<string, Array<() => Promise<unknown>>> = {
  '/dashboard': [
    () => import(/* webpackChunkName: "dashboard-account-summary" */ '../components/dashboard/AccountSummaryCard'),
    () => import(/* webpackChunkName: "dashboard-trading-stats" */ '../components/dashboard/TradingStatsCard'),
  ],
  '/trade/history': [
    () => import(/* webpackChunkName: "trade-history-card" */ '../components/trades/LazyTradeHistoryCard'),
  ],
  '/analytics': [
    () => import(/* webpackChunkName: "performance-chart" */ '../components/dashboard/PerformanceChart'),
    () => import(/* webpackChunkName: "analytics-overview" */ '../components/analytics/OverviewTab'),
  ],
  '/trade/view': [],
};

/**
 * Preload module cho một route cụ thể
 * @param route Route cần preload
 */
export const preloadRoute = (route: string): void => {
  // Prefetch main module
  const moduleLoader = ROUTE_TO_MODULE_MAP[route];
  if (moduleLoader) {
    setTimeout(() => {
      moduleLoader().catch(() => {
        // Silently handle preload failures
      });
    }, 200); // Small timeout to avoid blocking main thread
  }

  // Prefetch dependencies
  const dependencies = ROUTE_DEPENDENCIES[route];
  if (dependencies?.length) {
    setTimeout(() => {
      dependencies.forEach(dep => {
        dep().catch(() => {
          // Silently handle dependency preload failures
        });
      });
    }, 500); // Longer timeout for dependencies
  }
};

/**
 * Preload các route phổ biến
 * Gọi hàm này sau khi app đã load xong
 */
export const preloadCommonRoutes = (): void => {
  // Chỉ chạy sau khi app đã load và không phải trên mobile
  if (window.innerWidth < 768) {
    // Trên mobile, chỉ preload route hiện tại và dashboard
    const currentPath = window.location.pathname;
    
    if (currentPath !== '/dashboard') {
      preloadRoute('/dashboard');
    }
    
    return;
  }

  // Trên desktop, preload các route phổ biến
  setTimeout(() => {
    COMMON_ROUTES.forEach(route => {
      preloadRoute(route);
    });
  }, 3000); // Chỉ preload sau khi app đã load hoàn toàn
};

/**
 * Preload các font quan trọng
 */
export const preloadFonts = (): void => {
  const fontUrls = [
    '/fonts/inter-var.woff2',
  ];

  fontUrls.forEach(url => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = url;
    link.as = 'font';
    link.type = 'font/woff2';
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });
};

/**
 * Preload các resources quan trọng
 * Sử dụng resource hints để cải thiện loading speed
 * PERFORMANCE OPTIMIZATION: Delayed preloading to improve startup time
 */
export const preloadCriticalResources = (): void => {
  // PERFORMANCE: Trì hoãn mọi hoạt động preload không cần thiết
  // cho việc hiển thị ban đầu để cải thiện thời gian khởi động
  
  // Theo dõi thời gian bắt đầu để đo lường hiệu suất
  const startTime = performance.now();
  
  // Sử dụng queueMicrotask thay vì chạy ngay lập tức
  queueMicrotask(() => {
    // Preload fonts sau khi các tác vụ khác quan trọng hơn hoàn tất
    setTimeout(preloadFonts, 500);
  });

  // Tạo hàm preload CSS với độ ưu tiên thấp
  const preloadCSS = (href: string) => {
    // Trì hoãn việc preload CSS với setTimeout
    setTimeout(() => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = href;
      link.as = 'style';
      document.head.appendChild(link);
    }, 800); // Delay cao hơn để ưu tiên cho việc hiển thị UI
  };

  // Preload main CSS
  if (import.meta.env.PROD) {
    preloadCSS('/src/index.css');
  }

  // Preload các route phổ biến chỉ khi trang đã load xong và người dùng không tương tác
  // Sử dụng requestIdleCallback nếu có để không ảnh hưởng hiệu suất ban đầu
  const scheduleRoutePreload = () => {
    // Log thời gian khởi động cho development
    if (process.env.NODE_ENV === 'development') {
      console.log(`App startup took: ${(performance.now() - startTime).toFixed(1)}ms before preloading routes`);
    }
    
    // Sử dụng requestIdleCallback với thời gian timeout lớn hơn
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => {
        preloadCommonRoutes();
      }, { timeout: 8000 }); // Timeout lớn hơn để đảm bảo không ảnh hưởng hiệu suất
    } else {
      // Fallback với setTimeout dài hơn
      setTimeout(() => {
        preloadCommonRoutes();
      }, 5000);
    }
  };
  
  // Chỉ thực hiện preload sau khi trang đã tải xong hoàn toàn
  if (document.readyState === 'complete') {
    scheduleRoutePreload();
  } else {
    window.addEventListener('load', scheduleRoutePreload);
  }
};

