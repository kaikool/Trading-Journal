import React from 'react';
import { useFormContext } from "react-hook-form";
import { FormField, FormItem, FormControl, FormMessage } from "@/components/ui/form";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { NumberInput } from '@/components/ui/number-input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons/icons';
import { GetPriceButton } from '../../GetPriceButton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { cn, formatCurrency } from '@/lib/utils';
import { useNumberInput } from "@/hooks/use-number-input";
import { TradeFormValues } from '../types';
import { ChangeEvent } from 'react';

interface TradeDetailsProps {
  isCalculatingLotSize: boolean;
  isCalculatingTakeProfit: boolean;
  accountBalance: number;
  riskPercentage: number;
  setRiskPercentage: (value: number) => void;
  canFetchPrice: boolean;
  isEditMode: boolean;
  calculateOptimalLotSize: () => void;
  calculateOptimalTakeProfit: () => void;
  riskRewardRatio: number;
}

export function TradeDetails({
  isCalculatingLotSize,
  isCalculatingTakeProfit,
  accountBalance,
  riskPercentage,
  setRiskPercentage,
  canFetchPrice,
  isEditMode,
  calculateOptimalLotSize,
  calculateOptimalTakeProfit,
  riskRewardRatio
}: TradeDetailsProps) {
  const form = useFormContext<TradeFormValues>();
  
  // For risk percentage input
  const { 
    value: riskValue, 
    onChange: onRiskChange 
  } = useNumberInput({
    initial: riskPercentage,
    min: 0.1,
    max: 5,
    step: 0.1,
    onChange: (value) => {
      setRiskPercentage(value);
    }
  });
  
  // Format risk:reward ratio
  const formattedRatio = riskRewardRatio ? `${riskRewardRatio.toFixed(2)}:1` : "0:1";
  
  // Get entry date from form
  const entryDate = form.watch("entryDate");

  // Get pair from form for price button
  const selectedPair = form.watch("pair");
  
  return (
    <div className="space-y-4">
      {/* Force two-column layout on all devices */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-4">
        {/* Column 1 */}
        <div className="space-y-4">
          {/* Currency Pair */}
          <FormField
            control={form.control}
            name="pair"
            render={({ field }) => (
              <FormItem>
                <div className="flex justify-between items-center mb-1.5">
                  <Label htmlFor="pair" className="font-medium text-sm">Currency Pair</Label>
                </div>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger id="pair" className="h-9">
                      <SelectValue placeholder="Select pair" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="EURUSD">EUR/USD</SelectItem>
                    <SelectItem value="GBPUSD">GBP/USD</SelectItem>
                    <SelectItem value="USDJPY">USD/JPY</SelectItem>
                    <SelectItem value="AUDUSD">AUD/USD</SelectItem>
                    <SelectItem value="USDCAD">USD/CAD</SelectItem>
                    <SelectItem value="NZDUSD">NZD/USD</SelectItem>
                    <SelectItem value="EURGBP">EUR/GBP</SelectItem>
                    <SelectItem value="USDCHF">USD/CHF</SelectItem>
                    <SelectItem value="XAUUSD">XAU/USD (Gold)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Entry Price with GetPrice button */}
          <FormField
            control={form.control}
            name="entryPrice"
            render={({ field }) => (
              <FormItem>
                <div className="flex justify-between items-center mb-1.5">
                  <Label htmlFor="entryPrice" className="font-medium text-sm">Entry Price</Label>
                  {canFetchPrice && selectedPair && (
                    <GetPriceButton
                      symbol={selectedPair}
                      size="sm"
                      onPriceReceived={(price) => {
                        form.setValue("entryPrice", price);
                        form.trigger("entryPrice");
                      }}
                      tooltipText={`Get current ${selectedPair} price`}
                    />
                  )}
                </div>
                <FormControl>
                  <NumberInput
                    id="entryPrice"
                    placeholder="0.00000"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    min={0}
                    step={0.00001}
                    className="h-9"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Stop Loss */}
          <FormField
            control={form.control}
            name="stopLoss"
            render={({ field }) => (
              <FormItem>
                <div className="flex justify-between items-center mb-1.5">
                  <Label htmlFor="stopLoss" className="font-medium text-sm">Stop Loss</Label>
                </div>
                <FormControl>
                  <NumberInput
                    id="stopLoss"
                    placeholder="0.00000"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    min={0}
                    step={0.00001}
                    className="h-9"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Lot Size with Risk Calculator */}
          <div>
            <FormField
              control={form.control}
              name="lotSize"
              render={({ field }) => (
                <FormItem>
                  <div className="flex justify-between items-center mb-1.5">
                    <Label htmlFor="lotSize" className="font-medium text-sm">Lot Size</Label>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-6 text-xs gap-1"
                      onClick={calculateOptimalLotSize}
                      disabled={isCalculatingLotSize}
                    >
                      {isCalculatingLotSize ? (
                        <Icons.ui.spinner className="h-3 w-3 animate-spin" />
                      ) : (
                        <Icons.analytics.percent className="h-3 w-3" />
                      )}
                      <span>Calculate</span>
                    </Button>
                  </div>
                  <FormControl>
                    <NumberInput
                      id="lotSize"
                      placeholder="0.01"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      min={0.01}
                      step={0.01}
                      className="h-9"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Risk Slider - displayed under lot size */}
            <div className="mt-2 rounded-md border border-border p-2.5 bg-muted/20">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium">Risk:</span>
                <Badge 
                  variant="outline" 
                  className={cn(
                    "font-mono text-xs h-5 px-1.5",
                    Number(riskValue) <= 1 ? "bg-green-50 text-green-600 border-green-200" : 
                    Number(riskValue) <= 2 ? "bg-amber-50 text-amber-600 border-amber-200" :
                    "bg-red-50 text-red-600 border-red-200"
                  )}
                >
                  {riskValue}%
                </Badge>
              </div>
              <Slider
                value={[Number(riskValue)]}
                min={0.1}
                max={5}
                step={0.1}
                onValueChange={(values) => {
                  const newValue = values[0];
                  setRiskPercentage(newValue);
                }}
                className="mb-1"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
                <span>Conservative</span>
                <span>Moderate</span>
                <span>Aggressive</span>
              </div>
            </div>

            {/* Account Balance */}
            <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
              <span className="font-medium">Balance:</span>
              <span>
                {formatCurrency(accountBalance)}
              </span>
              <span className="mx-1">•</span>
              <span className="font-medium">Risk Amount:</span>
              <span className={cn(
                Number(riskValue) <= 1 ? "text-green-600" : 
                Number(riskValue) <= 2 ? "text-amber-600" :
                "text-red-600"
              )}>
                {formatCurrency(accountBalance * (Number(riskValue) / 100))}
              </span>
            </div>
          </div>
        </div>

        {/* Column 2 */}
        <div className="space-y-4">
          {/* Direction */}
          <FormField
            control={form.control}
            name="direction"
            render={({ field }) => (
              <FormItem>
                <div className="flex justify-between items-center mb-1.5">
                  <Label htmlFor="direction" className="font-medium text-sm">Direction</Label>
                </div>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger 
                      id="direction" 
                      className={cn(
                        "h-9", 
                        field.value === "BUY" ? "text-green-600" : 
                        field.value === "SELL" ? "text-red-600" : ""
                      )}
                    >
                      <SelectValue placeholder="Select direction" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="BUY" className="text-green-600">Buy (Long)</SelectItem>
                    <SelectItem value="SELL" className="text-red-600">Sell (Short)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Entry Date */}
          <FormField
            control={form.control}
            name="entryDate"
            render={({ field }) => (
              <FormItem>
                <div className="flex justify-between items-center mb-1.5">
                  <Label htmlFor="entryDate" className="font-medium text-sm">Entry Date</Label>
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "h-9 w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          <span>
                            {format(new Date(field.value), "MMM d, yyyy")}
                          </span>
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <Icons.general.calendar className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={field.value ? new Date(field.value) : undefined}
                      onSelect={(day) => {
                        if (day) {
                          field.onChange(format(day, "yyyy-MM-dd"));
                        }
                      }}
                      disabled={(date) => date > new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Take Profit */}
          <FormField
            control={form.control}
            name="takeProfit"
            render={({ field }) => (
              <FormItem>
                <div className="flex justify-between items-center mb-1.5">
                  <Label htmlFor="takeProfit" className="font-medium text-sm">Take Profit</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-6 text-xs gap-1"
                    onClick={calculateOptimalTakeProfit}
                    disabled={isCalculatingTakeProfit}
                  >
                    {isCalculatingTakeProfit ? (
                      <Icons.ui.spinner className="h-3 w-3 animate-spin" />
                    ) : (
                      <Icons.analytics.percent className="h-3 w-3" />
                    )}
                    <span>Calculate R:R</span>
                  </Button>
                </div>
                <FormControl>
                  <NumberInput
                    id="takeProfit"
                    placeholder="0.00000"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    min={0}
                    step={0.00001}
                    className="h-9"
                  />
                </FormControl>
                {/* Risk:Reward status */}
                {riskRewardRatio > 0 && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium">Risk:Reward Ratio</span>
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "font-mono text-xs h-5 px-1.5",
                          riskRewardRatio >= 2 ? "bg-green-50 text-green-600 border-green-200" : 
                          riskRewardRatio >= 1 ? "bg-amber-50 text-amber-600 border-amber-200" :
                          "bg-red-50 text-red-600 border-red-200"
                        )}
                      >
                        {formattedRatio}
                      </Badge>
                    </div>
                    {/* Progress bar showing the R:R visually */}
                    <div className="mt-1.5 h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full rounded-full",
                          riskRewardRatio >= 2 ? "bg-green-500" : 
                          riskRewardRatio >= 1 ? "bg-amber-500" : 
                          "bg-red-500"
                        )}
                        style={{ width: `${Math.min(riskRewardRatio * 33, 100)}%` }} 
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
                      <span>1:1</span>
                      <span>2:1</span>
                      <span>3:1</span>
                    </div>
                  </div>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  );
}