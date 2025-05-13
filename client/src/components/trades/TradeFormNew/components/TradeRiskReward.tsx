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
  
  // Tính toán pips và potential profit
  const pipsAtRisk = form.watch("entryPrice") && form.watch("stopLoss") 
    ? Math.abs(Number(form.watch("entryPrice")) - Number(form.watch("stopLoss"))).toFixed(5)
    : "0.00000";
    
  const potentialProfitPips = form.watch("entryPrice") && form.watch("takeProfit")
    ? Math.abs(Number(form.watch("entryPrice")) - Number(form.watch("takeProfit"))).toFixed(5)
    : "0.00000";

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
                <Label className="text-sm font-medium bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">Risk per Trade</Label>
                <div className="flex items-center gap-1.5 bg-gradient-to-r from-background to-muted rounded-full px-3 py-1 shadow-sm">
                  <span className={cn("text-sm font-semibold", getRiskColor(riskPercentage))}>
                    {riskPercentage.toFixed(1)}%
                  </span>
                  <div className={cn("w-2 h-2 rounded-full", 
                    riskPercentage > 2 ? "bg-red-500" : 
                    riskPercentage > 1 ? "bg-amber-500" : 
                    "bg-emerald-500")} 
                  />
                </div>
              </div>
              
              <div className="pt-1 pb-4">
                {/* Background color indicator bar */}
                <div className="h-1.5 w-full mt-5 mb-2 rounded-full overflow-hidden bg-muted">
                  <div className="h-full w-full bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500" />
                </div>
                
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
                
                <div className="flex justify-between mt-2 px-1">
                  <div className="text-xs font-medium bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-md">0.1%</div>
                  <div className="text-xs font-medium bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-md">1%</div>
                  <div className="text-xs font-medium bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-md">2%</div>
                  <div className="text-xs font-medium bg-red-500/10 text-red-500 px-2 py-0.5 rounded-md">5%</div>
                </div>
              </div>
            </div>
            
            <div className="mt-2 pt-3 border-t border-border/30">
              <div className="flex items-center gap-2 text-sm mb-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                  <Icons.analytics.dollar className="h-3.5 w-3.5 text-primary" />
                </div>
                <span className="text-sm font-medium">Risk Amount</span>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="w-full rounded-lg border shadow-sm overflow-hidden">
                  <div 
                    className={cn(
                      "h-10 flex items-center px-3 relative",
                      riskPercentage > 2 ? "bg-red-500/10" : 
                      riskPercentage > 1 ? "bg-amber-500/10" : 
                      "bg-emerald-500/10"
                    )}
                  >
                    {/* Progress bar showing risk level */}
                    <div 
                      className={cn(
                        "absolute top-0 left-0 bottom-0 opacity-10",
                        riskPercentage > 2 ? "bg-red-500" : 
                        riskPercentage > 1 ? "bg-amber-500" : 
                        "bg-emerald-500"
                      )}
                      style={{ width: `${Math.min(riskPercentage * 20, 100)}%` }}
                    />
                    
                    {/* Amount text */}
                    <span className={cn(
                      "text-sm font-medium relative z-10", 
                      getRiskColor(riskPercentage)
                    )}>
                      {formatCurrency(riskAmount)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right column - Calculations (7 cols on md) */}
          <div className="md:col-span-7 flex flex-col justify-between">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Enhanced Pips at Risk */}
              <motion.div 
                className="rounded-lg border overflow-hidden shadow-sm"
                whileHover={{ y: -2, boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)" }}
                transition={{ duration: 0.2 }}
              >
                <div className="px-3 py-2 bg-gradient-to-r from-primary/5 to-primary/10 border-b">
                  <div className="flex items-center gap-1.5">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10">
                      <Icons.general.target className="h-3 w-3 text-primary" />
                    </div>
                    <Label className="text-xs font-medium">Pips at Risk</Label>
                  </div>
                </div>
                <div className="p-3 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Entry to Stop Loss</span>
                  </div>
                  <span className="text-base font-medium">{pipsAtRisk}</span>
                </div>
              </motion.div>
              
              {/* Enhanced Potential Profit Pips */}
              <motion.div 
                className="rounded-lg border overflow-hidden shadow-sm"
                whileHover={{ y: -2, boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)" }}
                transition={{ duration: 0.2 }}
              >
                <div className="px-3 py-2 bg-gradient-to-r from-emerald-500/5 to-emerald-500/10 border-b">
                  <div className="flex items-center gap-1.5">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/10">
                      <Icons.analytics.trendingUp className="h-3 w-3 text-emerald-500" />
                    </div>
                    <Label className="text-xs font-medium">Potential Profit</Label>
                  </div>
                </div>
                <div className="p-3 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Entry to Take Profit</span>
                  </div>
                  <span className="text-base font-medium text-emerald-500">{potentialProfitPips}</span>
                </div>
              </motion.div>
            </div>
            
            {/* Risk:Reward and potential gain */}
            <div className="mt-4 space-y-3">
              {/* Risk:Reward with enhanced visual indicator */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10">
                      <Icons.ui.scale className="h-3 w-3 text-primary" />
                    </div>
                    <span className="text-sm font-medium">Risk:Reward Ratio</span>
                  </div>
                  <div className={cn(
                    "px-2.5 py-1 rounded-md text-sm font-semibold", 
                    riskRewardRatio >= 2 ? "bg-emerald-500/10 text-emerald-600" : 
                    riskRewardRatio >= 1 ? "bg-amber-500/10 text-amber-600" : 
                    "bg-red-500/10 text-red-500"
                  )}>
                    {formattedRatio}
                  </div>
                </div>
                
                <div className="relative my-3">
                  <div className="flex items-center justify-between mb-1 text-xs text-muted-foreground/80">
                    <span>Poor</span>
                    <span>Good</span>
                    <span>Excellent</span>
                  </div>
                  <div className="h-2 bg-gradient-to-r from-red-500 via-amber-500 to-emerald-500 rounded-full overflow-hidden relative">
                    <div className="absolute top-0 left-0 h-full w-full bg-gradient-to-r from-transparent to-white/10"></div>
                  </div>
                  <div 
                    className="absolute -bottom-2 transform -translate-x-1/2"
                    style={{ left: `${rrProgressValue}%` }}
                  >
                    <div className="h-5 w-5 rounded-full bg-white border-2 border-primary shadow-lg flex items-center justify-center">
                      <div className="h-2 w-2 rounded-full bg-primary"></div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Potential Gain with enhanced styling */}
              <div className="mt-3 border rounded-lg overflow-hidden shadow-sm">
                <div className="px-3 py-2 bg-gradient-to-r from-emerald-500/5 to-emerald-500/10 border-b">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/10">
                      <Icons.analytics.trendingUp className="h-3.5 w-3.5 text-emerald-500" />
                    </div>
                    <span className="text-sm font-medium">Potential Gain</span>
                  </div>
                </div>
                <div className="px-4 py-3 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Based on your risk settings</span>
                  <span className="text-lg font-semibold text-emerald-500">{formatCurrency(potentialGain)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
