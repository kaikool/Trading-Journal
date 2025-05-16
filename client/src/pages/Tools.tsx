import React, { useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTheme } from "@/contexts/ThemeContext";
import TradingViewChart from "@/components/tradingview/TradingViewChart";

export default function Tools() {
  const { isDarkMode } = useTheme();

  // Direct embed approach for TradingView calendar widget
  useEffect(() => {
    const loadCalendarWidget = (container) => {
      if (!container) return;
      
      // Clear any existing content first
      container.innerHTML = "";
      
      // Manual HTML injection for TradingView widget
      container.innerHTML = `
        <div class="tradingview-widget-container" style="width:100%; height:100%;">
          <iframe 
            id="tradingview-widget-iframe"
            src="https://s.tradingview.com/calendar/?locale=en&countryFilter=us&importanceFilter=-1,0,1&theme=${isDarkMode ? 'dark' : 'light'}" 
            style="width:100%; height:100%; border:none;"
            frameborder="0"
            allowtransparency="true"
            scrolling="no"
          ></iframe>
          <div class="tradingview-widget-copyright p-1 text-xs text-muted-foreground">
            <a href="https://www.tradingview.com/" rel="noopener nofollow" target="_blank" class="text-primary font-medium">
              Powered by TradingView
            </a>
          </div>
        </div>
      `;
    };

    // Function to handle tab changes
    const handleTabChange = () => {
      if (document.querySelector('[data-state="active"][value="forex-calendar"]')) {
        const container = document.getElementById("tradingview-calendar-container");
        loadCalendarWidget(container);
      }
    };
    
    // Initial load if forex-calendar is the active tab
    setTimeout(() => {
      if (document.querySelector('[data-state="active"][value="forex-calendar"]')) {
        const container = document.getElementById("tradingview-calendar-container");
        loadCalendarWidget(container);
      }
    }, 500);
    
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