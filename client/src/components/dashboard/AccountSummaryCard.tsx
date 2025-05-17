import { Icons } from "@/components/icons/icons";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardIcon, 
  CardGradient,
  CardValue
} from "@/components/ui/card";

import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { formatCurrency, formatNumber } from "@/utils/format-number";

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
      <Card className="border shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            {/* Empty loading state without skeleton */}
          </div>
        </CardHeader>
        <CardContent>
          <div className="balance-container">
            {/* Empty loading container */}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate percentage for progress bar
  const balancePercentage = Math.min(Math.max((currentBalance / initialBalance) * 100, 0), 200);

  // Xác định loại gradient dựa trên performance
  const gradientVariant = isPositive === null 
    ? 'default' 
    : isPositive 
      ? 'success' 
      : 'destructive';
      
  // Xác định biểu tượng trend
  const trendIcon = isPositive === null 
    ? <Icons.ui.minus className="h-4 w-4" /> 
    : isPositive 
      ? <Icons.trade.profit className="h-4 w-4" /> 
      : <Icons.trade.loss className="h-4 w-4" />;
  
  // Xác định status cho CardValue
  const valueStatus = isPositive === null 
    ? 'default' 
    : isPositive 
      ? 'success' 
      : 'danger';
  
  return (
    <Card className="relative overflow-hidden card-spotlight">
      {/* Gradient background cho card */}
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
            <Icons.general.clipboard className="h-4 w-4" />
          </CardIcon>
          Account Balance
        </CardTitle>
        
        {/* Chỉ hiển thị badge khi có giao dịch */}
        {hasTrades && (
          <div className={cn(
            "flex items-center px-3 py-1 rounded-full text-xs font-medium",
            statusColorClasses.bg, statusColorClasses.text
          )}>
            {isPositive === null ? 
              <Icons.ui.minus className="h-3.5 w-3.5 mr-1" /> : 
              isPositive ? 
                <Icons.ui.arrowUp className="h-3.5 w-3.5 mr-1" /> : 
                <Icons.ui.arrowDown className="h-3.5 w-3.5 mr-1" />
            }
            {isPositive === true ? "+" : ""}{profitLossPercentage.toFixed(1)}%
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        <div className="flex flex-wrap items-end justify-between gap-2 mb-6">
          <div>
            <CardValue
              size="lg"
              status={valueStatus}
              className="mb-1"
            >
              {formatCurrency(currentBalance)}
            </CardValue>
            
            {/* Chỉ hiển thị phần này khi có giao dịch */}
            {hasTrades ? (
              <div className={cn("text-sm font-medium", statusColorClasses.text)}>
                {isPositive ? "+" : ""}{formatCurrency(Math.abs(profitLoss))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                No trade history yet
              </div>
            )}
          </div>
          
          <div className="flex items-center text-xs bg-background/50 border border-border/30 px-3 py-1.5 rounded-md shadow-sm">
            <Icons.ui.dollarSign className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
            {formatNumber(initialBalance)} initial
          </div>
        </div>
        
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Initial</span>
            <span>Current</span>
          </div>
          <Progress 
            value={balancePercentage} 
            max={200}
            className="h-2 bg-muted/20" 
            indicatorClassName={statusColorClasses.progressBar}
          />
        </div>
      </CardContent>
    </Card>
  );
}