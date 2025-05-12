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
import { 
  Card, 
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ChangeEvent } from 'react';
import { motion } from 'framer-motion';

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
  
  // Get direction from form
  const direction = form.watch("direction");
  
  // Animation variants
  const containerAnimation = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };
  
  const itemAnimation = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  };
  
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={containerAnimation}
      className="space-y-5"
    >
      {/* Entry Info Section - Modernized UI */}
      <Card className="rounded-lg border-border/50 shadow-sm overflow-hidden">
        <CardHeader className="bg-primary/5 py-3 px-4">
          <div className="flex items-center">
            <Icons.ui.arrowRightCircle className="h-4 w-4 text-primary mr-2" />
            <CardTitle className="text-sm font-medium">Entry Information</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            {/* Left Column */}
            <div className="space-y-4">
              {/* Currency Pair and Direction in one row */}
              <div className="grid grid-cols-2 gap-4">
                {/* Currency Pair */}
                <FormField
                  control={form.control}
                  name="pair"
                  render={({ field }) => (
                    <FormItem>
                      <Label htmlFor="pair" className="text-xs font-medium mb-1.5 block">
                        Currency Pair
                      </Label>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger id="pair" className="h-9 text-sm">
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

                {/* Direction */}
                <FormField
                  control={form.control}
                  name="direction"
                  render={({ field }) => (
                    <FormItem>
                      <Label htmlFor="direction" className="text-xs font-medium mb-1.5 block">
                        Direction
                      </Label>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger 
                            id="direction" 
                            className={cn(
                              "h-9 text-sm", 
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
              </div>

              {/* Entry Price with GetPrice button */}
              <FormField
                control={form.control}
                name="entryPrice"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex justify-between items-center mb-1.5">
                      <Label htmlFor="entryPrice" className="text-xs font-medium">
                        Entry Price
                      </Label>
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

              {/* Entry Date */}
              <FormField
                control={form.control}
                name="entryDate"
                render={({ field }) => (
                  <FormItem>
                    <Label htmlFor="entryDate" className="text-xs font-medium mb-1.5 block">
                      Entry Date
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "h-9 w-full pl-3 text-left font-normal text-sm",
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
            
            {/* Right Column */}
            <div className="space-y-4">
              {/* Stop Loss and Take Profit in one row */}
              <div className="grid grid-cols-2 gap-4">
                {/* Stop Loss */}
                <FormField
                  control={form.control}
                  name="stopLoss"
                  render={({ field }) => (
                    <FormItem>
                      <Label htmlFor="stopLoss" className="text-xs font-medium mb-1.5 block">
                        Stop Loss
                      </Label>
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

                {/* Take Profit */}
                <FormField
                  control={form.control}
                  name="takeProfit"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex justify-between items-center mb-1.5">
                        <Label htmlFor="takeProfit" className="text-xs font-medium">
                          Take Profit
                        </Label>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-5 text-xs gap-1 rounded-sm"
                          onClick={calculateOptimalTakeProfit}
                          disabled={isCalculatingTakeProfit}
                        >
                          {isCalculatingTakeProfit ? (
                            <Icons.ui.spinner className="h-3 w-3 animate-spin" />
                          ) : (
                            <span>R:R</span>
                          )}
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Risk/Reward Status Card - conditionally shown */}
              {riskRewardRatio > 0 && (
                <div className="rounded-md border border-border/50 bg-gradient-to-r from-muted/5 to-muted/20 p-3 shadow-sm">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center">
                      <span className="text-xs font-medium">Risk/Reward</span>
                    </div>
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
                  <div className="mt-1.5 h-2 w-full bg-muted/30 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(riskRewardRatio * 33, 100)}%` }}
                      transition={{ duration: 0.5 }}
                      className={cn(
                        "h-full rounded-full shadow-inner",
                        riskRewardRatio >= 2 ? "bg-gradient-to-r from-green-400 to-green-500" : 
                        riskRewardRatio >= 1 ? "bg-gradient-to-r from-amber-400 to-amber-500" : 
                        "bg-gradient-to-r from-red-400 to-red-500"
                      )}
                    />
                  </div>
                </div>
              )}

              {/* Lot Size */}
              <FormField
                control={form.control}
                name="lotSize"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex justify-between items-center mb-1.5">
                      <Label htmlFor="lotSize" className="text-xs font-medium">
                        Lot Size
                      </Label>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-5 text-xs gap-1 rounded-sm"
                        onClick={calculateOptimalLotSize}
                        disabled={isCalculatingLotSize}
                      >
                        {isCalculatingLotSize ? (
                          <Icons.ui.spinner className="h-3 w-3 animate-spin" />
                        ) : (
                          <span>Calculate</span>
                        )}
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
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk & Reward Section */}
      <Card className="rounded-lg border-border/50 shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/30 py-3 px-4">
          <div className="flex items-center">
            <Icons.analytics.trendingUp className="h-4 w-4 text-primary mr-2" />
            <CardTitle className="text-sm font-medium">Risk & Reward</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            {/* Left Column - Risk Parameters */}
            <div className="space-y-4">
              <div className="rounded-md border border-border/50 bg-muted/10 p-4 shadow-sm">
                <div className="flex items-center mb-3">
                  <h3 className="text-sm font-medium">Risk Parameters</h3>
                </div>
                
                <div className="space-y-4">
                  {/* Risk Slider with Risk Amount */}
                  <div className="rounded-md bg-muted/20 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium">Risk Percentage:</span>
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
                      className="mb-1.5"
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                      <span>Conservative</span>
                      <span>Moderate</span>
                      <span>Aggressive</span>
                    </div>
                  </div>
                  
                  {/* Account Balance */}
                  <div className="flex flex-col space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Account Balance:</span>
                      <span className="font-medium">{formatCurrency(accountBalance)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Risk Amount:</span>
                      <span className={cn(
                        "font-medium",
                        Number(riskValue) <= 1 ? "text-green-600" : 
                        Number(riskValue) <= 2 ? "text-amber-600" :
                        "text-red-600"
                      )}>
                        {formatCurrency(accountBalance * (Number(riskValue) / 100))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right Column - Reward Parameters */}
            <div className="space-y-4">
              <div className="rounded-md border border-border/50 bg-muted/10 p-4 shadow-sm">
                <div className="flex items-center mb-3">
                  <Icons.analytics.target className="h-4 w-4 text-green-500 mr-2" />
                  <h3 className="text-sm font-medium">Reward Calculation</h3>
                </div>
                
                {/* Risk:Reward Ratio */}
                {riskRewardRatio > 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Risk:Reward Ratio</span>
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
                    <div className="mt-1 h-2 w-full bg-muted rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(riskRewardRatio * 33, 100)}%` }}
                        transition={{ duration: 0.5 }}
                        className={cn(
                          "h-full rounded-full",
                          riskRewardRatio >= 2 ? "bg-green-500" : 
                          riskRewardRatio >= 1 ? "bg-amber-500" : 
                          "bg-red-500"
                        )}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                      <span>1:1</span>
                      <span>2:1</span>
                      <span>3:1</span>
                    </div>
                    
                    <div className="rounded-md bg-muted/30 p-3 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Potential Profit:</span>
                        <span className="font-medium text-green-600">
                          {formatCurrency(accountBalance * (Number(riskValue) / 100) * riskRewardRatio)}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-4 text-xs text-muted-foreground">
                    <p>Enter Stop Loss and Take Profit values to calculate R:R ratio</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}