/**
 * Strategy AI Analysis Component
 * 
 * Phân tích hiệu suất chiến lược giao dịch với AI
 * - Thống kê hiệu suất từ dữ liệu giao dịch thực
 * - Phân tích win rate, impact của từng condition
 * - AI đưa ra gợi ý cải tiến dựa trên dữ liệu thực
 */

import React, { useState, useEffect } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Icons } from "@/components/icons/icons";
import { useToast } from "@/hooks/use-toast";
import { TradingStrategy } from "@/types";
import { getStrategies, updateStrategy } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";
import { useTradesQuery } from "@/hooks/use-trades-query";
import { 
  calculateAIStrategyData, 
  formatAIDataForGemini,
  type AIConditionPerformance,
  type AIAnalysisResults 
} from "./AIStrategyAnalysisCalculation";

// Types for analysis results
interface ConditionPerformance {
  id: string;
  label: string;
  type: 'rule' | 'entry' | 'exit';
  winRate: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  impact: 'high' | 'medium' | 'low';
  profitLoss: number;
  avgProfit: number;
  recommendation: 'keep' | 'modify' | 'remove';
}

interface AIRecommendation {
  id: string;
  title: string;
  description: string;
  confidence: number;
  impact: 'High' | 'Medium' | 'Low';
  type: 'add_condition' | 'modify_condition' | 'remove_condition';
  condition: {
    label: string;
    description: string;
    indicator?: string;
    timeframe?: string;
    expectedValue?: string;
  };
}

interface AnalysisResults {
  overallStats: {
    totalTrades: number;
    winRate: number;
    profitLoss: number;
    avgProfit: number;
    bestPerformingCondition: string;
    worstPerformingCondition: string;
  };
  conditionPerformance: ConditionPerformance[];
  recommendations: AIRecommendation[];
}

// Helper function to calculate stats from trades when analytics data is not available
const calculateStatsFromTrades = (strategyTrades: any[]) => {
  const winningTrades = strategyTrades.filter(t => 
    t.result === 'win' || t.result === 'Win' || 
    (t.profitLoss && t.profitLoss > 0) ||
    (t.pips && t.pips > 0)
  );
  const losingTrades = strategyTrades.filter(t => 
    t.result === 'loss' || t.result === 'Loss' ||
    (t.profitLoss && t.profitLoss < 0) ||
    (t.pips && t.pips < 0)
  );
  const totalProfit = strategyTrades.reduce((sum, t) => sum + (t.profitLoss || 0), 0);

  return {
    totalTrades: strategyTrades.length,
    winRate: strategyTrades.length > 0 ? (winningTrades.length / strategyTrades.length) * 100 : 0,
    profitLoss: totalProfit,
    avgProfit: strategyTrades.length > 0 ? totalProfit / strategyTrades.length : 0,
    bestPerformingCondition: '',
    worstPerformingCondition: ''
  };
};

