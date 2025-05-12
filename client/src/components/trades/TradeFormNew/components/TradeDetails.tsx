import React from 'react';
import { useFormContext } from "react-hook-form";
import { FormField, FormItem, FormControl, FormMessage } from "@/components/ui/form";
import { Label } from '@/components/ui/label';
import { NumberInput } from '@/components/ui/number-input';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons/icons';
import { GetPriceButton } from '../../GetPriceButton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { TradeFormValues } from '../types';
import { motion } from 'framer-motion';

/**
 * TradeDetails Component
 * 
 * REFACTORED: Now only contains the entry details section
 * Other sections were moved to separate components to follow proper layout structure
 */

interface TradeDetailsProps {
  isCalculatingLotSize: boolean;
  isCalculatingTakeProfit: boolean;
  canFetchPrice: boolean;
  calculateOptimalLotSize: () => void;
  calculateOptimalTakeProfit: () => void;
  riskRewardRatio: number;
}

export function TradeDetails({
  isCalculatingLotSize,
  isCalculatingTakeProfit,
  canFetchPrice,
  calculateOptimalLotSize,
  calculateOptimalTakeProfit,
  riskRewardRatio
}: TradeDetailsProps) {
  const form = useFormContext<TradeFormValues>();
  
  // Get pair from form for price button
  const selectedPair = form.watch("pair");
  
  // Format risk:reward ratio for display
  const formattedRatio = riskRewardRatio ? `${riskRewardRatio.toFixed(2)}:1` : "0:1";
  
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
      className="space-y-4"
    >
      {/* Entry Details Only */}
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
                  <div className="h-6 flex items-center">
                    <Label htmlFor="pair" className="text-sm font-medium">
                      Currency Pair
                    </Label>
                  </div>
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
                  <div className="h-6 flex items-center">
                    <Label htmlFor="direction" className="text-sm font-medium">
                      Direction
                    </Label>
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
                <div className="h-6 flex items-center justify-between">
                  <Label htmlFor="entryPrice" className="text-sm font-medium">
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
                  <div className="h-6 flex items-center">
                    <Label htmlFor="stopLoss" className="text-sm font-medium">
                      Stop Loss
                    </Label>
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

            {/* Take Profit */}
            <FormField
              control={form.control}
              name="takeProfit"
              render={({ field }) => (
                <FormItem>
                  <div className="h-6 flex items-center justify-between">
                    <Label htmlFor="takeProfit" className="text-sm font-medium">
                      Take Profit
                    </Label>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-6 text-sm gap-1 rounded-sm"
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
                  <span className="text-sm font-medium">Risk/Reward</span>
                </div>
                <Badge 
                  variant="outline" 
                  className={cn(
                    "font-mono text-sm h-6 px-2",
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
                <div className="h-6 flex items-center justify-between">
                  <Label htmlFor="lotSize" className="text-sm font-medium">
                    Lot Size
                  </Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-6 text-sm gap-1 rounded-sm"
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
    </motion.div>
  );
}
