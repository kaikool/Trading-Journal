import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Settings } from "lucide-react";

import TradingViewChart from "@/components/tradingview/TradingViewChart";
import EconomicCalendar from "@/components/tradingview/EconomicCalendar";
import ChartConfig from "@/components/tradingview/ChartConfig";
import CalendarConfig from "@/components/tradingview/CalendarConfig";
import { useTradingTools } from "@/contexts/TradingToolsContext";
import { useTheme } from "@/contexts/ThemeContext";

export default function Tools() {
  const { isDarkMode } = useTheme();
  const { chartConfig, calendarConfig } = useTradingTools();
  const [activeTab, setActiveTab] = useState("chart");
  const [configOpen, setConfigOpen] = useState(false);
  const [chartKey, setChartKey] = useState(Date.now());
  const [calendarKey, setCalendarKey] = useState(Date.now());

  // Effect to listen for config update events
  useEffect(() => {
    // Listen for chart config updates
    const handleChartConfigUpdated = () => {
      setChartKey(Date.now()); // Force remount of chart component
      setConfigOpen(false);    // Close the dialog
    };
    
    // Listen for calendar config updates
    const handleCalendarConfigUpdated = () => {
      setCalendarKey(Date.now()); // Force remount of calendar component
      setConfigOpen(false);       // Close the dialog
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
      return <ChartConfig />;
    } else if (activeTab === "forex-calendar") {
      return <CalendarConfig />;
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
        
        <Button 
          variant="outline" 
          size="sm"
          className="self-start sm:self-center"
          onClick={() => setConfigOpen(true)}
        >
          <Settings className="h-4 w-4 mr-2" />
          Configure
        </Button>
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
              <TradingViewChart key={chartKey} config={chartConfig} />
            </div>
          </TabsContent>
          
          <TabsContent value="forex-calendar">
            <div className="w-full overflow-hidden rounded-md border border-muted" style={{ height: "75vh" }}>
              <EconomicCalendar key={calendarKey} config={calendarConfig} />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Configuration Dialog */}
      <Dialog open={configOpen} onOpenChange={setConfigOpen}>
        <DialogContent className="max-w-xl" aria-describedby="config-description">
          <DialogHeader>
            <DialogTitle>
              {activeTab === "chart" ? "Chart Settings" : "Calendar Settings"}
            </DialogTitle>
            <p id="config-description" className="text-sm text-muted-foreground mt-1">
              Configure {activeTab === "chart" ? "chart" : "economic calendar"} settings
            </p>
          </DialogHeader>
          {getConfigComponent()}
        </DialogContent>
      </Dialog>
    </div>
  );
}