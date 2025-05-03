import { useMemo, memo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { ArrowUpCircle, ArrowDownCircle, LineChart, PieChartIcon, TrendingUp, CircleDollarSign } from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import { subDays, isAfter } from "date-fns";
import { CHART_CONFIG, UI_CONFIG, COLOR_CONFIG } from "@/lib/config";
import { useTimestamp, DateFormat } from "@/hooks/use-timestamp";
import { calculateWinRate, calculateProfitFactor } from "@/lib/forex-calculator";

interface KPICardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    value: string | number;
  };
}

// Tối ưu hóa KPICard với memo để giảm re-render
const KPICard = memo(function KPICard({ title, value, description, icon, trend }: KPICardProps) {
  return (
    <Card className="border shadow-sm hover:shadow-md transition-all">
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-md font-semibold">{title}</CardTitle>
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
        {trend && (
          <div className="flex items-center mt-2">
            {trend.direction === 'up' ? (
              <ArrowUpCircle className="text-success h-4 w-4 mr-1" />
            ) : trend.direction === 'down' ? (
              <ArrowDownCircle className="text-destructive h-4 w-4 mr-1" />
            ) : (
              <div className="w-4 mr-1" />
            )}
            <span className={`text-xs ${
              trend.direction === 'up' ? 'text-success' : 
              trend.direction === 'down' ? 'text-destructive' : 
              'text-muted-foreground'
            }`}>
              {trend.value}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

interface OverviewTabProps {
  data: {
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    winRate: number;
    netProfit: number;
    initialBalance: number;
    currentBalance: number;
    pairPerformance: any[];
    strategyPerformance: any[];
    emotionPerformance: any[];
    disciplineMetrics: any;
    trades: any[];
  };
}

function OverviewTabContent({ data }: OverviewTabProps) {
  // Sử dụng hook timestamp cho việc xử lý ngày tháng
  const timestamp = useTimestamp({
    defaultFormat: DateFormat.CHART
  });
  
  const {
    totalTrades,
    winningTrades,
    losingTrades,
    winRate,
    netProfit,
    initialBalance,
    currentBalance,
    pairPerformance,
    trades
  } = data;

  // Monthly performance data for equity curve
  const equityCurveData = useMemo(() => {
    // Đã xóa console.log để tăng hiệu suất
    
    // Sử dụng tiện ích timestamp để tạo dữ liệu biểu đồ từ trades
    return timestamp.createTimeSeriesData(trades, initialBalance, { sortByDate: true });
  }, [trades, initialBalance, timestamp]);

  // Format profit/loss as currency
  const formattedProfit = formatCurrency(netProfit);
  
  // Calculate profit/loss percentage
  const profitLossPercentage = initialBalance ? ((netProfit / initialBalance) * 100) : 0;
  
  // Top-performing pairs for pie chart (limit to top 5)
  const topPerformingPairs = useMemo(() => {
    return [...pairPerformance]
      .sort((a, b) => b.netProfit - a.netProfit)
      .slice(0, 5)
      .map(pair => ({
        ...pair,
        name: pair.pair,
        value: Math.abs(pair.netProfit)
      }));
  }, [pairPerformance]);

  // Recent performance trend (last 7 days vs previous 7 days)
  const recentPerformanceTrend = useMemo(() => {
    if (!trades.length) return { direction: 'neutral' as const, value: '0%' };
    
    const today = new Date();
    const last7Days = subDays(today, 7);
    const previous7Days = subDays(last7Days, 7);
    
    // Filter trades for the last 7 days using timestamp helper
    const last7DaysTrades = trades.filter(trade => {
      const tradeDate = timestamp.parse(trade.closeDate);
      if (!tradeDate) return false;
      return isAfter(tradeDate, last7Days);
    });
    
    // Filter trades for the previous 7 days using timestamp helper
    const previous7DaysTrades = trades.filter(trade => {
      const tradeDate = timestamp.parse(trade.closeDate);
      if (!tradeDate) return false;
      return isAfter(tradeDate, previous7Days) && !isAfter(tradeDate, last7Days);
    });
    
    // Calculate profit for both periods
    const last7DaysProfit = last7DaysTrades.reduce((sum, trade) => sum + (trade.profitLoss || 0), 0);
    const previous7DaysProfit = previous7DaysTrades.reduce((sum, trade) => sum + (trade.profitLoss || 0), 0);
    
    // Determine trend direction
    let direction: 'up' | 'down' | 'neutral' = 'neutral';
    let value = '0%';
    
    if (previous7DaysProfit !== 0) {
      const percentageChange = ((last7DaysProfit - previous7DaysProfit) / Math.abs(previous7DaysProfit)) * 100;
      
      if (percentageChange > 0) {
        direction = 'up';
        value = `+${percentageChange.toFixed(1)}%`;
      } else if (percentageChange < 0) {
        direction = 'down';
        value = `${percentageChange.toFixed(1)}%`;
      }
    } else if (last7DaysProfit > 0) {
      direction = 'up';
      value = '+100%';
    } else if (last7DaysProfit < 0) {
      direction = 'down';
      value = '-100%';
    }
    
    return { 
      direction: direction === 'up' ? 'up' as const : 
                direction === 'down' ? 'down' as const : 
                'neutral' as const, 
      value 
    };
  }, [trades, timestamp]);

  // Generate trading activity data (trades per month)
  const tradingActivityData = useMemo(() => {
    if (!trades.length) return [];
    
    // Nhóm các giao dịch theo tháng
    const tradesByMonth = timestamp.groupTradesByMonth(trades, { dateProp: 'closeDate' });
    
    // Chuyển đổi dữ liệu thành định dạng cần thiết cho biểu đồ, dựa trên pips thay vì profitLoss
    const monthlyData = Object.entries(tradesByMonth).map(([month, monthTrades]) => {
      const wins = monthTrades.filter(trade => (trade.pips || 0) > 0).length;
      const losses = monthTrades.filter(trade => (trade.pips || 0) < 0).length;
      const breakEven = monthTrades.filter(trade => (trade.pips || 0) === 0).length;
      
      return {
        month,
        trades: monthTrades.length,
        wins,
        losses,
        breakEven
      };
    });
    
    // Sắp xếp theo tháng
    return monthlyData.sort((a, b) => {
      const monthA = a.month.split(' ');
      const monthB = b.month.split(' ');
      
      // So sánh năm trước
      const yearA = parseInt(monthA[1]);
      const yearB = parseInt(monthB[1]);
      if (yearA !== yearB) return yearA - yearB;
      
      // Nếu cùng năm, so sánh tháng
      const monthOrder: Record<string, number> = { 
        'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'May': 5, 'Jun': 6, 
        'Jul': 7, 'Aug': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12 
      };
      
      // Lấy giá trị tháng hoặc mặc định là 0 nếu không tìm thấy
      const monthValueA = monthA[0] in monthOrder ? monthOrder[monthA[0]] : 0;
      const monthValueB = monthB[0] in monthOrder ? monthOrder[monthB[0]] : 0;
      
      return monthValueA - monthValueB;
    });
  }, [trades, timestamp]);

  // Chart colors from configuration
  const COLORS = CHART_CONFIG.COLORS;

  // Custom tooltip for the equity curve - Tối ưu hóa với memo
  const EquityCurveTooltip = memo(({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    
    return (
      <div className="bg-background/95 border border-muted shadow-sm rounded-md p-1.5 text-xs backdrop-blur-sm">
        <p className="font-medium">{payload[0].payload.date}</p>
        <div className="flex flex-col gap-0.5 mt-0.5">
          <div className="flex items-center gap-1.5">
            <span>{formatCurrency(payload[0].value)}</span>
          </div>
          {payload[0].payload.profit && (
            <div className="flex items-center gap-1.5">
              <span className={payload[0].payload.profit >= 0 ? 'text-success' : 'text-destructive'}>
                {payload[0].payload.profit >= 0 ? '+' : ''}
                {formatCurrency(payload[0].payload.profit)}
              </span>
              <span className="text-muted-foreground text-[10px]">P/L</span>
            </div>
          )}
        </div>
      </div>
    );
  });

  // Custom tooltip for the trading activity chart - Tối ưu hóa với memo
  const TradingActivityTooltip = memo(({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    
    const data = payload[0].payload;
    // Tạo mảng trades tạm thời để tính win rate bằng hàm chuẩn
    const tempTrades = [
      ...Array(data.wins).fill({ pips: 1 }),       // Trades thắng
      ...Array(data.losses).fill({ pips: -1 }),    // Trades thua
      ...Array(data.breakEven || data.trades - data.wins - data.losses).fill({ pips: 0 }) // Trades hòa
    ];
    const winRate = calculateWinRate(tempTrades).toFixed(0);
    
    return (
      <div className="bg-background/95 border border-muted shadow-sm rounded-md p-1.5 text-xs backdrop-blur-sm">
        <p className="font-medium">{data.month}</p>
        <div className="flex flex-col gap-0.5 mt-0.5">
          <div className="flex items-center gap-1.5">
            <span className="text-success">{data.wins} wins</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-destructive">{data.losses} losses</span>
            {data.breakEven > 0 && (
              <>
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground">{data.breakEven} BE</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-1.5 pt-0.5 mt-0.5 border-t border-muted">
            <span className="text-primary">{winRate}% win rate</span>
            <span className="text-muted-foreground text-[10px]">({data.trades} trades)</span>
          </div>
        </div>
      </div>
    );
  });

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Account Balance"
          value={formatCurrency(currentBalance)}
          description={`Initial: ${formatCurrency(initialBalance)}`}
          icon={<CircleDollarSign className="h-5 w-5" />}
          trend={{
            direction: netProfit >= 0 ? 'up' as const : 'down' as const,
            value: `${netProfit >= 0 ? '+' : ''}${formattedProfit} (${netProfit >= 0 ? '+' : ''}${profitLossPercentage.toFixed(1)}%)`
          }}
        />
        
        <KPICard
          title="Win Rate"
          value={`${winRate.toFixed(1)}%`}
          description={`${winningTrades} wins, ${losingTrades} losses, ${totalTrades - winningTrades - losingTrades} BE`}
          icon={<TrendingUp className="h-5 w-5" />}
          trend={recentPerformanceTrend}
        />
        
        <KPICard
          title="Total Trades"
          value={totalTrades}
          description="Completed trades"
          icon={<LineChart className="h-5 w-5" />}
        />
        
        <KPICard
          title="Profit Factor"
          value={(() => {
            // Sử dụng hàm calculateProfitFactor từ forex-calculator.ts cho tính nhất quán
            const closedTrades = trades.filter(t => t.status !== "OPEN");
            
            // Gọi hàm chuẩn với tham số đúng
            const profitFactor = calculateProfitFactor(closedTrades, "pips", "profitLoss");
            
            // Xử lý trường hợp đặc biệt
            if (profitFactor === Number.POSITIVE_INFINITY) {
              return '∞';
            }
            
            return profitFactor.toFixed(2);
          })()}
          description="Ratio of gross profit to gross loss"
          icon={<TrendingUp className="h-5 w-5" />}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Equity Curve Chart */}
        <Card className="border shadow-sm border-border/40 overflow-hidden">
          <CardHeader className="pb-2 pt-4 px-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-xl font-semibold flex items-center">
                <LineChart className="h-5 w-5 mr-2 text-primary" />
                Account Equity
              </CardTitle>
              
              <div className="flex items-center gap-3">
                {netProfit !== 0 && (
                  <div className={cn(
                    "flex items-center px-3 py-1 rounded-full text-xs font-medium",
                    netProfit >= 0 
                      ? "bg-success/10 dark:bg-success/15 text-success" 
                      : "bg-destructive/10 dark:bg-destructive/15 text-destructive"
                  )}>
                    {netProfit >= 0 ? 
                      <ArrowUpCircle className="h-3.5 w-3.5 mr-1.5" /> : 
                      <ArrowDownCircle className="h-3.5 w-3.5 mr-1.5" />}
                    {netProfit >= 0 ? "+" : ""}{profitLossPercentage.toFixed(1)}%
                  </div>
                )}
              </div>
            </div>
            <CardDescription>
              Account balance progression over {equityCurveData.length} data points
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={equityCurveData}
                  margin={{ top: 4, right: 8, left: 0, bottom: 4 }} 
                  barCategoryGap={12}
                  barGap={6}
                >
                  <defs>
                    <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop 
                        offset="5%" 
                        stopColor={netProfit >= 0 ? COLOR_CONFIG.CHART.POSITIVE : COLOR_CONFIG.CHART.NEGATIVE} 
                        stopOpacity={0.25} 
                      />
                      <stop 
                        offset="95%" 
                        stopColor={netProfit >= 0 ? COLOR_CONFIG.CHART.POSITIVE : COLOR_CONFIG.CHART.NEGATIVE} 
                        stopOpacity={0.05} 
                      />
                    </linearGradient>
                  </defs>
                  {/* Đã xóa CartesianGrid theo yêu cầu */}
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={false}
                    axisLine={{ stroke: 'hsl(var(--muted-foreground)/15)' }}
                    tickMargin={8}
                    minTickGap={20}
                  />
                  <YAxis 
                    hide={true}
                  />
                  <Tooltip 
                    content={<EquityCurveTooltip />} 
                    cursor={{
                      stroke: "hsl(var(--muted-foreground)/30)",
                      strokeWidth: 1,
                      strokeDasharray: '3 3'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="balance" 
                    stroke={netProfit >= 0 ? COLOR_CONFIG.CHART.POSITIVE : COLOR_CONFIG.CHART.NEGATIVE} 
                    strokeWidth={3}
                    fill="url(#balanceGradient)" 
                    activeDot={{ 
                      r: 6, 
                      strokeWidth: 2, 
                      stroke: "hsl(var(--background))",
                      fill: netProfit >= 0 ? COLOR_CONFIG.CHART.POSITIVE : COLOR_CONFIG.CHART.NEGATIVE
                    }}
                    dot={false}
                  />
                  
                  {/* Hiển thị điểm đặc biệt - chỉ hiển thị cao nhất, thấp nhất */}
                  {equityCurveData.map((item, index) => {
                    // Xác định các điểm đặc biệt
                    const isFirst = index === 0;
                    const isLast = index === equityCurveData.length - 1;
                    
                    // Tìm điểm cao nhất và thấp nhất
                    const maxValue = Math.max(...equityCurveData.map(d => d.balance));
                    const minValue = Math.min(...equityCurveData.map(d => d.balance));
                    const isMax = item.balance === maxValue;
                    const isMin = item.balance === minValue;
                    
                    // Bỏ qua điểm đầu và điểm cuối, chỉ hiển thị max/min (không phải đầu/cuối)
                    if (isFirst || isLast || !(isMax || isMin)) {
                      return null;
                    }
                    
                    // Xác định vị trí nhãn (trên/dưới) dựa trên loại điểm
                    const position = isMax ? 'top' : 'bottom';
                    
                    return (
                      <ReferenceLine 
                        key={`point-${index}`}
                        x={item.date}
                        y={item.balance}
                        stroke="transparent"
                        label={{
                          value: `${formatCurrency(item.balance, true)}`,
                          position,
                          offset: 15,
                          fill: 'hsl(var(--foreground))',
                          fontSize: 10,
                          fontWeight: 500,
                        }}
                      />
                    );
                  })}
                  
                  {/* Hiển thị điểm tròn tại vị trí đặc biệt - chỉ tại điểm cao nhất và thấp nhất */}
                  {equityCurveData.map((item, index) => {
                    const isFirst = index === 0;
                    const isLast = index === equityCurveData.length - 1;
                    const maxValue = Math.max(...equityCurveData.map(d => d.balance));
                    const minValue = Math.min(...equityCurveData.map(d => d.balance));
                    const isMax = item.balance === maxValue;
                    const isMin = item.balance === minValue;
                    
                    // Bỏ qua điểm đầu và điểm cuối, chỉ hiển thị điểm min/max
                    if (isFirst || isLast || !(isMax || isMin)) {
                      return null;
                    }
                    
                    // Xác định màu viền của điểm dựa trên loại
                    let strokeColor = isMax ? COLOR_CONFIG.CHART.POSITIVE : COLOR_CONFIG.CHART.NEGATIVE;
                    
                    return (
                      <ReferenceLine 
                        key={`dot-${index}`}
                        x={item.date}
                        stroke="transparent"
                        isFront={true}
                        shape={props => {
                          return (
                            <circle 
                              cx={props.x} 
                              cy={props.y} 
                              r={6} 
                              fill="hsl(var(--background))" 
                              stroke={strokeColor} 
                              strokeWidth={2}
                            />
                          );
                        }}
                      />
                    );
                  })}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Profit by Pair Chart */}
        <Card className="shadow-sm border border-border/40 overflow-hidden h-full">
          <CardHeader className="pb-2 pt-4 px-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-xl font-semibold flex items-center">
                <PieChartIcon className="h-5 w-5 mr-2 text-primary" />
                Currency Pair Performance
              </CardTitle>
              
              <div className="flex items-center gap-3">
                {topPerformingPairs.length > 0 && (
                  <Badge variant="outline" className="px-3 py-1 bg-primary/5 text-xs font-medium">
                    Top 3
                  </Badge>
                )}
              </div>
            </div>
            <CardDescription>
              Top performing currency pairs by profit
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart
                  margin={{ top: 4, right: 8, left: 0, bottom: 4 }} 
                  <Pie
                    data={topPerformingPairs}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    fill="#8884d8"
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                    labelLine={false}
                  >
                    {topPerformingPairs.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]} 
                        stroke="hsl(var(--background))"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const index = topPerformingPairs.findIndex(p => p.name === data.name);
                      const color = COLORS[index % COLORS.length];
                      return (
                        <div className="bg-background/90 backdrop-blur-sm shadow-md border border-primary/20 rounded-md p-2 text-sm">
                          <p className="font-medium text-center" style={{ color }}>{data.name}</p>
                          <div className="mt-1 flex justify-between gap-4">
                            <span className="text-xs text-muted-foreground">Profit:</span>
                            <span className="font-medium">{formatCurrency(data.value)}</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-xs text-muted-foreground">Win Rate:</span>
                            <span className="font-medium">{data.winRate?.toFixed(0) || 0}%</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }} />
                  <Legend 
                    formatter={(value) => {
                      const dataItem = topPerformingPairs.find(item => item.name === value);
                      if (!dataItem) return value;
                      return `${value} (${dataItem.winRate?.toFixed(0) || 0}%)`;
                    }}
                    layout="horizontal"
                    verticalAlign="bottom"
                    align="center"
                    iconSize={6}
                    wrapperStyle={{
                      paddingTop: "4px", 
                      fontSize: "10px",
                      width: "100%",
                      display: "flex",
                      flexWrap: "wrap",
                      justifyContent: "center",
                      rowGap: "4px", 
                    }}
                    iconType="circle"
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trading Activity */}
      <Card className="border shadow-sm border-border/40 overflow-hidden">
        <CardHeader className="pb-2 pt-4 px-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-xl font-semibold flex items-center">
              <BarChart className="h-5 w-5 mr-2 text-primary" />
              Monthly Trading Activity
            </CardTitle>
            
            <div className="flex items-center gap-3">
              {tradingActivityData.length > 0 && (
                <Badge variant="outline" className="px-3 py-1 bg-primary/5 text-xs font-medium">
                  {tradingActivityData.length} {tradingActivityData.length === 1 ? 'month' : 'months'}
                </Badge>
              )}
            </div>
          </div>
          <CardDescription>
            Monthly trade volume with win/loss breakdown
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={tradingActivityData}
                margin={{ top: 4, right: 8, left: 0, bottom: 4 }} 
                barCategoryGap={12}
                barGap={6}
              >
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  vertical={false} 
                  stroke="hsl(var(--muted-foreground)/12)" 
                  strokeWidth={1}
                />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={{ stroke: 'hsl(var(--muted-foreground)/15)' }}
                  tickMargin={8}
                  minTickGap={20}
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  width={35}
                  tickCount={5}
                  domain={[0, 'dataMax']}
                  tickFormatter={(value) => Math.floor(value).toString()}
                />
                <Tooltip content={<TradingActivityTooltip />} />
                <Legend 
                  iconSize={6}
                  wrapperStyle={{
                    fontSize: "10px",
                    paddingTop: "4px", 
                  }}
                  iconType="circle"
                />
                <Bar 
                  dataKey="wins" 
                  stackId="a" 
                  fill={COLOR_CONFIG.CHART.POSITIVE}
                  name="Winning Trades" 
                  radius={[4, 4, 0, 0]}
                  barSize={30}
                  isAnimationActive={false}
                  animationDuration={0}
                  className="hover:opacity-100"
                  onMouseOver={(data, index) => {}}
                  onMouseOut={(data, index) => {}}
                />
                <Bar 
                  dataKey="losses" 
                  stackId="a" 
                  fill={COLOR_CONFIG.CHART.NEGATIVE}
                  name="Losing Trades"
                  radius={[4, 4, 0, 0]}
                  barSize={30}
                  isAnimationActive={false}
                  animationDuration={0}
                  className="hover:opacity-100"
                  onMouseOver={(data, index) => {}}
                  onMouseOut={(data, index) => {}}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Export with memo for performance optimization
const OverviewTab = memo(OverviewTabContent);
export default OverviewTab;