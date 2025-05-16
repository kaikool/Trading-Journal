import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useTradingTools } from '@/contexts/TradingToolsContext';

// Define common forex pairs
const commonForexPairs = [
  { value: "OANDA:EURUSD", label: "EUR/USD" },
  { value: "OANDA:GBPUSD", label: "GBP/USD" },
  { value: "OANDA:USDJPY", label: "USD/JPY" },
  { value: "OANDA:AUDUSD", label: "AUD/USD" },
  { value: "OANDA:USDCAD", label: "USD/CAD" },
  { value: "OANDA:NZDUSD", label: "NZD/USD" },
  { value: "OANDA:USDCHF", label: "USD/CHF" },
  { value: "OANDA:XAUUSD", label: "XAU/USD" },
  { value: "OANDA:XAGUSD", label: "XAG/USD" },
  { value: "OANDA:GBPJPY", label: "GBP/JPY" },
  { value: "OANDA:EURJPY", label: "EUR/JPY" },
  { value: "OANDA:AUDJPY", label: "AUD/JPY" },
];

// Define time intervals
const chartIntervals = [
  { value: "1", label: "1 minute" },
  { value: "5", label: "5 minutes" },
  { value: "15", label: "15 minutes" },
  { value: "30", label: "30 minutes" },
  { value: "60", label: "1 hour" },
  { value: "240", label: "4 hours" },
  { value: "1D", label: "1 day" },
  { value: "1W", label: "1 week" },
  { value: "1M", label: "1 month" },
];

// Define chart styles
const chartStyles = [
  { value: "0", label: "Bars" },
  { value: "1", label: "Candles" },
  { value: "2", label: "Hollow Candles" },
  { value: "3", label: "Line" },
  { value: "4", label: "Area" },
  { value: "5", label: "Renko" },
  { value: "6", label: "Kagi" },
  { value: "7", label: "Point & Figure" },
  { value: "8", label: "Heikin Ashi" },
];

// Define available studies (indicators)
const availableStudies = [
  { value: "RSI@tv-basicstudies", label: "RSI" },
  { value: "MASimple@tv-basicstudies", label: "Simple MA" },
  { value: "MAExp@tv-basicstudies", label: "EMA" },
  { value: "MACD@tv-basicstudies", label: "MACD" },
  { value: "BB@tv-basicstudies", label: "Bollinger Bands" },
  { value: "SStoch@tv-basicstudies", label: "Stochastic" },
  { value: "ATR@tv-basicstudies", label: "ATR" },
  { value: "IchimokuCloud@tv-basicstudies", label: "Ichimoku Cloud" },
  { value: "Supertrend@tv-basicstudies", label: "Supertrend" },
  { value: "PivotPointsStandard@tv-basicstudies", label: "Pivot Points" },
];

