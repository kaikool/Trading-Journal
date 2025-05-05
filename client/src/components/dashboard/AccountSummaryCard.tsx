import { ArrowDown, ArrowUp, DollarSign, Wallet, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { UI_CONFIG } from "@/lib/config";
import { CurrencyPair } from "@/lib/forex-calculator";
import { formatCurrency, formatNumber, formatPercentage } from "@/utils/format-number";

interface AccountSummaryCardProps {
  currentBalance: number;
  initialBalance: number;
  isLoading?: boolean;
  profitLoss?: number;
  profitLossPercentage?: number;
  hasTrades?: boolean; // Thêm prop này để kiểm tra có giao dịch nào chưa
}

export function AccountSummaryCard({
  currentBalance,
  initialBalance,
  isLoading = false,
  profitLoss = 0,
  profitLossPercentage = 0,
  hasTrades = false, // Thêm giá trị mặc định
}: AccountSummaryCardProps) {
  /**
   * IMPORTANT: Quy tắc tính toán số dư tài khoản
   * 
   * 1. Khi chưa có giao dịch:
   *    - Current Balance = Initial Balance
   *    - KHÔNG hiển thị P&L và phần trăm lãi/lỗ
   *    - Hiển thị "No trade history yet" thay vì P&L
   * 
   * 2. Khi đã có giao dịch:
   *    - Current Balance = Initial Balance + Tổng P&L của tất cả giao dịch đã đóng
   *    - P&L = Current Balance - Initial Balance
   *    - P&L Percentage = (P&L / Initial Balance) * 100
   * 
   * 3. Khi thay đổi Initial Balance:
   *    - Nếu chưa có giao dịch, Current Balance = Initial Balance mới
   *    - Nếu đã có giao dịch, Current Balance = Initial Balance mới + Tổng P&L
   * 
   * Chi tiết tham khảo tại: client/src/lib/balance-calculation-rules.ts
   */
  
  // Calculate display properties based on performance
  // Chỉ tính isPositive khi có giao dịch, nếu không có thì luôn là null
  let isPositive = null;
  if (hasTrades) {
    if (profitLoss > 0) isPositive = true;
    else if (profitLoss < 0) isPositive = false;
  }
  
  // Color classes for positive/negative/neutral values - financial market standards
  const statusColorClasses = {
    text: isPositive === null 
      ? "text-muted-foreground"
      : isPositive 
        ? "text-success" // Use CSS variables for consistent colors
        : "text-destructive",
    bg: isPositive === null 
      ? "bg-muted/20 dark:bg-muted/10" 
      : isPositive 
        ? "bg-success/10 dark:bg-success/15" 
        : "bg-destructive/10 dark:bg-destructive/15",
    progressBar: isPositive === null 
      ? "bg-muted-foreground/40" 
      : isPositive 
        ? "bg-success" 
        : "bg-destructive"
  };

  // Loading state
  if (isLoading) {
    return (
      <Card variant="gradient">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="balance-skeleton-container">
            <Skeleton className="balance-skeleton-amount" />
            <Skeleton className="balance-skeleton-subtitle" />
            <Skeleton className="balance-skeleton-bar mt-4" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate percentage for progress bar
  const balancePercentage = Math.min(Math.max((currentBalance / initialBalance) * 100, 0), 200);
  
  // Determine card variant based on performance
  const cardVariant = hasTrades 
    ? (isPositive ? 'status' : 'status')
    : 'gradient';
  
  // Determine card status based on performance
  const cardStatus = hasTrades
    ? (isPositive ? 'success' : 'error')
    : 'info';

  return (
    <Card 
      variant={cardVariant} 
      status={cardStatus}
      className="overflow-hidden"
    >
      {/* Simple gradient background overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent opacity-60 pointer-events-none" />
      
      {/* Simple decorative dollar sign */}
      <div className="absolute top-4 right-4 opacity-15 pointer-events-none">
        <DollarSign className="h-20 w-20 text-primary" />
      </div>
      
      <CardHeader className="px-4 sm:px-6 pt-4 pb-2 relative z-10">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle 
            size="md"
            withIcon={<Wallet className="text-primary" />}
          >
            Account Balance
          </CardTitle>
          
          {/* Performance badge when trades exist */}
          {hasTrades && (
            <div className={cn(
              "flex items-center px-3 py-1 rounded-full text-xs font-medium",
              statusColorClasses.bg, statusColorClasses.text
            )}>
              {isPositive === null ? 
                <Minus className="h-3.5 w-3.5 mr-1" /> : 
                isPositive ? 
                  <ArrowUp className="h-3.5 w-3.5 mr-1" /> : 
                  <ArrowDown className="h-3.5 w-3.5 mr-1" />
              }
              {isPositive === true ? "+" : ""}{profitLossPercentage.toFixed(1)}%
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-2 pb-4 px-4 sm:px-6 relative z-10">
        {/* Main balance display with enhanced visual styling */}
        <div className="flex flex-wrap items-end justify-between gap-2 mb-6">
          <div>
            <div className="text-3xl font-bold mb-1 flex items-center">
              <span className="mr-1 text-primary/80">$</span>
              {formatNumber(currentBalance)}
            </div>
            
            {/* P&L display with appropriate styling */}
            {hasTrades ? (
              <div className={cn(
                "text-sm font-medium flex items-center", 
                statusColorClasses.text
              )}>
                {isPositive ? (
                  <ArrowUp className="h-3.5 w-3.5 mr-1" />
                ) : (
                  <ArrowDown className="h-3.5 w-3.5 mr-1" />
                )}
                {isPositive ? "+" : ""}{formatCurrency(Math.abs(profitLoss))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground flex items-center">
                <Minus className="h-3.5 w-3.5 mr-1 opacity-70" />
                No trade history yet
              </div>
            )}
          </div>
          
          {/* Enhanced badge for initial balance */}
          <div className="flex items-center text-xs font-medium bg-muted/20 dark:bg-muted/15 backdrop-blur-sm px-3 py-1.5 rounded-md">
            <DollarSign className="h-3.5 w-3.5 mr-1 text-primary/70" />
            {formatNumber(initialBalance)} initial
          </div>
        </div>
        
        {/* Progress bar with enhanced styling and gradient */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span className="font-medium flex items-center">
              <DollarSign className="h-3 w-3 mr-1 opacity-70" />
              Initial
            </span>
            <span className="font-medium flex items-center">
              Current
              <DollarSign className="h-3 w-3 ml-1 opacity-70" />
            </span>
          </div>
          
          {/* Simple gradient progress bar */}
          <div className="relative">
            <Progress 
              value={balancePercentage} 
              max={200}
              className="h-3 bg-muted/20 rounded-md overflow-hidden" 
              indicatorClassName={cn(
                "bg-gradient-to-r transition-all duration-500 ease-out",
                isPositive 
                  ? "from-success/80 to-success" 
                  : isPositive === false 
                    ? "from-destructive/80 to-destructive" 
                    : "from-primary/80 to-primary"
              )}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}