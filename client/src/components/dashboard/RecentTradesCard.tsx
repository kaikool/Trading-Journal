import { Icons } from "@/components/icons/icons";
import { useState, useMemo, useCallback } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle,
  CardIcon,
  CardGradient
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getTradeStatusConfig } from "@/lib/trade-status-config";
import { formatPrice, CurrencyPair, Direction, calculateWinRate } from "@/lib/forex-calculator";
import { UI_CONFIG } from "@/lib/config";
import { format } from "date-fns";
import { useLocation } from "wouter";
import { determineTradeStatus } from "@/lib/trade-status-helpers";
import { Trade as AppTrade } from "@/types";
import DirectionBadge from "../trades/DirectionBadge";
import { memoWithPerf, useMemoWithPerf } from "@/lib/performance";

// Define the types for the trade data
interface Trade {
  id: string;
  createdAt: any; // Timestamp
  pair: string;
  direction: "BUY" | "SELL";
  entryPrice: number;
  exitPrice?: number;
  profitLoss?: number;
  pips?: number;
  status?: string;
  result?: string;
  isOpen?: boolean;
  leverage?: number;
  lotSize: number;
}

interface RecentTradesCardProps {
  trades: Trade[];
  isLoading?: boolean;
}

// Sử dụng memoWithPerf để tối ưu hiệu năng
export function RecentTradesCard({
  trades,
  isLoading = false
}: RecentTradesCardProps) {
  const [_, setLocation] = useLocation();

  // Removed getDirectionClasses as we're now using DirectionBadge component

  // Function to format timestamp - Sử dụng useMemoWithPerf để tối ưu theo hiệu năng thiết bị
  const formatTimestamp = useMemoWithPerf(() => {
    // Lưu cache cho timestamp đã từng xử lý
    const timestampCache = new Map<string, string>();
    
    return (timestamp: any) => {
      if (!timestamp) return "Unknown date";
      
      // Tạo key cho cache
      const cacheKey = timestamp?.toString() || "";
      if (timestampCache.has(cacheKey)) {
        return timestampCache.get(cacheKey)!;
      }
      
      let formattedDate: string;
      
      // If timestamp is a Firebase Timestamp object
      if (timestamp.toDate) {
        formattedDate = format(timestamp.toDate(), "dd MMM yyyy, HH:mm");
      }
      // If timestamp is a date object
      else if (timestamp instanceof Date) {
        formattedDate = format(timestamp, "dd MMM yyyy, HH:mm");
      }
      // If timestamp is a number (unix timestamp in seconds or milliseconds)
      else if (typeof timestamp === 'number') {
        const date = new Date(timestamp > 10000000000 ? timestamp : timestamp * 1000);
        formattedDate = format(date, "dd MMM yyyy, HH:mm");
      }
      else {
        formattedDate = "Invalid date";
      }
      
      // Lưu vào cache và trả về kết quả
      timestampCache.set(cacheKey, formattedDate);
      return formattedDate;
    };
  }, [], true); // true để luôn memoize ngay cả trên thiết bị hiệu năng cao

  // Function to navigate to trade detail - tối ưu với useCallback để tránh tạo lại hàm
  const handleViewTrade = useCallback((tradeId: string) => {
    setLocation(`/trade/view/${tradeId}`);
  }, [setLocation]);

  // Function to navigate to all trades - tối ưu với useCallback để tránh tạo lại hàm
  const handleViewAllTrades = useCallback(() => {
    setLocation("/trade/history");
  }, [setLocation]);
  
  // Dùng useMemoWithPerf thay vì useMemo để tối ưu hiệu năng trên các thiết bị khác nhau
  const memoizedTradesList = useMemoWithPerf(() => {
    if (!trades.length) return null;
    
    return trades.map((trade) => {
      // Xác định trạng thái giao dịch
      const tradeStatus = determineTradeStatus(trade as unknown as AppTrade);
      const isTradeOpen = tradeStatus === "OPEN";
      const config = getTradeStatusConfig(tradeStatus);
      
      return (
        <div key={trade.id} className="py-3 flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <DirectionBadge
                direction={trade.direction}
                size="sm"
                variant="modern"
                showTooltip={false}
              />
              <span className="font-medium">{trade.pair}</span>
            </div>
            <div className="text-xs text-muted-foreground flex items-center">
              <Icons.general.clock className="h-3 w-3 mr-1" />
              {formatTimestamp(trade.createdAt)}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-right">
              {/* Chỉ hiển thị lợi nhuận nếu giao dịch đã đóng và có giá trị lợi nhuận */}
              {!isTradeOpen && trade.profitLoss !== undefined && (
                <div className={cn(
                  "font-medium text-sm",
                  (trade.pips || 0) > 0 ? "text-success" : 
                  (trade.pips || 0) < 0 ? "text-destructive" : "text-muted-foreground"
                )}>
                  {trade.profitLoss > 0 ? "+" : ""}
                  {(() => {
                    // Lấy giá trị profitLoss trực tiếp - không cần sửa đổi nữa
                    let value = trade.profitLoss;
                    
                    return value !== undefined ? 
                      "$" + new Intl.NumberFormat('en-US', { 
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      }).format(value) : "$0.00";
                  })()}
                </div>
              )}
              
              {/* Badge hiển thị trạng thái giao dịch */}
              <div 
                className={cn(
                  "text-xs px-1.5 py-0.5 rounded-full font-medium inline-flex items-center gap-1 mt-0.5",
                  config.lightBgColor,
                  config.color
                )}
              >
                <config.icon className="h-3 w-3" />
                {config.label}
              </div>
            </div>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8" 
              onClick={() => handleViewTrade(trade.id)}
            >
              <Icons.general.moveRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      );
    });
  }, [trades, formatTimestamp, handleViewTrade], true); // true để luôn memoize vì đây là component có tính toán phức tạp
  
  if (isLoading) {
    return (
      <Card className="h-full flex flex-col relative overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-md" />
              <Skeleton className="h-6 w-40" />
            </div>
            <Skeleton className="h-4 w-56 mt-2" />
          </div>
        </CardHeader>
        
        <CardContent className="py-2 flex-grow">
          {Array(3).fill(0).map((_, index) => (
            <div key={index} className="flex items-center justify-between py-3 border-b border-border/30 last:border-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-3.5 w-32" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-16 rounded-md" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
            </div>
          ))}
        </CardContent>
        
        <CardFooter>
          <Skeleton className="h-9 w-28" />
        </CardFooter>
      </Card>
    );
  }

  // Calculate card gradient based on win rate
  const hasCompletedTrades = trades.filter(t => t.status !== 'OPEN' && t.profitLoss !== undefined).length > 0;
  const winCount = trades.filter(t => (t.pips || 0) > 0).length;
  const winRate = hasCompletedTrades ? (winCount / trades.length) * 100 : 0;
  
  // Gradient variant based on win rate
  const gradientVariant = winRate >= 60 ? 'success' : 
                          winRate >= 40 ? 'primary' :
                          winRate > 0 ? 'warning' : 'default';

  return (
    <Card className="h-full flex flex-col relative overflow-hidden card-spotlight">
      {hasCompletedTrades && (
        <CardGradient 
          variant={gradientVariant}
          intensity="subtle"
          direction="bottom-right"
        />
      )}
      
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <CardIcon
              color="primary"
              size="sm"
              variant="soft"
            >
              <ClipboardList className="h-4 w-4" />
            </CardIcon>
            Recent Trades
          </CardTitle>
          <CardDescription className="mt-1">
            Your latest trading activities
          </CardDescription>
        </div>
      </CardHeader>
      
      <CardContent className="py-2 flex-grow">
        {trades.length > 0 ? (
          <div className="divide-y divide-border/30">
            {memoizedTradesList}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full py-10 text-center">
            <div className="rounded-full bg-muted/10 p-3 mb-3">
              <ClipboardList className="h-10 w-10 text-muted-foreground/40" />
            </div>
            <p className="font-medium text-muted-foreground">No recent activity</p>
            <p className="text-sm text-muted-foreground/70 mt-1 max-w-xs">
              Add your first trade to see your recent activity here
            </p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => setLocation("/trade/new")}
            >
              Add Your First Trade
            </Button>
          </div>
        )}
      </CardContent>
      
      {trades.length > 0 && (
        <CardFooter>
          <Button 
            variant="outline" 
            size="sm"
            className="w-full sm:w-auto"
            onClick={handleViewAllTrades}
          >
            View All Trades
            <ExternalLink className="h-3.5 w-3.5 ml-1" />
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}