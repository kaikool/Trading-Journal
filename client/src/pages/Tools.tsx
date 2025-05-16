import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTheme } from "@/contexts/ThemeContext";
import TradingViewChart from "@/components/tradingview/TradingViewChart";

// Simple TradingView Calendar component using iframe
const ForexCalendar = () => {
  const { isDarkMode } = useTheme();
  
  return (
    <div className="w-full h-full rounded-md overflow-hidden">
      <iframe 
        src={`https://s.tradingview.com/calendar/?locale=en&importanceFilter=-1,0,1&countryFilter=us&theme=${isDarkMode ? 'dark' : 'light'}`}
        style={{ 
          width: "100%", 
          height: "100%", 
          border: "none",
          minHeight: "75vh"
        }}
        frameBorder="0"
        allowTransparency={true}
        title="Economic Calendar"
      />
      <div className="tradingview-widget-copyright p-1 text-xs text-muted-foreground">
        <a href="https://www.tradingview.com/" rel="noopener nofollow" target="_blank" className="text-primary font-medium">
          Powered by TradingView
        </a>
      </div>
    </div>
  );
};

export default function Tools() {
  const [activeTab, setActiveTab] = useState("chart");
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
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
        <Tabs 
          defaultValue="chart" 
          className="w-full"
          onValueChange={handleTabChange}
        >
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
            <div className="w-full overflow-hidden rounded-md border border-muted">
              {activeTab === "forex-calendar" && <ForexCalendar />}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}