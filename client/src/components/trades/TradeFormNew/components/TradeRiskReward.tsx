import React, { useEffect, useState } from 'react';
import { useFormContext } from "react-hook-form";
import { FormField, FormItem, FormControl, FormMessage } from "@/components/ui/form";
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { cn, formatCurrency } from '@/lib/utils';
import { TradeFormValues } from '../types';
import { motion } from 'framer-motion';
import { Icons } from '@/components/icons/icons';
import { Progress } from '@/components/ui/progress';
import { formatPrice, CurrencyPair } from '@/lib/forex-calculator';

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
  
  // Tính toán màu sắc dựa trên risk percentage
  const getRiskColor = (value: number) => {
    if (value > 2) return "text-red-500";
    if (value > 1) return "text-amber-500";
    return "text-emerald-500";
  };

  // Tính toán màu sắc dựa trên risk/reward ratio
  const getRRColor = (value: number) => {
    if (value >= 2) return "text-emerald-500";
    if (value >= 1) return "text-amber-500";
    return "text-red-500";
  };

  // Tính toán giá trị risk amount và potential gain
  const riskAmount = accountBalance * (riskPercentage / 100);
  const potentialGain = riskAmount * riskRewardRatio;
  
  // Lấy cặp tiền tệ từ form
  const currencyPair = form.watch("pair") as CurrencyPair || "EURUSD";
  
  // Tính toán pips và potential profit - sử dụng formatPrice để hiển thị đúng số thập phân
  const pipsAtRisk = form.watch("entryPrice") && form.watch("stopLoss") 
    ? Math.abs(Number(form.watch("entryPrice")) - Number(form.watch("stopLoss")))
    : 0;
    
  const potentialProfitPips = form.watch("entryPrice") && form.watch("takeProfit")
    ? Math.abs(Number(form.watch("entryPrice")) - Number(form.watch("takeProfit")))
    : 0;
    
  // Format giá trị pip dựa trên loại cặp tiền
  const formattedPipsAtRisk = formatPrice(pipsAtRisk, currencyPair);
  const formattedPotentialPips = formatPrice(potentialProfitPips, currencyPair);

  // Progress value cho risk/reward visual
  const rrProgressValue = Math.min(riskRewardRatio * 33, 100); // Scale to fit within visual

  // Define more detailed animations
  const cardAnimation = {
    hidden: { opacity: 0, y: 20 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: { 
        type: "spring",
        stiffness: 300,
        damping: 20
      }
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={containerAnimation}
      className="space-y-4"
    >
      <motion.div 
        className="rounded-lg border bg-card shadow-sm overflow-hidden"
        variants={cardAnimation}
      >
        {/* Header section */}
        <div className="border-b px-4 py-3 flex items-center justify-between bg-muted/30">
          <div className="flex items-center gap-1.5">
            <Icons.analytics.chartLine className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium">Risk Management</h3>
          </div>
          <Badge variant="outline" className="text-xs font-normal">
            Balance: {formatCurrency(accountBalance)}
          </Badge>
        </div>
        
        {/* Risk slider and calculations */}
        <div className="p-4 grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left column - Risk Slider (5 cols on md) */}
          <div className="md:col-span-5 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-medium">Risk per Trade</Label>
                <span className={cn("text-sm font-semibold", getRiskColor(riskPercentage))}>
                  {riskPercentage.toFixed(1)}%
                </span>
              </div>
              
              <div className="pt-1 pb-2">
                <Slider
                  value={[riskPercentage]}
                  min={0.1}
                  max={5}
                  step={0.1}
                  onValueChange={(values) => {
                    setRiskPercentage(values[0]);
                  }}
                  className="my-2"
                />
                
                <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                  <span>0.1%</span>
                  <span>1%</span>
                  <span>2%</span>
                  <span>5%</span>
                </div>
              </div>
            </div>
            
            <div className="mt-2 pt-3 border-t border-border/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm">Risk Amount</span>
                <span className={cn("text-sm font-medium", getRiskColor(riskPercentage))}>
                  {formatCurrency(riskAmount)}
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div 
                  className={cn(
                    "h-full", 
                    riskPercentage > 2 ? "bg-red-500" : 
                    riskPercentage > 1 ? "bg-amber-500" : 
                    "bg-emerald-500"
                  )}
                  style={{ width: `${Math.min(riskPercentage * 20, 100)}%` }}
                />
              </div>
            </div>
          </div>
          
          {/* Right column - Calculations (7 cols on md) */}
          <div className="md:col-span-7 flex flex-col justify-between">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Simplified Pips at Risk */}
              <div className="rounded-lg border p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm">Pips at Risk</span>
                  <span className="text-sm font-medium">{formattedPipsAtRisk}</span>
                </div>
                <div className="text-xs text-muted-foreground">Entry to Stop Loss</div>
              </div>
              
              {/* Simplified Potential Profit Pips */}
              <div className="rounded-lg border p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm">Potential Profit</span>
                  <span className="text-sm font-medium text-emerald-500">{formattedPotentialPips}</span>
                </div>
                <div className="text-xs text-muted-foreground">Entry to Take Profit</div>
              </div>
            </div>
            
            {/* Risk:Reward and potential gain */}
            <div className="mt-4 space-y-3">
              {/* Simplified Risk:Reward */}
              <div className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Risk:Reward Ratio</span>
                  <span className={cn(
                    "text-sm font-medium", 
                    getRRColor(riskRewardRatio)
                  )}>
                    {formattedRatio}
                  </span>
                </div>
                
                <div className="relative pt-3 pb-4">
                  <div className="h-1.5 bg-gradient-to-r from-red-500 via-amber-500 to-emerald-500 rounded-full" />
                  <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                    <span>Poor</span>
                    <span>Good</span>
                    <span>Excellent</span>
                  </div>
                  <div 
                    className="absolute top-3 w-1 h-3 bg-white border border-primary"
                    style={{ left: `calc(${rrProgressValue}% - 2px)` }}
                  />
                </div>
              </div>
              
              {/* Simplified Potential Gain */}
              <div className="mt-3 border rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm">Potential Gain</span>
                  <span className="text-sm font-medium text-emerald-500">{formatCurrency(potentialGain)}</span>
                </div>
                <div className="text-xs text-muted-foreground">Based on your risk settings</div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
