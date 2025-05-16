import React, { useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTheme } from "@/contexts/ThemeContext";
import TradingViewChart from "@/components/tradingview/TradingViewChart";

export default function Tools() {
  const { isDarkMode } = useTheme();

  // Dynamically inject TradingView widget script
  useEffect(() => {
    // Remove any existing script to avoid duplicates
    const existingScript = document.getElementById("tradingview-widget-script");
    if (existingScript) {
      existingScript.remove();
    }

    // Create new script element
    const script = document.createElement("script");
    script.id = "tradingview-widget-script";
    script.type = "text/javascript";
    script.async = true;
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-events.js";
    
    // Configure widget options based on current theme
    const widgetConfig = {
      "width": "100%",
      "height": "600",
      "colorTheme": isDarkMode ? "dark" : "light",
      "isTransparent": false,
      "locale": "en",
      "importanceFilter": "0,1",
      "countryFilter": "us"
    };
    
    script.innerHTML = JSON.stringify(widgetConfig);
    
    // Append script to widget container
    const widgetContainer = document.getElementById("tradingview-widget-container");
    if (widgetContainer) {
      widgetContainer.appendChild(script);
    }
    
    // Cleanup on unmount
    return () => {
      if (script && script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [isDarkMode]);

  return (
    <div className="max-w-7xl mx-auto px-0 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col mb-4">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-primary via-primary/90 to-primary/70 bg-clip-text text-transparent">
          Trading Tools
        </h1>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          Access essential tools for your trading analysis and decision making
        </p>
      </div>
      
      {/* Main content */}
      <div className="grid grid-cols-1 gap-6">
        <Tabs defaultValue="chart" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="chart">Chart</TabsTrigger>
            <TabsTrigger value="forex-calendar">Forex Calendar</TabsTrigger>
            {/* Additional tabs can be added here later */}
          </TabsList>
          
          <TabsContent value="chart">
            <div className="w-full overflow-hidden rounded-md border border-muted">
              <TradingViewChart />
            </div>
          </TabsContent>
          
          <TabsContent value="forex-calendar">
            <div className="w-full overflow-hidden rounded-md border border-muted" style={{ height: "75vh" }}>
              <div id="tradingview-widget-container" className="tradingview-widget-container" style={{ height: "100%", width: "100%" }}>
                <div className="tradingview-widget-container__widget" style={{ height: "calc(100% - 24px)", width: "100%" }}></div>
                <div className="tradingview-widget-copyright p-1 text-xs text-muted-foreground">
                  Powered by <a href="https://www.tradingview.com/" rel="noopener nofollow" target="_blank" className="text-primary font-medium">TradingView</a>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}