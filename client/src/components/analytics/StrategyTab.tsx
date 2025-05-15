import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Legend,
  Cell,
  ComposedChart,
  Line,
} from "recharts";
import { Icons } from "@/components/icons/icons";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { CHART_CONFIG } from "@/lib/config";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface StrategyTabProps {
  data: {
    strategyPerformance: {
      strategy: string;
      trades: number;
      winRate: number;
      netProfit: number;
    }[];
    trades: any[];
  };
}

export default function StrategyTab({ data }: StrategyTabProps) {
  const { strategyPerformance } = data; // trades không được sử dụng
  
  // Sort strategies by win rate for visualization
  const sortedStrategies = useMemo(() => {
    return [...strategyPerformance]
      .filter(strategy => strategy.trades >= 1) // Strategies with at least 1 trade
      .sort((a, b) => b.winRate - a.winRate);
  }, [strategyPerformance]);
  
  // Sort strategies by profit for visualization
  const profitableStrategies = useMemo(() => {
    return [...strategyPerformance]
      .filter(strategy => strategy.trades >= 1) // Strategies with at least 1 trade
      .sort((a, b) => b.netProfit - a.netProfit);
  }, [strategyPerformance]);
  
  // Format win rate data for bar chart
  const winRateData = useMemo(() => {
    return sortedStrategies.map(strategy => ({
      name: strategy.strategy,
      winRate: strategy.winRate,
      trades: strategy.trades
    }));
  }, [sortedStrategies]);
  
  // Format profit data for bar chart
  const profitData = useMemo(() => {
    return profitableStrategies.map(strategy => ({
      name: strategy.strategy,
      profit: strategy.netProfit,
      trades: strategy.trades,
      avgProfit: strategy.netProfit / strategy.trades
    }));
  }, [profitableStrategies]);
  
  // Format strategy comparison data
  const strategyComparisonData = useMemo(() => {
    return sortedStrategies.map(strategy => ({
      strategy: strategy.strategy,
      winRate: strategy.winRate,
      trades: strategy.trades,
      netProfit: strategy.netProfit,
      avgProfit: strategy.netProfit / strategy.trades
    })).sort((a, b) => b.netProfit - a.netProfit);
  }, [sortedStrategies]);
  
  // Generate strategy insights
  const strategyInsights = useMemo(() => {
    if (strategyPerformance.length === 0) return [];
    
    const insights = [];
    
    // Best performing strategy
    if (sortedStrategies.length > 0) {
      const bestStrategy = sortedStrategies[0];
      if (bestStrategy.winRate > 60) {
        insights.push({
          type: 'positive',
          icon: <Icons.analytics.award className="h-4 w-4" />,
          title: 'Best Performing Strategy',
          description: `"${bestStrategy.strategy}" has your highest win rate at ${bestStrategy.winRate.toFixed(1)}% over ${bestStrategy.trades} trades.`
        });
      }
    }
    
    // Most profitable strategy
    if (profitableStrategies.length > 0) {
      const mostProfitable = profitableStrategies[0];
      if (mostProfitable.netProfit > 0) {
        insights.push({
          type: 'positive',
          icon: <Icons.analytics.award className="h-4 w-4" />,
          title: 'Most Profitable Strategy',
          description: `"${mostProfitable.strategy}" has generated ${formatCurrency(mostProfitable.netProfit)} in profit across ${mostProfitable.trades} trades.`
        });
      }
    }
    
    // Strategy with poor performance but significant sample size
    const poorStrategies = strategyPerformance
      .filter(strategy => strategy.trades >= 5 && strategy.winRate < 40);
    
    if (poorStrategies.length > 0) {
      const worstStrategy = poorStrategies[0];
      insights.push({
        type: 'warning',
        icon: <Icons.analytics.lightbulb className="h-4 w-4" />,
        title: 'Strategy Optimization Needed',
        description: `"${worstStrategy.strategy}" has a low win rate of ${worstStrategy.winRate.toFixed(1)}% over ${worstStrategy.trades} trades. Consider reviewing or abandoning this approach.`
      });
    }
    
    // Suggest focusing on high-performing strategies
    if (sortedStrategies.length >= 3) {
      const topStrategy = sortedStrategies[0];
      const secondStrategy = sortedStrategies[1];
      
      if (topStrategy.winRate > 60 && secondStrategy.winRate > 55) {
        insights.push({
          type: 'suggestion',
          icon: <Icons.analytics.lightbulb className="h-4 w-4" />,
          title: 'Focus on Winning Strategies',
          description: `Your top strategies "${topStrategy.strategy}" and "${secondStrategy.strategy}" show consistently good results. Consider allocating more capital to these approaches.`
        });
      }
    }
    
    // Suggestions for strategies with small sample size
    const lowSampleStrategies = strategyPerformance
      .filter(strategy => strategy.trades < 5 && strategy.trades > 0);
    
    if (lowSampleStrategies.length > 0) {
      insights.push({
        type: 'suggestion',
        icon: <Icons.analytics.lightbulb className="h-4 w-4" />,
        title: 'Expand Your Testing',
        description: `You have ${lowSampleStrategies.length} strategies with less than 5 trades each. Continue testing to gather more data for conclusive performance analysis.`
      });
    }
    
    return insights;
  }, [sortedStrategies, profitableStrategies, strategyPerformance]);
  
  // Chart colors from configuration
  const COLORS = CHART_CONFIG.COLORS;
  
  // Custom tooltip for win rate chart
  const WinRateTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background/95 border border-muted shadow-sm rounded-md p-1.5 text-xs backdrop-blur-sm">
          <p className="font-medium">{label}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-primary">{payload[0].value.toFixed(1)}%</span>
            <span className="text-muted-foreground">
              ({winRateData.find(strategy => strategy.name === label)?.trades || 0} trades)
            </span>
          </div>
        </div>
      );
    }
    return null;
  };
  
  // Custom tooltip for profit chart
  const ProfitTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = profitData.find(strategy => strategy.name === label);
      const profit = data?.profit ?? 0;
      const avgProfit = data?.avgProfit ?? 0;
      const trades = data?.trades ?? 0;
      
      return (
        <div className="bg-background/95 border border-muted shadow-sm rounded-md p-1.5 text-xs backdrop-blur-sm">
          <p className="font-medium">{label}</p>
          <div className="flex flex-col gap-0.5 mt-0.5">
            <div className="flex items-center gap-1.5">
              <span className={profit >= 0 ? 'text-success' : 'text-destructive'}>
                {formatCurrency(payload[0].value)}
              </span>
              <span className="text-muted-foreground text-[10px]">
                ({trades} trades)
              </span>
            </div>
            <div className="text-[10px] text-muted-foreground">
              Avg: {formatCurrency(avgProfit)} per trade
            </div>
          </div>
        </div>
      );
    }
    return null;
  };
  
  // Custom tooltip for strategy comparison chart
  const ComparisonTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background/95 border border-muted shadow-sm rounded-md p-1.5 text-xs backdrop-blur-sm">
          <p className="font-medium">{label}</p>
          <div className="flex flex-col gap-0.5 mt-0.5">
            <div className="flex items-center gap-2">
              <span className="text-primary">{payload[0].value.toFixed(1)}%</span>
              <span className="text-muted-foreground text-[10px]">Win rate</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={payload[1].value >= 0 ? 'text-success' : 'text-destructive'}>
                {formatCurrency(payload[1].value)}
              </span>
              <span className="text-muted-foreground text-[10px]">Profit</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#8884d8]">{payload[2].value}</span>
              <span className="text-muted-foreground text-[10px]">Trades</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };
  
  return (
    <div className="space-y-6">
      {/* Strategy Insights */}
      {strategyInsights.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex items-center">
              <Icons.analytics.brainCircuit className="h-5 w-5 mr-2 text-primary" />
              Strategy Insights
            </CardTitle>
            <CardDescription>
              Key observations and recommendations for your trading strategies
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {strategyInsights.map((insight, index) => (
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
      
      {/* Win Rate Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold flex items-center">
            <Icons.analytics.barChart className="h-5 w-5 mr-2 text-primary" />
            Strategy Win Rates
          </CardTitle>
          <CardDescription>
            Win rate comparison across different trading strategies
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-4">
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={winRateData}
                layout="vertical"
                margin={{ top: 4, right: 4, left: 4, bottom: 4 }} // Tuân thủ tiêu chuẩn margin 4px đồng nhất
                barCategoryGap={8} 
                barGap={4}
              >
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  horizontal={true}
                  vertical={false} 
                  stroke="hsl(var(--muted-foreground)/15)" 
                />
                <XAxis 
                  type="number"
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={{ stroke: 'hsl(var(--muted-foreground)/20)' }}
                  tickMargin={8} // Chuẩn hóa theo quy tắc 4px
                />
                <YAxis 
                  dataKey="name" 
                  type="category"
                  tick={false}
                  tickLine={false}
                  axisLine={false}
                  width={8} // Chuẩn hóa theo quy tắc 4px
                />
                <Tooltip content={<WinRateTooltip />} />
                <Bar 
                  dataKey="winRate" 
                  fill={COLORS[0]} 
                  radius={[0, 4, 4, 0]}
                  barSize={winRateData.length > 6 ? 16 : (winRateData.length > 3 ? 20 : 25)}
                  isAnimationActive={false}
                  animationDuration={0}
                  className="hover:opacity-100"
                  onMouseOver={() => {}}
                  onMouseOut={() => {}}
                  label={props => {
                    const { x, y, width, height, value, index } = props;
                    const item = winRateData[index];
                    // Xác định cách hiển thị tên chiến lược (bên trong hoặc bên trái)
                    // Quyết định hiển thị nhãn và giá trị dựa trên độ rộng của thanh
                    const showTextInside = width > 80;
                    const showOnRight = width < 60; // Cả nhãn và giá trị hiển thị bên phải
                    
                    // Vị trí x và căn chỉnh văn bản
                    let textX, textAnchor;
                    
                    if (showOnRight) {
                      // Nếu thanh quá ngắn, hiển thị mọi thứ bên phải
                      textX = x + width + 4; // Chuẩn hóa theo quy tắc 4px
                      textAnchor = "start";
                    } else if (showTextInside) {
                      // Nếu thanh đủ rộng, hiển thị nhãn bên trong
                      textX = x + 8; // 8px là bội số của 4px nên đã phù hợp với quy tắc
                      textAnchor = "start";
                    } else {
                      // Trường hợp trung gian, hiển thị nhãn bên trái
                      textX = x - 4; // Chuẩn hóa theo quy tắc 4px
                      textAnchor = "end";
                    }
                    
                    // Cắt ngắn tên chiến lược nếu quá dài so với chiều rộng thanh
                    let displayName = item.name;
                    
                    // Xử lý trường hợp tên dài
                    if (showTextInside && width < 200 && displayName.length > 15) {
                      displayName = displayName.substring(0, 12) + "...";
                    }
                    
                    return (
                      <g>
                        {/* Hiển thị tên chiến lược (nếu thanh quá ngắn, hiển thị kèm giá trị) */}
                        <text 
                          x={textX} 
                          y={y + height/2} 
                          dy={4}
                          textAnchor={textAnchor}
                          fontSize={10}
                          fill={showTextInside && !showOnRight ? "white" : "hsl(var(--foreground))"}
                        >
                          {showOnRight ? `${displayName} (${value.toFixed(1)}%)` : displayName}
                        </text>
                        
                        {/* Hiển thị giá trị ở cuối thanh khi thanh đủ dài */}
                        {!showOnRight && (
                          <text 
                            x={x + width - 5} 
                            y={y + height/2} 
                            dy={4}
                            textAnchor="end"
                            fontSize={10}
                            fontWeight="500"
                            fill="white"
                          >
                            {value.toFixed(1)}%
                          </text>
                        )}
                      </g>
                    );
                  }}
                >
                  {winRateData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.winRate > 50 ? 'hsl(var(--success))' : 
                            entry.winRate > 40 ? COLORS[1] : 
                            'hsl(var(--destructive))'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      {/* Profit by Strategy and Strategy Comparison Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profit by Strategy */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex items-center">
              <Icons.analytics.barChart className="h-5 w-5 mr-2 text-primary" />
              Profit by Strategy
            </CardTitle>
            <CardDescription>
              Net profit generated by each trading strategy
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4">
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={profitData}
                  layout="vertical"
                  margin={{ top: 4, right: 4, left: 4, bottom: 4 }} // Tuân thủ tiêu chuẩn margin 4px đồng nhất
                  barCategoryGap={8}
                  barGap={4}
                >
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    horizontal={true}
                    vertical={false} 
                    stroke="hsl(var(--muted-foreground)/15)" 
                  />
                  <XAxis 
                    type="number"
                    tickFormatter={(value) => formatCurrency(value, true)}
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={false}
                    axisLine={{ stroke: 'hsl(var(--muted-foreground)/20)' }}
                    tickMargin={0}
                    // Đảm bảo biểu đồ sử dụng hết chiều rộng
                    domain={['dataMin', 'dataMax']}
                  />
                  <YAxis 
                    dataKey="name" 
                    type="category"
                    tick={false}
                    tickLine={false}
                    axisLine={false}
                    width={8} // Chuẩn hóa theo quy tắc 4px
                  />
                  <Tooltip content={<ProfitTooltip />} />
                  <Bar 
                    dataKey="profit" 
                    radius={[0, 4, 4, 0]}
                    barSize={profitData.length > 6 ? 16 : (profitData.length > 3 ? 20 : 25)}
                    isAnimationActive={false}
                    animationDuration={0}
                    className="hover:opacity-100"
                    onMouseOver={() => {}}
                    onMouseOut={() => {}}
                    label={props => {
                      const { x, y, width, height, value, index } = props;
                      const item = profitData[index];
                      const isPositive = value >= 0;
                      
                      // Quyết định hiển thị nhãn và giá trị dựa trên độ rộng của thanh
                      const showTextInside = width > 80;
                      const showOnRight = width < 60; // Cả nhãn và giá trị hiển thị bên phải
                      
                      // Vị trí x và căn chỉnh văn bản
                      let textX, textAnchor;
                      
                      if (showOnRight) {
                        // Nếu thanh quá ngắn, hiển thị mọi thứ bên phải
                        textX = x + width + 4; // Chuẩn hóa theo quy tắc 4px
                        textAnchor = "start";
                      } else if (showTextInside) {
                        // Nếu thanh đủ rộng, hiển thị nhãn bên trong
                        textX = x + 8; // 8px là bội số của 4px nên đã phù hợp với quy tắc
                        textAnchor = "start";
                      } else {
                        // Trường hợp trung gian, hiển thị nhãn bên trái
                        textX = x - 4; // Chuẩn hóa theo quy tắc 4px
                        textAnchor = "end";
                      }
                      
                      // Cắt ngắn tên chiến lược nếu quá dài so với chiều rộng thanh
                      let displayName = item.name;
                      
                      // Xử lý trường hợp tên dài
                      if (showTextInside && width < 200 && displayName.length > 15) {
                        displayName = displayName.substring(0, 12) + "...";
                      }
                      
                      return (
                        <g>
                          {/* Hiển thị tên chiến lược (nếu thanh quá ngắn, hiển thị kèm giá trị) */}
                          <text 
                            x={textX} 
                            y={y + height/2} 
                            dy={4}
                            textAnchor={textAnchor}
                            fontSize={10}
                            fill={showTextInside && !showOnRight ? "white" : "hsl(var(--foreground))"}
                          >
                            {showOnRight ? `${displayName} (${formatCurrency(value, true)})` : displayName}
                          </text>
                          
                          {/* Hiển thị giá trị ở cuối thanh khi thanh đủ dài */}
                          {!showOnRight && (
                            <text 
                              x={x + width - 5} 
                              y={y + height/2} 
                              dy={4}
                              textAnchor="end"
                              fontSize={10}
                              fontWeight="500"
                              fill="white"
                            >
                              {formatCurrency(value, true)}
                            </text>
                          )}
                        </g>
                      );
                    }}
                  >
                    {profitData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.profit >= 0 ? 'hsl(var(--success))' : 'hsl(var(--destructive))'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        {/* Strategy Comparison */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex items-center">
              <Icons.analytics.brainCircuit className="h-5 w-5 mr-2 text-primary" />
              Strategy Comparison
            </CardTitle>
            <CardDescription>
              Combined view of win rate, profit, and trade volume
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4">
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={strategyComparisonData} // Show all strategies, không cắt top 5 nữa
                  margin={{ top: 4, right: 4, left: 4, bottom: 4 }} /* Tuân thủ tiêu chuẩn margin 4px đồng nhất */
                  barCategoryGap="10%" /* Sử dụng phần trăm để dàn đều theo tỷ lệ */
                  barGap={4} // Thống nhất với barGap của biểu đồ Profit
                >
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    vertical={false} 
                    stroke="hsl(var(--muted-foreground)/15)" 
                  />
                  <XAxis 
                    dataKey="strategy" 
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={false}
                    axisLine={{ stroke: 'hsl(var(--muted-foreground)/20)' }}
                    tickMargin={0}
                    interval={0} // Hiển thị tất cả tick để dàn đều
                  />
                  <YAxis 
                    yAxisId="left"
                    orientation="left"
                    tickFormatter={(value) => `${value}%`}
                    domain={[0, 100]}
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={0}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    tickFormatter={(value) => formatCurrency(value, true)}
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={0}
                    // Đảm bảo trục Y cho profit sử dụng hết phạm vi hiển thị
                    domain={['dataMin', 'dataMax']}
                  />
                  <Tooltip content={<ComparisonTooltip />} />
                  <Legend 
                    iconSize={6}
                    wrapperStyle={{
                      fontSize: "10px",
                      paddingTop: "4px", // Điều chỉnh theo quy tắc spacing 4px
                    }}
                    iconType="circle"
                  />
                  <Bar 
                    yAxisId="left"
                    dataKey="winRate" 
                    name="Win Rate (%)" 
                    fill={COLORS[1]} 
                    barSize={profitData.length > 6 ? 16 : (profitData.length > 3 ? 20 : 25)} // Thống nhất với biểu đồ Profit
                    isAnimationActive={false}
                    animationDuration={0}
                    className="hover:opacity-100"
                    onMouseOver={() => {}}
                    onMouseOut={() => {}}
                  />
                  <Bar 
                    yAxisId="right"
                    dataKey="netProfit" 
                    name="Net Profit" 
                    fill={COLORS[0]} 
                    barSize={profitData.length > 6 ? 16 : (profitData.length > 3 ? 20 : 25)} // Thống nhất với biểu đồ Profit
                    isAnimationActive={false}
                    animationDuration={0}
                    className="hover:opacity-100"
                    onMouseOver={() => {}}
                    onMouseOut={() => {}}
                  />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="trades" 
                    name="Trades" 
                    stroke={COLORS[3]} 
                    strokeWidth={1.5}
                    dot={{ r: 4 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Strategy Performance Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold flex items-center">
            <Icons.analytics.brainCircuit className="h-5 w-5 mr-2 text-primary" />
            Detailed Strategy Performance
          </CardTitle>
          <CardDescription>
            Comprehensive breakdown of all your trading strategies
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-4 overflow-x-auto">
          <Table className="compact-table">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[150px]">Strategy</TableHead>
                <TableHead className="text-center w-[60px]">Trades</TableHead>
                <TableHead className="text-center w-[80px]">Win Rate</TableHead>
                <TableHead className="text-right w-[100px]">Net Profit</TableHead>
                <TableHead className="text-right">Avg P/T</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {strategyPerformance
                .sort((a, b) => b.netProfit - a.netProfit)
                .map((strategy) => (
                  <TableRow key={strategy.strategy}>
                    <TableCell className="font-medium">
                      <span 
                        className="cursor-help truncate inline-block max-w-[150px]" 
                        title={strategy.strategy}
                      >
                        {strategy.strategy}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">{strategy.trades}</TableCell>
                    <TableCell className="text-center">
                      <Badge className={`text-xs py-1 px-2 ${
                        strategy.winRate > 50 ? 'bg-success/20 text-success border-success/30' :
                        strategy.winRate > 40 ? 'bg-warning/20 text-warning border-warning/30' :
                        'bg-destructive/20 text-destructive border-destructive/30'
                      }`}>
                        {strategy.winRate.toFixed(1)}%
                      </Badge>
                    </TableCell>
                    <TableCell className={`text-right text-sm ${strategy.netProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {formatCurrency(strategy.netProfit, true)}
                    </TableCell>
                    <TableCell className={`text-right text-sm ${(strategy.netProfit / strategy.trades) >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {formatCurrency(strategy.netProfit / strategy.trades, true)}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}