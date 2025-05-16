import React, { useEffect, useRef, memo } from 'react';
import { useTheme } from "@/contexts/ThemeContext";

interface EconomicCalendarProps {
  config?: {
    importanceFilter?: string;
    countryFilter?: string;
    timeFrame?: string;
  };
}

function EconomicCalendar({ config }: EconomicCalendarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { isDarkMode } = useTheme();
  
  // Default configuration
  const defaultConfig = {
    importanceFilter: "0,1,2", // 0=low, 1=medium, 2=high
    countryFilter: "us,eu,gb,jp,au,ca,ch", // Common forex countries
    timeFrame: "1M" // One month
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
    };
    
    // Clean up first
    cleanup();
    
    // Create and add the script
    const script = document.createElement("script");
    script.id = "tradingview-calendar-script";
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-events.js";
    script.type = "text/javascript";
    script.async = true;
    
    // Set widget options
    const widgetOptions = {
      "width": "100%",
      "height": "100%",
      "autosize": true,
      "colorTheme": isDarkMode ? "dark" : "light",
      "isTransparent": false,
      "locale": "en",
      "importanceFilter": mergedConfig.importanceFilter,
      "countryFilter": mergedConfig.countryFilter,
      "timeFrame": mergedConfig.timeFrame
    };
    
    script.innerHTML = JSON.stringify(widgetOptions);
    
    // Add the script to the container if it exists
    if (containerRef.current) {
      containerRef.current.appendChild(script);
    }
    
    // Cleanup on unmount
    return cleanup;
  }, [isDarkMode, mergedConfig]);
  
  return (
    <div className="w-full" style={{ height: "75vh" }}>
      <div className="tradingview-widget-container" ref={containerRef} style={{ height: "100%", width: "100%" }} id="tradingview-calendar-container">
        <div className="tradingview-widget-container__widget" style={{ height: "calc(100% - 24px)", width: "100%" }}></div>
        <div className="tradingview-widget-copyright p-1 text-xs text-muted-foreground">
          <a href="https://www.tradingview.com/" rel="noopener nofollow" target="_blank" className="text-primary font-medium">
            Powered by TradingView
          </a>
        </div>
      </div>
    </div>
  );
}

export default memo(EconomicCalendar);