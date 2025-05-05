import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart2, 
  TrendingUp, 
  Scale, 
  Percent, 
  CheckCircle,
  AlertCircle,
  Medal,
  DollarSign,
  TrendingDown
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatProfitFactor } from "@/lib/balance-calculation-rules";
import { calculateWinRate } from "@/lib/forex-calculator";

interface TradingStatsCardProps {
  totalTrades: number;
  winRate: number;
  profitFactor: number;
  avgRiskRewardRatio: number;
  isLoading?: boolean;
  totalProfit?: number;
  totalLoss?: number;
}

export function TradingStatsCard({
  totalTrades,
  winRate,
  profitFactor,
  avgRiskRewardRatio,
  isLoading = false,
  totalProfit = 0,
  totalLoss = 0
}: TradingStatsCardProps) {
  // Loading state
  if (isLoading) {
    return (
      <Card variant="gradient">
        <CardHeader withBackground className="pb-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
        </CardHeader>
        <CardContent withBackground={false}>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array(4).fill(0).map((_, index) => (
              <div key={index} className="stat-skeleton-tile">
                <div className="stat-skeleton-header">
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-8 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Calculate performance ratings - 0% hiển thị màu trung tính
  let isGoodWinRate = null;
  let isGoodProfitFactor = null;
  let isGoodRR = null;
  
  // Chỉ đánh giá khi chỉ số > 0
  if (winRate > 0) isGoodWinRate = winRate >= 50;
  if (profitFactor > 0) isGoodProfitFactor = profitFactor >= 1.5;
  if (avgRiskRewardRatio > 0) isGoodRR = avgRiskRewardRatio >= 1.5;
  
  // Get performance level
  const performancePoints = [isGoodWinRate, isGoodProfitFactor, isGoodRR]
    .filter(Boolean).length;
  
  // Performance tag configuration
  const performanceConfig = {
    tag: "Insufficient Data",
    badgeClass: "bg-muted/20 text-muted-foreground",
    icon: AlertCircle
  };
  
  if (totalTrades >= 10) {
    if (performancePoints === 3) {
      performanceConfig.tag = "Excellent";
      performanceConfig.badgeClass = "bg-success/10 text-success dark:bg-success/15 dark:text-success";
      performanceConfig.icon = Medal;
    } else if (performancePoints === 2) {
      performanceConfig.tag = "Good";
      performanceConfig.badgeClass = "bg-primary/10 text-primary dark:bg-primary/15 dark:text-primary-foreground";
      performanceConfig.icon = CheckCircle;
    } else if (performancePoints === 1) {
      performanceConfig.tag = "Needs Improvement";
      performanceConfig.badgeClass = "bg-warning/10 text-warning dark:bg-warning/15 dark:text-warning";
      performanceConfig.icon = AlertCircle;
    } else {
      performanceConfig.tag = "Underperforming";
      performanceConfig.badgeClass = "bg-destructive/10 text-destructive dark:bg-destructive/15 dark:text-destructive";
      performanceConfig.icon = AlertCircle;
    }
  }
  
  // Statistics tiles configuration
  const stats = [
    { 
      label: "Total Trades", 
      value: totalTrades.toString(), 
      icon: BarChart2,
      tooltip: "Total number of completed trades",
      color: "text-primary dark:text-primary-foreground/90",
      bgColor: "bg-primary/10 dark:bg-primary/20"
    },
    { 
      label: "Win Rate", 
      value: `${winRate.toFixed(1)}%`, 
      icon: isGoodWinRate !== null ? (isGoodWinRate ? CheckCircle : Percent) : Percent,
      tooltip: "Percentage of profitable trades",
      color: isGoodWinRate !== null 
        ? (isGoodWinRate ? "text-success" : "text-destructive")
        : "text-muted-foreground",
      bgColor: isGoodWinRate !== null
        ? (isGoodWinRate ? "bg-success/10 dark:bg-success/15" : "bg-destructive/10 dark:bg-destructive/15")
        : "bg-muted/20 dark:bg-muted/10"
    },
    { 
      label: "Profit Factor", 
      value: formatProfitFactor(profitFactor), 
      icon: TrendingUp,
      tooltip: "Ratio of gross profit to gross loss",
      color: isGoodProfitFactor !== null
        ? (isGoodProfitFactor ? "text-success" : "text-destructive")
        : "text-muted-foreground",
      bgColor: isGoodProfitFactor !== null
        ? (isGoodProfitFactor ? "bg-success/10 dark:bg-success/15" : "bg-destructive/10 dark:bg-destructive/15")
        : "bg-muted/20 dark:bg-muted/10"
    },
    { 
      label: "R:R Ratio", 
      value: avgRiskRewardRatio.toFixed(2), 
      icon: Scale,
      tooltip: "Average profit per trade to average loss per trade",
      color: isGoodRR !== null
        ? (isGoodRR ? "text-success" : "text-destructive")
        : "text-muted-foreground",
      bgColor: isGoodRR !== null
        ? (isGoodRR ? "bg-success/10 dark:bg-success/15" : "bg-destructive/10 dark:bg-destructive/15")
        : "bg-muted/20 dark:bg-muted/10"
    }
  ];

  // Add profit details if provided
  if (totalProfit > 0 || totalLoss > 0) {
    stats.push(
      { 
        label: "Total Profit", 
        value: totalProfit.toFixed(2), 
        icon: DollarSign,
        tooltip: "Total profit from winning trades",
        color: "text-success",
        bgColor: "bg-success/10 dark:bg-success/15"
      },
      { 
        label: "Total Loss", 
        value: totalLoss.toFixed(2), 
        icon: TrendingDown,
        tooltip: "Total loss from losing trades",
        color: "text-destructive",
        bgColor: "bg-destructive/10 dark:bg-destructive/15"
      }
    );
  }
  
  // Determine card variant based on performance
  let cardVariant: 'default' | 'outline' | 'elevated' | 'gradient' | 'accent' | 'status' = 'gradient'; // Default style
  let cardStatus: 'success' | 'warning' | 'error' | 'info' | 'neutral' = 'neutral'; // Default status
  
  // Set card variant/status based on performance level
  if (totalTrades >= 10) {
    cardVariant = 'status';
    if (performancePoints === 3) {
      cardStatus = 'success';
    } else if (performancePoints === 2) {
      cardStatus = 'info';
    } else if (performancePoints === 1) {
      cardStatus = 'warning';
    } else {
      cardStatus = 'error';
    }
  }
  
  // Component render with enhanced styling
  return (
    <Card 
      variant={cardVariant} 
      status={cardStatus}
      className="overflow-hidden"
    >
      {/* Add subtle pattern overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50 pointer-events-none" />
      
      {/* Add decorative chart/stats shape */}
      <div className="absolute bottom-0 right-0 w-24 h-24 opacity-10 pointer-events-none">
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10,90 L10,50 L30,70 L50,30 L70,50 L90,20 L90,90 Z" fill="currentColor" />
        </svg>
      </div>
      
      <CardHeader withBackground className="px-4 sm:px-6 pt-4 pb-2 relative z-10">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle 
            size="md"
            withIcon={<BarChart2 className="text-primary" />}
          >
            Trading Statistics
          </CardTitle>
          
          <div className={cn(
            "flex items-center px-3 py-1 rounded-full text-xs font-medium",
            performanceConfig.badgeClass
          )}>
            <performanceConfig.icon className="h-3.5 w-3.5 mr-1.5" />
            {performanceConfig.tag}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-2 pb-4 px-4 sm:px-6 relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <div 
              key={index} 
              className="stat-card stat-card-compact bg-card/80 backdrop-blur-sm border border-border/10 hover:border-border/20 transition-colors"
              title={stat.tooltip}
            >
              <div className="stat-card-header">
                <div className={cn("stat-card-title font-medium", stat.color)}>
                  {stat.label}
                </div>
                <div className={cn(
                  "stat-card-icon-container rounded-lg",
                  stat.bgColor
                )}>
                  <stat.icon className={cn("h-3.5 w-3.5", stat.color)} />
                </div>
              </div>
              <div className={cn("stat-card-value font-bold", stat.color)}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}