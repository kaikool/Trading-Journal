import { lazy } from 'react';

// Lazily load the TradingView chart component
export const LazyTradingViewChart = lazy(() => import('../tradingview/TradingViewChart'));

// Lazily load the Economic Calendar component
export const LazyEconomicCalendar = lazy(() => import('../tradingview/EconomicCalendar'));

// Lazily load configuration components
export const LazyChartConfig = lazy(() => import('../tradingview/ChartConfig'));

export const LazyCalendarConfig = lazy(() => import('../tradingview/CalendarConfig'));