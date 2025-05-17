import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardIcon,
  CardGradient, 
  CardValue 
} from "@/components/ui/card";
import { Icons } from "@/components/icons/icons";

import { cn } from "@/lib/utils";
import { formatProfitFactor } from "@/lib/balance-calculation-rules";
import { formatPercentage, formatRiskReward } from "@/utils/format-number";

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
      <Card className="relative overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-2">
            {/* Empty loading header */}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Empty loading content */}
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
    icon: Icons.ui.error
  };
  
  if (totalTrades >= 10) {
    if (performancePoints === 3) {
      performanceConfig.tag = "Excellent";
      performanceConfig.badgeClass = "bg-success/10 text-success dark:bg-success/15 dark:text-success";
      performanceConfig.icon = Icons.achievement.medal;
    } else if (performancePoints === 2) {
      performanceConfig.tag = "Good";
      performanceConfig.badgeClass = "bg-primary/10 text-primary dark:bg-primary/15 dark:text-primary-foreground";
      performanceConfig.icon = Icons.ui.circleCheck;
    } else if (performancePoints === 1) {
      performanceConfig.tag = "Needs Improvement";
      performanceConfig.badgeClass = "bg-warning/10 text-warning dark:bg-warning/15 dark:text-warning";
      performanceConfig.icon = Icons.ui.warning;
    } else {
      performanceConfig.tag = "Underperforming";
      performanceConfig.badgeClass = "bg-destructive/10 text-destructive dark:bg-destructive/15 dark:text-destructive";
      performanceConfig.icon = Icons.ui.error;
    }
  }
  
  // Statistics tiles configuration
  const stats = [
    { 
      label: "Total Trades", 
      value: totalTrades.toString(), 
      icon: Icons.analytics.barChart,
      tooltip: "Total number of completed trades",
      color: "text-primary dark:text-primary-foreground/90",
      bgColor: "bg-primary/10 dark:bg-primary/20"
    },
    { 
      label: "Win Rate", 
      value: formatPercentage(winRate), 
      icon: isGoodWinRate !== null ? (isGoodWinRate ? Icons.ui.circleCheck : Icons.analytics.percent) : Icons.analytics.percent,
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
      icon: Icons.trade.profit,
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
      value: formatRiskReward(avgRiskRewardRatio), 
      icon: Icons.ui.slidersHorizontal,
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
        icon: Icons.ui.dollarSign,
        tooltip: "Total profit from winning trades",
        color: "text-success",
        bgColor: "bg-success/10 dark:bg-success/15"
      },
      { 
        label: "Total Loss", 
        value: totalLoss.toFixed(2), 
        icon: Icons.trade.loss,
        tooltip: "Total loss from losing trades",
        color: "text-destructive",
        bgColor: "bg-destructive/10 dark:bg-destructive/15"
      }
    );
  }
  
  // Xác định gradient variant dựa trên performance
  const gradientVariant = performancePoints === 3 ? 'success' : 
                         performancePoints === 2 ? 'primary' :
                         performancePoints === 1 ? 'warning' :
                         performancePoints === 0 ? 'destructive' : 'default';
  
  // Component render
  return (
    <Card className="relative overflow-hidden">
      {/* Gradient background dựa trên performance */}
      <CardGradient 
        variant={gradientVariant}
        intensity="subtle"
        direction="top-right"
      />
      
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <CardIcon
            color="primary"
            size="sm"
            variant="soft"
          >
            <Icons.analytics.barChart className="h-4 w-4" />
          </CardIcon>
          Trading Statistics
        </CardTitle>
        
        <div className={cn(
          "flex items-center px-3 py-1 rounded-full text-xs font-medium",
          performanceConfig.badgeClass
        )}>
          <performanceConfig.icon className="h-3.5 w-3.5 mr-1.5" />
          {performanceConfig.tag}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => {
            // Map các trạng thái màu sắc sang các cấu hình CardIcon và CardValue
            const iconColor = stat.color.includes('primary') ? 'primary' :
                            stat.color.includes('success') ? 'success' :
                            stat.color.includes('destructive') ? 'destructive' :
                            stat.color.includes('warning') ? 'warning' : 'muted';
            
            const valueStatus = stat.color.includes('success') ? 'success' :
                              stat.color.includes('destructive') ? 'danger' :
                              stat.color.includes('warning') ? 'warning' : 'default';
            
            return (
              <Card 
                key={index}
                className="relative overflow-hidden p-3 h-auto card-spotlight"
                title={stat.tooltip}
              >
                {/* Gradient background for each stat card */}
                <CardGradient 
                  variant={iconColor as any}
                  intensity="subtle" 
                  direction="top-right" 
                />
                
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    {stat.label}
                  </span>
                  <CardIcon
                    color={iconColor}
                    size="sm"
                    variant="soft"
                  >
                    <stat.icon className="h-3.5 w-3.5" />
                  </CardIcon>
                </div>
                <CardValue
                  size="md"
                  status={valueStatus}
                  className="font-bold"
                >
                  {stat.value}
                </CardValue>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}