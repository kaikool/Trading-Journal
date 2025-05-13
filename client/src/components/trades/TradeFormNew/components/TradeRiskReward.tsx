import React, { useEffect } from 'react';
import { useFormContext } from "react-hook-form";
import { FormField, FormItem, FormControl, FormMessage } from "@/components/ui/form";
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { cn, formatCurrency } from '@/lib/utils';
import { useNumberInput } from "@/hooks/use-number-input";
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
  const riskAmount = accountBalance * (Number(riskValue) / 100);
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

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={containerAnimation}
      className="space-y-4"
    >
      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
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
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm">Risk per Trade</Label>
                <Badge 
                  variant="outline" 
                  className={cn("font-medium", getRiskColor(Number(riskValue)))}
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
                  onRiskChange(values[0].toString());
                }}
                className="my-3"
              />
              
              <div className="flex text-xs text-muted-foreground justify-between mt-1 px-1">
                <span>0.1%</span>
                <span>1%</span>
                <span>2%</span>
                <span>5%</span>
              </div>
            </div>
            
            <div className="pt-1">
              <div className="flex items-center gap-2 text-sm mb-2">
                <Icons.analytics.dollar className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">Risk Amount</span>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="w-full h-8 bg-muted/50 rounded-md flex items-center px-3">
                  <span className={cn("text-sm font-medium", getRiskColor(Number(riskValue)))}>
                    {formatCurrency(riskAmount)}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right column - Calculations (7 cols on md) */}
          <div className="md:col-span-7 flex flex-col justify-between">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Pips at Risk */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Icons.general.target className="h-3.5 w-3.5 text-muted-foreground" />
                  <Label className="text-xs text-muted-foreground">Pips at Risk</Label>
                </div>
                <div className="h-8 bg-muted/50 rounded-md flex items-center px-3">
                  <span className="text-sm font-medium">{pipsAtRisk}</span>
                </div>
              </div>
              
              {/* Potential Profit Pips */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Icons.analytics.trendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                  <Label className="text-xs text-muted-foreground">Potential Profit</Label>
                </div>
                <div className="h-8 bg-muted/50 rounded-md flex items-center px-3">
                  <span className="text-sm font-medium text-emerald-500">{potentialProfitPips}</span>
                </div>
              </div>
            </div>
            
            {/* Risk:Reward and potential gain */}
            <div className="mt-4 space-y-3">
              {/* Risk:Reward with visual indicator */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Icons.ui.scale className="h-3.5 w-3.5 text-muted-foreground" />
                    <Label className="text-xs text-muted-foreground">Risk:Reward Ratio</Label>
                  </div>
                  <span className={cn("text-sm font-medium", getRRColor(riskRewardRatio))}>
                    {formattedRatio}
                  </span>
                </div>
                <Progress value={rrProgressValue} className="h-2" />
              </div>
              
              {/* Potential Gain */}
              <div className="bg-muted/50 rounded-md flex items-center justify-between p-3">
                <div className="flex items-center gap-1.5">
                  <Icons.analytics.trendingUp className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Potential Gain</span>
                </div>
                <span className="text-sm font-medium text-emerald-500">{formatCurrency(potentialGain)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
