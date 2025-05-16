import React, { useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTheme } from "@/contexts/ThemeContext";
import TradingViewChart from "@/components/tradingview/TradingViewChart";

export default function Tools() {
  const { isDarkMode } = useTheme();

  // Dynamically inject TradingView widget script for calendar
  useEffect(() => {
    // Function to initialize the economic calendar widget
    const initializeCalendarWidget = () => {
      const widgetContainer = document.getElementById("tradingview-calendar-container");
      if (!widgetContainer) return;
      
      // Clear existing content
      widgetContainer.innerHTML = "";
      
      // Create widget container div
      const widgetDiv = document.createElement("div");
      widgetDiv.className = "tradingview-widget-container__widget";
      widgetDiv.style.height = "calc(100% - 24px)";
      widgetDiv.style.width = "100%";
      
      // Create copyright div
      const copyrightDiv = document.createElement("div");
      copyrightDiv.className = "tradingview-widget-copyright p-1 text-xs text-muted-foreground";
      copyrightDiv.innerHTML = '<a href="https://www.tradingview.com/" rel="noopener nofollow" target="_blank" class="text-primary font-medium">Powered by TradingView</a>';
      
      // Append to container
      widgetContainer.appendChild(widgetDiv);
      widgetContainer.appendChild(copyrightDiv);
      
      // Create the script element with proper configuration
      const script = document.createElement("script");
      script.id = "tradingview-widget-script";
      script.src = "https://s3.tradingview.com/external-embedding/embed-widget-events.js";
      script.async = true;
      
      // Simple string-based setup to avoid JSON stringify issues
      script.textContent = JSON.stringify({
        "width": "100%",
        "height": "100%",
        "colorTheme": isDarkMode ? "dark" : "light",
        "isTransparent": false,
        "locale": "en",
        "importanceFilter": "0,1",
        "currencyFilter": "USD,EUR,JPY,GBP,AUD,CAD,CHF,CNY",
        "countryFilter": "us,eu,uk,jp,ca,au,ch,cn"
      });
      
      // Append script to widget container
      widgetDiv.appendChild(script);
    };

    // Handle tab change to initialize widget when forex-calendar tab is selected
    const handleTabChange = () => {
      const calendarTab = document.querySelector('[data-state="active"][value="forex-calendar"]');
      if (calendarTab) {
        // Initialize widget with a slight delay to ensure DOM is ready
        setTimeout(initializeCalendarWidget, 100);
      }
    };
    
    // Run once on mount with a delay to ensure proper rendering
    setTimeout(() => {
      const calendarTab = document.querySelector('[data-state="active"][value="forex-calendar"]');
      if (calendarTab) {
        initializeCalendarWidget();
      }
    }, 800);
    
    // Set up tab change listener
    const tabsList = document.querySelector('[role="tabslist"]');
    if (tabsList) {
      tabsList.addEventListener('click', handleTabChange);
    }
    
    // Cleanup
    return () => {
      if (tabsList) {
        tabsList.removeEventListener('click', handleTabChange);
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
              <div id="tradingview-calendar-container" className="tradingview-widget-container" style={{ height: "100%", width: "100%" }}>
                {/* Widget will be dynamically inserted here by useEffect */}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}