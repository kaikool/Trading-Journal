import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardIcon,
  CardGradient
} from "@/components/ui/card";

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, TooltipProps } from "recharts";
import { Icons } from "@/components/icons/icons";
import { UI_CONFIG, COLOR_CONFIG } from "@/lib/config";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { useEffect, useState } from "react";

// Define the type for data points
interface DataPoint {
  date: string;
  balance: number;
  formattedDate?: string;
}

interface PerformanceChartProps {
  data: DataPoint[];
  isLoading?: boolean;
}

// Custom tooltip component
const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    const dataPoint = payload[0].payload;
    
    return (
      <div className="balance-chart-tooltip">
        <p className="balance-chart-tooltip-date">{dataPoint.formattedDate || format(parseISO(dataPoint.date), 'MMM dd')}</p>
        <div className="balance-chart-tooltip-value">
          {UI_CONFIG.CURRENCY_SYMBOL}{new Intl.NumberFormat('en-US', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
          }).format(dataPoint.balance)}
        </div>
      </div>
    );
  }
  return null;
};

export function PerformanceChart({ 
  data, 
  isLoading = false 
}: PerformanceChartProps) {

  
  // Consider it loading if we receive an empty array
  // This happens when userData is not yet loaded in parent components
  const effectiveIsLoading = isLoading || (data && data.length === 0);
  
  // Detect dark mode for x-axis label color
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  useEffect(() => {
    // Check if dark mode is active
    const darkModeCheck = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };
    
    // Check immediately
    darkModeCheck();
    
    // Watch for theme changes
    const observer = new MutationObserver(darkModeCheck);
    observer.observe(document.documentElement, { 
      attributes: true,
      attributeFilter: ['class'] 
    });
    
    return () => observer.disconnect();
  }, []);
  // Skip rendering if loading
  if (effectiveIsLoading) {
    return null;
  }
  
  // Empty state - now this only happens when data is really empty, not during loading
  if (!data || data.length === 0) {
    return (
      <Card className="relative overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <CardIcon
              color="primary"
              size="sm"
              variant="soft"
            >
              <Icons.analytics.lineChart className="h-4 w-4" />
            </CardIcon>
            Balance History
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center text-center min-h-[200px] py-10">
          <div className="rounded-full bg-muted/10 p-3 mb-3">
            <Icons.ui.info className="h-8 w-8 text-muted-foreground/40" />
          </div>
          <p className="font-medium text-muted-foreground">No performance data available</p>
          <p className="text-sm text-muted-foreground/70 mt-1 max-w-xs">
            Complete trades will appear in this chart
          </p>
        </CardContent>
      </Card>
    );
  }
  
  // Calculate if overall trend is positive
  const isPositiveTrend = data[data.length - 1].balance > data[0].balance;
  
  // Sử dụng màu từ COLOR_CONFIG để đảm bảo tính nhất quán theo thiết kế
  const chartColors = {
    stroke: isPositiveTrend ? COLOR_CONFIG.CHART.POSITIVE : COLOR_CONFIG.CHART.NEGATIVE, // Màu theo chuẩn tài chính
    fill: isPositiveTrend 
      ? `${COLOR_CONFIG.CHART.POSITIVE}15` // Giảm opacity xuống 15% cho vùng fill 
      : `${COLOR_CONFIG.CHART.NEGATIVE}15`,
    text: isPositiveTrend 
      ? "text-success dark:text-success" // Sử dụng biến CSS --success
      : "text-destructive dark:text-destructive", // Sử dụng biến CSS --destructive
    bg: isPositiveTrend 
      ? "bg-success/10 dark:bg-success/15" // Giảm opacity cho nền badge
      : "bg-destructive/10 dark:bg-destructive/15"
  };
  
  /**
   * IMPORTANT: Quy tắc tính toán số dư tài khoản
   * 
   * 1. Khi chưa có giao dịch:
   *    - Current Balance = Initial Balance
   *    - KHÔNG hiển thị P&L và phần trăm lãi/lỗ
   * 
   * 2. Khi đã có giao dịch:
   *    - Current Balance = Initial Balance + Tổng P&L của tất cả giao dịch đã đóng
   *    - P&L = Current Balance - Initial Balance
   *    - P&L Percentage = (P&L / Initial Balance) * 100
   * 
   * Chi tiết tham khảo tại: client/src/lib/balance-calculation-rules.ts
   */
  // Calculate initial and current values for display
  const initialBalance = data[0].balance;
  const currentBalance = data[data.length - 1].balance;
  const change = currentBalance - initialBalance;
  const percentChange = (change / initialBalance) * 100;
  
  // Tính toán giá trị tối thiểu và tối đa cho domain của biểu đồ
  const minBalance = Math.min(...data.map(d => d.balance));
  const maxBalance = Math.max(...data.map(d => d.balance));
  const balanceRange = maxBalance - minBalance;
  
  // Tính toán domain để đảm bảo đường line nằm ở khoảng 2/3 biểu đồ

  const domainMin = minBalance - balanceRange * 1.5;
  const domainMax = maxBalance + balanceRange * 0.1;
  
  const formattedPercentChange = `${isPositiveTrend ? "+" : ""}${percentChange.toFixed(1)}%`;
  
  // Gradient variant based on performance
  const gradientVariant = isPositiveTrend ? 'success' : 'destructive';

  return (
    <Card className="relative overflow-hidden card-spotlight">
      <CardGradient 
        variant={gradientVariant}
        intensity="subtle"
        direction="top-left"
      />
      
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <CardIcon
            color="primary"
            size="sm"
            variant="soft"
          >
            <Icons.analytics.lineChart className="h-4 w-4" />
          </CardIcon>
          Balance History
        </CardTitle>
        
        <div className={cn(
          "flex items-center px-3 py-1 rounded-full text-xs font-medium",
          chartColors.bg, chartColors.text
        )}>
          {isPositiveTrend ? 
            <Icons.trade.arrowUp className="h-3.5 w-3.5 mr-1" /> : 
            <Icons.trade.arrowDown className="h-3.5 w-3.5 mr-1" />}
          {formattedPercentChange}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="balance-chart-container" style={{ minHeight: '200px' }}>
          <ResponsiveContainer width="100%" height="100%" minHeight={200}>
            <AreaChart
              data={data}
              margin={{
                top: 10,
                right: 0,
                left: 0,
                bottom: 0,
              }}
            >
              <defs>
                <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop 
                    offset="5%" 
                    stopColor={chartColors.stroke} 
                    stopOpacity={parseFloat(getComputedStyle(document.documentElement)
                      .getPropertyValue('--balance-chart-gradient-opacity-top')) || 0.2}
                  />
                  <stop 
                    offset="95%" 
                    stopColor={chartColors.stroke} 
                    stopOpacity={parseFloat(getComputedStyle(document.documentElement)
                      .getPropertyValue('--balance-chart-gradient-opacity-bottom')) || 0}
                  />
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="formattedDate" 
                axisLine={false}
                tickLine={false}
                tick={{ 
                  fontSize: 11, 
                  fill: isDarkMode ? "#FFFFFF" : "#000000", 
                  fontWeight: 600 
                }}
                tickMargin={8} // Chuẩn hóa theo quy tắc 4px
              />
              <YAxis 
                hide={true}
                domain={[domainMin, domainMax]}
                // Cài đặt domain để đảm bảo đường line nằm ở vị trí 2/3 biểu đồ
                tickFormatter={(value) => {
                  // Ẩn các giá trị trục Y, chỉ dùng để điều chỉnh tỷ lệ
                  return '';
                }}
              />
              <Tooltip 
                content={<CustomTooltip />} 
                cursor={{
                  stroke: "hsl(var(--muted-foreground))",
                  strokeWidth: 1,
                  strokeDasharray: '3 3'
                }}
              />
              <Area
                type="monotone"
                dataKey="balance"
                stroke={chartColors.stroke}
                strokeWidth={parseInt(getComputedStyle(document.documentElement)
                  .getPropertyValue('--balance-chart-line-width')) || 2}
                fillOpacity={1}
                fill="url(#balanceGradient)"
                activeDot={{ 
                  r: parseInt(getComputedStyle(document.documentElement)
                    .getPropertyValue('--balance-chart-point-size')) || 6, 
                  fill: chartColors.stroke, 
                  stroke: "hsl(var(--background))", 
                  strokeWidth: 2 
                }}
                animationDuration={parseInt(getComputedStyle(document.documentElement)
                  .getPropertyValue('--balance-chart-anim-speed')) || 1000}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}