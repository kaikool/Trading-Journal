import React, { useEffect, useRef, memo } from 'react';
import { useTheme } from "@/contexts/ThemeContext";

export interface TradingViewChartConfig {
  symbol?: string;
  interval?: string;
  timezone?: string;
  style?: string;
  studies?: string[];
  watchlist?: string[];
  showDetailsButton?: boolean;
  showHotlistButton?: boolean;
  showCalendarButton?: boolean;
  showDrawings?: boolean;
  showVolume?: boolean;
  scaleMode?: 'Normal' | 'Logarithmic';
  showGridLines?: boolean;
  customGridLineColor?: string;
  backgroundColor?: string;
  showFloatingTooltip?: boolean;
  showWatermark?: boolean;
  fullscreenButton?: boolean;
  allowScreenshot?: boolean;
  hideSideToolbar?: boolean;
  customColors?: {
    upColor?: string;
    downColor?: string;
    wickUpColor?: string;
    wickDownColor?: string;
    borderUpColor?: string;
    borderDownColor?: string;
    backgroundType?: 'solid' | 'gradient';
    backColor?: string;
    chartFontColor?: string;
    volumeUpColor?: string;
    volumeDownColor?: string;
  };
}

interface TradingViewChartProps {
  config?: TradingViewChartConfig;
}

function TradingViewChart({ config }: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { isDarkMode } = useTheme();
  
  // Default configuration
  const defaultConfig: TradingViewChartConfig = {
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
    showVolume: true,
    scaleMode: "Normal",
    showGridLines: true,
    showFloatingTooltip: true,
    showWatermark: false,
    fullscreenButton: true,
    allowScreenshot: true,
    hideSideToolbar: false,
    customColors: {
      upColor: "#26a69a",
      downColor: "#ef5350",
      wickUpColor: "#26a69a",
      wickDownColor: "#ef5350",
      backgroundType: "solid",
      volumeUpColor: "#26a69a80",
      volumeDownColor: "#ef535080"
    }
  };
  
  // Merge default with provided config
  const mergedConfig = {
    ...defaultConfig,
    ...config,
    customColors: { ...defaultConfig.customColors, ...config?.customColors }
  };
  
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
      "symbol": mergedConfig.symbol,
      "interval": mergedConfig.interval,
      "timezone": mergedConfig.timezone,
      "theme": isDarkMode ? "dark" : "light",
      "style": mergedConfig.style,
      "locale": "en",
      "toolbar_bg": isDarkMode ? "#151924" : "#f1f3f6",
      "enable_publishing": false,
      "hide_top_toolbar": false,
      "allow_symbol_change": true,
      "save_image": mergedConfig.allowScreenshot !== false,
      "container_id": "tradingview-widget-container",
      "watchlist": mergedConfig.watchlist,
      "withdateranges": true,
      "hide_side_toolbar": mergedConfig.hideSideToolbar === true || !mergedConfig.showDrawings,
      "details": mergedConfig.showDetailsButton,
      "hotlist": mergedConfig.showHotlistButton,
      "calendar": mergedConfig.showCalendarButton,
      "studies": mergedConfig.studies,
      "show_popup_button": mergedConfig.fullscreenButton !== false,
      "popup_width": "1000",
      "popup_height": "650",
      "hide_volume": mergedConfig.showVolume === false,
      "hide_drawing_toolbar": mergedConfig.showDrawings === false,
      "scale_mode": mergedConfig.scaleMode?.toLowerCase() === "logarithmic" ? "logarithmic" : "normal",
      "disabled_features": [
        "header_compare",
        ...(mergedConfig.showGridLines === false ? ["grid_lines"] : []), 
        ...(mergedConfig.showWatermark === false ? ["header_symbol_search"] : []),
        ...(mergedConfig.showFloatingTooltip === false ? ["floating_tooltip"] : [])
      ],
      "enabled_features": [
        "use_localstorage_for_settings",
        "save_chart_properties_to_local_storage"
      ],
      "charts_storage_api_version": "1.1",
      "client_id": "tradingview.com",
      "user_id": "public_user",
      "charts_storage_url": "https://saveload.tradingview.com",
      "supported_resolutions": ["1", "5", "15", "30", "60", "240", "1D", "1W", "1M"],
      "time_frames": [
        { "text": "1m", "resolution": "1" },
        { "text": "5m", "resolution": "5" },
        { "text": "15m", "resolution": "15" },
        { "text": "30m", "resolution": "30" },
        { "text": "1h", "resolution": "60" },
        { "text": "4h", "resolution": "240" },
        { "text": "1D", "resolution": "1D" },
        { "text": "1W", "resolution": "1W" },
        { "text": "1M", "resolution": "1M" }
      ],
      "overrides": {
        // Candle style
        "mainSeriesProperties.candleStyle.upColor": mergedConfig.customColors?.upColor,
        "mainSeriesProperties.candleStyle.downColor": mergedConfig.customColors?.downColor,
        "mainSeriesProperties.candleStyle.wickUpColor": mergedConfig.customColors?.wickUpColor,
        "mainSeriesProperties.candleStyle.wickDownColor": mergedConfig.customColors?.wickDownColor,
        "mainSeriesProperties.candleStyle.borderUpColor": mergedConfig.customColors?.borderUpColor,
        "mainSeriesProperties.candleStyle.borderDownColor": mergedConfig.customColors?.borderDownColor,
        
        // Volume colors
        "volumePaneSize": mergedConfig.showVolume !== false ? "medium" : "small",
        "volume.volume.color.0": mergedConfig.customColors?.volumeDownColor || (mergedConfig.customColors?.downColor + "80"),
        "volume.volume.color.1": mergedConfig.customColors?.volumeUpColor || (mergedConfig.customColors?.upColor + "80"),
        
        // Background
        "paneProperties.background": mergedConfig.customColors?.backColor || (isDarkMode ? "#131722" : "#ffffff"),
        "paneProperties.backgroundType": mergedConfig.customColors?.backgroundType || "solid",
        
        // Grid lines
        "paneProperties.gridProperties.color": mergedConfig.customGridLineColor || (isDarkMode ? "#363c4e" : "#e1e3eb"),
        "paneProperties.vertGridProperties.color": mergedConfig.customGridLineColor || (isDarkMode ? "#363c4e" : "#e1e3eb"),
        "paneProperties.horzGridProperties.color": mergedConfig.customGridLineColor || (isDarkMode ? "#363c4e" : "#e1e3eb"),
        
        // Scaling
        "scalesProperties.textColor": mergedConfig.customColors?.chartFontColor || (isDarkMode ? "#a3a6af" : "#131722"),
        "scalesProperties.lineColor": mergedConfig.customGridLineColor || (isDarkMode ? "#363c4e" : "#e1e3eb"),
        "scalesProperties.backgroundColor": mergedConfig.customColors?.backColor || (isDarkMode ? "#131722" : "#ffffff")
      }
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