import React, { createContext, useContext, useState, useEffect } from 'react';
import { TradingViewChartConfig } from '@/components/tradingview/TradingViewChart';

interface EconomicCalendarConfig {
  importanceFilter: string;
  countryFilter: string;
  timeFrame: string;
  showTabs?: boolean;
  showTimezone?: boolean;
  showFlags?: boolean;
  showSymbol?: boolean;
  initialTab?: 'event' | 'forex' | 'crypto' | 'stock';
  scrollToEarliestEvent?: boolean;
}

interface TradingToolsContextType {
  chartConfig: TradingViewChartConfig;
  calendarConfig: EconomicCalendarConfig;
  updateChartConfig: (config: Partial<TradingViewChartConfig>) => void;
  updateCalendarConfig: (config: Partial<EconomicCalendarConfig>) => void;
  resetChartConfig: () => void;
  resetCalendarConfig: () => void;
}

// Default configurations
const defaultChartConfig: TradingViewChartConfig = {
  symbol: "OANDA:XAUUSD",
  interval: "60", // 1h default
  timezone: "exchange",
  style: "1", // Candles style
  studies: [
    "RSI@tv-basicstudies",
    "MASimple@tv-basicstudies"
  ],
  watchlist: [
    "OANDA:XAUUSD",
    "BINANCE:BTCUSDT.P", 
    "FX:GBPUSD",
    "OANDA:GBPUSD",
    "OANDA:USDJPY",
    "OANDA:EURUSD",
    "OANDA:AUDUSD"
  ],
  showDetailsButton: true,
  showHotlistButton: true,
  showCalendarButton: true,
  showDrawings: true,
  customColors: {
    upColor: "#26a69a",
    downColor: "#ef5350",
    wickUpColor: "#26a69a",
    wickDownColor: "#ef5350"
  }
};

const defaultCalendarConfig: EconomicCalendarConfig = {
  importanceFilter: "0,1,2", // 0=low, 1=medium, 2=high
  countryFilter: "us,eu,gb,jp,au,ca,ch", // Common forex countries
  timeFrame: "1M", // One month
  showTabs: true,
  showTimezone: true,
  showFlags: true,
  showSymbol: true,
  initialTab: 'event',
  scrollToEarliestEvent: false
};

// Create context
const TradingToolsContext = createContext<TradingToolsContextType | undefined>(undefined);

// Storage keys
const CHART_CONFIG_KEY = 'forex-journal-chart-config';
const CALENDAR_CONFIG_KEY = 'forex-journal-calendar-config';

export const TradingToolsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize state with stored values or defaults
  const [chartConfig, setChartConfig] = useState<TradingViewChartConfig>(() => {
    const storedConfig = localStorage.getItem(CHART_CONFIG_KEY);
    if (storedConfig) {
      try {
        return JSON.parse(storedConfig);
      } catch (e) {
        console.error('Failed to parse stored chart config', e);
        return defaultChartConfig;
      }
    }
    return defaultChartConfig;
  });

  const [calendarConfig, setCalendarConfig] = useState<EconomicCalendarConfig>(() => {
    const storedConfig = localStorage.getItem(CALENDAR_CONFIG_KEY);
    if (storedConfig) {
      try {
        return JSON.parse(storedConfig);
      } catch (e) {
        console.error('Failed to parse stored calendar config', e);
        return defaultCalendarConfig;
      }
    }
    return defaultCalendarConfig;
  });

  // Save configs to localStorage when they change
  useEffect(() => {
    localStorage.setItem(CHART_CONFIG_KEY, JSON.stringify(chartConfig));
  }, [chartConfig]);

  useEffect(() => {
    localStorage.setItem(CALENDAR_CONFIG_KEY, JSON.stringify(calendarConfig));
  }, [calendarConfig]);

  // Update functions
  const updateChartConfig = (newConfig: Partial<TradingViewChartConfig>) => {
    setChartConfig(prevConfig => ({
      ...prevConfig,
      ...newConfig,
      customColors: {
        ...prevConfig.customColors,
        ...newConfig.customColors
      }
    }));
  };

  const updateCalendarConfig = (newConfig: Partial<EconomicCalendarConfig>) => {
    setCalendarConfig(prevConfig => ({
      ...prevConfig,
      ...newConfig
    }));
  };

  // Reset functions
  const resetChartConfig = () => {
    setChartConfig(defaultChartConfig);
  };

  const resetCalendarConfig = () => {
    setCalendarConfig(defaultCalendarConfig);
  };

  return (
    <TradingToolsContext.Provider 
      value={{
        chartConfig,
        calendarConfig,
        updateChartConfig,
        updateCalendarConfig,
        resetChartConfig,
        resetCalendarConfig
      }}
    >
      {children}
    </TradingToolsContext.Provider>
  );
};

// Custom hook to use the context
export const useTradingTools = () => {
  const context = useContext(TradingToolsContext);
  if (context === undefined) {
    throw new Error('useTradingTools must be used within a TradingToolsProvider');
  }
  return context;
};