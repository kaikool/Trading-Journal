import React, { useEffect, useRef, memo } from 'react';
import { useTheme } from "@/contexts/ThemeContext";

interface EconomicCalendarProps {
  config?: {
    importanceFilter?: string;
    countryFilter?: string;
    timeFrame?: string;
    showTabs?: boolean;
    showTimezone?: boolean;
    showFlags?: boolean;
    showSymbol?: boolean;
    initialTab?: 'event' | 'forex' | 'crypto' | 'stock';
    scrollToEarliestEvent?: boolean;
  };
}

function EconomicCalendar({ config }: EconomicCalendarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { isDarkMode } = useTheme();
  
  // Default configuration
  const defaultConfig = {
    importanceFilter: "0,1,2", // 0=low, 1=medium, 2=high
    countryFilter: "us,eu,gb,jp,au,ca,ch", // Common forex countries
    timeFrame: "1M", // One month
    showTabs: true,
    showTimezone: true,
    showFlags: true,
    showSymbol: true,
    initialTab: 'event' as const,
    scrollToEarliestEvent: false
  };
  
  // Merge default with provided config
  const mergedConfig = { ...defaultConfig, ...config };
  
  useEffect(() => {
    // Cleanup function to remove any existing widget scripts
    const cleanup = () => {
      const existingScript = document.getElementById("tradingview-calendar-script");
      if (existingScript && existingScript.parentNode) {
        existingScript.parentNode.removeChild(existingScript);
      }
      
      // Also clean up any existing calendar elements
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
    
    // Clean up first
    cleanup();
    
    // Create widget container
    const widgetContainer = document.createElement("div");
    widgetContainer.className = "tradingview-widget-container";
    widgetContainer.style.height = "100%";
    
    const widgetDiv = document.createElement("div");
    widgetDiv.className = "tradingview-widget-container__widget";
    widgetDiv.style.height = "calc(100% - 24px)";
    widgetDiv.style.width = "100%";
    
    const copyright = document.createElement("div");
    copyright.className = "tradingview-widget-copyright p-1 text-xs text-muted-foreground";
    copyright.innerHTML = '<a href="https://www.tradingview.com/" rel="noopener nofollow" target="_blank" class="text-primary font-medium">Powered by TradingView</a>';
    
    // Create and add the script
    const script = document.createElement("script");
    script.id = "tradingview-calendar-script";
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-events.js";
    script.type = "text/javascript";
    script.async = true;
    
    // Set widget options as a plain object
    const widgetOptions = {
      width: "100%",
      height: "100%",
      colorTheme: isDarkMode ? "dark" : "light",
      isTransparent: false,
      locale: "en",
      importanceFilter: mergedConfig.importanceFilter,
      countryFilter: mergedConfig.countryFilter,
      timeFrame: mergedConfig.timeFrame,
      tabs: mergedConfig.showTabs ? [
        {
          title: "Events",
          type: "economic-calendar",
          isActive: mergedConfig.initialTab === 'event',
          symbols: []
        },
        {
          title: "Forex",
          type: "symbols",
          symbols: ["FX:EURUSD", "FX:USDJPY", "FX:GBPUSD", "FX:AUDUSD", "FX:USDCAD"],
          isActive: mergedConfig.initialTab === 'forex'
        },
        {
          title: "Crypto",
          type: "symbols",
          symbols: ["BINANCE:BTCUSDT", "BINANCE:ETHUSDT", "BINANCE:SOLUSDT", "BINANCE:DOGEUSDT", "BINANCE:BNBUSDT"],
          isActive: mergedConfig.initialTab === 'crypto'
        },
        {
          title: "Stock",
          type: "symbols",
          symbols: ["NASDAQ:AAPL", "NASDAQ:MSFT", "NASDAQ:AMZN", "NYSE:TSLA", "NASDAQ:NVDA"],
          isActive: mergedConfig.initialTab === 'stock'
        }
      ] : undefined,
      showTabs: mergedConfig.showTabs,
      showTimezone: mergedConfig.showTimezone,
      hideFlags: !mergedConfig.showFlags,
      showSymbol: mergedConfig.showSymbol,
      scrollToEarliestEvent: mergedConfig.scrollToEarliestEvent
    };
    
    // Convert to JSON and set as innerHTML
    script.innerHTML = JSON.stringify(widgetOptions);
    
    // Add the elements to container if it exists
    if (containerRef.current) {
      widgetContainer.appendChild(widgetDiv);
      widgetContainer.appendChild(copyright);
      widgetContainer.appendChild(script);
      containerRef.current.appendChild(widgetContainer);
    }
    
    // Cleanup on unmount
    return cleanup;
  }, [isDarkMode, mergedConfig]);
  
  return (
    <div className="w-full h-full" style={{ height: "75vh" }}>
      <div ref={containerRef} className="h-full w-full"></div>
    </div>
  );
}

export default memo(EconomicCalendar);