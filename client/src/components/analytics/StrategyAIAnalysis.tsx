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
      console.error('AI Analysis error:', error);
      throw error;
    }
  };

  const generateAIRecommendations = async (
    strategy: TradingStrategy,
    overallStats: any,
    conditionPerformance: ConditionPerformance[]
  ): Promise<AIRecommendation[]> => {
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "AIzaSyAM8ZqOOPoPdkNhDacIJ4Hv2CnSC2z6qiA";
      if (!apiKey) {
        // Return smart recommendations based on data analysis without AI
        return generateSmartRecommendations(strategy, overallStats, conditionPerformance);
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

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      try {
        const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed = JSON.parse(cleanText);
        return parsed.recommendations || [];
      } catch (parseError) {
        console.warn('Failed to parse AI response, using smart recommendations');
        return generateSmartRecommendations(strategy, overallStats, conditionPerformance);
      }

    } catch (error) {
      console.warn('AI recommendation failed, using smart recommendations');
      return generateSmartRecommendations(strategy, overallStats, conditionPerformance);
    }
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

// Performance Statistics Card
function PerformanceStatsCard({ stats }: { stats: any }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold text-primary">{stats.totalTrades}</div>
          <div className="text-sm text-muted-foreground">Total Trades</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className={`text-2xl font-bold ${
            stats.winRate >= 60 ? 'text-green-600' : 
            stats.winRate >= 40 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {stats.winRate.toFixed(1)}%
          </div>
          <div className="text-sm text-muted-foreground">Win Rate</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className={`text-2xl font-bold ${stats.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${stats.profitLoss.toFixed(2)}
          </div>
          <div className="text-sm text-muted-foreground">Total P&L</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className={`text-2xl font-bold ${stats.avgProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${stats.avgProfit.toFixed(2)}
          </div>
          <div className="text-sm text-muted-foreground">Avg Per Trade</div>
        </CardContent>
      </Card>
    </div>
  );
}

// Condition Performance Card
function ConditionCard({ condition }: { condition: ConditionPerformance }) {
  const getStatusColor = () => {
    if (condition.recommendation === 'keep') return 'border-green-200 bg-green-50';
    if (condition.recommendation === 'modify') return 'border-yellow-200 bg-yellow-50';
    return 'border-red-200 bg-red-50';
  };

  const getStatusIcon = () => {
    if (condition.recommendation === 'keep') return <Icons.ui.check className="h-4 w-4 text-green-600" />;
    if (condition.recommendation === 'modify') return <Icons.ui.warning className="h-4 w-4 text-yellow-600" />;
    return <Icons.ui.x className="h-4 w-4 text-red-600" />;
  };

  return (
    <Card className={`border ${getStatusColor()}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <div>
              <h3 className="font-medium text-sm">{condition.label}</h3>
              <Badge variant="outline" className="text-xs">
                {condition.type}
              </Badge>
            </div>
          </div>
        </div>
        
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Win Rate</span>
              <span className="font-medium">{condition.winRate.toFixed(1)}%</span>
            </div>
            <Progress value={condition.winRate} className="h-2" />
          </div>
          
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <div className="text-muted-foreground">Trades</div>
              <div className="font-medium">{condition.totalTrades}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Impact</div>
              <div className="font-medium capitalize">{condition.impact}</div>
            </div>
            <div>
              <div className="text-muted-foreground">P&L</div>
              <div className={`font-medium ${condition.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${condition.profitLoss.toFixed(1)}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// AI Recommendation Card
function RecommendationCard({ 
  recommendation, 
  onApply 
}: { 
  recommendation: AIRecommendation;
  onApply: (rec: AIRecommendation) => void;
}) {
  const getImpactColor = () => {
    switch (recommendation.impact) {
      case 'High': return 'bg-red-100 text-red-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-3">
          <div>
            <h3 className="font-medium text-sm mb-1">{recommendation.title}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {recommendation.description}
            </p>
          </div>
          
          {recommendation.condition && (
            <div className="bg-muted/50 rounded p-3 text-xs">
              <div className="font-medium mb-1">{recommendation.condition.label}</div>
              <div className="text-muted-foreground">{recommendation.condition.description}</div>
            </div>
          )}
          
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <div className="text-xs">
                <span className="text-muted-foreground">Confidence: </span>
                <span className="font-medium">{recommendation.confidence}%</span>
              </div>
              <Badge className={`text-xs ${getImpactColor()}`}>
                {recommendation.impact} Impact
              </Badge>
            </div>
            
            <Button 
              size="sm" 
              onClick={() => onApply(recommendation)}
            >
              <Icons.ui.check className="h-3 w-3 mr-1" />
              Apply
            </Button>
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
        <div className="space-y-6">
          {/* Condition Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Condition Analysis</CardTitle>
              <CardDescription>
                Performance of each condition in the strategy
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="rules">Rules</TabsTrigger>
                  <TabsTrigger value="entry">Entry</TabsTrigger>
                  <TabsTrigger value="exit">Exit</TabsTrigger>
                </TabsList>

                <TabsContent value="all">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {analysisResults.conditionPerformance.map((condition) => (
                      <ConditionCard key={condition.id} condition={condition} />
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="rules">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {analysisResults.conditionPerformance
                      .filter(c => c.type === 'rule')
                      .map((condition) => (
                        <ConditionCard key={condition.id} condition={condition} />
                      ))}
                  </div>
                </TabsContent>

                <TabsContent value="entry">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {analysisResults.conditionPerformance
                      .filter(c => c.type === 'entry')
                      .map((condition) => (
                        <ConditionCard key={condition.id} condition={condition} />
                      ))}
                  </div>
                </TabsContent>

                <TabsContent value="exit">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {analysisResults.conditionPerformance
                      .filter(c => c.type === 'exit')
                      .map((condition) => (
                        <ConditionCard key={condition.id} condition={condition} />
                      ))}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* AI Recommendations */}
          {analysisResults.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>AI Recommendations</CardTitle>
                <CardDescription>
                  Suggestions to improve your strategy
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analysisResults.recommendations.map((recommendation) => (
                    <RecommendationCard 
                      key={recommendation.id} 
                      recommendation={recommendation}
                      onApply={handleApplyRecommendation}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
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