import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Icons } from "@/components/icons/icons";
import { cn } from "@/lib/utils";
import { CHART_CONFIG } from "@/lib/config";

// Define the types for the pair performance data
interface PairPerformanceData {
  pair: string;
  trades: number;
  winRate: number;
  netProfit: number;
  value: number; // For the chart
}

interface PairPerformanceCardProps {
  data: PairPerformanceData[];
  isLoading?: boolean;
}

export function PairPerformanceCard({
  data,
  isLoading = false
}: PairPerformanceCardProps) {
  // Generate chart colors from the configuration
  const COLORS = CHART_CONFIG.COLORS;
  
  // Custom tooltip component for the chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const fill = payload[0].fill;
      return (
        <div className="bg-background/90 backdrop-blur-sm shadow-md border border-primary/20 rounded-md p-2 text-sm">
          <p className={cn(
            "font-medium text-center",
            `chart-tooltip-text-color-${(payload[0].name % 5) + 1}`
          )}>{data.pair}</p>
          <div className="mt-1 flex justify-between gap-4">
            <span className="text-xs text-muted-foreground">Win Rate:</span>
            <span className="font-medium">{data.winRate.toFixed(0)}%</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-xs text-muted-foreground">Trades:</span>
            <span className="font-medium">{data.trades}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  // Format the value for display in the legend
  const formatLegendValue = (value: string) => {
    const dataItem = data.find(item => item.pair === value);
    if (!dataItem) return value;
    
    // Return pair name with win rate
    return `${value} (${dataItem.winRate.toFixed(0)}%)`;
  };

  // Loading state
  if (isLoading) {
    return (
      <Card className="shadow-sm border border-border/40">
        <CardHeader className="pb-0 pt-3 px-4">
          <div className="flex justify-between items-center">
            <Skeleton className="h-5 w-32" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] w-full flex items-center justify-center">
            <Skeleton className="h-[160px] w-[160px] rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (!data || data.length === 0) {
    return (
      <Card className="shadow-sm border border-border/40 h-full">
        <CardHeader className="pb-0 pt-3 px-4">
          <div className="flex justify-between items-center">
            <CardTitle className="text-md font-medium flex items-center">
              <Icons.ui.barChart className="h-4 w-4 mr-1.5 text-primary/80" />
              Currency Pairs
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-[200px] text-center">
          <Icons.ui.info className="h-6 w-6 text-muted-foreground/30 mb-2" />
          <p className="font-medium text-muted-foreground text-sm">No data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm border border-border/40 overflow-hidden h-full">
      <CardHeader className="pb-0 pt-3 px-4">
        <div className="flex justify-between items-center">
          <CardTitle className="text-md font-medium flex items-center">
            <Icons.ui.barChart className="h-4 w-4 mr-1.5 text-primary/80" />
            Currency Pairs
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={75}
                fill="#8884d8"
                paddingAngle={3}
                dataKey="value"
                nameKey="pair"
                labelLine={false}
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]} 
                    stroke="hsl(var(--background))"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                formatter={formatLegendValue}
                layout="horizontal"
                verticalAlign="bottom"
                align="center"
                iconSize={8}
                className="chart-legend"
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}