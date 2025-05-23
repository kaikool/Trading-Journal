/**
 * AIStrategyAnalysis.tsx
 * 
 * Component tích hợp phân tích AI cho chiến lược giao dịch
 * Được thiết kế để tích hợp vào trang Strategy Management
 */

import React, { useState, useCallback } from 'react';
import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from '@google/generative-ai';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Icons } from "@/components/icons/icons";
import { useToast } from "@/hooks/use-toast";
import { TradingStrategy } from "@/types";
import { useTradesQuery } from "@/hooks/use-trades-query";

// Hardcode API Key
const GEMINI_API_KEY = "AIzaSyAM8ZqOOPoPdkNhDacIJ4Hv2CnSC2z6qiA";

// Types
interface AnalysisResult {
  isLoading: boolean;
  error: string | null;
  data: any | null;
}

interface ConditionSuggestion {
  id: string;
  title: string;
  description: string;
  condition: {
    label: string;
    indicator?: string;
    timeframe?: string;
    expectedValue?: string;
    description?: string;
  };
  confidence: number;
  impact: string;
}

// Gemini Analysis Hook
function useGeminiAnalysis() {
  const [genAI] = useState(() => new GoogleGenerativeAI(GEMINI_API_KEY));
  const { toast } = useToast();

  const analyzeStrategyWithGemini = async (strategy: TradingStrategy, trades: any[] = []) => {
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
Phân tích chiến lược giao dịch Forex sau đây:

Tên chiến lược: ${strategy.name}
Mô tả: ${strategy.description}
Tỷ lệ Risk/Reward: ${strategy.riskRewardRatio}
Khung thời gian: ${strategy.timeframes?.join(", ") || "Không xác định"}

Các quy tắc giao dịch:
${strategy.rules?.map(rule => `- ${rule.label}: ${rule.description || ''}`).join('\n') || 'Không có quy tắc cụ thể'}

Điều kiện vào lệnh:
${strategy.entryConditions?.map(cond => `- ${cond.label}: ${cond.description || ''}`).join('\n') || 'Không có điều kiện vào lệnh'}

Điều kiện thoát lệnh:
${strategy.exitConditions?.map(cond => `- ${cond.label}: ${cond.description || ''}`).join('\n') || 'Không có điều kiện thoát lệnh'}

Dữ liệu giao dịch (${trades.length} giao dịch):
${trades.slice(0, 10).map(trade => `
- Cặp tiền: ${trade.pair}, Hướng: ${trade.direction}, Kết quả: ${trade.result || 'Đang mở'}, P&L: ${trade.profitLoss || 0}
`).join('') || 'Không có dữ liệu giao dịch'}

Hãy phân tích chiến lược này và đưa ra:
1. Đánh giá tổng quan về độ hiệu quả
2. Điểm mạnh và điểm yếu
3. Khuyến nghị cải thiện
4. Mức độ rủi ro và cách quản lý

Phản hồi bằng tiếng Việt, súc tích và thực tế.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return {
        analysis: text,
        timestamp: new Date(),
        strategy: strategy.name
      };
    } catch (error) {
      console.error('Lỗi phân tích Gemini:', error);
      throw new Error('Không thể kết nối với Gemini AI. Vui lòng thử lại sau.');
    }
  };

  const generateSuggestionsWithGemini = async (strategy: TradingStrategy, trades: any[] = []) => {
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
Dựa trên chiến lược giao dịch "${strategy.name}" và dữ liệu ${trades.length} giao dịch, hãy đề xuất 3-5 điều kiện/quy tắc mới để cải thiện hiệu suất:

Chiến lược hiện tại:
- Tỷ lệ thắng: ${trades.length > 0 ? ((trades.filter(t => t.result === 'win').length / trades.length) * 100).toFixed(1) : 0}%
- Tổng P&L: ${trades.reduce((sum, t) => sum + (t.profitLoss || 0), 0)}
- Các cặp tiền chính: ${Array.from(new Set(trades.map(t => t.pair))).slice(0, 3).join(', ')}

Phản hồi theo định dạng JSON:
{
  "suggestedConditions": [
    {
      "id": "suggestion-1",
      "title": "Tên điều kiện",
      "description": "Mô tả chi tiết lợi ích",
      "condition": {
        "label": "Tên điều kiện ngắn gọn",
        "indicator": "Chỉ báo kỹ thuật (nếu có)",
        "timeframe": "Khung thời gian",
        "expectedValue": "Giá trị mong đợi",
        "description": "Mô tả cách áp dụng"
      },
      "confidence": 85,
      "impact": "high"
    }
  ]
}

Chỉ trả về JSON, không có text thêm.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      try {
        const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed = JSON.parse(cleanText);
        return parsed;
      } catch (parseError) {
        console.error('Lỗi parse JSON:', parseError);
        return {
          suggestedConditions: [
            {
              id: "suggestion-1",
              title: "Xác nhận xu hướng với RSI",
              description: "Thêm RSI để xác nhận tín hiệu và tránh giao dịch trong vùng quá mua/quá bán",
              condition: {
                label: "RSI trong vùng hợp lý",
                indicator: "RSI(14)",
                timeframe: "H4",
                expectedValue: "30-70",
                description: "RSI nằm giữa 30-70 để tránh extreme zones"
              },
              confidence: 75,
              impact: "high"
            }
          ]
        };
      }
    } catch (error) {
      console.error('Lỗi tạo gợi ý:', error);
      throw new Error('Không thể tạo gợi ý. Vui lòng thử lại sau.');
    }
  };

  return {
    analyzeStrategyWithGemini,
    generateSuggestionsWithGemini
  };
}

