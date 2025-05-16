import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TradingViewChart from "@/components/tradingview/TradingViewChart";
import { useTheme } from "@/contexts/ThemeContext";

export default function Tools() {
  const { isDarkMode } = useTheme();

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
            <div className="w-full overflow-hidden rounded-md border border-muted h-[75vh]">
              {/* TradingView Widget BEGIN */}
              <div className="tradingview-widget-container h-full">
                <div className="tradingview-widget-container__widget h-[calc(100%-24px)]"></div>
                <div className="tradingview-widget-copyright p-1 text-xs text-muted-foreground">
                  <a href="https://www.tradingview.com/" rel="noopener nofollow" target="_blank" className="text-primary font-medium">
                    Track all markets on TradingView
                  </a>
                </div>
                <script 
                  type="text/javascript" 
                  src="https://s3.tradingview.com/external-embedding/embed-widget-events.js" 
                  async
                  dangerouslySetInnerHTML={{
                    __html: `
                    {
                      "width": "100%",
                      "height": "100%",
                      "colorTheme": "${isDarkMode ? 'dark' : 'light'}",
                      "isTransparent": false,
                      "locale": "en",
                      "importanceFilter": "0,1",
                      "countryFilter": "us"
                    }
                    `
                  }}
                ></script>
              </div>
              {/* TradingView Widget END */}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}