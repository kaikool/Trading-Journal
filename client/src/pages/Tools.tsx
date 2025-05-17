import React, { useState, useEffect, Suspense } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Settings, X } from "lucide-react";


// Dynamic imports for code splitting
import { 
  LazyTradingViewChart, 
  LazyEconomicCalendar,
  LazyChartConfig,
  LazyCalendarConfig
} from "@/components/dynamic/trading-components";

import { useTradingTools } from "@/contexts/TradingToolsContext";
import { useTheme } from "@/contexts/ThemeContext";

export default function Tools() {
  const { isDarkMode } = useTheme();
  const { chartConfig, calendarConfig } = useTradingTools();
  const [activeTab, setActiveTab] = useState("chart");
  const [showConfig, setShowConfig] = useState(false);
  const [chartKey, setChartKey] = useState(Date.now());
  const [calendarKey, setCalendarKey] = useState(Date.now());

  // Effect to listen for config update events
  useEffect(() => {
    // Listen for chart config updates
    const handleChartConfigUpdated = () => {
      setChartKey(Date.now()); // Force remount of chart component
      setShowConfig(false);    // Hide the config panel
    };
    
    // Listen for calendar config updates
    const handleCalendarConfigUpdated = () => {
      setCalendarKey(Date.now()); // Force remount of calendar component
      setShowConfig(false);       // Hide the config panel
    };
    
    // Add event listeners
    window.addEventListener('chart-config-updated', handleChartConfigUpdated);
    window.addEventListener('calendar-config-updated', handleCalendarConfigUpdated);
    
    // Clean up event listeners on unmount
    return () => {
      window.removeEventListener('chart-config-updated', handleChartConfigUpdated);
      window.removeEventListener('calendar-config-updated', handleCalendarConfigUpdated);
    };
  }, []);

  // Handle tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  // Get the appropriate configuration component based on active tab
  const getConfigComponent = () => {
    if (activeTab === "chart") {
      return (
        <Suspense fallback={<div className="h-[200px] bg-background/5 rounded-md"></div>}>
          <LazyChartConfig />
        </Suspense>
      );
    } else if (activeTab === "forex-calendar") {
      return (
        <Suspense fallback={<div className="h-[200px] bg-background/5 rounded-md"></div>}>
          <LazyCalendarConfig />
        </Suspense>
      );
    }
    return null;
  };

  return (
    <div className="max-w-7xl mx-auto px-0 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-primary via-primary/90 to-primary/70 bg-clip-text text-transparent">
            Trading Tools
          </h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Access essential tools for your trading analysis and decision making
          </p>
        </div>
      </div>
      
      {/* Main content */}
      <div className="grid grid-cols-1 gap-6">
        <Tabs defaultValue="chart" className="w-full" onValueChange={handleTabChange}>
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="chart">Chart</TabsTrigger>
              <TabsTrigger value="forex-calendar">Forex Calendar</TabsTrigger>
              {/* Additional tabs can be added here later */}
            </TabsList>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowConfig(!showConfig)}
              className="ml-2 flex items-center"
            >
              <Settings className="h-4 w-4 mr-1" />
              <span>{showConfig ? "Hide Config" : "Config"}</span>
            </Button>
          </div>
          
          {showConfig && (
            <Card className="mb-4 p-4 border-muted">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-medium">
                    {activeTab === "chart" ? "Chart Settings" : "Calendar Settings"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Configure {activeTab === "chart" ? "chart" : "economic calendar"} settings
                  </p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowConfig(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {getConfigComponent()}
            </Card>
          )}
          
          <TabsContent value="chart">
            <div className="w-full overflow-hidden rounded-md border border-muted">
              <Suspense fallback={<div className="h-[600px] bg-background/5 rounded-md"></div>}>
                <LazyTradingViewChart key={chartKey} config={chartConfig} />
              </Suspense>
            </div>
          </TabsContent>
          
          <TabsContent value="forex-calendar">
            <div className="w-full overflow-hidden rounded-md border border-muted" style={{ height: "75vh" }}>
              <Suspense fallback={<div className="h-[600px] bg-background/5 rounded-md"></div>}>
                <LazyEconomicCalendar key={calendarKey} config={calendarConfig} />
              </Suspense>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}