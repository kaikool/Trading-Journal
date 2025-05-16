import React from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useTradingTools } from '@/contexts/TradingToolsContext';

// Define available countries
const countries = [
  { value: "us", label: "United States" },
  { value: "eu", label: "European Union" },
  { value: "gb", label: "United Kingdom" },
  { value: "jp", label: "Japan" },
  { value: "au", label: "Australia" },
  { value: "ca", label: "Canada" },
  { value: "ch", label: "Switzerland" },
  { value: "cn", label: "China" },
  { value: "nz", label: "New Zealand" },
  { value: "kr", label: "South Korea" },
  { value: "in", label: "India" },
  { value: "br", label: "Brazil" },
  { value: "mx", label: "Mexico" },
  { value: "za", label: "South Africa" },
  { value: "ru", label: "Russia" },
  { value: "tr", label: "Turkey" },
];

// Define time frames
const timeFrames = [
  { value: "1D", label: "1 Day" },
  { value: "2D", label: "2 Days" },
  { value: "3D", label: "3 Days" },
  { value: "1W", label: "1 Week" },
  { value: "2W", label: "2 Weeks" },
  { value: "1M", label: "1 Month" },
  { value: "3M", label: "3 Months" },
];

// Define event importance
const importanceLevels = [
  { value: "0", label: "Low Impact", description: "Events with minimal market impact" },
  { value: "1", label: "Medium Impact", description: "Events with moderate market movement potential" },
  { value: "2", label: "High Impact", description: "Major events that can significantly move markets" },
];

const CalendarConfig: React.FC = () => {
  const { calendarConfig, updateCalendarConfig, resetCalendarConfig } = useTradingTools();
  
  // Convert string to array for UI interaction
  const selectedCountries = calendarConfig.countryFilter.split(',');
  const selectedImportance = calendarConfig.importanceFilter.split(',');
  
  // Handle country selection changes
  const handleCountryChange = (country: string, checked: boolean) => {
    const updatedCountries = checked
      ? [...selectedCountries, country]
      : selectedCountries.filter(c => c !== country);
    
    updateCalendarConfig({
      countryFilter: updatedCountries.join(',')
    });
  };
  
  // Handle importance selection changes
  const handleImportanceChange = (level: string, checked: boolean) => {
    const updatedImportance = checked
      ? [...selectedImportance, level]
      : selectedImportance.filter(i => i !== level);
    
    updateCalendarConfig({
      importanceFilter: updatedImportance.join(',')
    });
  };
  
  return (
    <div className="p-4 bg-card rounded-md border">
      <h3 className="text-lg font-medium mb-4">Economic Calendar Settings</h3>
      
      <Accordion type="single" collapsible defaultValue="timeframe" className="w-full">
        <AccordionItem value="timeframe">
          <AccordionTrigger>Time Frame</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <Label htmlFor="timeFrame">Display Events For</Label>
              <Select 
                value={calendarConfig.timeFrame} 
                onValueChange={(value) => updateCalendarConfig({ timeFrame: value })}
              >
                <SelectTrigger id="timeFrame">
                  <SelectValue placeholder="Select time frame" />
                </SelectTrigger>
                <SelectContent>
                  {timeFrames.map((frame) => (
                    <SelectItem key={frame.value} value={frame.value}>
                      {frame.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="countries">
          <AccordionTrigger>Countries</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground mb-2">
                Select countries to show economic events for
              </p>
              
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                {countries.map((country) => (
                  <div key={country.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`country-${country.value}`}
                      checked={selectedCountries.includes(country.value)}
                      onCheckedChange={(checked) => 
                        handleCountryChange(country.value, checked === true)
                      }
                    />
                    <Label 
                      htmlFor={`country-${country.value}`}
                      className="text-sm font-normal"
                    >
                      {country.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="importance">
          <AccordionTrigger>Event Importance</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground mb-2">
                Filter events by their market impact level
              </p>
              
              <div className="space-y-3">
                {importanceLevels.map((level) => (
                  <div key={level.value} className="flex items-start space-x-2">
                    <Checkbox
                      id={`importance-${level.value}`}
                      checked={selectedImportance.includes(level.value)}
                      onCheckedChange={(checked) => 
                        handleImportanceChange(level.value, checked === true)
                      }
                      className="mt-1"
                    />
                    <div>
                      <Label 
                        htmlFor={`importance-${level.value}`}
                        className="text-sm font-medium"
                      >
                        {level.label}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {level.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      
      <Accordion type="single" collapsible className="w-full mt-4">
        <AccordionItem value="advanced">
          <AccordionTrigger>Advanced Options</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                <Label className="mb-2">Display Mode</Label>
                
                <div className="grid grid-cols-1 gap-3">
                  <Label className="text-sm font-normal mb-2">Initial Tab View</Label>
                  <Select 
                    value={calendarConfig.initialTab || 'event'} 
                    onValueChange={(value: 'event' | 'forex' | 'crypto' | 'stock') => 
                      updateCalendarConfig({ initialTab: value })
                    }
                  >
                    <SelectTrigger id="initialTab">
                      <SelectValue placeholder="Select default tab" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="event">Economic Events</SelectItem>
                      <SelectItem value="forex">Forex Pairs</SelectItem>
                      <SelectItem value="crypto">Cryptocurrencies</SelectItem>
                      <SelectItem value="stock">Stocks</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator className="my-2" />

                <div className="space-y-2 mt-4">
                  <Label className="mb-2">User Interface Options</Label>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="showTabs"
                        checked={calendarConfig.showTabs !== false}
                        onCheckedChange={(checked) => 
                          updateCalendarConfig({ showTabs: checked })
                        }
                      />
                      <Label htmlFor="showTabs">Show Tab Navigation</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="showTimezone"
                        checked={calendarConfig.showTimezone !== false}
                        onCheckedChange={(checked) => 
                          updateCalendarConfig({ showTimezone: checked })
                        }
                      />
                      <Label htmlFor="showTimezone">Show Timezone Selector</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="showFlags"
                        checked={calendarConfig.showFlags !== false}
                        onCheckedChange={(checked) => 
                          updateCalendarConfig({ showFlags: checked })
                        }
                      />
                      <Label htmlFor="showFlags">Show Country Flags</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="showSymbol"
                        checked={calendarConfig.showSymbol !== false}
                        onCheckedChange={(checked) => 
                          updateCalendarConfig({ showSymbol: checked })
                        }
                      />
                      <Label htmlFor="showSymbol">Show Currency Symbol</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="scrollToEarliestEvent"
                        checked={calendarConfig.scrollToEarliestEvent === true}
                        onCheckedChange={(checked) => 
                          updateCalendarConfig({ scrollToEarliestEvent: checked })
                        }
                      />
                      <Label htmlFor="scrollToEarliestEvent">Auto-scroll to Upcoming Events</Label>
                    </div>
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
          onClick={resetCalendarConfig}
          className="mr-2"
        >
          Reset to Defaults
        </Button>
        <Button onClick={() => {
          // Close the dialog
          const closeEvent = new CustomEvent('calendar-config-updated');
          window.dispatchEvent(closeEvent);
          
          // Return to any parent dialogs that might be open
          return false;
        }}>Apply Changes</Button>
      </div>
    </div>
  );
};

export default CalendarConfig;