interface AIStrategyAnalysisProps {
  strategy: TradingStrategy;
  onUpdateStrategy?: (updatedStrategy: TradingStrategy) => void;
}

export function AIStrategyAnalysis({ strategy, onUpdateStrategy }: AIStrategyAnalysisProps) {
  const { trades } = useTradesQuery();
  const { toast } = useToast();
  
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [strategyAnalysis, setStrategyAnalysis] = useState<AnalysisResult>({
    isLoading: false,
    error: null,
    data: null
  });
  
  const [suggestionAnalysis, setSuggestionAnalysis] = useState<AnalysisResult>({
    isLoading: false,
    error: null,
    data: null
  });

  const { analyzeStrategyWithGemini, generateSuggestionsWithGemini } = useGeminiAnalysis();

  const handleAnalyzeWithGemini = useCallback(async () => {
    setShowAnalysis(true);
    setStrategyAnalysis({ isLoading: true, error: null, data: null });
    setSuggestionAnalysis({ isLoading: true, error: null, data: null });

    try {
      // Get relevant trades for this strategy
      const relevantTrades = trades?.filter(trade => trade.strategy === strategy.id) || [];

      // Run both analyses in parallel
      const [analysisResult, suggestionsResult] = await Promise.all([
        analyzeStrategyWithGemini(strategy, relevantTrades),
        generateSuggestionsWithGemini(strategy, relevantTrades)
      ]);

      setStrategyAnalysis({
        isLoading: false,
        error: null,
        data: analysisResult
      });

      setSuggestionAnalysis({
        isLoading: false,
        error: null,
        data: suggestionsResult
      });

      toast({
        title: "Thành công",
        description: "Phân tích AI đã hoàn thành",
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra khi phân tích';
      
      setStrategyAnalysis({
        isLoading: false,
        error: errorMessage,
        data: null
      });

      setSuggestionAnalysis({
        isLoading: false,
        error: errorMessage,
        data: null
      });

      toast({
        title: "Lỗi",
        description: errorMessage,
        variant: "destructive"
      });
    }
  }, [strategy, trades, analyzeStrategyWithGemini, generateSuggestionsWithGemini, toast]);

  const handleAddSuggestion = useCallback((suggestion: ConditionSuggestion) => {
    if (onUpdateStrategy) {
      const newCondition = {
        id: `cond-${Date.now()}`,
        label: suggestion.condition.label,
        order: (strategy.rules?.length || 0) + 1,
        description: suggestion.condition.description,
        indicator: suggestion.condition.indicator,
        timeframe: suggestion.condition.timeframe,
        expectedValue: suggestion.condition.expectedValue,
      };

      const updatedStrategy = {
        ...strategy,
        rules: [...(strategy.rules || []), newCondition]
      };

      onUpdateStrategy(updatedStrategy);
    }

    toast({
      title: "Gợi ý đã được áp dụng",
      description: `Điều kiện "${suggestion.title}" đã được thêm vào chiến lược`,
    });
  }, [strategy, onUpdateStrategy, toast]);

  if (strategyAnalysis.isLoading || suggestionAnalysis.isLoading) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Icons.analytics.brain className="h-5 w-5 mr-2 text-primary animate-pulse" />
            Đang phân tích với Gemini AI...
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
    );
  }

  if (strategyAnalysis.error || suggestionAnalysis.error) {
    return (
      <Card className="shadow-sm border-destructive/20">
        <CardContent className="p-4">
          <Alert>
            <Icons.ui.warning className="h-4 w-4" />
            <AlertDescription>
              {strategyAnalysis.error || suggestionAnalysis.error}
            </AlertDescription>
          </Alert>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleAnalyzeWithGemini}
            className="mt-3"
          >
            <Icons.ui.refresh className="h-4 w-4 mr-2" />
            Thử lại
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {!showAnalysis && (
        <div className="text-center py-6">
          <Button 
            onClick={handleAnalyzeWithGemini}
            className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300 group relative overflow-hidden"
            size="lg"
          >
            <Icons.analytics.brain className="h-5 w-5 mr-3 text-white animate-pulse group-hover:animate-spin transition-all duration-300" />
            <span className="font-semibold text-white tracking-wide relative z-10">
              Phân tích với Gemini AI
            </span>
            
            <div className="absolute inset-0 -top-2 -left-2 w-6 h-full bg-white/30 skew-x-12 transform translate-x-full group-hover:translate-x-[-200%] transition-transform duration-1000 ease-out"></div>
          </Button>
        </div>
      )}

      {showAnalysis && (
        <div className="space-y-6">
          {/* Strategy Analysis */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-base">
                <Icons.analytics.lineChart className="h-5 w-5 mr-2 text-primary" />
                Phân tích Chiến lược
              </CardTitle>
            </CardHeader>
            <CardContent>
              {strategyAnalysis.data ? (
                <div className="bg-muted/20 p-4 rounded-lg border">
                  <pre className="whitespace-pre-wrap text-sm text-foreground leading-relaxed">
                    {strategyAnalysis.data.analysis}
                  </pre>
                </div>
              ) : (
                <div className="text-center p-4 border rounded-md">
                  <Icons.analytics.lineChart className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">Không có dữ liệu phân tích</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Suggestions */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-base">
                <Icons.analytics.lightbulb className="h-5 w-5 mr-2 text-primary" />
                Gợi ý Cải thiện
              </CardTitle>
            </CardHeader>
            <CardContent>
              {suggestionAnalysis.data?.suggestedConditions?.length ? (
                <div className="space-y-3">
                  {suggestionAnalysis.data.suggestedConditions.map((suggestion: ConditionSuggestion) => (
                    <Card key={suggestion.id} className="border-primary/10 hover:border-primary/20 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium text-sm">{suggestion.title}</h4>
                              <Badge 
                                variant={suggestion.impact === 'high' ? 'default' : 'secondary'} 
                                className="text-xs"
                              >
                                {suggestion.impact === 'high' ? 'Tác động cao' : 'Tác động trung bình'}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {suggestion.confidence}% tin cậy
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">
                              {suggestion.description}
                            </p>
                            <div className="bg-muted/30 p-3 rounded text-xs space-y-1">
                              <div><strong>Điều kiện:</strong> {suggestion.condition.label}</div>
                              {suggestion.condition.indicator && (
                                <div><strong>Chỉ báo:</strong> {suggestion.condition.indicator}</div>
                              )}
                              {suggestion.condition.timeframe && (
                                <div><strong>Khung thời gian:</strong> {suggestion.condition.timeframe}</div>
                              )}
                              {suggestion.condition.expectedValue && (
                                <div><strong>Giá trị:</strong> {suggestion.condition.expectedValue}</div>
                              )}
                            </div>
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleAddSuggestion(suggestion)}
                            className="flex-shrink-0"
                          >
                            <Icons.ui.check className="h-3 w-3 mr-1" />
                            Áp dụng
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center p-4 border rounded-md">
                  <Icons.analytics.lightbulb className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">Không có gợi ý cải thiện</p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-center pt-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleAnalyzeWithGemini}
              className="text-xs"
            >
              <Icons.ui.refresh className="h-3 w-3 mr-1.5" />
              Làm mới phân tích
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}