import React from 'react';
import { useFormContext } from "react-hook-form";
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { cn, formatCurrency } from '@/lib/utils';
import { TradeFormValues } from '../types';
import { Icons } from '@/components/icons/icons';
import { CurrencyPair, PIP_SIZE } from '@/lib/forex-calculator';

/**
 * TradeRiskReward Component - Tối giản hóa
 * 
 * Phiên bản gọn gàng, tối giản hơn của component quản lý risk:reward
 * Loại bỏ các animations và hiển thị lặp lại không cần thiết
 */

interface TradeRiskRewardProps {
  accountBalance: number;
  riskPercentage: number;
  setRiskPercentage: (value: number) => void;
  riskRewardRatio: number;
  setRiskRewardRatio?: (value: number) => void;
}

export function TradeRiskReward({
  accountBalance,
  riskPercentage,
  setRiskPercentage,
  riskRewardRatio
}: TradeRiskRewardProps) {
  const form = useFormContext<TradeFormValues>();
  
  // Màu sắc theo risk và ratio
  const getRiskColor = (value: number) => {
    if (value > 2) return "text-red-500";
    if (value > 1) return "text-amber-500";
    return "text-emerald-500";
  };

  // Màu sắc cho Risk:Reward (giờ là 1:X thay vì X:1)
  const getRRColor = (value: number) => {
    if (value >= 2) return "text-emerald-500";
    if (value >= 1) return "text-amber-500";
    return "text-red-500";
  };

  // Các giá trị cần thiết
  const riskAmount = accountBalance * (riskPercentage / 100);
  
  // Xác định cặp tiền tệ và tính pips
  const currencyPair = form.watch("pair") as CurrencyPair || "EURUSD";
  const entryPrice = Number(form.watch("entryPrice") || 0);
  const stopLoss = Number(form.watch("stopLoss") || 0);
  const takeProfit = Number(form.watch("takeProfit") || 0);
  
  // Tính pips - chỉ tính khi có đủ giá trị
  const pipsAtRisk = (entryPrice && stopLoss) 
    ? Math.abs(entryPrice - stopLoss) / PIP_SIZE[currencyPair]
    : 0;
    
  const potentialProfitPips = (entryPrice && takeProfit)
    ? Math.abs(entryPrice - takeProfit) / PIP_SIZE[currencyPair]
    : 0;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        {/* Header đơn giản */}
        <div className="border-b px-4 py-3 flex items-center justify-between bg-muted/30">
          <div className="flex items-center gap-1.5">
            <Icons.analytics.chartLine className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium">Risk Management</h3>
          </div>
          <Badge variant="outline" className="text-xs font-normal">
            Balance: {formatCurrency(accountBalance)}
          </Badge>
        </div>
        
        {/* Nội dung chính - layout đơn giản hơn */}
        <div className="p-4 grid grid-cols-1 gap-4">
          {/* Phần Risk Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Risk per Trade</Label>
              <div className="flex flex-col items-end">
                <span className={cn("text-lg font-semibold", getRiskColor(riskPercentage))}>
                  {riskPercentage.toFixed(1)}%
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatCurrency(riskAmount)}
                </span>
              </div>
            </div>
            
            <div className="pt-1 pb-1">
              {/* Slider đơn giản không cần div bao ngoài */}
              <Slider
                value={[riskPercentage]}
                min={0.1}
                max={3}
                step={0.1}
                onValueChange={(values) => {
                  setRiskPercentage(values[0]);
                }}
                className="my-2 trade-risk-slider"
                aria-label="Risk percentage"
              />
            </div>
          </div>
          
          {/* Thông tin Risk:Reward - Tối giản */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/30">
            {/* Hiển thị cô đọng pips at risk và potential profit */}
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground">Pips at Risk</span>
              <span className="text-xl font-medium">{pipsAtRisk.toFixed(1)}</span>
            </div>
            
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground">Potential Profit (Pips)</span>
              <span className="text-xl font-medium text-emerald-500">{potentialProfitPips.toFixed(1)}</span>
            </div>
          </div>
          
          {/* Risk:Reward Ratio - Thay bằng Slider */}
          <div className="mt-2 pt-2 border-t border-border/30">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Risk:Reward Ratio</span>
              <span className={cn(
                "text-lg font-medium", 
                getRRColor(riskRewardRatio)
              )}>
                1:{riskRewardRatio.toFixed(2)}
              </span>
            </div>
            
            <div className="pt-1 pb-1">
              <Slider
                value={[riskRewardRatio]}
                min={0.1}
                max={3}
                step={0.1}
                onValueChange={(values) => {
                  // Cập nhật R:R và tính lại Take Profit dựa trên giá trị mới
                  const newRR = values[0];
                  
                  // Tính toán Take Profit mới dựa trên Risk:Reward
                  if (entryPrice && stopLoss) {
                    const priceDiff = Math.abs(entryPrice - stopLoss);
                    const direction = form.watch("direction");
                    
                    let newTakeProfit = 0;
                    if (direction === "BUY") {
                      // Nếu BUY, TP = Entry + (Entry - SL) * RR
                      newTakeProfit = entryPrice + (priceDiff * newRR);
                    } else {
                      // Nếu SELL, TP = Entry - (SL - Entry) * RR
                      newTakeProfit = entryPrice - (priceDiff * newRR);
                    }
                    
                    // Cập nhật form với giá trị Take Profit mới (chuyển về số)
                    const formattedTP = parseFloat(newTakeProfit.toFixed(5));
                    form.setValue("takeProfit", formattedTP, {
                      shouldValidate: true,
                      shouldDirty: true
                    });
                  }
                }}
                className="my-2 trade-risk-slider"
                aria-label="Risk reward ratio"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
