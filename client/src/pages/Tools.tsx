import React, { useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTheme } from "@/contexts/ThemeContext";
import TradingViewChart from "@/components/tradingview/TradingViewChart";

export default function Tools() {
  const { isDarkMode } = useTheme();

  // Dynamically inject TradingView widget script for calendar
  useEffect(() => {
    // Function to create the calendar widget
    const createCalendarWidget = () => {
      // Check for existing events widget script and remove if found
      const existingEventsScript = document.getElementById("tradingview-events-script");
      if (existingEventsScript) {
        existingEventsScript.remove();
      }

      // Create new script element for events widget
      const script = document.createElement("script");
      script.id = "tradingview-events-script";
      script.type = "text/javascript";
      script.async = true;
      script.src = "https://s3.tradingview.com/external-embedding/embed-widget-events.js";
      
      // Configure widget options based on current theme
      const widgetConfig = {
        "width": "100%",
        "height": "100%",
        "colorTheme": isDarkMode ? "dark" : "light",
        "isTransparent": false,
        "locale": "en",
        "importanceFilter": "0,1",
        "countryFilter": "us"
      };
      
      script.innerHTML = JSON.stringify(widgetConfig);
      
      return script;
    };

    // Add calendar script when forex-calendar tab is selected
    const handleTabChange = () => {
      const calendarTab = document.querySelector('[data-state="active"][value="forex-calendar"]');
      if (calendarTab) {
        const widgetContainer = document.getElementById("tradingview-calendar-container");
        if (widgetContainer) {
          // Clear existing widget content
          widgetContainer.innerHTML = "";
          
          // Create widget div
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
          
          // Add script 
          widgetContainer.appendChild(createCalendarWidget());
        }
      }
    };
    
    // Run once on mount
    setTimeout(handleTabChange, 500);
    
    // Setup tab change listener
    const tabsList = document.querySelector('[role="tabslist"]');
    if (tabsList) {
      tabsList.addEventListener('click', handleTabChange);
    }
    
    // Cleanup
    return () => {
      if (tabsList) {
        tabsList.removeEventListener('click', handleTabChange);
      }
      
      const existingScript = document.getElementById("tradingview-events-script");
      if (existingScript && existingScript.parentNode) {
        existingScript.parentNode.removeChild(existingScript);
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