// Hook for strategy analysis - now uses calculated values from analytics system
function useStrategyAnalysis() {
  const { toast } = useToast();

  const analyzeStrategyPerformance = async (
    strategy: TradingStrategy, 
    trades: any[],
    analyticsData?: any // Optional analytics data for fallback
  ): Promise<AnalysisResults> => {
    try {
      // Sử dụng module AI riêng để tính toán
      const aiResults = calculateAIStrategyData(strategy, trades);
      
      // Format dữ liệu cho Gemini AI
      const aiFormattedData = formatAIDataForGemini(strategy, aiResults);
      
      console.log('=== AI CALCULATION MODULE RESULTS ===');
      console.log('AI Strategy:', aiFormattedData.aiStrategyName);
      console.log('AI Overall Stats:', aiFormattedData.aiOverallStatsFormatted);
      console.log('AI Condition Performance:', aiFormattedData.aiConditionPerformanceFormatted);
      console.log('====================================');

      // Convert AI results to legacy format for compatibility
      const overallStats = {
        totalTrades: aiResults.aiOverallStats.aiTotalTrades,
        winRate: aiResults.aiOverallStats.aiWinRate,
        profitLoss: aiResults.aiOverallStats.aiProfitLoss,
        avgProfit: aiResults.aiOverallStats.aiAvgProfit,
        bestPerformingCondition: aiResults.aiOverallStats.aiBestPerformingCondition,
        worstPerformingCondition: aiResults.aiOverallStats.aiWorstPerformingCondition
      };

      // Convert AI condition performance to legacy format
      const conditionPerformance: ConditionPerformance[] = aiResults.aiConditionPerformance.map(aiCond => ({
        id: aiCond.id,
        label: aiCond.label,
        type: aiCond.type,
        winRate: aiCond.aiWinRate,
        totalTrades: aiCond.aiTotalTrades,
        winningTrades: aiCond.aiWinningTrades,
        losingTrades: aiCond.aiLosingTrades,
        impact: aiCond.aiImpact,
        profitLoss: aiCond.aiProfitLoss,
        avgProfit: aiCond.aiAvgProfit,
        recommendation: aiCond.aiRecommendation
      }));

      // Generate AI recommendations using Gemini với dữ liệu đã được tính toán từ module AI
      const recommendations = await generateAIRecommendations(strategy, overallStats, conditionPerformance);

      return {
        overallStats,
        conditionPerformance,
        recommendations
      };

    } catch (error) {
      console.error('AI Analysis error:', error instanceof Error ? error.message : 'Unknown error');
      throw new Error(error instanceof Error ? error.message : 'AI Analysis failed');
    }
  };

  const generateAIRecommendations = async (
    strategy: TradingStrategy,
    overallStats: any,
    conditionPerformance: ConditionPerformance[]
  ): Promise<AIRecommendation[]> => {
    // Hardcode API key for testing
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "AIzaSyAM8ZqOOPoPdkNhDacIJ4Hv2CnSC2z6qiA";
    if (!apiKey) {
      throw new Error('VITE_GEMINI_API_KEY is required for AI recommendations');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Log data being sent to Gemini for debugging
    console.log('=== AI DATA SENT TO GEMINI ===');
    console.log('Strategy:', strategy.name);
    console.log('Overall Stats:', overallStats);
    console.log('Condition Performance (AI Calculated):', conditionPerformance);
    console.log('==============================');

    const prompt = `
Phân tích chiến lược forex "${strategy.name}" và đưa ra gợi ý cải tiến bằng tiếng Việt:

THỐNG KÊ TỔNG QUAN:
- Tổng giao dịch: ${overallStats.totalTrades}
- Tỷ lệ thắng: ${overallStats.winRate.toFixed(1)}%
- Tổng P&L: $${overallStats.profitLoss.toFixed(2)}
- Lợi nhuận trung bình: $${overallStats.avgProfit.toFixed(2)}

HIỆU SUẤT CÁC ĐIỀU KIỆN:
${conditionPerformance.map(c => 
  `- ${c.label} (${c.type}): Tỷ lệ thắng ${c.winRate.toFixed(1)}%, ${c.totalTrades} giao dịch, P&L $${c.profitLoss.toFixed(2)}`
).join('\n')}

Dựa trên dữ liệu này, hãy đưa ra 2-3 gợi ý cải tiến cụ thể bằng TIẾNG VIỆT. Trả về JSON với nội dung tiếng Việt:

{
  "recommendations": [
    {
      "id": "rec-1",
      "title": "Tiêu đề gợi ý",
      "description": "Mô tả chi tiết dựa trên phân tích dữ liệu",
      "confidence": 85,
      "impact": "High",
      "type": "add_condition",
      "condition": {
        "label": "Điều kiện mới",
        "description": "Mô tả cách áp dụng",
        "indicator": "Chỉ báo kỹ thuật",
        "timeframe": "H1",
        "expectedValue": "Giá trị mong đợi"
      }
    }
  ]
}`;

    console.log('🚀 Sending request to Gemini AI...');
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ Gemini AI Response received:', text);
    
    const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    console.log('🧹 Cleaned text:', cleanText);
    
    const parsed = JSON.parse(cleanText);
    console.log('📊 Parsed recommendations:', parsed);
    
    return parsed.recommendations || [];
  };

  const generateSmartRecommendations = (
    strategy: TradingStrategy,
    overallStats: any,
    conditionPerformance: ConditionPerformance[]
  ): AIRecommendation[] => {
    const recommendations: AIRecommendation[] = [];

    // Analyze based on win rate
    if (overallStats.winRate < 60) {
      recommendations.push({
        id: 'rec-winrate',
        title: 'Cải thiện tỷ lệ thắng',
        description: `Tỷ lệ thắng hiện tại ${overallStats.winRate.toFixed(1)}% cần được cải thiện. Đề xuất thêm bộ lọc để tăng chất lượng tín hiệu.`,
        confidence: 88,
        impact: 'High',
        type: 'add_condition',
        condition: {
          label: 'Xác nhận với multiple timeframes',
          description: 'Xác nhận tín hiệu trên nhiều khung thời gian trước khi vào lệnh',
          indicator: 'Multi-TF Analysis',
          timeframe: 'H1 + H4',
          expectedValue: 'Cùng hướng trend'
        }
      });
    }

    // Analyze based on profit/loss
    if (overallStats.avgProfit < 0) {
      recommendations.push({
        id: 'rec-risk',
        title: 'Tối ưu quản lý rủi ro',
        description: 'Lợi nhuận trung bình âm cho thấy cần cải thiện stop loss và take profit.',
        confidence: 92,
        impact: 'High',
        type: 'add_condition',
        condition: {
          label: 'Dynamic Stop Loss dựa trên ATR',
          description: 'Sử dụng ATR để điều chỉnh stop loss linh hoạt theo volatility thị trường',
          indicator: 'ATR(14)',
          timeframe: 'Current',
          expectedValue: '2x ATR'
        }
      });
    }

    // Analyze poor performing conditions
    const poorConditions = conditionPerformance.filter(c => c.winRate < 40);
    if (poorConditions.length > 0) {
      recommendations.push({
        id: 'rec-remove',
        title: 'Loại bỏ điều kiện kém hiệu quả',
        description: `Điều kiện "${poorConditions[0].label}" có win rate thấp (${poorConditions[0].winRate.toFixed(1)}%). Đề xuất xem xét loại bỏ hoặc thay thế.`,
        confidence: 75,
        impact: 'Medium',
        type: 'remove_condition',
        condition: {
          label: poorConditions[0].label,
          description: 'Xem xét loại bỏ điều kiện này khỏi strategy'
        }
      });
    }

    return recommendations;
  };

  return { analyzeStrategyPerformance };
}

// Performance Statistics Card - Compact modern design
function PerformanceStatsCard({ stats }: { stats: any }) {
  return (
    <Card className="border-0 shadow-sm bg-gradient-to-r from-card to-card/50">
      <CardContent className="p-4">
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-lg font-semibold text-primary">{stats.totalTrades}</div>
            <div className="text-xs text-muted-foreground">Trades</div>
          </div>
          <div className="text-center border-l border-border/30 pl-4">
            <div className={`text-lg font-semibold ${
              stats.winRate >= 60 ? 'text-emerald-600' : 
              stats.winRate >= 40 ? 'text-amber-600' : 'text-red-500'
            }`}>
              {stats.winRate.toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground">Win Rate</div>
          </div>
          <div className="text-center border-l border-border/30 pl-4">
            <div className={`text-lg font-semibold ${stats.profitLoss >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              ${Math.abs(stats.profitLoss) >= 1000 ? 
                `${(stats.profitLoss / 1000).toFixed(1)}k` : 
                stats.profitLoss.toFixed(0)}
            </div>
            <div className="text-xs text-muted-foreground">Total P&L</div>
          </div>
          <div className="text-center border-l border-border/30 pl-4">
            <div className={`text-lg font-semibold ${stats.avgProfit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              ${stats.avgProfit.toFixed(1)}
            </div>
            <div className="text-xs text-muted-foreground">Avg/Trade</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Condition Performance Card - Compact refined design
function ConditionCard({ condition }: { condition: ConditionPerformance }) {
  const getStatusConfig = () => {
    if (condition.recommendation === 'keep') 
      return { 
        color: 'border-l-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20', 
        icon: <Icons.ui.check className="h-3.5 w-3.5 text-emerald-600" />,
        badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
      };
    if (condition.recommendation === 'modify') 
      return { 
        color: 'border-l-amber-400 bg-amber-50/50 dark:bg-amber-950/20', 
        icon: <Icons.ui.warning className="h-3.5 w-3.5 text-amber-600" />,
        badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
      };
    return { 
      color: 'border-l-red-400 bg-red-50/50 dark:bg-red-950/20', 
      icon: <Icons.ui.x className="h-3.5 w-3.5 text-red-600" />,
      badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
    };
  };

  const statusConfig = getStatusConfig();

  return (
    <Card className={`border-l-4 ${statusConfig.color} border-r-0 border-t-0 border-b-0 shadow-sm hover:shadow-md transition-all duration-200`}>
      <CardContent className="p-3">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-start gap-2 flex-1">
            {statusConfig.icon}
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm text-foreground truncate">{condition.label}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className={`text-xs px-1.5 py-0.5 ${statusConfig.badge} border-0`}>
                  {condition.type}
                </Badge>
                <span className={`text-xs font-medium ${
                  condition.winRate >= 60 ? 'text-emerald-600' : 
                  condition.winRate >= 40 ? 'text-amber-600' : 'text-red-500'
                }`}>
                  {condition.winRate.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <Progress 
            value={condition.winRate} 
            className={`h-1.5 ${
              condition.winRate >= 60 ? '[&_div]:bg-emerald-500' : 
              condition.winRate >= 40 ? '[&_div]:bg-amber-500' : '[&_div]:bg-red-500'
            }`}
          />
          
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="text-center">
              <div className="text-muted-foreground">Trades</div>
              <div className="font-medium text-foreground">{condition.totalTrades}</div>
            </div>
            <div className="text-center">
              <div className="text-muted-foreground">Impact</div>
              <div className={`font-medium capitalize ${
                condition.impact === 'high' ? 'text-red-600' :
                condition.impact === 'medium' ? 'text-amber-600' : 'text-blue-600'
              }`}>
                {condition.impact}
              </div>
            </div>
            <div className="text-center">
              <div className="text-muted-foreground">P&L</div>
              <div className={`font-medium ${condition.profitLoss >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                ${Math.abs(condition.profitLoss) >= 100 ? 
                  `${(condition.profitLoss / 100).toFixed(1)}h` : 
                  condition.profitLoss.toFixed(0)}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// AI Recommendation Card - Modern compact design
function RecommendationCard({ 
  recommendation, 
  onApply 
}: { 
  recommendation: AIRecommendation;
  onApply: (rec: AIRecommendation) => void;
}) {
  const getImpactConfig = () => {
    switch (recommendation.impact) {
      case 'High': 
        return { 
          color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
          icon: <Icons.analytics.trendingUp className="h-3 w-3" />,
          border: 'border-l-red-400'
        };
      case 'Medium': 
        return { 
          color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
          icon: <Icons.analytics.barChart className="h-3 w-3" />,
          border: 'border-l-amber-400'
        };
      case 'Low': 
        return { 
          color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
          icon: <Icons.analytics.activity className="h-3 w-3" />,
          border: 'border-l-blue-400'
        };
      default: 
        return { 
          color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300',
          icon: <Icons.analytics.activity className="h-3 w-3" />,
          border: 'border-l-gray-400'
        };
    }
  };

  const impactConfig = getImpactConfig();

  return (
    <Card className={`border-l-4 ${impactConfig.border} border-r-0 border-t-0 border-b-0 shadow-sm hover:shadow-md transition-all duration-200 bg-gradient-to-r from-card to-card/50`}>
      <CardContent className="p-3">
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Icons.analytics.brain className="h-3.5 w-3.5 text-primary" />
                <h3 className="font-medium text-sm text-foreground truncate">{recommendation.title}</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                {recommendation.description}
              </p>
            </div>
            <Button 
              size="sm" 
              variant="ghost"
              onClick={() => onApply(recommendation)}
              className="h-7 w-7 p-0 shrink-0 hover:bg-primary/10"
            >
              <Icons.ui.plus className="h-3 w-3" />
            </Button>
          </div>
          
          {recommendation.condition && (
            <div className="bg-muted/30 rounded-md p-2 text-xs border border-border/30">
              <div className="font-medium text-foreground mb-0.5 truncate">{recommendation.condition.label}</div>
              <div className="text-muted-foreground line-clamp-1">{recommendation.condition.description}</div>
              {(recommendation.condition.indicator || recommendation.condition.timeframe) && (
                <div className="flex items-center gap-2 mt-1">
                  {recommendation.condition.indicator && (
                    <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 bg-primary/5 border-primary/20">
                      {recommendation.condition.indicator}
                    </Badge>
                  )}
                  {recommendation.condition.timeframe && (
                    <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 bg-secondary/50">
                      {recommendation.condition.timeframe}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          )}
          
          <div className="flex justify-between items-center">
            <Badge className={`text-xs px-2 py-0.5 border-0 ${impactConfig.color}`}>
              <span className="mr-1">{impactConfig.icon}</span>
              {recommendation.impact}
            </Badge>
            <div className="text-xs text-muted-foreground">
              {recommendation.confidence}% confidence
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Main Component
export default function StrategyAIAnalysis() {
  const { userId } = useAuth();
  const { trades } = useTradesQuery();
  const { toast } = useToast();
  
  const [strategies, setStrategies] = useState<TradingStrategy[]>([]);
  const [selectedStrategyId, setSelectedStrategyId] = useState<string>('');
  const [selectedStrategy, setSelectedStrategy] = useState<TradingStrategy | null>(null);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResults | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoadingStrategies, setIsLoadingStrategies] = useState(false);

  const { analyzeStrategyPerformance } = useStrategyAnalysis();

  // Load strategies
  useEffect(() => {
    const loadStrategies = async () => {
      if (!userId) {
        console.log('No userId available for loading strategies');
        return;
      }
      
      console.log('Loading strategies for userId:', userId);
      setIsLoadingStrategies(true);
      try {
        const strategiesData = await getStrategies(userId);
        console.log('Loaded strategies:', strategiesData);
        setStrategies(strategiesData || []);
      } catch (error) {
        console.error('Error loading strategies:', error);
        toast({
          title: "Error",
          description: "Unable to load strategies",
          variant: "destructive"
        });
      } finally {
        setIsLoadingStrategies(false);
      }
    };

    loadStrategies();
  }, [userId, toast]);

  // Handle strategy selection
  const handleStrategyChange = async (value: string) => {
    setSelectedStrategyId(value);
    const strategy = strategies.find(s => s.id === value);
    setSelectedStrategy(strategy || null);
    
    // Auto-run condition analysis when strategy is selected
    if (strategy && trades) {
      setIsAnalyzing(true);
      try {
        const results = await analyzeStrategyPerformance(strategy, trades);
        setAnalysisResults(results);
      } catch (error) {
        console.error('Auto-analysis error:', error);
        setAnalysisResults(null);
      } finally {
        setIsAnalyzing(false);
      }
    } else {
      setAnalysisResults(null);
    }
  };

  // Run analysis
  const handleRunAnalysis = async () => {
    if (!selectedStrategy || !trades) return;

    setIsAnalyzing(true);
    try {
      const results = await analyzeStrategyPerformance(selectedStrategy, trades);
      setAnalysisResults(results);
      
      toast({
        title: "Analysis Complete",
        description: `Analyzed ${results.overallStats.totalTrades} trades for strategy "${selectedStrategy.name}"`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Analysis failed';
      toast({
        title: "Analysis Error",
        description: message,
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Apply recommendation
  const handleApplyRecommendation = async (recommendation: AIRecommendation) => {
    if (!selectedStrategy || !userId) return;

    try {
      if (recommendation.type === 'add_condition') {
        const newCondition = {
          id: `cond-${Date.now()}`,
          label: recommendation.condition.label,
          order: (selectedStrategy.rules?.length || 0) + 1,
          description: recommendation.condition.description,
          indicator: recommendation.condition.indicator,
          timeframe: recommendation.condition.timeframe,
          expectedValue: recommendation.condition.expectedValue,
        };

        const updatedStrategy = {
          ...selectedStrategy,
          rules: [...(selectedStrategy.rules || []), newCondition]
        };

        await updateStrategy(userId, selectedStrategy.id, updatedStrategy);
        setSelectedStrategy(updatedStrategy);
        
        toast({
          title: "Recommendation Applied",
          description: `Added "${recommendation.condition.label}" to your strategy`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Unable to apply recommendation",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container max-w-7xl mx-auto px-0 sm:px-6 lg:px-8 space-y-6">

      {/* Strategy Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Strategy</CardTitle>
          <CardDescription>
            Choose a strategy to analyze performance based on trading data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select 
            value={selectedStrategyId} 
            onValueChange={handleStrategyChange}
            disabled={isLoadingStrategies}
          >
            <SelectTrigger>
              <SelectValue placeholder={
                isLoadingStrategies 
                  ? "Loading..." 
                  : "Select strategy"
              } />
            </SelectTrigger>
            <SelectContent>
              {strategies.map((strategy) => (
                <SelectItem key={strategy.id} value={strategy.id}>
                  {strategy.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedStrategy && (
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="text-sm text-muted-foreground">
                {trades?.length || 0} trades available • Analysis auto-loaded
              </div>
              {analysisResults && (
                <Button 
                  onClick={handleRunAnalysis}
                  disabled={isAnalyzing}
                  variant="outline"
                >
                  {isAnalyzing ? (
                    <>
                      <Icons.ui.spinner className="h-4 w-4 mr-2 animate-spin" />
                      Getting AI suggestions...
                    </>
                  ) : (
                    <>
                      <Icons.analytics.brain className="h-4 w-4 mr-2" />
                      Get AI Recommendations
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Loading State */}
      {isAnalyzing && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Icons.ui.spinner className="h-4 w-4 animate-spin" />
                <span>Analyzing strategy...</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-20" />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {analysisResults && (
        <div className="space-y-4">
          {/* Overall Performance - Compact */}
          <PerformanceStatsCard stats={analysisResults.overallStats} />

          {/* Condition Performance - Modern compact layout */}
          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Condition Analysis</h3>
                <p className="text-sm text-muted-foreground">Performance breakdown by condition type</p>
              </div>
              <div className="text-sm text-muted-foreground">
                {analysisResults.conditionPerformance.length} conditions analyzed
              </div>
            </div>

            <Tabs defaultValue="all" className="space-y-3">
              <TabsList className="grid w-full grid-cols-4 bg-muted/50">
                <TabsTrigger value="all" className="text-xs">All ({analysisResults.conditionPerformance.length})</TabsTrigger>
                <TabsTrigger value="rules" className="text-xs">
                  Rules ({analysisResults.conditionPerformance.filter(c => c.type === 'rule').length})
                </TabsTrigger>
                <TabsTrigger value="entry" className="text-xs">
                  Entry ({analysisResults.conditionPerformance.filter(c => c.type === 'entry').length})
                </TabsTrigger>
                <TabsTrigger value="exit" className="text-xs">
                  Exit ({analysisResults.conditionPerformance.filter(c => c.type === 'exit').length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-0">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {analysisResults.conditionPerformance.map((condition) => (
                    <ConditionCard key={condition.id} condition={condition} />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="rules" className="space-y-0">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {analysisResults.conditionPerformance
                    .filter(c => c.type === 'rule')
                    .map((condition) => (
                      <ConditionCard key={condition.id} condition={condition} />
                    ))}
                </div>
              </TabsContent>

              <TabsContent value="entry" className="space-y-0">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {analysisResults.conditionPerformance
                    .filter(c => c.type === 'entry')
                    .map((condition) => (
                      <ConditionCard key={condition.id} condition={condition} />
                    ))}
                </div>
              </TabsContent>

              <TabsContent value="exit" className="space-y-0">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {analysisResults.conditionPerformance
                    .filter(c => c.type === 'exit')
                    .map((condition) => (
                      <ConditionCard key={condition.id} condition={condition} />
                    ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* AI Recommendations - Compact modern design */}
          {analysisResults.recommendations.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Icons.analytics.brain className="h-5 w-5 text-primary" />
                    AI Recommendations
                  </h3>
                  <p className="text-sm text-muted-foreground">Smart suggestions to enhance your strategy</p>
                </div>
                <Badge variant="secondary" className="px-2 py-1 text-xs">
                  {analysisResults.recommendations.length} suggestions
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {analysisResults.recommendations.map((recommendation) => (
                  <RecommendationCard 
                    key={recommendation.id} 
                    recommendation={recommendation}
                    onApply={handleApplyRecommendation}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* No data state */}
      {selectedStrategy && !isAnalyzing && !analysisResults && trades && trades.length === 0 && (
        <Alert>
          <Icons.ui.info className="h-4 w-4" />
          <AlertDescription>
            No trading data available for analysis. Start trading with this strategy to get performance insights.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}