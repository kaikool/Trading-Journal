import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TradingViewChart from "@/components/tradingview/TradingViewChart";
import { useTheme } from "@/contexts/ThemeContext";

export default function Tools() {
  const { isDarkMode } = useTheme();

  // Xử lý khi tab thay đổi để tải calendar
  const handleTabChange = (value: string) => {
    if (value === "forex-calendar") {
      setTimeout(() => {
        const container = document.getElementById("calendar-container");
        if (container) {
          // Xóa nội dung cũ
          container.innerHTML = "";
          
          // TradingView Widget BEGIN
          const widgetContainer = document.createElement("div");
          widgetContainer.className = "tradingview-widget-container";
          widgetContainer.style.height = "100%";
          
          const widgetDiv = document.createElement("div");
          widgetDiv.className = "tradingview-widget-container__widget";
          widgetDiv.style.height = "calc(100% - 24px)";
          widgetDiv.style.width = "100%";
          
          const copyright = document.createElement("div");
          copyright.className = "tradingview-widget-copyright";
          copyright.style.padding = "4px";
          copyright.style.fontSize = "12px";
          copyright.innerHTML = '<a href="https://www.tradingview.com/" rel="noopener nofollow" target="_blank" style="color: #1E88E5; font-weight: 500;">Track all markets on TradingView</a>';
          
          const script = document.createElement("script");
          script.type = "text/javascript";
          script.src = "https://s3.tradingview.com/external-embedding/embed-widget-events.js";
          script.async = true;
          script.innerHTML = JSON.stringify({
            "width": "100%",
            "height": "100%",
            "colorTheme": isDarkMode ? "dark" : "light",
            "isTransparent": false,
            "locale": "en",
            "importanceFilter": "0,1",
            "countryFilter": "us"
          });
          
          widgetContainer.appendChild(widgetDiv);
          widgetContainer.appendChild(copyright);
          widgetContainer.appendChild(script);
          container.appendChild(widgetContainer);
          // TradingView Widget END
        }
      }, 100);
    }
  };

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
        <Tabs defaultValue="chart" className="w-full" onValueChange={handleTabChange}>
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
              <div id="calendar-container" className="h-full"></div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}