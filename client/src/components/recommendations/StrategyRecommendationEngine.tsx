import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Trade, TradingStrategy } from "@/types";
import { Icons } from "@/components/icons/icons";

// Định nghĩa type cho đề xuất chiến lược
interface StrategyRecommendation {
  strategyId: string;
  strategyName: string;
  confidence: number;
  expectedWinRate: number;
  estimatedProfitPotential: number;
  bestPairs: string[];
  bestSessions: string[];
  marketConditions: string[];
  emotionalStates: string[];
  reasonsToUse: string[];
  riskLevel: 'Low' | 'Medium' | 'High';
  improvementTips: string[];
}

interface StrategyRecommendationEngineProps {
  trades: Trade[];
  strategies: TradingStrategy[];
}

/**
 * Engine đề xuất chiến lược giao dịch
 * 
 * Component này phân tích lịch sử giao dịch của người dùng và đưa ra
 * các đề xuất chiến lược phù hợp nhất dựa trên hiệu suất trong quá khứ.
 */
export function StrategyRecommendationEngine({ trades, strategies }: StrategyRecommendationEngineProps) {
  // Chỉ phân tích các giao dịch đã đóng
  const closedTrades = useMemo(() => trades.filter(trade => !trade.isOpen), [trades]);
  
  // Tính toán các đề xuất chiến lược dựa trên dữ liệu giao dịch
  const recommendations = useMemo(() => {
    if (closedTrades.length < 5 || strategies.length === 0) {
      return [];
    }
    
    return generateRecommendations(closedTrades, strategies);
  }, [closedTrades, strategies]);
  
  if (closedTrades.length < 5) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <Icons.analytics.stats className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">Chưa đủ dữ liệu giao dịch</h3>
        <p className="text-sm text-muted-foreground mt-2">
          Cần ít nhất 5 giao dịch đã đóng để tạo đề xuất chiến lược có giá trị.
        </p>
      </div>
    );
  }
  
  if (strategies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <Icons.analytics.stats className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">Chưa có chiến lược nào được thiết lập</h3>
        <p className="text-sm text-muted-foreground mt-2">
          Thiết lập ít nhất một chiến lược trong phần Cài đặt để nhận đề xuất.
        </p>
      </div>
    );
  }
  
  if (recommendations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <Icons.analytics.stats className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">Không thể tạo đề xuất</h3>
        <p className="text-sm text-muted-foreground mt-2">
          Không thể tạo đề xuất từ dữ liệu hiện có. Thêm nhiều giao dịch với thông tin chi tiết hơn.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {recommendations.map((recommendation) => (
          <RecommendationCard key={recommendation.strategyId} recommendation={recommendation} />
        ))}
      </div>
    </div>
  );
}

/**
 * Card hiển thị chi tiết đề xuất chiến lược
 */
