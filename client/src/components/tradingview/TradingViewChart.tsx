import React, { useEffect, useRef, memo } from 'react';
import { useTheme } from "@/contexts/ThemeContext";

function TradingViewChart() {
  const container = useRef<HTMLDivElement>(null);
  const { isDarkMode } = useTheme();

  useEffect(() => {
    if (!container.current) return;
    
    // Clear any existing scripts first
    container.current.innerHTML = "";
    
    const widgetContainer = document.createElement("div");
    widgetContainer.className = "tradingview-widget-container__widget";
    widgetContainer.style.height = "calc(100% - 32px)";
    widgetContainer.style.width = "100%";
    
    const copyright = document.createElement("div");
    copyright.className = "tradingview-widget-copyright p-2 text-xs text-muted-foreground";
    copyright.innerHTML = '<a href="https://www.tradingview.com/" rel="noopener nofollow" target="_blank" class="text-primary font-medium">Powered by TradingView</a>';
    
    if (container.current) {
      container.current.appendChild(widgetContainer);
      container.current.appendChild(copyright);
    }

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    
    // Configure chart options based on current theme
    const chartOptions = {
      "autosize": true,
      "symbol": "OANDA:XAUUSD",
      "interval": "60",
      "timezone": "exchange",
      "theme": isDarkMode ? "dark" : "light",
      "style": "1",
      "locale": "en",
      "hide_legend": true,
      "allow_symbol_change": true,
      "watchlist": [
        "OANDA:XAUUSD",
        "BINANCE:BTCUSDT.P",
        "FX:GBPUSD",
        "OANDA:GBPUSD",
        "OANDA:USDJPY"
      ],
      "studies": [
        "STD;RSI",
        "STD;TEMA"
      ],
      "hide_volume": true,
      "support_host": "https://www.tradingview.com"
    };
    
    script.innerHTML = JSON.stringify(chartOptions);
    
    if (container.current) {
      container.current.appendChild(script);
    }
    
    return () => {
      if (script && script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [isDarkMode]);

  return (
    <div 
      className="tradingview-widget-container h-full w-full" 
      ref={container} 
      style={{ minHeight: "650px" }}
    ></div>
  );
}

export default memo(TradingViewChart);