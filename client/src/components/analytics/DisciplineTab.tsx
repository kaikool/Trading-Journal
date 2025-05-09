import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { calculateWinRate } from "@/lib/forex-calculator";
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
  PieChart,
  Pie,
} from "recharts";
import { Icons } from "@/components/icons/icons";
import { CHART_CONFIG } from "@/lib/config";
import { formatCurrency } from "@/lib/utils";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface DisciplineTabProps {
  data: {
    disciplineMetrics: {
      followedPlan: {
        yes: number;
        no: number;
        winRateYes: number;
        winRateNo: number;
      };
      enteredEarly: {
        yes: number;
        no: number;
        winRateYes: number;
        winRateNo: number;
      };
      revenge: {
        yes: number;
        no: number;
        winRateYes: number;
        winRateNo: number;
      };
    };
    trades: any[];
  };
}

export default function DisciplineTab({ data }: DisciplineTabProps) {
  const { disciplineMetrics, trades } = data;
  
  // Chart colors
  const COLORS = CHART_CONFIG.COLORS;
  
  // Format discipline metrics for better visualization
  const disciplineData = useMemo(() => {
    return [
      {
        name: "Followed Trading Plan",
        yes: disciplineMetrics.followedPlan.yes,
        no: disciplineMetrics.followedPlan.no,
        winRateYes: disciplineMetrics.followedPlan.winRateYes,
        winRateNo: disciplineMetrics.followedPlan.winRateNo,
        total: disciplineMetrics.followedPlan.yes + disciplineMetrics.followedPlan.no,
        icon: <Icons.achievement.target className="h-5 w-5" />,
        description: "Trading according to your predefined plan",
        impact: disciplineMetrics.followedPlan.winRateYes - disciplineMetrics.followedPlan.winRateNo
      },
      {
        name: "Entered Too Early",
        yes: disciplineMetrics.enteredEarly.yes,
        no: disciplineMetrics.enteredEarly.no,
        winRateYes: disciplineMetrics.enteredEarly.winRateYes,
        winRateNo: disciplineMetrics.enteredEarly.winRateNo,
        total: disciplineMetrics.enteredEarly.yes + disciplineMetrics.enteredEarly.no,
        icon: <Icons.ui.alertTriangle className="h-5 w-5" />,
        description: "Entering trades before confirmation signals",
        impact: disciplineMetrics.enteredEarly.winRateNo - disciplineMetrics.enteredEarly.winRateYes
      },
      {
        name: "Revenge Trading",
        yes: disciplineMetrics.revenge.yes,
        no: disciplineMetrics.revenge.no,
        winRateYes: disciplineMetrics.revenge.winRateYes,
        winRateNo: disciplineMetrics.revenge.winRateNo,
        total: disciplineMetrics.revenge.yes + disciplineMetrics.revenge.no,
        icon: <Icons.achievement.shield className="h-5 w-5" />,
        description: "Trading to recover previous losses",
        impact: disciplineMetrics.revenge.winRateNo - disciplineMetrics.revenge.winRateYes
      }
    ];
  }, [disciplineMetrics]);
  
  // Format discipline metrics for pie chart (yes/no distribution)
  const disciplineDistributionData = useMemo(() => {
    return disciplineData.map(item => {
      return [
        { name: "Yes", value: item.yes, fill: COLORS[2] },
        { name: "No", value: item.no, fill: COLORS[0] }
      ];
    });
  }, [disciplineData, COLORS]);
  
  // Format win rate comparison data for bar chart
  const winRateComparisonData = useMemo(() => {
    return disciplineData.map(item => {
      return {
        name: item.name,
        "With Discipline": item.name === "Entered Too Early" || item.name === "Revenge Trading" 
          ? item.winRateNo 
          : item.winRateYes,
        "Without Discipline": item.name === "Entered Too Early" || item.name === "Revenge Trading"
          ? item.winRateYes
          : item.winRateNo
      };
    });
  }, [disciplineData]);
  
  // Custom tooltip for win rate comparison
  const DisciplineWinRateTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background/95 border border-muted shadow-sm rounded-md p-1.5 text-xs backdrop-blur-sm">
          <p className="font-medium">{label}</p>
          <div className="flex flex-col gap-0.5 mt-0.5">
            {payload.map((entry: any, index: number) => (
              <div 
                key={`item-${index}`}
                className="flex items-center gap-1.5"
              >
                <span className={entry.name === "With Discipline" ? "text-success" : "text-destructive"}>
                  {entry.value.toFixed(1)}%
                </span>
                <span className="text-muted-foreground text-[10px]">
                  {entry.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };
  
  // Custom tooltip for discipline distribution
  const DisciplineDistributionTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const disciplineItem = disciplineData[Math.floor(payload[0].dataKey.slice(-1))];
      
      if (!disciplineItem) return null;
      
      const total = disciplineItem.total;
      const percentage = total > 0 ? ((data.value / total) * 100).toFixed(1) : '0.0';
      const winRate = data.name === "Yes" 
        ? disciplineItem.winRateYes.toFixed(1)
        : disciplineItem.winRateNo.toFixed(1);
      
      return (
        <div className="bg-background/95 border border-muted shadow-sm rounded-md p-1.5 text-xs backdrop-blur-sm">
          <p className="font-medium">{disciplineItem.name} - {data.name}</p>
          <div className="flex flex-col gap-0.5 mt-0.5">
            <div className="flex items-center gap-1.5">
              <span className={data.name === "Yes" ? "text-success" : "text-destructive"}>
                {percentage}%
              </span>
              <span className="text-muted-foreground text-[10px]">
                ({data.value} trades)
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={Number(winRate) >= 50 ? "text-success" : "text-destructive"}>
                {winRate}% win rate
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };
  
  // Generate discipline insights
  const disciplineInsights = useMemo(() => {
    if (disciplineData.length === 0) return [];
    
    const insights = [];
    
    // Calculate discipline score based on behaviors
    const followPlanImpact = disciplineMetrics.followedPlan.winRateYes - disciplineMetrics.followedPlan.winRateNo;
    const enterEarlyImpact = disciplineMetrics.enteredEarly.winRateNo - disciplineMetrics.enteredEarly.winRateYes;
    const revengeImpact = disciplineMetrics.revenge.winRateNo - disciplineMetrics.revenge.winRateYes;
    
    // Total trades count
    const totalTradesCount = disciplineData[0].total;
    
    // Check if following plan has significant positive impact
    if (followPlanImpact > 10 && disciplineMetrics.followedPlan.yes > 5) {
      insights.push({
        type: 'positive',
        icon: <Icons.achievement.award className="h-4 w-4" />,
        title: 'Plan Adherence Success',
        description: `Following your trading plan improves win rate by ${followPlanImpact.toFixed(1)}%. Continue this disciplined approach for consistent results.`
      });
    }
    
    // Check if following plan is being neglected but has positive impact
    if (followPlanImpact > 10 && disciplineMetrics.followedPlan.yes < disciplineMetrics.followedPlan.no) {
      insights.push({
        type: 'warning',
        icon: <Icons.achievement.target className="h-4 w-4" />,
        title: 'Improve Plan Adherence',
        description: `You win ${followPlanImpact.toFixed(1)}% more often when following your plan, but only do so ${((disciplineMetrics.followedPlan.yes / totalTradesCount) * 100).toFixed(1)}% of the time. Focus on discipline.`
      });
    }
    
    // Check if entering early has negative impact
    if (enterEarlyImpact > 15 && disciplineMetrics.enteredEarly.yes > 3) {
      insights.push({
        type: 'warning',
        icon: <Icons.ui.alertTriangle className="h-4 w-4" />,
        title: 'Early Entry Warning',
        description: `Entering trades prematurely reduces your win rate by ${enterEarlyImpact.toFixed(1)}%. Wait for proper confirmation signals before executing.`
      });
    }
    
    // Check if revenge trading has significant negative impact
    if (revengeImpact > 15 && disciplineMetrics.revenge.yes > 3) {
      insights.push({
        type: 'warning',
        icon: <Icons.ui.xCircle className="h-4 w-4" />,
        title: 'Avoid Revenge Trading',
        description: `Revenge trading decreases your win rate by ${revengeImpact.toFixed(1)}%. Take breaks after losses to maintain emotional balance.`
      });
    }
    
    // Check overall discipline effectiveness
    const combinedDisciplineImpact = followPlanImpact + enterEarlyImpact + revengeImpact;
    if (combinedDisciplineImpact > 30) {
      insights.push({
        type: 'positive',
        icon: <Icons.ui.circleCheck className="h-4 w-4" />,
        title: 'Strong Discipline Edge',
        description: `Your discipline factors collectively improve performance by ~${combinedDisciplineImpact.toFixed(1)}%. Trading psychology appears to be a significant strength in your strategy.`
      });
    }
    
    // Recommendations for small sample size
    if (totalTradesCount < 15 && totalTradesCount > 0) {
      insights.push({
        type: 'suggestion',
        icon: <Icons.general.lightbulb className="h-4 w-4" />,
        title: 'Gathering More Data',
        description: `With only ${totalTradesCount} trades analyzed, continue tracking discipline metrics to establish clearer patterns and more reliable insights.`
      });
    }
    
    // Specific actionable tip based on weakest area
    const disciplineFactors = [
      {name: "Following Plan", impact: followPlanImpact, isPositive: followPlanImpact > 0},
      {name: "Avoiding Early Entry", impact: enterEarlyImpact, isPositive: enterEarlyImpact > 0},
      {name: "Avoiding Revenge Trading", impact: revengeImpact, isPositive: revengeImpact > 0}
    ];
    
    const weakestFactor = [...disciplineFactors].sort((a, b) => a.isPositive === b.isPositive ? Math.abs(b.impact) - Math.abs(a.impact) : (a.isPositive ? 1 : -1))[0];
    
    if (weakestFactor && !weakestFactor.isPositive && Math.abs(weakestFactor.impact) > 5) {
      let tip = '';
      if (weakestFactor.name === "Following Plan") {
        tip = "Try using a pre-trade checklist to ensure you systematically follow your plan before each trade.";
      } else if (weakestFactor.name === "Avoiding Early Entry") {
        tip = "Add confirmation signals to your strategy and only enter when all conditions are met, not beforehand.";
      } else if (weakestFactor.name === "Avoiding Revenge Trading") {
        tip = "Consider implementing a 'cooling-off period' after losses, or setting stricter daily loss limits.";
      }
      
      insights.push({
        type: 'suggestion',
        icon: <Icons.general.lightbulb className="h-4 w-4" />,
        title: `Improve ${weakestFactor.name}`,
        description: tip
      });
    }
    
    return insights;
  }, [disciplineData, disciplineMetrics]);
  
  return (
    <div className="space-y-6">
      {/* Discipline Insights */}
      {disciplineInsights.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex items-center">
              <Icons.analytics.brain className="h-5 w-5 mr-2 text-primary" />
              Trading Discipline Insights
            </CardTitle>
            <CardDescription>
              Key observations and recommendations for your trading discipline
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {disciplineInsights.map((insight, index) => (
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
      
      {/* Win Rate Impact of Discipline Factors */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold flex items-center">
            <Icons.analytics.brain className="h-5 w-5 mr-2 text-primary" />
            Discipline Impact on Win Rate
          </CardTitle>
          <CardDescription>
            How trading discipline affects your success rate
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-4">
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={winRateComparisonData}
                margin={{ top: 4, right: 4, left: 4, bottom: 4 }} /* Tuân thủ tiêu chuẩn margin 4px đồng nhất */
                barCategoryGap="10%" /* Sử dụng phần trăm để dàn đều theo tỷ lệ */
                barGap={4} /* Thống nhất với quy tắc khoảng cách 4px */
              >
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  vertical={false} 
                  stroke="hsl(var(--muted-foreground)/15)" 
                />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={{ stroke: 'hsl(var(--muted-foreground)/20)' }}
                  tickMargin={4} // Chuẩn hóa theo quy tắc 4px
                  interval={0} // Hiển thị tất cả tick để dàn đều
                />
                <YAxis 
                  tickFormatter={(value) => `${value}%`}
                  domain={[0, 100]}
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={4} // Chuẩn hóa theo quy tắc 4px
                />
                <Tooltip content={<DisciplineWinRateTooltip />} />
                <Legend 
                  align="center" 
                  verticalAlign="top" 
                  height={36}
                  iconSize={6}
                  wrapperStyle={{
                    fontSize: "10px",
                    paddingTop: "4px", // Chuẩn hóa theo quy tắc 4px
                  }}
                  iconType="circle"
                />
                <Bar 
                  dataKey="With Discipline" 
                  fill="hsl(var(--success))" 
                  radius={[4, 4, 0, 0]}
                  barSize={winRateComparisonData.length > 4 ? 14 : 18}
                  isAnimationActive={false}
                  animationDuration={0}
                  className="hover:opacity-100"
                  onMouseOver={(data, index) => {}}
                  onMouseOut={(data, index) => {}}
                />
                <Bar 
                  dataKey="Without Discipline" 
                  fill="hsl(var(--destructive))" 
                  radius={[4, 4, 0, 0]}
                  barSize={winRateComparisonData.length > 4 ? 14 : 18}
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
      
      {/* Discipline Distribution Charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {disciplineData.map((item, index) => (
          <Card key={item.name}>
            <CardHeader className="pb-2">
              <CardTitle className="text-md font-semibold flex items-center">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary mr-2">
                  {item.icon}
                </div>
                {item.name}
              </CardTitle>
              <CardDescription className="text-xs">
                {item.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-4">
              <div className="h-[160px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={disciplineDistributionData[index]}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={35}
                      outerRadius={58}
                    >
                      {disciplineDistributionData[index].map((entry, i) => (
                        <Cell 
                          key={`cell-${i}`} 
                          fill={entry.fill} 
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<DisciplineDistributionTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-1 text-center mt-1">
                <div className="text-[10px]">
                  <p className="font-semibold text-success">Yes: {item.yes}</p>
                  <p className="text-muted-foreground">
                    {item.total > 0 
                      ? `${((item.yes / item.total) * 100).toFixed(1)}% of trades`
                      : '0.0% of trades'}
                  </p>
                </div>
                <div className="text-[10px]">
                  <p className="font-semibold text-destructive">No: {item.no}</p>
                  <p className="text-muted-foreground">
                    {item.total > 0 
                      ? `${((item.no / item.total) * 100).toFixed(1)}% of trades`
                      : '0.0% of trades'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Discipline Impact Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold flex items-center">
            <Icons.analytics.brain className="h-5 w-5 mr-2 text-primary" />
            Discipline Factor Analysis
          </CardTitle>
          <CardDescription>
            Detailed breakdown of discipline factors and their impact
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Discipline Factor</TableHead>
                <TableHead>Applied</TableHead>
                <TableHead className="text-center">Yes Win Rate</TableHead>
                <TableHead className="text-center">No Win Rate</TableHead>
                <TableHead className="text-right">Impact</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {disciplineData.map((item) => (
                <TableRow key={item.name}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>
                    {item.total > 0 
                      ? `${((item.yes / item.total) * 100).toFixed(1)}%`
                      : '0.0%'}
                  </TableCell>
                  <TableCell className="text-center">{item.winRateYes.toFixed(1)}%</TableCell>
                  <TableCell className="text-center">{item.winRateNo.toFixed(1)}%</TableCell>
                  <TableCell className="text-right">
                    <Badge className={
                      (item.name === "Followed Trading Plan" && item.impact > 0) || 
                      ((item.name === "Entered Too Early" || item.name === "Revenge Trading") && item.impact > 0)
                        ? 'bg-success/20 text-success border-success/30'
                        : 'bg-destructive/20 text-destructive border-destructive/30'
                    }>
                      {item.impact > 0 ? '+' : ''}{item.impact.toFixed(1)}%
                    </Badge>
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