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
      "width": "100%",
      "height": "100%",
      "autosize": true,
      "symbol": "OANDA:XAUUSD",
      "interval": "60", // 1h default
      "timezone": "exchange",
      "theme": isDarkMode ? "dark" : "light",
      "style": "1", // Candles style
      "locale": "en",
      "toolbar_bg": isDarkMode ? "#151924" : "#f1f3f6",
      "enable_publishing": false,
      "hide_top_toolbar": false,
      "allow_symbol_change": true,
      "save_image": true,
      "container_id": "tradingview-widget-container",
      "watchlist": [
        "OANDA:XAUUSD",
        "BINANCE:BTCUSDT.P",
        "FX:GBPUSD",
        "OANDA:GBPUSD", 
        "OANDA:USDJPY"
      ],
      "withdateranges": true,
      "hide_side_toolbar": false,
      "details": true,
      "hotlist": true,
      "calendar": true,
      "studies": [
        "RSI@tv-basicstudies",
        "MASimple@tv-basicstudies"
      ],
      "disabled_features": [
        "header_compare"
      ],
      "enabled_features": [
        "use_localstorage_for_settings",
        "save_chart_properties_to_local_storage"
      ],
      "charts_storage_api_version": "1.1",
      "client_id": "tradingview.com",
      "user_id": "public_user",
      "charts_storage_url": "https://saveload.tradingview.com",
      "supported_resolutions": ["15", "30", "60", "240", "1D"],
      "time_frames": [
        { "text": "15m", "resolution": "15" },
        { "text": "30m", "resolution": "30" },
        { "text": "1h", "resolution": "60" },
        { "text": "4h", "resolution": "240" },
        { "text": "1D", "resolution": "1D" }
      ],
      "overrides": {
        "mainSeriesProperties.candleStyle.upColor": "#26a69a",
        "mainSeriesProperties.candleStyle.downColor": "#ef5350",
        "mainSeriesProperties.candleStyle.wickUpColor": "#26a69a",
        "mainSeriesProperties.candleStyle.wickDownColor": "#ef5350"
      }
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
      <div className="tradingview-widget-container" ref={containerRef} style={{ height: "100%", width: "100%" }} id="tradingview-widget-container">
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