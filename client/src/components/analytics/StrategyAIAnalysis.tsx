/**
 * Strategy AI Analysis Component - Modern Refined Design
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

// API Key from environment
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Types for analysis results
interface ConditionPerformance {
  id: string;
  label: string;
  type: 'rule' | 'entry' | 'exit';
  winRate: number;
  totalTrades: number;
  impact: 'High' | 'Medium' | 'Low';
  effectiveness: number;
}

interface AIRecommendation {
  id: string;
  title: string;
  description: string;
  confidence: number;
  impact: 'High' | 'Medium' | 'Low';
  type: 'add_condition' | 'remove_condition' | 'modify_condition' | 'general_advice';
  condition?: {
    label: string;
    description: string;
    indicator?: string;
    timeframe?: string;
    expectedValue?: string;
  };
}

interface AnalysisResults {
  overallPerformance: {
    totalTrades: number;
    winRate: number;
    avgProfit: number;
    profitFactor: number;
    maxDrawdown: number;
  };
  conditionPerformance: ConditionPerformance[];
  recommendations: AIRecommendation[];
  summary: string;
}

export default function StrategyAIAnalysis() {
  const { userId } = useAuth();
  const { trades } = useTradesQuery();
  const { toast } = useToast();

  const [strategies, setStrategies] = useState<TradingStrategy[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState<TradingStrategy | null>(null);
  const [isLoadingStrategies, setIsLoadingStrategies] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResults | null>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [isLoadingAIRecommendations, setIsLoadingAIRecommendations] = useState(false);

  // Load strategies
  useEffect(() => {
    const loadStrategies = async () => {
      if (!userId) return;
      
      setIsLoadingStrategies(true);
      try {
        const strategiesData = await getStrategies(userId);
        setStrategies(strategiesData || []);
      } catch (error) {
        console.error('Error loading strategies:', error);
        toast({
          title: "Error",
          description: "Failed to load strategies",
          variant: "destructive",
        });
      } finally {
        setIsLoadingStrategies(false);
      }
    };

    loadStrategies();
  }, [userId, toast]);

  // Auto-analyze when strategy changes
  useEffect(() => {
    if (selectedStrategy && trades?.length) {
      handleAnalyzeStrategy();
    }
  }, [selectedStrategy, trades]);

  const handleAnalyzeStrategy = async () => {
    if (!selectedStrategy || !trades?.length) return;

    setIsLoadingAnalysis(true);
    try {
      const strategyTrades = trades.filter(trade => 
        trade.strategy === selectedStrategy.name || 
        trade.usedRules?.some(ruleId => selectedStrategy.rules?.some(rule => rule.id === ruleId))
      );

      if (strategyTrades.length === 0) {
        toast({
          title: "No Data",
          description: "No trades found for this strategy",
          variant: "destructive",
        });
        setIsLoadingAnalysis(false);
        return;
      }

      // Calculate performance metrics
      const totalTrades = strategyTrades.length;
      const winningTrades = strategyTrades.filter(trade => (trade.profitLoss || 0) > 0).length;
      const winRate = (winningTrades / totalTrades) * 100;
      const avgProfit = strategyTrades.reduce((sum, trade) => sum + (trade.profitLoss || 0), 0) / totalTrades;
      
      const profits = strategyTrades.filter(trade => (trade.profitLoss || 0) > 0);
      const losses = strategyTrades.filter(trade => (trade.profitLoss || 0) < 0);
      const totalProfit = profits.reduce((sum, trade) => sum + (trade.profitLoss || 0), 0);
      const totalLoss = Math.abs(losses.reduce((sum, trade) => sum + (trade.profitLoss || 0), 0));
      const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? 999 : 0;

      // Calculate condition performance
      const conditionPerformance: ConditionPerformance[] = [];

      // Analyze rules
      selectedStrategy.rules?.forEach(rule => {
        const rulesTrades = strategyTrades.filter(trade => 
          trade.usedRules?.includes(rule.id)
        );
        
        if (rulesTrades.length > 0) {
          const ruleWins = rulesTrades.filter(trade => (trade.profitLoss || 0) > 0).length;
          const ruleWinRate = (ruleWins / rulesTrades.length) * 100;
          
          conditionPerformance.push({
            id: rule.id,
            label: rule.label,
            type: 'rule',
            winRate: ruleWinRate,
            totalTrades: rulesTrades.length,
            impact: ruleWinRate > 60 ? 'High' : ruleWinRate > 40 ? 'Medium' : 'Low',
            effectiveness: ruleWinRate
          });
        }
      });

      // Set analysis results
      setAnalysisResults({
        overallPerformance: {
          totalTrades,
          winRate,
          avgProfit,
          profitFactor,
          maxDrawdown: 0 // Simplified for now
        },
        conditionPerformance,
        recommendations: [],
        summary: `Strategy analysis completed for ${totalTrades} trades with ${winRate.toFixed(1)}% win rate.`
      });

    } catch (error) {
      console.error('Error analyzing strategy:', error);
      toast({
        title: "Analysis Error",
        description: "Failed to analyze strategy performance",
        variant: "destructive",
      });
    } finally {
      setIsLoadingAnalysis(false);
    }
  };

  const handleRunAIRecommendations = async () => {
    if (!analysisResults || !GEMINI_API_KEY) {
      toast({
        title: "API Key Required",
        description: "Please set your Gemini API key in environment variables",
        variant: "destructive",
      });
      return;
    }

    setIsLoadingAIRecommendations(true);
    try {
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });

      const prompt = `
      Analyze this forex trading strategy performance and provide specific recommendations:

      Overall Performance:
      - Total Trades: ${analysisResults.overallPerformance.totalTrades}
      - Win Rate: ${analysisResults.overallPerformance.winRate.toFixed(1)}%
      - Average Profit: $${analysisResults.overallPerformance.avgProfit.toFixed(2)}
      - Profit Factor: ${analysisResults.overallPerformance.profitFactor.toFixed(2)}

      Condition Performance:
      ${analysisResults.conditionPerformance.map(condition => 
        `- ${condition.label}: ${condition.winRate.toFixed(1)}% win rate (${condition.totalTrades} trades)`
      ).join('\n')}

      Please provide:
      1. 3-5 specific recommendations to improve this strategy
      2. Each recommendation should include:
         - Title (concise action)
         - Description (detailed explanation)
         - Confidence level (0-100)
         - Impact level (High/Medium/Low)
         - Specific condition to add/modify if applicable

      Format as JSON with this structure:
      {
        "recommendations": [
          {
            "id": "rec-1",
            "title": "Recommendation title",
            "description": "Detailed description",
            "confidence": 85,
            "impact": "High",
            "type": "add_condition",
            "condition": {
              "label": "Condition name",
              "description": "What this condition does",
              "indicator": "Technical indicator",
              "timeframe": "Time frame",
              "expectedValue": "Expected value/signal"
            }
          }
        ]
      }
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      try {
        const parsed = JSON.parse(text);
        setAnalysisResults(prev => prev ? {
          ...prev,
          recommendations: parsed.recommendations
        } : null);

        toast({
          title: "AI Analysis Complete",
          description: `Generated ${parsed.recommendations.length} recommendations`,
          variant: "default",
        });
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError);
        toast({
          title: "Analysis Error",
          description: "Failed to parse AI recommendations",
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error('Error getting AI recommendations:', error);
      toast({
        title: "AI Error",
        description: "Failed to get AI recommendations. Please check your API key.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingAIRecommendations(false);
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'High': return 'bg-red-500/10 text-red-700 border-red-200 dark:bg-red-500/20 dark:text-red-400 dark:border-red-800';
      case 'Medium': return 'bg-yellow-500/10 text-yellow-700 border-yellow-200 dark:bg-yellow-500/20 dark:text-yellow-400 dark:border-yellow-800';
      case 'Low': return 'bg-green-500/10 text-green-700 border-green-200 dark:bg-green-500/20 dark:text-green-400 dark:border-green-800';
      default: return 'bg-gray-500/10 text-gray-700 border-gray-200 dark:bg-gray-500/20 dark:text-gray-400 dark:border-gray-800';
    }
  };

  const getPerformanceColor = (winRate: number) => {
    if (winRate >= 60) return 'text-green-600 dark:text-green-400';
    if (winRate >= 40) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="space-y-8">
      {/* Modern Header Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-purple-950/30 border border-blue-200/30 dark:border-blue-800/30">
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-800 dark:[mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.05))]" />
        <div className="relative p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/25">
              <Icons.analytics.brain className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">AI Strategy Analysis</h2>
              <p className="text-gray-600 dark:text-gray-300">Intelligent insights powered by Gemini AI</p>
            </div>
          </div>

          {/* Strategy Selection */}
          <div className="space-y-4">
            <Select
              value={selectedStrategy?.id || ''}
              onValueChange={(value) => {
                const strategy = strategies.find(s => s.id === value);
                setSelectedStrategy(strategy || null);
                setAnalysisResults(null);
              }}
              disabled={isLoadingStrategies}
            >
              <SelectTrigger className="h-12 bg-white/80 dark:bg-gray-800/80 backdrop-blur border-white/20 dark:border-gray-700/20 shadow-sm">
                <SelectValue placeholder={
                  isLoadingStrategies 
                    ? "Loading strategies..." 
                    : "Select a strategy to analyze"
                } />
              </SelectTrigger>
              <SelectContent>
                {strategies.map((strategy) => (
                  <SelectItem key={strategy.id} value={strategy.id}>
                    <div className="flex items-center gap-2">
                      <Icons.strategy.target className="h-4 w-4" />
                      {strategy.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedStrategy && (
              <div className="flex items-center justify-between p-4 bg-white/60 dark:bg-gray-800/60 backdrop-blur rounded-xl border border-white/20 dark:border-gray-700/20">
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  <span className="font-medium">{trades?.length || 0}</span> trades available • Analysis ready
                </div>
                {analysisResults && (
                  <Button 
                    onClick={handleRunAIRecommendations}
                    disabled={isLoadingAIRecommendations || !GEMINI_API_KEY}
                    variant="outline"
                    size="sm"
                    className="bg-white/80 dark:bg-gray-800/80 backdrop-blur border-white/20 dark:border-gray-700/20 hover:bg-white dark:hover:bg-gray-800"
                  >
                    {isLoadingAIRecommendations ? (
                      <>
                        <Icons.ui.spinner className="h-4 w-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Icons.analytics.brain className="h-4 w-4 mr-2" />
                        Get AI Insights
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Analysis Results */}
      {isLoadingAnalysis && (
        <div className="grid gap-6">
          <Card variant="glass" className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-6 w-48" />
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      )}

      {analysisResults && (
        <div className="space-y-8">
          {/* Performance Overview */}
          <Card variant="glass" hover className="overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icons.analytics.trendingUp className="h-5 w-5 text-blue-600" />
                Performance Overview
              </CardTitle>
              <CardDescription>
                Overall strategy performance metrics and key indicators
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                <div className="text-center space-y-2">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {analysisResults.overallPerformance.totalTrades}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Trades</div>
                </div>
                <div className="text-center space-y-2">
                  <div className={`text-2xl font-bold ${getPerformanceColor(analysisResults.overallPerformance.winRate)}`}>
                    {analysisResults.overallPerformance.winRate.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Win Rate</div>
                </div>
                <div className="text-center space-y-2">
                  <div className={`text-2xl font-bold ${analysisResults.overallPerformance.avgProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    ${analysisResults.overallPerformance.avgProfit.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Avg Profit</div>
                </div>
                <div className="text-center space-y-2">
                  <div className={`text-2xl font-bold ${analysisResults.overallPerformance.profitFactor >= 1 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {analysisResults.overallPerformance.profitFactor.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Profit Factor</div>
                </div>
                <div className="text-center space-y-2">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {analysisResults.overallPerformance.maxDrawdown.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Max Drawdown</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Condition Performance */}
          {analysisResults.conditionPerformance.length > 0 && (
            <Card variant="glass" hover>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icons.analytics.barChart className="h-5 w-5 text-indigo-600" />
                  Condition Performance Analysis
                </CardTitle>
                <CardDescription>
                  Individual performance metrics for each trading condition
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysisResults.conditionPerformance.map((condition) => (
                    <div key={condition.id} className="p-4 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50">
                      <div className="flex items-center justify-between mb-3">
                        <div className="space-y-1">
                          <h4 className="font-medium text-gray-900 dark:text-white">{condition.label}</h4>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {condition.type}
                            </Badge>
                            <Badge className={getImpactColor(condition.impact)}>
                              {condition.impact} Impact
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-lg font-bold ${getPerformanceColor(condition.winRate)}`}>
                            {condition.winRate.toFixed(1)}%
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {condition.totalTrades} trades
                          </div>
                        </div>
                      </div>
                      <Progress 
                        value={condition.winRate} 
                        className="h-2"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI Recommendations */}
          {analysisResults.recommendations.length > 0 && (
            <Card variant="glass" hover className="border-purple-200/30 dark:border-purple-800/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icons.analytics.brain className="h-5 w-5 text-purple-600" />
                  AI Recommendations
                </CardTitle>
                <CardDescription>
                  Intelligent suggestions to optimize your trading strategy
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {analysisResults.recommendations.map((rec) => (
                    <div key={rec.id} className="p-6 rounded-xl bg-gradient-to-br from-purple-50/50 to-indigo-50/50 dark:from-purple-950/20 dark:to-indigo-950/20 border border-purple-200/30 dark:border-purple-800/30">
                      <div className="flex items-start justify-between mb-4">
                        <div className="space-y-2 flex-1">
                          <h4 className="font-semibold text-gray-900 dark:text-white">{rec.title}</h4>
                          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                            {rec.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Badge className={getImpactColor(rec.impact)}>
                            {rec.impact}
                          </Badge>
                          <Badge variant="outline" className="bg-white/60 dark:bg-gray-800/60">
                            {rec.confidence}% confident
                          </Badge>
                        </div>
                      </div>
                      
                      {rec.condition && (
                        <div className="mt-4 p-4 rounded-lg bg-white/60 dark:bg-gray-800/60 border border-white/30 dark:border-gray-700/30">
                          <h5 className="font-medium text-gray-900 dark:text-white mb-2">{rec.condition.label}</h5>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{rec.condition.description}</p>
                          {rec.condition.indicator && (
                            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-500">
                              <span><strong>Indicator:</strong> {rec.condition.indicator}</span>
                              {rec.condition.timeframe && <span><strong>Timeframe:</strong> {rec.condition.timeframe}</span>}
                              {rec.condition.expectedValue && <span><strong>Signal:</strong> {rec.condition.expectedValue}</span>}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* No Recommendations State */}
          {analysisResults.recommendations.length === 0 && selectedStrategy && (
            <Card variant="glass" className="border-dashed border-gray-300 dark:border-gray-700">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                  <Icons.analytics.brain className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Ready for AI Analysis
                </h3>
                <p className="text-gray-600 dark:text-gray-400 max-w-md">
                  Click "Get AI Insights" to receive personalized recommendations for improving your strategy performance.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Empty State */}
      {!selectedStrategy && (
        <Card variant="glass" className="border-dashed border-gray-300 dark:border-gray-700">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 mb-6">
              <Icons.strategy.target className="h-10 w-10 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Select a Strategy to Analyze
            </h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-md">
              Choose a trading strategy from the dropdown above to start analyzing its performance with AI-powered insights.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}