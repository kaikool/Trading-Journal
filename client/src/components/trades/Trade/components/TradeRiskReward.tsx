
import { useFormContext } from "react-hook-form";
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatCurrency, formatPips, formatRiskReward } from '@/utils/format-number';
import { TradeFormValues } from '../types';
import { Icons } from '@/components/icons/icons';
import { CurrencyPair, PIP_SIZE } from '@/lib/forex-calculator';



interface TradeRiskRewardProps {
  accountBalance: number;
  riskPercentage: number;
  setRiskPercentage: (value: number) => void;
  riskRewardRatio: number;
  setRiskRewardRatio: (value: number) => void;
}

export function TradeRiskReward({
  accountBalance,
  riskPercentage,
  setRiskPercentage,
  riskRewardRatio,
  setRiskRewardRatio
}: TradeRiskRewardProps) {
  const form = useFormContext<TradeFormValues>();
  const getRiskColor = (value: number) => {
    if (value > 2) return "text-red-500";
    if (value > 1) return "text-amber-500";
    return "text-emerald-500";
  };

  const getRRColor = (value: number) => {
    if (value >= 2) return "text-emerald-500";
    if (value >= 1) return "text-amber-500";
    return "text-red-500";
  };

  const riskAmount = accountBalance * (riskPercentage / 100);
  const currencyPair = form.watch("pair") as CurrencyPair || "EURUSD";
  const entryPrice = Number(form.watch("entryPrice") || 0);
  const stopLoss = Number(form.watch("stopLoss") || 0);
  const takeProfit = Number(form.watch("takeProfit") || 0);
  
  const pipsAtRisk = (entryPrice && stopLoss) 
    ? Math.abs(entryPrice - stopLoss) / PIP_SIZE[currencyPair]
    : 0;
    
  const potentialProfitPips = (entryPrice && takeProfit)
    ? Math.abs(entryPrice - takeProfit) / PIP_SIZE[currencyPair]
    : 0;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        <div className="border-b px-4 py-2.5 flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-1.5">
            <Icons.analytics.chartLine className="h-4 w-4 text-primary/70" />
            <h3 className="text-sm font-medium">Risk Management</h3>
          </div>
          <Badge variant="outline" className="text-xs font-normal px-2 py-0.5 bg-background">
            Balance: {formatCurrency(accountBalance)}
          </Badge>
        </div>
        
        <div className="px-4 py-3 grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Risk per Trade</Label>
              <div className="flex flex-col items-end">
                <span className={cn("text-sm font-semibold", getRiskColor(riskPercentage))}>
                  {`${riskPercentage.toFixed(1)}%`}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatCurrency(riskAmount)}
                </span>
              </div>
            </div>
            
            <div>
              <Slider
                value={[riskPercentage]}
                min={0.1}
                max={3}
                step={0.1}
                onValueChange={(values) => {
                  setRiskPercentage(values[0]);
                }}
                className="my-1 trade-risk-slider"
                aria-label="Risk percentage"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/20">
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground mb-0.5">Pips at Risk</span>
              <span className="text-base font-medium">{formatPips(pipsAtRisk)}</span>
            </div>
            
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground mb-0.5">Potential Profit</span>
              <span className="text-base font-medium text-emerald-500">{formatPips(potentialProfitPips, { includeUnit: true })}</span>
            </div>
          </div>
          
          <div className="pt-2 border-t border-border/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Risk:Reward Ratio</span>
              <span className={cn(
                "text-sm font-medium", 
                entryPrice && stopLoss ? getRRColor(riskRewardRatio) : "text-muted-foreground/70"
              )}>
                {formatRiskReward(riskRewardRatio, { formatAsRatio: true })}
              </span>
            </div>
            
            <div>
              <Slider
                value={[riskRewardRatio]}
                min={0.1}
                max={10}
                step={0.1}
                disabled={!entryPrice || !stopLoss}
                onValueChange={(values) => {
                  const newRR = values[0];
                  setRiskRewardRatio(newRR);
                  
                  if (entryPrice && stopLoss) {
                    const priceDiff = Math.abs(entryPrice - stopLoss);
                    const direction = form.watch("direction");
                    
                    let newTakeProfit = 0;
                    if (direction === "BUY") {
                      newTakeProfit = entryPrice + (priceDiff * newRR);
                    } else {
                      newTakeProfit = entryPrice - (priceDiff * newRR);
                    }
                    
                    const formattedTP = parseFloat(newTakeProfit.toFixed(5));
                    form.setValue("takeProfit", formattedTP, {
                      shouldValidate: true,
                      shouldDirty: true
                    });
                  }
                }}
                className={cn(
                  "my-1 trade-risk-slider",
                  !entryPrice || !stopLoss ? "opacity-50" : ""
                )}
                aria-label="Risk reward ratio"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
