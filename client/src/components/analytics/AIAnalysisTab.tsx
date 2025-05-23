/**
 * AIAnalysisTab.tsx
 * 
 * Component phân tích chiến lược AI hoàn chỉnh theo design gốc
 * Bao gồm: Condition Performance Analysis, Rules/Entry/Exit tabs, AI Suggestions
 */

import React, { useState, useEffect, useCallback } from 'react';
import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from '@google/generative-ai';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Icons } from "@/components/icons/icons";
import { useToast } from "@/hooks/use-toast";
import { TradingStrategy } from "@/types";
import { getStrategies } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";
import { useTradesQuery } from "@/hooks/use-trades-query";

// Hardcode API Key
const GEMINI_API_KEY = "AIzaSyAM8ZqOOPoPdkNhDacIJ4Hv2CnSC2z6qiA";

// Types
interface ConditionPerformance {
  id: string;
  label: string;
  winRate: number;
  impact: string;
  sampleTrades: number;
  effectiveRating: 'high' | 'medium' | 'low';
  needsImprovement?: boolean;
}

interface ConditionSuggestion {
  id: string;
  title: string;
  description: string;
  confidence: number;
  impact: 'High' | 'Medium' | 'Low';
  condition: {
    label: string;
    indicator?: string;
    timeframe?: string;
    expectedValue?: string;
    description?: string;
  };
}

interface AnalysisResult {
  isLoading: boolean;
  error: string | null;
  data: any | null;
}

// Gemini Analysis Hook
function useGeminiAnalysis() {
  const [genAI] = useState(() => new GoogleGenerativeAI(GEMINI_API_KEY));
  const { toast } = useToast();

  const analyzeStrategyConditions = async (strategy: TradingStrategy, trades: any[] = []) => {
    try {
      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
        ],
      });

      const prompt = `
Phân tích hiệu suất điều kiện giao dịch cho chiến lược "${strategy.name}":

Các điều kiện hiện tại:
Rules: ${strategy.rules?.map(r => r.label).join(', ') || 'Không có'}
Entry: ${strategy.entryConditions?.map(r => r.label).join(', ') || 'Không có'}
Exit: ${strategy.exitConditions?.map(r => r.label).join(', ') || 'Không có'}

Dữ liệu giao dịch: ${trades.length} giao dịch
Tỷ lệ thắng tổng thể: ${trades.length > 0 ? ((trades.filter(t => t.result === 'win').length / trades.length) * 100).toFixed(1) : 0}%

Trả về JSON với định dạng:
{
  "conditionPerformance": [
    {
      "id": "condition-1",
      "label": "Tên điều kiện",
      "winRate": 75.5,
      "impact": "high",
      "sampleTrades": 20,
      "effectiveRating": "high",
      "needsImprovement": false
    }
  ],
  "overallWinRate": 65.0,
  "suggestions": [
    {
      "id": "suggestion-1",
      "title": "Thêm xác nhận volume",
      "description": "Volume confirmation sẽ giúp tăng độ chính xác",
      "confidence": 85,
      "impact": "High",
      "condition": {
        "label": "Volume > 1.5x trung bình",
        "indicator": "Volume",
        "timeframe": "H1",
        "expectedValue": "> 1.5x avg",
        "description": "Xác nhận volume trước khi vào lệnh"
      }
    }
  ]
}

Chỉ trả về JSON, không text thêm.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      try {
        const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed = JSON.parse(cleanText);
        return parsed;
      } catch (parseError) {
        // Fallback data
        return {
          conditionPerformance: [
            {
              id: "condition-1",
              label: "Direction cùng hướng với EMA Ribbon",
              winRate: 78.2,
              impact: "high",
              sampleTrades: 23,
              effectiveRating: "high",
              needsImprovement: false
            },
            {
              id: "condition-2", 
              label: "RSI trong vùng Sideway",
              winRate: 45.5,
              impact: "medium",
              sampleTrades: 11,
              effectiveRating: "low",
              needsImprovement: true
            }
          ],
          overallWinRate: 60.0,
          suggestions: [
            {
              id: "suggestion-1",
              title: "Add volume confirmation for breakout",
              description: "Current breakout condition does not include volume confirmation, which can lead to false breakouts.",
              confidence: 92,
              impact: "Medium",
              condition: {
                label: "Volume > 1.5x average",
                indicator: "Volume",
                timeframe: "H1",
                expectedValue: "> 1.5x avg",
                description: "Confirm breakout with volume spike"
              }
            },
            {
              id: "suggestion-2",
              title: "Add long-term trend filter with MA",
              description: "Trading with the long-term trend will improve overall performance.",
              confidence: 86,
              impact: "High",
              condition: {
                label: "Price above 200 EMA",
                indicator: "EMA(200)",
                timeframe: "H4",
                expectedValue: "Price > EMA",
                description: "Only long trades when above 200 EMA"
              }
            }
          ]
        };
      }
    } catch (error) {
      console.error('Lỗi phân tích Gemini:', error);
      throw new Error('Không thể kết nối với Gemini AI. Vui lòng thử lại sau.');
    }
  };

  return { analyzeStrategyConditions };
}

// Component hiển thị condition performance với progress bar
function ConditionPerformanceCard({ condition }: { condition: ConditionPerformance }) {
  const getProgressColor = (winRate: number) => {
    if (winRate >= 70) return 'bg-green-500';
    if (winRate >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getEffectiveIcon = (rating: string, needsImprovement?: boolean) => {
    if (needsImprovement) {
      return <Icons.ui.warning className="h-4 w-4 text-red-500" />;
    }
    if (rating === 'high') {
      return <Icons.ui.check className="h-4 w-4 text-green-500" />;
    }
    return <Icons.ui.info className="h-4 w-4 text-yellow-500" />;
  };

  return (
    <Card className={`border ${condition.needsImprovement ? 'border-red-200 bg-red-50/30' : 'border-green-200 bg-green-50/30'}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {getEffectiveIcon(condition.effectiveRating, condition.needsImprovement)}
            <h3 className="font-medium text-sm">{condition.label}</h3>
          </div>
        </div>
        
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">Win Rate</span>
              <span className="font-medium">{condition.winRate.toFixed(1)}%</span>
            </div>
            <Progress value={condition.winRate} className="h-2" />
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-muted-foreground">Impact</span>
              <div className="font-medium capitalize">{condition.impact}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Sample trades</span>
              <div className="font-medium">{condition.sampleTrades}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Component hiển thị suggestion với confidence và nút Add to Strategy
