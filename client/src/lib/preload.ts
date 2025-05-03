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
      moduleLoader().catch(err => {
        console.debug(`Silent preload for ${route} failed:`, err);
      });
    }, 200); // Small timeout to avoid blocking main thread
  }

  // Prefetch dependencies
  const dependencies = ROUTE_DEPENDENCIES[route];
  if (dependencies?.length) {
    setTimeout(() => {
      dependencies.forEach(dep => {
        dep().catch(err => {
          console.debug(`Silent dependency preload failed:`, err);
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
 */
export const preloadCriticalResources = (): void => {
  // Chỉ chạy preload đầy đủ trên production để tránh chậm trong quá trình dev
  const isProduction = import.meta.env.PROD;
  
  // Preload fonts luôn được thực hiện
  preloadFonts();

  // Preload CSS 
  const preloadCSS = (href: string) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = 'style';
    document.head.appendChild(link);
  };

  // Preload main CSS
  preloadCSS('/src/index.css');

  // Preload các route phổ biến chỉ khi trang đã load xong
  // Sử dụng requestIdleCallback nếu có để không ảnh hưởng hiệu suất ban đầu
  window.addEventListener('load', () => {
    // Sử dụng requestIdleCallback khi có thể để chạy trong thời gian rảnh của browser
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => {
        preloadCommonRoutes();
      }, { timeout: 5000 }); // Timeout 5s để đảm bảo preload được thực hiện
    } else {
      // Fallback cho các trình duyệt không hỗ trợ requestIdleCallback
      setTimeout(() => {
        preloadCommonRoutes();
      }, 3000);
    }
  });
};

export default {
  preloadRoute,
  preloadCommonRoutes,
  preloadCriticalResources,
};