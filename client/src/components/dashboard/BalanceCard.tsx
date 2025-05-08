import React from "react";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { UI_CONFIG } from "@/lib/config";
import { Icons } from "@/components/icons/icons";

interface BalanceCardProps {
  currentBalance: number;
  percentageChange: number;
  period?: string;
  isLoading?: boolean;
}

// Tối ưu với React.memo để tránh re-render không cần thiết
const BalanceCard = React.memo(function BalanceCard({
  currentBalance,
  percentageChange,
  period = UI_CONFIG.TEXT.INITIAL_DEPOSIT,
  isLoading = false
}: BalanceCardProps) {
  if (isLoading) {
    return (
      <Card className="rounded-lg p-6 text-white shadow-md animate-pulse relative overflow-hidden h-[138px]">
        {/* Apple-inspired subtle gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/80 opacity-95" />
        <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-[0.03]" />
        
        <div className="flex justify-between mb-2 relative z-10">
          <div className="h-5 w-24 bg-white/20 rounded-md" />
          <div className="h-5 w-5 bg-white/20 rounded-full" />
        </div>
        <div className="h-8 w-40 bg-white/30 rounded-md mb-2 relative z-10" />
        <div className="h-5 w-36 bg-white/20 rounded-md relative z-10" />
      </Card>
    );
  }

  // Định dạng số dư chính xác
  const formattedBalance = formatCurrency(currentBalance);

  return (
    <Card className="rounded-lg p-6 text-white shadow-md hover:shadow-lg transition-all duration-200 relative overflow-hidden group">
      {/* Apple-inspired subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/80 opacity-95 group-hover:opacity-100 transition-opacity" />
      <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-[0.03]" />
      
      {/* Subtle visual elements */}
      <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -left-10 -bottom-10 w-32 h-32 rounded-full bg-black/5 blur-3xl" />
      
      <div className="flex justify-between mb-2 relative z-10">
        <span className="text-sm font-medium text-white/90">{UI_CONFIG.TEXT.CURRENT_BALANCE}</span>
        <div className="bg-white/20 p-1.5 rounded-full">
          <Icons.general.clipboard className="h-4 w-4 text-white" />
        </div>
      </div>
      
      <div className="text-3xl font-semibold mb-1 relative z-10">
        {formattedBalance}
      </div>
      
      <div className="flex items-center text-sm relative z-10">
        {percentageChange > 0 ? (
          <span className="inline-flex items-center text-green-200 mr-2 bg-green-500/20 px-2 py-0.5 rounded-full text-xs">
            <Icons.trade.exit className="h-3 w-3 mr-1" />
            <span>{formatPercentage(percentageChange)}</span>
          </span>
        ) : percentageChange < 0 ? (
          <span className="inline-flex items-center text-red-200 mr-2 bg-red-500/20 px-2 py-0.5 rounded-full text-xs">
            <Icons.trade.entry className="h-3 w-3 mr-1" />
            <span>{formatPercentage(Math.abs(percentageChange))}</span>
          </span>
        ) : (
          <span className="inline-flex items-center text-gray-200 mr-2 bg-gray-500/20 px-2 py-0.5 rounded-full text-xs">
            <span>0.0%</span>
          </span>
        )}
        <span className="text-white/70 text-xs">since {period}</span>
      </div>
    </Card>
  );
});

BalanceCard.displayName = "BalanceCard";

export default BalanceCard;
