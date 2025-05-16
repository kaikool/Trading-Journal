import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Tools() {
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
                Real-time economic events calendar to help you stay informed about market-moving events.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="w-full overflow-hidden rounded-md border border-muted">
                <iframe 
                  src="https://sslecal2.investing.com?columns=exc_flags,exc_currency,exc_importance,exc_actual,exc_forecast,exc_previous&category=_employment,_economicActivity,_inflation,_credit,_centralBanks,_confidenceIndex,_balance,_Bonds&importance=1,2,3&features=datepicker,timezone,timeselector,filters&countries=5&calType=week&timeZone=27&lang=1" 
                  width="100%" 
                  height="600" 
                  frameBorder="0" 
                  allowTransparency 
                  className="w-full"
                ></iframe>
                <div className="p-2 text-xs text-muted-foreground">
                  Economic Calendar provided by <a href="https://www.investing.com/" rel="nofollow" target="_blank" className="text-primary font-medium">Investing.com</a>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}