function RecommendationCard({ recommendation }: { recommendation: StrategyRecommendation }) {
  const { 
    strategyName, confidence, expectedWinRate, bestPairs, 
    bestSessions, marketConditions, emotionalStates, 
    reasonsToUse, riskLevel, improvementTips
  } = recommendation;
  
  // Xác định màu cho cấp độ rủi ro
  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'Low': return 'bg-green-500/10 text-green-500';
      case 'Medium': return 'bg-yellow-500/10 text-yellow-500';
      case 'High': return 'bg-red-500/10 text-red-500';
      default: return 'bg-primary/10 text-primary';
    }
  };
  
  // Xác định màu cho độ tin cậy
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-500';
    if (confidence >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <Card className="overflow-hidden border border-border/50 shadow-sm transition-all hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-xl">{strategyName}</CardTitle>
          <Badge variant="outline" className={`ml-2 ${getRiskLevelColor(riskLevel)}`}>
            {riskLevel === 'Low' ? 'Rủi ro thấp' : riskLevel === 'Medium' ? 'Rủi ro vừa' : 'Rủi ro cao'}
          </Badge>
        </div>
        <CardDescription>
          Độ tin cậy đề xuất: <span className={getConfidenceColor(confidence)}>{confidence}%</span>
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pb-0 space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Tỷ lệ thắng dự kiến</span>
            <span className="text-sm">{expectedWinRate}%</span>
          </div>
          <Progress value={expectedWinRate} className="h-2" />
        </div>
        
        <div>
          <h4 className="text-sm font-medium mb-2">Lý do đề xuất</h4>
          <ul className="text-sm space-y-1 pl-5 list-disc">
            {reasonsToUse.map((reason, index) => (
              <li key={index}>{reason}</li>
            ))}
          </ul>
        </div>
        
        <Separator />
        
        <div className="space-y-3">
          <div>
            <h4 className="text-sm font-medium mb-1.5">Cặp tiền tệ phù hợp nhất</h4>
            <div className="flex flex-wrap gap-1.5">
              {bestPairs.map((pair, index) => (
                <Badge key={index} variant="secondary">{pair}</Badge>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium mb-1.5">Thời điểm giao dịch tối ưu</h4>
            <div className="flex flex-wrap gap-1.5">
              {bestSessions.map((session, index) => (
                <Badge key={index} variant="outline">{session}</Badge>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium mb-1.5">Điều kiện thị trường</h4>
            <div className="flex flex-wrap gap-1.5">
              {marketConditions.map((condition, index) => (
                <Badge key={index} variant="outline" className="bg-blue-500/10 text-blue-500">
                  {condition}
                </Badge>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium mb-1.5">Trạng thái cảm xúc phù hợp</h4>
            <div className="flex flex-wrap gap-1.5">
              {emotionalStates.map((state, index) => (
                <Badge key={index} variant="outline" className="bg-purple-500/10 text-purple-500">
                  {state}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex flex-col items-start pt-4">
        <h4 className="text-sm font-medium mb-2">Lời khuyên cải thiện</h4>
        <ul className="text-sm space-y-1 pl-5 list-disc">
          {improvementTips.map((tip, index) => (
            <li key={index}>{tip}</li>
          ))}
        </ul>
      </CardFooter>
    </Card>
  );
}

/**
 * Tạo các đề xuất chiến lược dựa trên dữ liệu giao dịch
 */
function generateRecommendations(trades: Trade[], strategies: TradingStrategy[]): StrategyRecommendation[] {
  if (trades.length === 0 || strategies.length === 0) {
    return [];
  }

  // Tạo map hiệu suất theo chiến lược
  const strategyPerformance: Record<string, {
    wins: number;
    losses: number;
    breakEven: number;
    totalProfitLoss: number;
    trades: Trade[];
    pairCounts: Record<string, number>;
    pairWins: Record<string, number>;
    marketConditionCounts: Record<string, number>;
    marketConditionWins: Record<string, number>;
    sessionCounts: Record<string, number>;
    sessionWins: Record<string, number>;
    emotionCounts: Record<string, number>;
    emotionWins: Record<string, number>;
  }> = {};

  // Phân tích hiệu suất của từng chiến lược
  strategies.forEach(strategy => {
    strategyPerformance[strategy.id] = {
      wins: 0,
      losses: 0,
      breakEven: 0,
      totalProfitLoss: 0,
      trades: [],
      pairCounts: {},
      pairWins: {},
      marketConditionCounts: {},
      marketConditionWins: {},
      sessionCounts: {},
      sessionWins: {},
      emotionCounts: {},
      emotionWins: {}
    };
  });

  // Phân loại giao dịch theo chiến lược và thu thập số liệu thống kê
  trades.forEach(trade => {
    const strategyId = trade.strategy;
    if (!strategyId || !strategyPerformance[strategyId]) {
      return;
    }

    const perf = strategyPerformance[strategyId];
    const pips = trade.pips || 0;
    const profitLoss = trade.profitLoss || 0;
    const isWin = pips > 0;
    const isLoss = pips < 0;
    const isBreakEven = pips === 0;

    perf.trades.push(trade);
    if (isWin) perf.wins++;
    else if (isLoss) perf.losses++;
    else if (isBreakEven) perf.breakEven++;

    perf.totalProfitLoss += profitLoss;

    // Phân tích theo cặp tiền
    const pair = trade.pair;
    perf.pairCounts[pair] = (perf.pairCounts[pair] || 0) + 1;
    if (isWin) perf.pairWins[pair] = (perf.pairWins[pair] || 0) + 1;

    // Phân tích theo điều kiện thị trường
    if (trade.marketCondition) {
      perf.marketConditionCounts[trade.marketCondition] = (perf.marketConditionCounts[trade.marketCondition] || 0) + 1;
      if (isWin) perf.marketConditionWins[trade.marketCondition] = (perf.marketConditionWins[trade.marketCondition] || 0) + 1;
    }

    // Phân tích theo phiên giao dịch
    if (trade.sessionType) {
      perf.sessionCounts[trade.sessionType] = (perf.sessionCounts[trade.sessionType] || 0) + 1;
      if (isWin) perf.sessionWins[trade.sessionType] = (perf.sessionWins[trade.sessionType] || 0) + 1;
    }

    // Phân tích theo cảm xúc
    if (trade.emotion) {
      perf.emotionCounts[trade.emotion] = (perf.emotionCounts[trade.emotion] || 0) + 1;
      if (isWin) perf.emotionWins[trade.emotion] = (perf.emotionWins[trade.emotion] || 0) + 1;
    }
  });

  // Tạo các đề xuất
  const recommendations: StrategyRecommendation[] = [];

  // Chỉ xem xét các chiến lược có ít nhất 3 giao dịch
  Object.entries(strategyPerformance).forEach(([strategyId, perf]) => {
    if (perf.trades.length < 3) {
      return;
    }

    const strategy = strategies.find(s => s.id === strategyId);
    if (!strategy) return;

    const totalTrades = perf.wins + perf.losses + perf.breakEven;
    const winRate = totalTrades ? (perf.wins / totalTrades) * 100 : 0;
    const avgProfitLoss = totalTrades ? perf.totalProfitLoss / totalTrades : 0;

    // Tính điểm tin cậy dựa trên số lượng giao dịch và độ nhất quán
    const tradeCountScore = Math.min(perf.trades.length / 20, 1) * 30; // Max 30 points
    const consistencyScore = Math.min(Math.abs(avgProfitLoss) / 100, 1) * 30; // Max 30 points
    const winRateScore = (winRate / 100) * 40; // Max 40 points
    
    const confidence = Math.min(Math.round(tradeCountScore + consistencyScore + winRateScore), 98);

    // Xác định cặp tiền tệ tốt nhất
    const bestPairs = Object.entries(perf.pairCounts)
      .filter(([_, count]) => count >= 2) // Ít nhất 2 giao dịch
      .map(([pair, count]) => ({
        pair,
        count,
        winRate: (perf.pairWins[pair] || 0) / count * 100
      }))
      .sort((a, b) => b.winRate - a.winRate)
      .slice(0, 3)
      .map(item => item.pair);

    // Xác định phiên giao dịch tốt nhất
    const bestSessions = Object.entries(perf.sessionCounts)
      .filter(([_, count]) => count >= 2) // Ít nhất 2 giao dịch
      .map(([session, count]) => ({
        session,
        count,
        winRate: (perf.sessionWins[session] || 0) / count * 100
      }))
      .sort((a, b) => b.winRate - a.winRate)
      .slice(0, 2)
      .map(item => item.session);

    // Xác định điều kiện thị trường tốt nhất
    const bestMarketConditions = Object.entries(perf.marketConditionCounts)
      .filter(([_, count]) => count >= 2) // Ít nhất 2 giao dịch
      .map(([condition, count]) => ({
        condition,
        count,
        winRate: (perf.marketConditionWins[condition] || 0) / count * 100
      }))
      .sort((a, b) => b.winRate - a.winRate)
      .slice(0, 2)
      .map(item => item.condition);

    // Xác định trạng thái cảm xúc tốt nhất
    const bestEmotions = Object.entries(perf.emotionCounts)
      .filter(([_, count]) => count >= 2) // Ít nhất 2 giao dịch
      .map(([emotion, count]) => ({
        emotion,
        count,
        winRate: (perf.emotionWins[emotion] || 0) / count * 100
      }))
      .sort((a, b) => b.winRate - a.winRate)
      .slice(0, 2)
      .map(item => item.emotion);

    // Xác định cấp độ rủi ro dựa trên độ biến động lợi nhuận
    const profitLossValues = perf.trades.map(t => t.profitLoss || 0);
    const variance = calculateVariance(profitLossValues);
    const normalizedVariance = Math.min(variance / 10000, 1); // Chuẩn hóa phương sai

    let riskLevel: 'Low' | 'Medium' | 'High';
    if (normalizedVariance < 0.3) riskLevel = 'Low';
    else if (normalizedVariance < 0.7) riskLevel = 'Medium';
    else riskLevel = 'High';

    // Tạo lý do đề xuất
    const reasonsToUse: string[] = [];
    if (winRate > 50) {
      reasonsToUse.push(`Tỷ lệ thắng cao (${winRate.toFixed(1)}%) với chiến lược này.`);
    }
    if (avgProfitLoss > 0) {
      reasonsToUse.push(`Lợi nhuận trung bình tích cực: ${formatCurrency(avgProfitLoss)}/giao dịch.`);
    }
    if (bestPairs.length > 0) {
      reasonsToUse.push(`Hiệu quả với các cặp: ${bestPairs.join(', ')}.`);
    }
    if (bestSessions.length > 0) {
      reasonsToUse.push(`Thành công trong phiên: ${bestSessions.join(', ')}.`);
    }

    // Tạo các lời khuyên cải thiện
    const improvementTips: string[] = [];
    const followedPlanWins = perf.trades.filter(t => t.followedPlan && (t.pips || 0) > 0).length;
    const followedPlanTotal = perf.trades.filter(t => t.followedPlan).length;
    const notFollowedPlanWins = perf.trades.filter(t => !t.followedPlan && (t.pips || 0) > 0).length;
    const notFollowedPlanTotal = perf.trades.filter(t => !t.followedPlan).length;

    if (followedPlanTotal > 0 && notFollowedPlanTotal > 0) {
      const followedPlanWinRate = (followedPlanWins / followedPlanTotal) * 100;
      const notFollowedPlanWinRate = (notFollowedPlanWins / notFollowedPlanTotal) * 100;
      
      if (followedPlanWinRate > notFollowedPlanWinRate + 10) {
        improvementTips.push(`Tuân thủ kế hoạch tăng hiệu suất lên ${(followedPlanWinRate - notFollowedPlanWinRate).toFixed(1)}%.`);
      }
    }

    // Kiểm tra ảnh hưởng của giao dịch trả thù
    const revengeTrades = perf.trades.filter(t => t.revenge).length;
    const revengeWins = perf.trades.filter(t => t.revenge && (t.pips || 0) > 0).length;
    
    if (revengeTrades > 2) {
      const revengeWinRate = (revengeWins / revengeTrades) * 100;
      if (revengeWinRate < winRate) {
        improvementTips.push(`Tránh giao dịch trả thù - giảm tỷ lệ thắng ${(winRate - revengeWinRate).toFixed(1)}%.`);
      }
    }

    // Thêm các lời khuyên thực tế
    improvementTips.push("Tăng kích thước lô khi xu hướng rõ ràng, điều này cải thiện R:R.");
    improvementTips.push("Thực hiện nghiêm túc journal giao dịch sau mỗi lần.");

    recommendations.push({
      strategyId,
      strategyName: strategy.name,
      confidence,
      expectedWinRate: Math.round(winRate),
      estimatedProfitPotential: avgProfitLoss,
      bestPairs: bestPairs.length > 0 ? bestPairs : ['Chưa đủ dữ liệu'],
      bestSessions: bestSessions.length > 0 ? bestSessions : ['Chưa đủ dữ liệu'],
      marketConditions: bestMarketConditions.length > 0 ? bestMarketConditions : ['Chưa đủ dữ liệu'],
      emotionalStates: bestEmotions.length > 0 ? bestEmotions : ['Chưa đủ dữ liệu'],
      reasonsToUse: reasonsToUse.length > 0 ? reasonsToUse : ['Chiến lược phù hợp với phong cách giao dịch của bạn.'],
      riskLevel,
      improvementTips: improvementTips.length > 0 ? improvementTips : ['Tiếp tục theo dõi và cải thiện chiến lược.'],
    });
  });

  // Sắp xếp đề xuất theo độ tin cậy
  return recommendations.sort((a, b) => b.confidence - a.confidence);
}

// Hàm tính phương sai của mảng số
function calculateVariance(values: number[]): number {
  if (values.length <= 1) return 0;
  
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  return squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
}

// Hàm định dạng số tiền
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}