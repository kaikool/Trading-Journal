import React, { useEffect, useRef, memo } from 'react';
import { useTheme } from "@/contexts/ThemeContext";

function TradingViewChart() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { isDarkMode } = useTheme();
  
  useEffect(() => {
    // Cleanup function to remove any existing widget scripts
    const cleanup = () => {
      const existingScript = document.getElementById("tradingview-widget-script");
      if (existingScript && existingScript.parentNode) {
        existingScript.parentNode.removeChild(existingScript);
      }
    };
    
    // Clean up first
    cleanup();
    
    // Create and add the script
    const script = document.createElement("script");
    script.id = "tradingview-widget-script";
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    
    // Set widget options
    const widgetOptions = {
      "autosize": true,
      "symbol": "OANDA:XAUUSD",
      "interval": "60", // H1 interval by default
      "timezone": "exchange",
      "theme": isDarkMode ? "dark" : "light",
      "style": "1", // Candles style
      "locale": "en",
      "hide_legend": true,
      "allow_symbol_change": true,
      "save_image": true,
      "enable_publishing": false,
      "hide_top_toolbar": false,
      "withdateranges": true,
      "show_popup_button": true,
      "popup_width": "1000",
      "popup_height": "650",
      "published_charts_count": 3,
      "watchlist": [
        "OANDA:XAUUSD",
        "BINANCE:BTCUSDT.P",
        "FX:GBPUSD",
        "OANDA:GBPUSD", 
        "OANDA:USDJPY"
      ],
      "chartType": "candlesticks",
      "default_interval": "60",
      "timeframe": "1D",
      "toolbar_bg": isDarkMode ? "#151924" : "#f1f3f6",
      "favorites": {
        "intervals": ["15", "30", "60", "240", "1D"],
        "chartTypes": ["candlesticks"]
      },
      "supported_resolutions": ["15", "30", "60", "240", "1D", "1W", "1M"],
      "disabled_features": ["header_compare"],
      "enabled_features": ["use_localstorage_for_settings"],
      "studies": [
        "STD;RSI", 
        "STD;TEMA"
      ],
      "hide_volume": true,
      "support_host": "https://www.tradingview.com"
    };
    
    script.innerHTML = JSON.stringify(widgetOptions);
    
    // Add the script to the container if it exists
    if (containerRef.current) {
      containerRef.current.appendChild(script);
    }
    
    // Cleanup on unmount
    return cleanup;
  }, [isDarkMode]);
  
  return (
    <div className="w-full" style={{ height: "75vh" }}>
      <div className="tradingview-widget-container" ref={containerRef} style={{ height: "100%", width: "100%" }}>
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

export default memo(TradingViewChart);