import { lazy, Suspense } from 'react';

// Re-export necessary components
export { Suspense };

// Dashboard components with lazy loading
export const LazyPerformanceChart = lazy(() => 
  import('../dashboard/PerformanceChart').then(module => ({ 
    default: module.PerformanceChart 
  }))
);

export const LazyRecentTradesCard = lazy(() => 
  import('../dashboard/RecentTradesCard').then(module => ({ 
    default: module.RecentTradesCard 
  }))
);

// Form components with lazy loading
export const LazyCloseTradeForm = lazy(() => import('../trades/TradeView/LazyCloseTradeForm'));

// Image related components with lazy loading
export const LazyTradeImageManager = lazy(() => 
  import('../trades/TradeView/TradeImageManager').then(module => ({ 
    default: module.TradeImageManager 
  }))
);

// Re-export all optimized chart components
export * from './chart-components';

// Để tránh các lỗi TypeScript, hãy đảm bảo chúng ta không export lazy-chart.tsx nữa