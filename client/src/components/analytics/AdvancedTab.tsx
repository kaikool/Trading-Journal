import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { calculateWinRate } from "@/lib/forex-calculator";
import { Badge } from "@/components/ui/badge";
import {
  LineChart as RechartsLineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Legend,
  ScatterChart,
  Scatter as RechartsScatter,
  ZAxis,
} from "recharts";
import { Icons } from "@/components/icons/icons";
import { format, subDays, parseISO, differenceInDays } from "date-fns";
import { formatCurrency } from "@/lib/utils";
import { CHART_CONFIG, UI_CONFIG } from "@/lib/config";
import { useTimestamp } from "@/hooks/use-timestamp";

interface AdvancedTabProps {
  data: {
    trades: any[];
    initialBalance: number;
  };
}

export default function AdvancedTab({ data }: AdvancedTabProps) {
  const { trades, initialBalance } = data;
  const timestamp = useTimestamp();
  
  // Calculate cumulative P&L over time with drawdowns
  const cumulativePnLData = useMemo(() => {
    if (!trades.length) return { timeData: [], maxDrawdown: 0, maxDrawdownPercent: 0 };
    
    // Sort trades by date sử dụng dịch vụ timestamp
    const sortedTrades = [...trades]
      .filter(trade => {
        // Đảm bảo closeDate tồn tại và có thể parse
        const date = timestamp.parse(trade.closeDate);
        return !!date;
      })
      .sort((a, b) => {
        const dateA = timestamp.parse(a.closeDate);
        const dateB = timestamp.parse(b.closeDate);
        
        if (!dateA || !dateB) return 0;
        return dateA.getTime() - dateB.getTime();
      });
    
    // Calculate cumulative P&L
    let runningBalance = initialBalance;
    let peakBalance = initialBalance;
    let maxDrawdown = 0;
    let maxDrawdownPercent = 0;
    
    const timeData = sortedTrades.map((trade, index) => {
      // Update balance
      runningBalance += (trade.profitLoss || 0);
      
      // Calculate drawdown
      if (runningBalance > peakBalance) {
        peakBalance = runningBalance;
      }
      
      const currentDrawdown = peakBalance - runningBalance;
      const currentDrawdownPercent = (currentDrawdown / peakBalance) * 100;
      
      if (currentDrawdown > maxDrawdown) {
        maxDrawdown = currentDrawdown;
        maxDrawdownPercent = currentDrawdownPercent;
      }
      
      return {
        tradeIndex: index + 1,
        date: timestamp.format(trade.closeDate, 'MMM dd'),
        balance: runningBalance,
        profitLoss: trade.profitLoss || 0,
        drawdown: currentDrawdown,
        drawdownPercent: currentDrawdownPercent.toFixed(2)
      };
    });
    
    return { timeData, maxDrawdown, maxDrawdownPercent };
  }, [trades, initialBalance, timestamp]);
  
  // Calculate trading volume by day of week
  const dayOfWeekData = useMemo(() => {
    if (!trades.length) return [];
    
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayData = daysOfWeek.map(day => ({ 
      day, 
      count: 0, 
      wins: 0, 
      losses: 0, 
      winRate: 0,
      profitLoss: 0 
    }));
    
    // Count trades and calculate P&L by day of week
    trades
      .filter(trade => {
        // Đảm bảo closeDate tồn tại và có thể parse
        const date = timestamp.parse(trade.closeDate);
        return !!date;
      })
      .forEach(trade => {
        try {
          const closeDate = timestamp.parse(trade.closeDate);
          if (!closeDate) return;
          
          const dayOfWeek = closeDate.getDay();
          
          dayData[dayOfWeek].count += 1;
          
          if ((trade.profitLoss || 0) > 0) {
            dayData[dayOfWeek].wins += 1;
          } else {
            dayData[dayOfWeek].losses += 1;
          }
          
          dayData[dayOfWeek].profitLoss += (trade.profitLoss || 0);
        } catch (error) {
          console.error("Error processing trade for day of week:", error);
        }
      });
    
    // Calculate win rates using the standard calculateWinRate function
    dayData.forEach(day => {
      if (day.count > 0) {
        // Create temporary trades array for each day
        const tempTrades = [
          ...Array(day.wins).fill({ pips: 1 }),       // Trades thắng
          ...Array(day.losses).fill({ pips: -1 }),    // Trades thua
          ...Array(day.count - day.wins - day.losses).fill({ pips: 0 }) // Trades hòa
        ];
        day.winRate = calculateWinRate(tempTrades);
      }
    });
    
    return dayData;
  }, [trades, timestamp]);
  
  // Calculate trade risk vs reward scatterplot data
  const riskRewardData = useMemo(() => {
    if (!trades.length) return { scatterData: [], averageRatio: 0 };
    
    // Filter trades with valid risk/reward data
    const tradesWithRiskReward = trades.filter(trade => 
      trade.entryPrice && 
      trade.stopLoss && 
      trade.takeProfit &&
      trade.profitLoss !== undefined &&
      trade.profitLoss !== null
    );
    
    if (tradesWithRiskReward.length === 0) return { scatterData: [], averageRatio: 0 };
    
    // Calculate risk and reward for each trade
    const scatterData = tradesWithRiskReward.map(trade => {
      // Simple risk calculation (entry to stop loss) in pips
      const riskPips = Math.abs(trade.entryPrice - trade.stopLoss);
      
      // Simple reward calculation (entry to take profit) in pips
      const rewardPips = Math.abs(trade.takeProfit - trade.entryPrice);
      
      // Calculate risk:reward ratio
      const ratio = rewardPips / riskPips;
      
      return {
        id: trade.id,
        pair: trade.pair,
        ratio: parseFloat(ratio.toFixed(2)),
        result: (trade.profitLoss || 0) > 0 ? 'win' : 'loss',
        profitLoss: trade.profitLoss || 0
      };
    });
    
    // Calculate average risk:reward ratio
    const totalRatio = scatterData.reduce((sum, item) => sum + item.ratio, 0);
    const averageRatio = parseFloat((totalRatio / scatterData.length).toFixed(2));
    
    return { scatterData, averageRatio };
  }, [trades, timestamp]);
  
  // Check if we have enough data for meaningful analysis
  const hasEnoughData = useMemo(() => {
    return trades.length >= 5;
  }, [trades]);

  // Generate insights based on statistical analysis
  const advancedInsights = useMemo(() => {
    // If not enough data, return empty insights
    if (!hasEnoughData) return [];

    const insights: {
      type: 'positive' | 'warning' | 'suggestion';
      icon: JSX.Element;
      title: string;
      description: string;
    }[] = [];

    // Analyze day of week performance
    if (dayOfWeekData.some(day => day.count >= 3)) {
      // Find best and worst days
      const tradingDays = dayOfWeekData.filter(day => day.count >= 3);
      const bestDay = [...tradingDays].sort((a, b) => b.winRate - a.winRate)[0];
      const worstDay = [...tradingDays].sort((a, b) => a.winRate - b.winRate)[0];
      
      if (bestDay && bestDay.winRate >= 60) {
        insights.push({
          type: 'positive',
          icon: <Icons.ui.success className="h-4 w-4" />,
          title: 'Most Profitable Trading Day',
          description: `${bestDay.day} shows your highest win rate at ${bestDay.winRate.toFixed(1)}%. Consider allocating more capital or taking more setups on this day.`
        });
      }
      
      if (worstDay && worstDay.winRate <= 40 && worstDay.count >= 5) {
        insights.push({
          type: 'warning',
          icon: <Icons.ui.warning className="h-4 w-4" />,
          title: 'Least Profitable Trading Day',
          description: `Your performance on ${worstDay.day} is significantly below average with ${worstDay.winRate.toFixed(1)}% win rate. Consider reducing position sizes or avoiding trading on this day.`
        });
      }
      
      // Check for weekend trading
      const weekendData = dayOfWeekData.filter(day => 
        (day.day === 'Saturday' || day.day === 'Sunday') && day.count > 0
      );
      
      if (weekendData.length > 0) {
        const weekendTrades = weekendData.reduce((sum, day) => sum + day.count, 0);
        insights.push({
          type: 'suggestion',
          icon: <Icons.general.calendar className="h-4 w-4" />,
          title: 'Weekend Trading',
          description: `You've placed ${weekendTrades} trades on weekends when forex liquidity is typically lower. Consider limiting weekend trading to reduce spread and slippage risks.`
        });
      }
    }
    
    // Analyze drawdowns
    if (cumulativePnLData.maxDrawdownPercent > 0) {
      if (cumulativePnLData.maxDrawdownPercent > 25) {
        insights.push({
          type: 'warning',
          icon: <Icons.trade.entry className="h-4 w-4" />,
          title: 'Significant Drawdown Risk',
          description: `Your maximum drawdown of ${cumulativePnLData.maxDrawdownPercent.toFixed(1)}% exceeds recommended limits. Consider reducing position sizes and implementing stricter stop-loss discipline.`
        });
      } else if (cumulativePnLData.maxDrawdownPercent < 10 && trades.length >= 15) {
        insights.push({
          type: 'positive',
          icon: <Icons.ui.shieldCheck className="h-4 w-4" />,
          title: 'Effective Risk Management',
          description: `You've maintained a reasonable maximum drawdown of ${cumulativePnLData.maxDrawdownPercent.toFixed(1)}%, indicating good risk management practices. Continue your disciplined approach.`
        });
      }
    }
    
    // Risk:Reward ratio analysis
    if (riskRewardData.scatterData.length >= 5) {
      if (riskRewardData.averageRatio < 1) {
        insights.push({
          type: 'warning',
          icon: <Icons.ui.warning className="h-4 w-4" />,
          title: 'Low Risk:Reward Ratio',
          description: `Your average risk:reward ratio of 1:${riskRewardData.averageRatio} is below the recommended 1:1.5 minimum. Focus on finding setups with higher reward potential relative to risk.`
        });
      } else if (riskRewardData.averageRatio >= 2) {
        insights.push({
          type: 'positive',
          icon: <Icons.ui.success className="h-4 w-4" />,
          title: 'Excellent Risk:Reward Ratio',
          description: `Your average risk:reward ratio of 1:${riskRewardData.averageRatio} exceeds the recommended minimum of 1:1.5. This positive expectancy means you can be profitable even with a lower win rate.`
        });
      }
      
      // Check if high R:R trades have lower win rates
      const highRRTrades = riskRewardData.scatterData.filter(trade => trade.ratio >= 2);
      const lowRRTrades = riskRewardData.scatterData.filter(trade => trade.ratio < 2);
      
      if (highRRTrades.length >= 3 && lowRRTrades.length >= 3) {
        // Chuẩn hóa cách tính win rate cho high RR trades
        const highRRWins = highRRTrades.filter(t => t.result === 'win').length;
        const highRRLosses = highRRTrades.filter(t => t.result === 'loss').length;
        const highRRTemp = [
          ...Array(highRRWins).fill({ pips: 1 }),
          ...Array(highRRLosses).fill({ pips: -1 }),
          ...Array(highRRTrades.length - highRRWins - highRRLosses).fill({ pips: 0 })
        ];
        const highRRWinRate = calculateWinRate(highRRTemp);
        
        // Chuẩn hóa cách tính win rate cho low RR trades
        const lowRRWins = lowRRTrades.filter(t => t.result === 'win').length;
        const lowRRLosses = lowRRTrades.filter(t => t.result === 'loss').length;
        const lowRRTemp = [
          ...Array(lowRRWins).fill({ pips: 1 }),
          ...Array(lowRRLosses).fill({ pips: -1 }),
          ...Array(lowRRTrades.length - lowRRWins - lowRRLosses).fill({ pips: 0 })
        ];
        const lowRRWinRate = calculateWinRate(lowRRTemp);
        
        if (highRRWinRate < lowRRWinRate - 15) {
          insights.push({
            type: 'suggestion',
            icon: <Icons.analytics.lightbulb className="h-4 w-4" />,
            title: 'Higher R:R Trade Management',
            description: `Your win rate on trades with R:R above 1:2 is ${highRRWinRate.toFixed(1)}%, which is lower than on your smaller target trades. Consider using partial profit taking to secure more wins on these trades.`
          });
        }
      }
    }
    
    // Add more insights based on equity curve
    if (cumulativePnLData.timeData.length >= 10) {
      // Check for recent performance trend
      const recentTrades = cumulativePnLData.timeData.slice(-5);
      const recentProfits = recentTrades.filter(t => t.profitLoss > 0).length;
      const recentLosses = recentTrades.filter(t => t.profitLoss < 0).length;
      
      if (recentProfits >= 4) {
        insights.push({
          type: 'positive',
          icon: <Icons.analytics.trendingUp className="h-4 w-4" />,
          title: 'Strong Recent Performance',
          description: `You're currently in a positive performance streak with ${recentProfits} profitable trades in your last 5. Focus on maintaining your current trading strategy and psychology.`
        });
      } else if (recentLosses >= 4) {
        insights.push({
          type: 'warning',
          icon: <Icons.ui.warning className="h-4 w-4" />,
          title: 'Recent Performance Dip',
          description: `You've experienced ${recentLosses} losing trades in your last 5. Consider taking a short break or reducing position sizes until your performance stabilizes.`
        });
      }
    }
    
    return insights;
  }, [hasEnoughData, trades, dayOfWeekData, cumulativePnLData, riskRewardData]);

  // Chart colors
  const COLORS = CHART_CONFIG.COLORS;
  
  // Custom tooltip for cumulative P&L
  const CumulativePnLTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background/95 border border-muted shadow-md rounded-md p-2.5 text-sm backdrop-blur-sm">
          <p className="font-semibold mb-1">{data.date} - Trade #{data.tradeIndex}</p>
          <p className="text-xs flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Balance:</span>
            <span className="font-medium">{formatCurrency(data.balance)}</span>
          </p>
          <p className={`text-xs flex items-center justify-between gap-2 ${data.profitLoss >= 0 ? 'text-success' : 'text-destructive'}`}>
            <span className="text-muted-foreground">Trade P/L:</span>
            <span className="font-medium">
              {data.profitLoss >= 0 ? '+' : ''}
              {formatCurrency(data.profitLoss)}
            </span>
          </p>
          <p className="text-xs flex items-center justify-between gap-2 text-destructive">
            <span className="text-muted-foreground">Drawdown:</span>
            <span className="font-medium">
              {formatCurrency(data.drawdown)} ({data.drawdownPercent}%)
            </span>
          </p>
        </div>
      );
    }
    return null;
  };
  
  // Custom tooltip for day of week stats
  const DayOfWeekTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background/95 border border-muted shadow-md rounded-md p-2.5 text-sm backdrop-blur-sm">
          <p className="font-semibold mb-1">{data.day}</p>
          <p className="text-xs flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Total Trades:</span>
            <span className="font-medium">{data.count}</span>
          </p>
          <p className="text-xs flex items-center justify-between gap-2 text-success">
            <span className="text-muted-foreground">Wins:</span>
            <span className="font-medium">{data.wins}</span>
          </p>
          <p className="text-xs flex items-center justify-between gap-2 text-destructive">
            <span className="text-muted-foreground">Losses:</span>
            <span className="font-medium">{data.losses}</span>
          </p>
          <p className="text-xs flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Win Rate:</span>
            <span className="font-medium">{data.winRate.toFixed(1)}%</span>
          </p>
          <p className={`text-xs flex items-center justify-between gap-2 ${data.profitLoss >= 0 ? 'text-success' : 'text-destructive'}`}>
            <span className="text-muted-foreground">Net P/L:</span>
            <span className="font-medium">
              {data.profitLoss >= 0 ? '+' : ''}
              {formatCurrency(data.profitLoss)}
            </span>
          </p>
        </div>
      );
    }
    return null;
  };
  
  // Custom tooltip for risk/reward scatter plot
  const RiskRewardTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background/95 border border-muted shadow-md rounded-md p-2.5 text-sm backdrop-blur-sm">
          <p className="font-semibold mb-1">{data.pair}</p>
          <p className="text-xs flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Risk:Reward Ratio:</span>
            <span className="font-medium">1:{data.ratio}</span>
          </p>
          <p className={`text-xs flex items-center justify-between gap-2 ${data.result === 'win' ? 'text-success' : 'text-destructive'}`}>
            <span className="text-muted-foreground">Result:</span>
            <span className="font-medium">
              {data.result === 'win' ? 'Win' : 'Loss'} ({formatCurrency(data.profitLoss)})
            </span>
          </p>
        </div>
      );
    }
    return null;
  };
  
  // Insufficient data component
  const InsufficientDataCard = () => (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold flex items-center">
          <Icons.general.database className="h-5 w-5 mr-2 text-primary" />
          More Trading Data Needed
        </CardTitle>
        <CardDescription>
          Continue recording detailed trades to unlock advanced analytics
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-start gap-3">
          <div className="mt-0.5 p-1.5 rounded-full bg-primary/10 text-primary">
            <Icons.analytics.lightbulb className="h-4 w-4" />
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              To get meaningful advanced insights, continue recording your trades with complete risk/reward metrics. 
              We recommend at least 10-15 trades with full details for reliable analysis.
            </p>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
              <li>Always include entry price, stop loss, and take profit levels</li>
              <li>Record trade result and final P&L for each position</li>
              <li>Trade consistently to identify meaningful patterns</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Advanced Insights or Insufficient Data Message */}
      {!hasEnoughData && <InsufficientDataCard />}
      
      {hasEnoughData && advancedInsights.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex items-center">
              <Icons.analytics.lightbulb className="h-5 w-5 mr-2 text-primary" />
              Advanced Analytics Insights
            </CardTitle>
            <CardDescription>
              Actionable recommendations based on statistical analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {advancedInsights.map((insight, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className={`mt-0.5 p-1.5 rounded-full ${
                    insight.type === 'positive' ? 'bg-success/10 text-success' :
                    insight.type === 'warning' ? 'bg-destructive/10 text-destructive' :
                    'bg-primary/10 text-primary'
                  }`}>
                    {insight.icon}
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-1">{insight.title}</h4>
                    <p className="text-xs text-muted-foreground">{insight.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Cumulative P&L with Drawdown Analysis */}
      <Card className="border shadow-sm border-border/40">
        <CardHeader className="pb-2 pt-4 px-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-xl font-semibold flex items-center">
              <Icons.analytics.lineChart className="h-5 w-5 mr-2 text-primary" />
              Equity Curve with Drawdown
            </CardTitle>
            
            <Badge variant="outline" className="px-3 py-1 bg-primary/5 text-xs font-medium">
              Max DD: {cumulativePnLData.maxDrawdownPercent.toFixed(1)}%
            </Badge>
          </div>
          <CardDescription>
            Account equity progression with maximum drawdown: {formatCurrency(cumulativePnLData.maxDrawdown)}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-4">
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={cumulativePnLData.timeData}
                margin={{ top: 4, right: 4, left: 4, bottom: 4 }} /* Tuân thủ tiêu chuẩn margin 4px đồng nhất */
              >
                <defs>
                  <linearGradient id="colorPnL" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS[0]} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={COLORS[0]} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  vertical={false} 
                  stroke="hsl(var(--muted-foreground)/15)" 
                />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={{ stroke: 'hsl(var(--muted-foreground)/20)' }}
                  tickMargin={4} // Chuẩn hóa theo quy tắc 4px
                />
                <YAxis 
                  tickFormatter={(value) => formatCurrency(value, true)}
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={4} // Chuẩn hóa theo quy tắc 4px
                />
                <Tooltip content={<CumulativePnLTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="balance" 
                  stroke={COLORS[0]} 
                  fill="url(#colorPnL)" 
                  activeDot={{ r: 4, strokeWidth: 1, stroke: 'white' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      {/* Day of Week Analysis and Risk/Reward Scatter */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Day of Week Analysis */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex items-center">
              <Icons.general.calendar className="h-5 w-5 mr-2 text-primary" />
              Trading Performance by Day
            </CardTitle>
            <CardDescription>
              Win rates and profitability by day of the week
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4">
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={dayOfWeekData}
                  margin={{ top: 4, right: 4, left: 4, bottom: 4 }} /* Tuân thủ tiêu chuẩn margin 4px đồng nhất */
                >
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    vertical={false} 
                    stroke="hsl(var(--muted-foreground)/15)" 
                  />
                  <XAxis 
                    dataKey="day" 
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={false}
                    axisLine={{ stroke: 'hsl(var(--muted-foreground)/20)' }}
                    tickMargin={4} // Chuẩn hóa theo quy tắc 4px
                  />
                  <YAxis 
                    tickFormatter={(value) => `${value}%`}
                    domain={[0, 100]}
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={4} // Chuẩn hóa theo quy tắc 4px
                  />
                  <Tooltip content={<DayOfWeekTooltip />} />
                  <Bar 
                    dataKey="winRate" 
                    fill={COLORS[1]} 
                    radius={[4, 4, 0, 0]}
                    barSize={16}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        {/* Risk/Reward Scatter Plot */}
        <Card className="border shadow-sm border-border/40">
          <CardHeader className="pb-2 pt-4 px-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-xl font-semibold flex items-center">
                <Icons.analytics.barChart className="h-5 w-5 mr-2 text-primary" />
                Risk:Reward Analysis
              </CardTitle>
              
              <Badge variant="outline" className="px-3 py-1 bg-primary/5 text-xs font-medium">
                1:{riskRewardData.averageRatio} avg
              </Badge>
            </div>
            <CardDescription>
              Trade outcomes vs. risk:reward ratios
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4">
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart
                  margin={{ top: 4, right: 4, left: 4, bottom: 4 }} /* Tuân thủ tiêu chuẩn margin 4px đồng nhất */
                >
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke="hsl(var(--muted-foreground)/15)" 
                  />
                  <XAxis 
                    type="number"
                    dataKey="ratio" 
                    name="Risk:Reward" 
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={false}
                    axisLine={{ stroke: 'hsl(var(--muted-foreground)/20)' }}
                    tickMargin={4} // Chuẩn hóa theo quy tắc 4px
                    label={{ 
                      value: 'Risk:Reward Ratio', 
                      position: 'insideBottom', 
                      offset: -2, 
                      fill: 'hsl(var(--muted-foreground))',
                      fontSize: 10
                    }}
                  />
                  <YAxis 
                    type="number"
                    dataKey="profitLoss" 
                    name="Profit/Loss" 
                    tickFormatter={(value) => formatCurrency(value, true)}
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={4} // Chuẩn hóa theo quy tắc 4px
                    label={{
                      value: 'Profit/Loss',
                      angle: -90,
                      position: 'insideLeft',
                      offset: 5,
                      fill: 'hsl(var(--muted-foreground))',
                      fontSize: 10
                    }}
                  />
                  <Tooltip content={<RiskRewardTooltip />} />
                  <RechartsScatter 
                    name="Trades" 
                    data={riskRewardData.scatterData} 
                    fill={COLORS[0]}
                    shape={(props: any) => {
                      const { cx, cy, fill } = props;
                      const result = props.payload.result;
                      
                      return (
                        <circle 
                          cx={cx} 
                          cy={cy} 
                          r={4} 
                          fill={result === 'win' ? 'hsl(var(--success))' : 'hsl(var(--destructive))'}
                          stroke="white"
                          strokeWidth={0.5}
                        />
                      );
                    }}
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center mt-0.5 text-[10px] text-muted-foreground">
              <div className="flex items-center mr-3">
                <div className="w-1.5 h-1.5 rounded-full bg-success mr-1"></div>
                <span>Winning Trades</span>
              </div>
              <div className="flex items-center">
                <div className="w-1.5 h-1.5 rounded-full bg-destructive mr-1"></div>
                <span>Losing Trades</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}