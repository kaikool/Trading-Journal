import React, { useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTheme } from "@/contexts/ThemeContext";

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
      "countryFilter": "us,eu,gb,ca,au,nz,jp,ch"
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
    <div className="container mx-auto p-4 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">Trading Tools</h1>
      
      <Tabs defaultValue="forex-calendar" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="forex-calendar">Forex Calendar</TabsTrigger>
          {/* Additional tabs can be added here later */}
        </TabsList>
        
        <TabsContent value="forex-calendar">
          <Card>
            <CardHeader>
              <CardTitle>Economic Calendar</CardTitle>
              <CardDescription>
                Stay informed about market-moving economic events with real-time updates.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="w-full overflow-hidden rounded-md border border-muted" style={{ minHeight: "600px" }}>
                <div id="tradingview-widget-container" className="tradingview-widget-container h-full">
                  <div className="tradingview-widget-container__widget h-full"></div>
                  <div className="tradingview-widget-copyright p-2 text-xs text-muted-foreground">
                    Powered by <a href="https://www.tradingview.com/" rel="noopener nofollow" target="_blank" className="text-primary font-medium">TradingView</a>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}