const ChartConfig: React.FC = () => {
  const { chartConfig, updateChartConfig, resetChartConfig } = useTradingTools();
  
  return (
    <div className="p-4 bg-card rounded-md border">
      <h3 className="text-lg font-medium mb-4">Chart Settings</h3>
      
      <Accordion type="single" collapsible defaultValue="basic" className="w-full">
        <AccordionItem value="basic">
          <AccordionTrigger>Basic Settings</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <Label htmlFor="symbol">Symbol</Label>
                  <Select 
                    value={chartConfig.symbol} 
                    onValueChange={(value) => updateChartConfig({ symbol: value })}
                  >
                    <SelectTrigger id="symbol">
                      <SelectValue placeholder="Select a symbol" />
                    </SelectTrigger>
                    <SelectContent>
                      {commonForexPairs.map((pair) => (
                        <SelectItem key={pair.value} value={pair.value}>
                          {pair.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="interval">Time Interval</Label>
                  <Select 
                    value={chartConfig.interval} 
                    onValueChange={(value) => updateChartConfig({ interval: value })}
                  >
                    <SelectTrigger id="interval">
                      <SelectValue placeholder="Select time interval" />
                    </SelectTrigger>
                    <SelectContent>
                      {chartIntervals.map((interval) => (
                        <SelectItem key={interval.value} value={interval.value}>
                          {interval.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="style">Chart Style</Label>
                  <Select 
                    value={chartConfig.style} 
                    onValueChange={(value) => updateChartConfig({ style: value })}
                  >
                    <SelectTrigger id="style">
                      <SelectValue placeholder="Select chart style" />
                    </SelectTrigger>
                    <SelectContent>
                      {chartStyles.map((style) => (
                        <SelectItem key={style.value} value={style.value}>
                          {style.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="indicators">
          <AccordionTrigger>Indicators</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground mb-2">
                Select up to 3 indicators to display on your chart
              </p>
              
              <div className="grid grid-cols-2 gap-2">
                {availableStudies.map((study) => (
                  <div key={study.value} className="flex items-center space-x-2">
                    <Switch 
                      id={`study-${study.value}`}
                      checked={chartConfig.studies?.includes(study.value)}
                      onCheckedChange={(checked) => {
                        const currentStudies = [...(chartConfig.studies || [])];
                        
                        if (checked) {
                          // Add the study if it's not already there
                          if (!currentStudies.includes(study.value)) {
                            // Limit to 3 indicators
                            if (currentStudies.length < 3) {
                              updateChartConfig({
                                studies: [...currentStudies, study.value]
                              });
                            }
                          }
                        } else {
                          // Remove the study
                          updateChartConfig({
                            studies: currentStudies.filter(s => s !== study.value)
                          });
                        }
                      }}
                    />
                    <Label htmlFor={`study-${study.value}`} className="text-sm">
                      {study.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="appearance">
          <AccordionTrigger>Appearance</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                <Label className="mb-2">Chế độ hiển thị biểu đồ</Label>
                <p className="text-xs text-muted-foreground mb-4">
                  Sau khi biểu đồ tải, bạn có thể tùy chỉnh màu sắc trực tiếp từ giao diện TradingView
                </p>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Label className="mb-2">Scale Type</Label>
                <Select 
                  value={chartConfig.scaleMode || "Normal"} 
                  onValueChange={(value) => updateChartConfig({ scaleMode: value as 'Normal' | 'Logarithmic' })}
                >
                  <SelectTrigger id="scaleMode">
                    <SelectValue placeholder="Select scale type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Normal">Normal</SelectItem>
                    <SelectItem value="Logarithmic">Logarithmic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Label className="mb-2">Display Options</Label>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="showVolume"
                      checked={chartConfig.showVolume !== false}
                      onCheckedChange={(checked) => 
                        updateChartConfig({ showVolume: checked })
                      }
                    />
                    <Label htmlFor="showVolume">Show Volume</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="showGridLines"
                      checked={chartConfig.showGridLines !== false}
                      onCheckedChange={(checked) => 
                        updateChartConfig({ showGridLines: checked })
                      }
                    />
                    <Label htmlFor="showGridLines">Show Grid Lines</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="showFloatingTooltip"
                      checked={chartConfig.showFloatingTooltip !== false}
                      onCheckedChange={(checked) => 
                        updateChartConfig({ showFloatingTooltip: checked })
                      }
                    />
                    <Label htmlFor="showFloatingTooltip">Show Floating Tooltip</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="showWatermark"
                      checked={chartConfig.showWatermark === true}
                      onCheckedChange={(checked) => 
                        updateChartConfig({ showWatermark: checked })
                      }
                    />
                    <Label htmlFor="showWatermark">Show Watermark</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="fullscreenButton"
                      checked={chartConfig.fullscreenButton !== false}
                      onCheckedChange={(checked) => 
                        updateChartConfig({ fullscreenButton: checked })
                      }
                    />
                    <Label htmlFor="fullscreenButton">Fullscreen Button</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="allowScreenshot"
                      checked={chartConfig.allowScreenshot !== false}
                      onCheckedChange={(checked) => 
                        updateChartConfig({ allowScreenshot: checked })
                      }
                    />
                    <Label htmlFor="allowScreenshot">Allow Screenshots</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="showDetailsButton"
                      checked={chartConfig.showDetailsButton}
                      onCheckedChange={(checked) => 
                        updateChartConfig({ showDetailsButton: checked })
                      }
                    />
                    <Label htmlFor="showDetailsButton">Show Details Button</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="showHotlistButton"
                      checked={chartConfig.showHotlistButton}
                      onCheckedChange={(checked) => 
                        updateChartConfig({ showHotlistButton: checked })
                      }
                    />
                    <Label htmlFor="showHotlistButton">Show Market Overview</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="showCalendarButton"
                      checked={chartConfig.showCalendarButton}
                      onCheckedChange={(checked) => 
                        updateChartConfig({ showCalendarButton: checked })
                      }
                    />
                    <Label htmlFor="showCalendarButton">Show Economic Calendar</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="showDrawings"
                      checked={chartConfig.showDrawings}
                      onCheckedChange={(checked) => 
                        updateChartConfig({ showDrawings: checked })
                      }
                    />
                    <Label htmlFor="showDrawings">Show Drawing Tools</Label>
                  </div>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      
      <div className="mt-6 flex justify-end">
        <Button
          variant="outline"
          onClick={resetChartConfig}
          className="mr-2"
        >
          Reset to Defaults
        </Button>
        <Button onClick={() => window.location.reload()}>Apply Changes</Button>
      </div>
    </div>
  );
};

export default ChartConfig;