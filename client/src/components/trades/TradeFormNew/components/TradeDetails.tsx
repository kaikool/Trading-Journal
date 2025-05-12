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
  
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold tracking-tight">Trade Details</h3>
      
      {/* Currency Pair */}
      <div className="space-y-2">
        <div className="flex justify-between mb-1.5">
          <Label htmlFor="pair" className="font-medium">Currency Pair</Label>
        </div>
        <FormField
          control={form.control}
          name="pair"
          render={({ field }) => (
            <FormItem>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger id="pair">
                    <SelectValue placeholder="Select currency pair" />
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
      </div>
      
      {/* Direction */}
      <div className="space-y-2">
        <div className="flex justify-between mb-1.5">
          <Label htmlFor="direction" className="font-medium">Direction</Label>
        </div>
        <FormField
          control={form.control}
          name="direction"
          render={({ field }) => (
            <FormItem>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger id="direction">
                    <SelectValue placeholder="Select direction" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="BUY">Buy (Long)</SelectItem>
                  <SelectItem value="SELL">Sell (Short)</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      
      {/* Entry Date */}
      <div className="space-y-2">
        <div className="flex justify-between mb-1.5">
          <Label htmlFor="entryDate" className="font-medium">Entry Date</Label>
        </div>
        <FormField
          control={form.control}
          name="entryDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        <span>
                          {format(new Date(field.value), "MMMM d, yyyy")}
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
      </div>
      
      {/* Entry Price */}
      <div className="space-y-2">
        <div className="flex justify-between mb-1.5 items-center">
          <Label htmlFor="entryPrice" className="font-medium">Entry Price</Label>
          {canFetchPrice && (
            <GetPriceButton
              symbol={form.watch("pair")}
              onPriceReceived={(price) => {
                form.setValue("entryPrice", price);
                form.trigger("entryPrice");
              }}
            />
          )}
        </div>
        <FormField
          control={form.control}
          name="entryPrice"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <NumberInput
                  id="entryPrice"
                  placeholder="0.00000"
                  value={field.value}
                  onValueChange={field.onChange}
                  onBlur={field.onBlur}
                  min={0}
                  step="0.00001"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      
      {/* Stop Loss */}
      <div className="space-y-2">
        <div className="flex justify-between mb-1.5">
          <Label htmlFor="stopLoss" className="font-medium">Stop Loss</Label>
        </div>
        <FormField
          control={form.control}
          name="stopLoss"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <NumberInput
                  id="stopLoss"
                  placeholder="0.00000"
                  value={field.value}
                  onValueChange={field.onChange}
                  onBlur={field.onBlur}
                  min={0}
                  step="0.00001"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      
      {/* Take Profit */}
      <div className="space-y-2">
        <div className="flex justify-between mb-1.5 items-center">
          <Label htmlFor="takeProfit" className="font-medium">Take Profit</Label>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1 flex items-center"
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
        <FormField
          control={form.control}
          name="takeProfit"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <NumberInput
                  id="takeProfit"
                  placeholder="0.00000"
                  value={field.value}
                  onValueChange={field.onChange}
                  onBlur={field.onBlur}
                  min={0}
                  step="0.00001"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Show risk:reward ratio */}
        {riskRewardRatio > 0 && (
          <div className="pt-1 text-xs text-muted-foreground flex items-center">
            <span className="mr-1">Risk:Reward Ratio:</span>
            <span className={cn(
              "font-medium",
              riskRewardRatio >= 1 ? "text-green-500" : "text-red-500"
            )}>
              {formattedRatio}
            </span>
          </div>
        )}
      </div>
      
      {/* Lot Size with risk calculator */}
      <div className="space-y-2">
        <div className="flex justify-between mb-1.5 items-center">
          <Label htmlFor="lotSize" className="font-medium">Lot Size</Label>
          
          <div className="flex gap-2 items-center">
            <div className="flex flex-col gap-1 w-32">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Risk:</span>
                <Badge 
                  variant="outline" 
                  className={cn(
                    "font-mono text-xs h-5 px-1.5",
                    riskValue <= 1 ? "bg-green-50 text-green-600 border-green-200" : 
                    riskValue <= 2 ? "bg-amber-50 text-amber-600 border-amber-200" :
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
                className="py-0.5"
              />
            </div>
            
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1 flex items-center"
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
        </div>
        
        <FormField
          control={form.control}
          name="lotSize"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <NumberInput
                  id="lotSize"
                  placeholder="0.01"
                  value={field.value}
                  onValueChange={field.onChange}
                  onBlur={field.onBlur}
                  min={0.01}
                  step={0.01}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Show account balance */}
        <div className="pt-1 text-xs text-muted-foreground flex items-center gap-1">
          <span>Account Balance:</span>
          <span className="font-medium">
            {formatCurrency(accountBalance)}
          </span>
        </div>
      </div>
    </div>
  );
}