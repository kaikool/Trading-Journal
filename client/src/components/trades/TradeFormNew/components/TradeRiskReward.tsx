import React from 'react';
import { useFormContext } from "react-hook-form";
import { FormField, FormItem, FormControl, FormMessage } from "@/components/ui/form";
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { cn, formatCurrency } from '@/lib/utils';
import { useNumberInput } from "@/hooks/use-number-input";
import { TradeFormValues } from '../types';
import { motion } from 'framer-motion';

/**
 * TradeRiskReward Component
 * 
 * REFACTORED: Extracted from TradeDetails to create proper layout hierarchy
 * Contains risk parameters and calculation results
 */

interface TradeRiskRewardProps {
  accountBalance: number;
  riskPercentage: number;
  setRiskPercentage: (value: number) => void;
  riskRewardRatio: number;
}

export function TradeRiskReward({
  accountBalance,
  riskPercentage,
  setRiskPercentage,
  riskRewardRatio
}: TradeRiskRewardProps) {
  const form = useFormContext<TradeFormValues>();
  
  // Format risk:reward ratio
  const formattedRatio = riskRewardRatio ? `${riskRewardRatio.toFixed(2)}:1` : "0:1";
  
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        {/* Left Column - Risk Parameters */}
        <div className="space-y-4">
          <div className="rounded-md border border-border/50 bg-muted/10 p-4 shadow-sm">
            <div className="h-6 flex items-center justify-between">
              <Label className="text-sm font-medium">Risk % Per Trade</Label>
              <span className="text-sm text-muted-foreground">{riskValue}%</span>
            </div>
            
            <div className="flex items-center gap-2 mt-4 mb-1">
              <Slider
                value={[riskValue]}
                min={0.1}
                max={5}
                step={0.1}
                onValueChange={(values) => {
                  setRiskPercentage(values[0]);
                }}
                className="flex-1"
              />
            </div>
            
            <div className="flex text-xs text-muted-foreground justify-between mt-1">
              <span>0.1%</span>
              <span>1%</span>
              <span>2%</span>
              <span>5%</span>
            </div>
            
            <div className="mt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Account Balance:</span>
                <span className="font-medium">{formatCurrency(accountBalance)}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Risk Amount:</span>
                <span className={cn(
                  "font-medium",
                  riskValue > 2 ? "text-red-500" : 
                  riskValue > 1 ? "text-amber-500" : 
                  "text-green-500"
                )}>
                  {formatCurrency(accountBalance * (riskValue / 100))}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Column - Calculation Results */}
        <div className="flex flex-col">
          <div className="rounded-md border border-border/50 bg-muted/10 p-4 shadow-sm">
            {/* Pips at Risk */}
            <div className="flex justify-between text-sm mb-3">
              <span className="text-muted-foreground">Pips at Risk:</span>
              <span className="font-medium">
                {form.watch("entryPrice") && form.watch("stopLoss") ? 
                  Math.abs(Number(form.watch("entryPrice")) - Number(form.watch("stopLoss"))).toFixed(5) : 
                  "0.00000"}
              </span>
            </div>
            
            {/* Potential Profit */}
            <div className="flex justify-between text-sm mb-3">
              <span className="text-muted-foreground">Potential Profit:</span>
              <span className="font-medium text-green-500">
                {form.watch("entryPrice") && form.watch("takeProfit") ? 
                  Math.abs(Number(form.watch("entryPrice")) - Number(form.watch("takeProfit"))).toFixed(5) : 
                  "0.00000"}
              </span>
            </div>
            
            {/* Risk to Reward */}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Risk/Reward Ratio:</span>
              <span className={cn(
                "font-medium",
                riskRewardRatio >= 2 ? "text-green-500" : 
                riskRewardRatio >= 1 ? "text-amber-500" : 
                "text-red-500"
              )}>
                {formattedRatio}
              </span>
            </div>
            
            {/* Potential Gain */}
            <div className="flex justify-between text-sm mt-3 pt-3 border-t border-muted/30">
              <span className="text-muted-foreground">Potential Gain:</span>
              <span className="font-medium text-green-500">
                {formatCurrency(accountBalance * (riskValue / 100) * riskRewardRatio)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