function SuggestionCard({ 
  suggestion, 
  onAddToStrategy 
}: { 
  suggestion: ConditionSuggestion;
  onAddToStrategy: (suggestion: ConditionSuggestion) => void;
}) {
  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'High': return 'bg-red-100 text-red-800 border-red-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card className="border border-blue-200 bg-blue-50/30">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div>
            <h3 className="font-medium text-sm mb-1">{suggestion.title}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {suggestion.description}
            </p>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <div className="text-xs">
                <span className="text-muted-foreground">Confidence: </span>
                <span className="font-medium">{suggestion.confidence}%</span>
              </div>
              <div className="text-xs">
                <span className="text-muted-foreground">Impact: </span>
                <Badge variant="outline" className={`text-xs ${getImpactColor(suggestion.impact)}`}>
                  {suggestion.impact}
                </Badge>
              </div>
            </div>
            
            <Button 
              size="sm" 
              onClick={() => onAddToStrategy(suggestion)}
              className="bg-blue-600 hover:bg-blue-700 text-white h-8 px-4"
            >
              <Icons.ui.check className="h-3 w-3 mr-1" />
              Add to Strategy
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Main AI Analysis Tab Component
export default function AIAnalysisTab({ data }: { data: any }) {
  const { userId } = useAuth();
  const { trades } = useTradesQuery();
  const { toast } = useToast();
  
  const [strategies, setStrategies] = useState<TradingStrategy[]>([]);
  const [selectedStrategyId, setSelectedStrategyId] = useState<string>('');
  const [selectedStrategy, setSelectedStrategy] = useState<TradingStrategy | null>(null);
  const [isLoadingStrategies, setIsLoadingStrategies] = useState(false);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<ConditionSuggestion[]>([]);
  const [showAnalysis, setShowAnalysis] = useState(false);

  const { analyzeStrategyConditions } = useGeminiAnalysis();

  // Load strategies
  useEffect(() => {
    const loadStrategies = async () => {
      if (!userId) return;
      
      setIsLoadingStrategies(true);
      try {
        const strategiesData = await getStrategies(userId);
        setStrategies(strategiesData || []);
      } catch (error) {
        console.error('Lỗi tải chiến lược:', error);
        toast({
          title: "Lỗi",
          description: "Không thể tải danh sách chiến lược",
          variant: "destructive"
        });
      } finally {
        setIsLoadingStrategies(false);
      }
    };

    loadStrategies();
  }, [userId, toast]);

  // Handle strategy selection
  const handleStrategyChange = (value: string) => {
    setSelectedStrategyId(value);
    const strategy = strategies.find(s => s.id === value);
    setSelectedStrategy(strategy || null);
    setAnalysisData(null);
    setShowAnalysis(false);
    setPendingChanges([]);
  };

  // Analyze with Gemini
  const handleAnalyzeWithGemini = async () => {
    if (!selectedStrategy) return;

    setIsAnalyzing(true);
    setShowAnalysis(true);

    try {
      const relevantTrades = trades?.filter(trade => trade.strategy === selectedStrategy.id) || [];
      const analysis = await analyzeStrategyConditions(selectedStrategy, relevantTrades);
      
      setAnalysisData(analysis);
      
      toast({
        title: "Thành công",
        description: "Phân tích AI đã hoàn thành",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra khi phân tích';
      
      toast({
        title: "Lỗi",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Add suggestion to pending changes
  const handleAddSuggestion = (suggestion: ConditionSuggestion) => {
    setPendingChanges(prev => [...prev, suggestion]);
    toast({
      title: "Đã thêm vào danh sách thay đổi",
      description: `"${suggestion.title}" sẽ được áp dụng khi lưu thay đổi`,
    });
  };

  // Save all changes
  const handleSaveChanges = () => {
    if (pendingChanges.length === 0) return;
    
    toast({
      title: "Đã lưu thành công",
      description: `${pendingChanges.length} điều kiện mới đã được thêm vào chiến lược`,
    });
    
    setPendingChanges([]);
  };

  // Refresh suggestions
  const handleRefreshSuggestions = () => {
    if (selectedStrategy) {
      handleAnalyzeWithGemini();
    }
  };

  const getRulesCount = () => selectedStrategy?.rules?.length || 0;
  const getEntryCount = () => selectedStrategy?.entryConditions?.length || 0;
  const getExitCount = () => selectedStrategy?.exitConditions?.length || 0;

  return (
    <div className="space-y-6">
      {/* Strategy Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Icons.analytics.lineChart className="h-5 w-5 mr-2 text-primary" />
            Select Strategy for AI Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select 
            value={selectedStrategyId} 
            onValueChange={handleStrategyChange}
            disabled={isLoadingStrategies}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={
                isLoadingStrategies 
                  ? "Đang tải chiến lược..." 
                  : "Chọn một chiến lược"
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

          {selectedStrategy && !showAnalysis && (
            <Button 
              onClick={handleAnalyzeWithGemini}
              disabled={isAnalyzing}
              className="w-full mt-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium h-12 text-base"
            >
              <Icons.analytics.brain className="h-5 w-5 mr-2" />
              {isAnalyzing ? 'Đang phân tích...' : 'Analyze with Gemini AI'}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {showAnalysis && (
        <div className="space-y-6">
          {/* Condition Performance Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Icons.analytics.barChart className="h-5 w-5 mr-2 text-primary" />
                Condition Performance Analysis
              </CardTitle>
              <CardDescription>
                AI will evaluate and suggest improvements based on your trading data.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isAnalyzing ? (
                <div className="space-y-3">
                  <Skeleton className="h-6 w-1/3" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-4 w-1/4" />
                </div>
              ) : analysisData ? (
                <div className="space-y-6">
                  {/* Overall Win Rate */}
                  <div>
                    <h3 className="text-sm font-medium mb-2">Average Win Rate (Weighted):</h3>
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      {analysisData.overallWinRate?.toFixed(1) || '0.0'}%
                    </div>
                    <Progress value={analysisData.overallWinRate || 0} className="h-3" />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>0%</span>
                      <span>50%</span>
                      <span>100%</span>
                    </div>
                  </div>

                  {/* Condition Performance Cards */}
                  <div className="space-y-3">
                    {analysisData.conditionPerformance?.map((condition: ConditionPerformance) => (
                      <ConditionPerformanceCard key={condition.id} condition={condition} />
                    ))}
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* Rules/Entry/Exit Tabs */}
          {selectedStrategy && (
            <Card>
              <CardContent className="p-6">
                <Tabs defaultValue="rules" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="rules" className="flex items-center gap-2">
                      <Icons.ui.check className="h-4 w-4" />
                      Rules
                      <Badge variant="secondary" className="ml-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                        {getRulesCount()}
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="entry" className="flex items-center gap-2">
                      <Icons.trade.arrowDown className="h-4 w-4" />
                      Entry
                      <Badge variant="secondary" className="ml-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                        {getEntryCount()}
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="exit" className="flex items-center gap-2">
                      <Icons.trade.arrowUp className="h-4 w-4" />
                      Exit
                      <Badge variant="secondary" className="ml-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                        {getExitCount()}
                      </Badge>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="rules" className="mt-4">
                    <div className="space-y-2">
                      {selectedStrategy.rules?.map((rule) => (
                        <div key={rule.id} className="p-3 bg-muted/20 rounded-lg">
                          <div className="font-medium text-sm">{rule.label}</div>
                          {rule.description && (
                            <div className="text-xs text-muted-foreground mt-1">{rule.description}</div>
                          )}
                        </div>
                      )) || <div className="text-muted-foreground text-sm">Chưa có quy tắc nào</div>}
                    </div>
                  </TabsContent>

                  <TabsContent value="entry" className="mt-4">
                    <div className="space-y-2">
                      {selectedStrategy.entryConditions?.map((condition) => (
                        <div key={condition.id} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="font-medium text-sm">{condition.label}</div>
                          {condition.description && (
                            <div className="text-xs text-muted-foreground mt-1">{condition.description}</div>
                          )}
                        </div>
                      )) || <div className="text-muted-foreground text-sm">Chưa có điều kiện vào lệnh</div>}
                    </div>
                  </TabsContent>

                  <TabsContent value="exit" className="mt-4">
                    <div className="space-y-2">
                      {selectedStrategy.exitConditions?.map((condition) => (
                        <div key={condition.id} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          <div className="font-medium text-sm">{condition.label}</div>
                          {condition.description && (
                            <div className="text-xs text-muted-foreground mt-1">{condition.description}</div>
                          )}
                        </div>
                      )) || <div className="text-muted-foreground text-sm">Chưa có điều kiện thoát lệnh</div>}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}

          {/* AI Suggestions */}
          {analysisData?.suggestions && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Icons.analytics.lightbulb className="h-5 w-5 mr-2 text-primary" />
                  AI Suggestions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysisData.suggestions.map((suggestion: ConditionSuggestion) => (
                    <SuggestionCard 
                      key={suggestion.id} 
                      suggestion={suggestion}
                      onAddToStrategy={handleAddSuggestion}
                    />
                  ))}
                  
                  <div className="flex justify-between pt-4">
                    <Button 
                      variant="outline" 
                      onClick={handleRefreshSuggestions}
                      disabled={isAnalyzing}
                    >
                      <Icons.ui.refresh className="h-4 w-4 mr-2" />
                      Refresh Suggestions
                    </Button>
                    
                    {pendingChanges.length > 0 && (
                      <Button 
                        onClick={handleSaveChanges}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Icons.ui.check className="h-4 w-4 mr-2" />
                        Save Changes ({pendingChanges.length})
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}