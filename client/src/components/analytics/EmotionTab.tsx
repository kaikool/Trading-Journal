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
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Heart, Lightbulb, XCircle, AlertTriangle, Database } from "lucide-react";
import { CHART_CONFIG } from "@/lib/config";
import { format, parseISO } from "date-fns";
import { formatCurrency } from "@/lib/utils";

interface EmotionTabProps {
  data: {
    emotionPerformance: any[];
    trades: any[];
  };
}

export default function EmotionTab({ data }: EmotionTabProps) {
  const { emotionPerformance, trades } = data;

  // Sort emotions by win rate
  const sortedEmotions = useMemo(() => {
    return [...emotionPerformance]
      .filter(e => e.trades >= 1) // Hiển thị tất cả emotion có ít nhất 1 trade
      .sort((a, b) => b.winRate - a.winRate);
  }, [emotionPerformance]);

  // Generate data for emotion distribution pie chart
  const emotionDistributionData = useMemo(() => {
    return emotionPerformance.map(emotion => ({
      name: emotion.emotion,
      value: emotion.trades
    }));
  }, [emotionPerformance]);

  // Generate data for win rate by emotion
  const winRateByEmotionData = useMemo(() => {
    return emotionPerformance
      .filter(e => e.trades >= 1) // Hiển thị tất cả emotion có ít nhất 1 trade
      .map(emotion => ({
        name: emotion.emotion,
        winRate: emotion.winRate,
        trades: emotion.trades
      }));
  }, [emotionPerformance]);

  // Generate emotion timeline data
  const emotionTimelineData = useMemo(() => {
    if (!trades.length) return [];
    
    // Filter and sort trades by date (ensuring dates are valid)
    const sortedTrades = [...trades]
      .filter(trade => {
        // Ensure trade has emotion and valid close date
        try {
          return trade.emotion && 
                 trade.closeDate && 
                 !isNaN(new Date(trade.closeDate).getTime());
        } catch (error) {
          console.error("Error filtering trade in emotion timeline:", error);
          return false;
        }
      })
      .sort((a, b) => {
        try {
          const dateA = new Date(a.closeDate);
          const dateB = new Date(b.closeDate);
          
          if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
            return 0;
          }
          
          return dateA.getTime() - dateB.getTime();
        } catch (error) {
          console.error("Error sorting trades by date:", error);
          return 0;
        }
      });
    
    // Get unique emotions
    const uniqueEmotionsSet = new Set<string>();
    sortedTrades.forEach(trade => {
      if (trade.emotion) uniqueEmotionsSet.add(trade.emotion);
    });
    const uniqueEmotions = Array.from(uniqueEmotionsSet);
    
    // Create timeline data
    return sortedTrades.map((trade, index) => {
      try {
        const closeDate = new Date(trade.closeDate);
        const date = format(closeDate, 'MMM dd');
        const result = trade.pips > 0 ? 'win' : trade.pips < 0 ? 'loss' : 'break-even';
        
        // Create an object with all emotions initialized to 0
        const emotions: Record<string, number> = {};
        uniqueEmotions.forEach(emotion => {
          emotions[emotion] = 0;
        });
        
        // Set the current trade's emotion to 1
        if (trade.emotion) {
          emotions[trade.emotion] = 1;
        }
        
        return {
          name: date,
          trade: index + 1,
          result,
          emotion: trade.emotion || 'Unknown',
          ...emotions
        };
      } catch (error) {
        console.error("Error creating emotion timeline entry:", error);
        return null;
      }
    }).filter(Boolean) as any[]; // Remove any null entries
  }, [trades]);

  // Check if we have enough data for meaningful insights
  const hasEnoughData = useMemo(() => {
    return trades.length >= 5 && emotionPerformance.length >= 2;
  }, [trades, emotionPerformance]);

  // Generate emotion insights
  const emotionInsights = useMemo(() => {
    // Đã loại bỏ console.log để cải thiện hiệu suất
    
    if (emotionPerformance.length === 0) {
      return [];
    }
    
    const insights: {
      type: 'positive' | 'warning' | 'suggestion';
      icon: JSX.Element;
      title: string;
      description: string;
    }[] = [];
    
    // If not enough data, add a suggestion to add more trades
    if (!hasEnoughData) {
      insights.push({
        type: 'suggestion',
        icon: <Database className="h-4 w-4" />,
        title: 'More Trading Data Needed',
        description: `Record at least 5-10 more trades with emotional states to get meaningful insights. The current sample size is too small for reliable analysis.`
      });
      return insights;
    }
    
    // Find best and worst emotions
    const bestEmotion = sortedEmotions[0];
    const worstEmotion = [...sortedEmotions].sort((a, b) => a.winRate - b.winRate)[0];
    
    // Best emotion insight
    if (bestEmotion && bestEmotion.trades >= 5 && bestEmotion.winRate > 60) {
      insights.push({
        type: 'positive',
        icon: <CheckCircle className="h-4 w-4" />,
        title: 'Best Emotional State',
        description: `Trading while feeling "${bestEmotion.emotion}" yields your highest win rate at ${bestEmotion.winRate.toFixed(1)}%. Consider journaling what conditions help you achieve this state.`
      });
    }
    
    // Worst emotion insight
    if (worstEmotion && worstEmotion.trades >= 5 && worstEmotion.winRate < 40) {
      insights.push({
        type: 'warning',
        icon: <XCircle className="h-4 w-4" />,
        title: 'Worst Emotional State',
        description: `Trading while feeling "${worstEmotion.emotion}" produces your lowest win rate at ${worstEmotion.winRate.toFixed(1)}%. Consider taking a break when experiencing this emotion.`
      });
    }
    
    // Emotional diversity insight
    if (emotionPerformance.length <= 2 && trades.length > 10) {
      insights.push({
        type: 'suggestion',
        icon: <Lightbulb className="h-4 w-4" />,
        title: 'Emotional Awareness',
        description: 'Consider recording more detailed emotions to better understand their impact on your trading decisions. Try using a broader emotional vocabulary.'
      });
    }
    
    // Emotional impact insight
    const emotionsData = sortedEmotions.filter(e => e.trades >= 5);
    if (emotionsData.length >= 2) {
      const highestWinRate = emotionsData[0].winRate;
      const lowestWinRate = emotionsData[emotionsData.length - 1].winRate;
      const difference = highestWinRate - lowestWinRate;
      
      if (difference > 20) {
        insights.push({
          type: 'suggestion',
          icon: <Heart className="h-4 w-4" />,
          title: 'Significant Emotional Impact',
          description: `There's a ${difference.toFixed(1)}% win rate difference between your best and worst emotional states. Focus on trading in optimal emotional conditions.`
        });
      }
    }
    
    // Analyze emotion patterns over time
    if (emotionTimelineData.length >= 10) {
      // Check for recurring emotional patterns
      const consecutiveEmotions: Array<{emotion: string, count: number}> = [];
      let currentEmotion = '';
      let currentCount = 0;
      
      emotionTimelineData.forEach((data: any) => {
        if (data && data.emotion === currentEmotion) {
          currentCount++;
        } else {
          if (currentCount >= 3) {
            consecutiveEmotions.push({ emotion: currentEmotion, count: currentCount });
          }
          currentEmotion = data?.emotion || '';
          currentCount = 1;
        }
      });
      
      // Add insight if there are patterns of consecutive emotions
      if (consecutiveEmotions.length > 0) {
        const mostConsecutive = consecutiveEmotions.sort((a, b) => b.count - a.count)[0];
        insights.push({
          type: 'suggestion',
          icon: <Lightbulb className="h-4 w-4" />,
          title: 'Emotional Pattern Detected',
          description: `You had ${mostConsecutive.count} consecutive trades with "${mostConsecutive.emotion}" emotion. Be aware of how emotional streaks affect your decision-making.`
        });
      }
      
      // Check for emotional volatility
      const emotionChanges = emotionTimelineData.reduce((count, data: any, index, array) => {
        if (index > 0 && data && array[index - 1] && data.emotion !== array[index - 1].emotion) {
          return count + 1;
        }
        return count;
      }, 0);
      
      const volatilityRate = emotionChanges / emotionTimelineData.length;
      
      if (volatilityRate > 0.7 && emotionTimelineData.length >= 15) {
        insights.push({
          type: 'warning',
          icon: <AlertTriangle className="h-4 w-4" />,
          title: 'High Emotional Volatility',
          description: 'Your emotions change frequently between trades. Consider practices that promote emotional stability, such as meditation or longer breaks between sessions.'
        });
      } else if (volatilityRate < 0.2 && emotionTimelineData.length >= 15) {
        insights.push({
          type: 'positive',
          icon: <CheckCircle className="h-4 w-4" />,
          title: 'Emotional Consistency',
          description: 'You maintain consistent emotional states across trading sessions, which can lead to more predictable performance patterns.'
        });
      }
    }
    
    // Offer specific actionable advice for emotional improvement
    if (worstEmotion && worstEmotion.trades >= 5 && worstEmotion.winRate < 40) {
      let emotionAdvice = '';
      
      // Tailor advice to specific emotions
      if (worstEmotion.emotion.toLowerCase().includes('fear') || 
          worstEmotion.emotion.toLowerCase().includes('anxious') ||
          worstEmotion.emotion.toLowerCase().includes('worried')) {
        emotionAdvice = 'For fear-based emotions, try pre-defining your entry/exit points before market opens to reduce in-the-moment anxiety.';
      } else if (worstEmotion.emotion.toLowerCase().includes('anger') || 
                worstEmotion.emotion.toLowerCase().includes('frustrat')) {
        emotionAdvice = 'When feeling frustrated or angry, implement a mandatory "cooling off" period before placing new trades.';
      } else if (worstEmotion.emotion.toLowerCase().includes('excite') || 
                worstEmotion.emotion.toLowerCase().includes('overconfident')) {
        emotionAdvice = 'For excitement or overconfidence, double-check your position sizing to ensure you are not risking more than your trading plan allows.';
      } else {
        emotionAdvice = 'Create a personal checklist of warning signs that you are trading in a sub-optimal emotional state.';
      }
      
      insights.push({
        type: 'suggestion',
        icon: <Lightbulb className="h-4 w-4" />,
        title: 'Emotional Management Strategy',
        description: emotionAdvice
      });
    }
    
    return insights;
  }, [sortedEmotions, emotionPerformance, trades, emotionTimelineData, hasEnoughData]);

  // Chart colors
  const COLORS = CHART_CONFIG.COLORS;

  // Custom tooltip for emotion win rate
  const EmotionWinRateTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background/95 border border-muted shadow-sm rounded-md p-1.5 text-xs backdrop-blur-sm">
          <p className="font-medium">{label}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-primary">{payload[0].value.toFixed(1)}%</span>
            <span className="text-muted-foreground text-[10px]">
              ({winRateByEmotionData.find(item => item.name === label)?.trades || 0} trades)
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for emotion distribution
  const EmotionDistributionTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const totalTrades = emotionPerformance.reduce((sum, item) => sum + item.trades, 0);
      const winRate = emotionPerformance.find(item => item.emotion === data.name)?.winRate || 0;
      
      return (
        <div className="bg-background/95 border border-muted shadow-sm rounded-md p-1.5 text-xs backdrop-blur-sm">
          <p className="font-medium">{data.name}</p>
          <div className="flex flex-col gap-0.5 mt-0.5">
            <div className="flex items-center gap-1.5">
              <span className="text-primary">{((data.value / totalTrades) * 100).toFixed(1)}%</span>
              <span className="text-muted-foreground text-[10px]">({data.value} trades)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={winRate >= 50 ? 'text-success' : 'text-destructive'}>
                {winRate.toFixed(1)}% win rate
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for emotion timeline
  const EmotionTimelineTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const tradeData = emotionTimelineData.find(item => item && item.name === label);
      if (!tradeData) return null;
      
      return (
        <div className="bg-background/95 border border-muted shadow-sm rounded-md p-1.5 text-xs backdrop-blur-sm">
          <p className="font-medium">{label} - #{tradeData.trade}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={
              tradeData.result === 'win' ? 'text-success' : 
              tradeData.result === 'loss' ? 'text-destructive' : 
              'text-muted-foreground'
            }>
              {tradeData.result === 'win' ? 'Win' : 
               tradeData.result === 'loss' ? 'Loss' : 
               'Break-even'}
            </span>
            <span className="text-muted-foreground">•</span>
            <span className="text-primary">{tradeData.emotion}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  // Insufficient data state
  const InsufficientDataCard = () => (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold flex items-center">
          <Database className="h-5 w-5 mr-2 text-primary" />
          More Trading Data Needed
        </CardTitle>
        <CardDescription>
          Continue recording emotions with your trades to unlock insights
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-start gap-3">
          <div className="mt-0.5 p-1.5 rounded-full bg-primary/10 text-primary">
            <Lightbulb className="h-4 w-4" />
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              To get meaningful emotional insights, continue recording your emotional state during trading. 
              We recommend at least 10-15 trades with emotional data for reliable analysis.
            </p>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
              <li>Record a variety of emotions to identify patterns</li>
              <li>Be consistent and honest about your emotional states</li>
              <li>Try using a standardized emotion vocabulary</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Emotion Insights or Insufficient Data Message */}
      {emotionInsights.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex items-center">
              <Heart className="h-5 w-5 mr-2 text-primary" />
              Emotion Insights
            </CardTitle>
            <CardDescription>
              Analysis of how emotions impact your trading performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {emotionInsights.map((insight, index) => (
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
      
      {/* Top charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Win Rate by Emotion */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex items-center">
              <Heart className="h-5 w-5 mr-2 text-primary" />
              Win Rate by Emotion
            </CardTitle>
            <CardDescription>
              How your emotional state affects trade success
            </CardDescription>
          </CardHeader>
          <CardContent>
            {winRateByEmotionData.length > 0 ? (
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={winRateByEmotionData}
                    margin={{ top: 4, right: 8, left: 0, bottom: 4 }} // Chuẩn hóa theo quy tắc 4px
                    layout="vertical"
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
                      tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                      tickLine={false}
                      axisLine={{ stroke: 'hsl(var(--muted-foreground)/20)' }}
                      tickMargin={5}
                    />
                    <YAxis 
                      dataKey="name"
                      type="category"
                      tick={false}
                      tickLine={false}
                      axisLine={false}
                      width={10}
                    />
                    <Tooltip content={<EmotionWinRateTooltip />} />
                    <Bar 
                      dataKey="winRate" 
                      radius={[0, 4, 4, 0]}
                      barSize={winRateByEmotionData.length > 6 ? 14 : (winRateByEmotionData.length > 3 ? 18 : 22)}
                      isAnimationActive={false}
                      animationDuration={0}
                      className="hover:opacity-100"
                      label={props => {
                        const { x, y, width, height, value, index } = props;
                        const item = winRateByEmotionData[index];
                        
                        // Quyết định hiển thị nhãn và giá trị dựa trên độ rộng của thanh
                        const showTextInside = width > 80;
                        const showOnRight = width < 60; // Cả nhãn và giá trị hiển thị bên phải
                        
                        // Vị trí x và căn chỉnh văn bản
                        let textX, textAnchor;
                        
                        if (showOnRight) {
                          // Nếu thanh quá ngắn, hiển thị mọi thứ bên phải
                          textX = x + width + 5;
                          textAnchor = "start";
                        } else if (showTextInside) {
                          // Nếu thanh đủ rộng, hiển thị nhãn bên trong
                          textX = x + 8;
                          textAnchor = "start";
                        } else {
                          // Trường hợp trung gian, hiển thị nhãn bên trái
                          textX = x - 5;
                          textAnchor = "end";
                        }
                        
                        // Cắt ngắn tên cảm xúc nếu quá dài so với chiều rộng thanh
                        let displayName = item.name;
                        
                        // Xử lý trường hợp tên dài
                        if (showTextInside && width < 200 && displayName.length > 15) {
                          displayName = displayName.substring(0, 12) + "...";
                        }
                        
                        return (
                          <g>
                            {/* Hiển thị tên cảm xúc (nếu thanh quá ngắn, hiển thị kèm giá trị) */}
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
                      {winRateByEmotionData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS[index % COLORS.length]} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[260px] flex items-center justify-center flex-col">
                <Heart className="h-12 w-12 text-muted-foreground/20 mb-4" />
                <p className="text-sm text-muted-foreground">Not enough emotion data yet</p>
                <p className="text-xs text-muted-foreground mt-1">Record more trades with emotions to see win rates</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Emotion Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex items-center">
              <Heart className="h-5 w-5 mr-2 text-primary" />
              Emotion Distribution
            </CardTitle>
            <CardDescription>
              Distribution of emotions across your trades
            </CardDescription>
          </CardHeader>
          <CardContent>
            {emotionDistributionData.length > 0 ? (
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={emotionDistributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => 
                        `${name.length > 8 ? name.substring(0, 8) + '...' : name}: ${(percent * 100).toFixed(1)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {emotionDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<EmotionDistributionTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[260px] flex items-center justify-center flex-col">
                <Heart className="h-12 w-12 text-muted-foreground/20 mb-4" />
                <p className="text-sm text-muted-foreground">No emotion data recorded yet</p>
                <p className="text-xs text-muted-foreground mt-1">Record emotions with your trades to see distribution</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Emotion Timeline */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold flex items-center">
            <Heart className="h-5 w-5 mr-2 text-primary" />
            Emotion Timeline
          </CardTitle>
          <CardDescription>
            Sequence of emotions across your trading history
          </CardDescription>
        </CardHeader>
        <CardContent>
          {emotionTimelineData.length > 0 ? (
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={emotionTimelineData}
                  margin={{ top: 8, right: 8, left: 0, bottom: 0 }} // Chuẩn hóa theo quy tắc 4px
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground)/15)" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={false}
                    axisLine={{ stroke: 'hsl(var(--muted-foreground)/20)' }}
                    tickMargin={5}
                  />
                  <YAxis 
                    hide 
                    domain={[0, 1.1]} 
                  />
                  <Tooltip content={<EmotionTimelineTooltip />} />
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
                  {emotionTimelineData.length > 0 && Object.keys(emotionTimelineData[0] || {})
                    .filter(key => !['name', 'trade', 'result', 'emotion'].includes(key))
                    .map((emotion, index) => (
                      <Area
                        key={emotion}
                        type="monotone"
                        dataKey={emotion}
                        stackId="1"
                        stroke={COLORS[index % COLORS.length]}
                        fill={COLORS[index % COLORS.length]}
                        isAnimationActive={false}
                      />
                    ))}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[260px] flex items-center justify-center flex-col">
              <Heart className="h-12 w-12 text-muted-foreground/20 mb-4" />
              <p className="text-sm text-muted-foreground">Not enough data for timeline</p>
              <p className="text-xs text-muted-foreground mt-1">Complete more trades with emotional data to see patterns over time</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Emotion Performance Comparison */}
      {hasEnoughData && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex items-center">
              <Heart className="h-5 w-5 mr-2 text-primary" />
              Emotion Performance Table
            </CardTitle>
            <CardDescription>
              Detailed performance metrics by emotional state
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Emotion</TableHead>
                  <TableHead className="text-center">Trades</TableHead>
                  <TableHead className="text-center">Win Rate</TableHead>
                  <TableHead className="text-right">Relative Performance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {emotionPerformance.filter(e => e.trades > 0).map((emotion) => {
                  const avgWinRate = trades.length > 0 
                    ? trades.filter(t => (t.profitLoss || 0) > 0).length / trades.length * 100 
                    : 0;
                  const performanceDiff = emotion.winRate - avgWinRate;
                  
                  return (
                    <TableRow key={emotion.emotion}>
                      <TableCell className="font-medium">{emotion.emotion}</TableCell>
                      <TableCell className="text-center">{emotion.trades}</TableCell>
                      <TableCell className="text-center">
                        <span className={emotion.winRate >= 50 ? 'text-success' : 'text-destructive'}>
                          {emotion.winRate.toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge className={
                          performanceDiff > 5 
                            ? 'bg-success/20 text-success border-success/30' 
                            : performanceDiff < -5
                              ? 'bg-destructive/20 text-destructive border-destructive/30'
                              : 'bg-muted text-muted-foreground'
                        }>
                          {performanceDiff > 0 ? '+' : ''}{performanceDiff.toFixed(1)}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}