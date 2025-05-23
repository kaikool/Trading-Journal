/**
 * AI Strategy Analysis Calculation Module
 * 
 * Module riêng để tính toán dữ liệu gửi cho AI phân tích chiến lược
 * Tách biệt với hệ thống analytics chính để tránh nhầm lẫn
 */

import { TradingStrategy } from "@/types";

// Types cho AI Strategy Analysis
export interface AIConditionPerformance {
  id: string;
  label: string;
  type: 'rule' | 'entry' | 'exit';
  aiWinRate: number; // Win rate tính theo logic AI riêng
  aiTotalTrades: number; // Tổng số trades có condition này được tích chọn
  aiWinningTrades: number; // Số trades thắng có condition này
  aiLosingTrades: number; // Số trades thua có condition này
  aiBreakEvenTrades: number; // Số trades hòa vốn có condition này
  aiImpact: 'high' | 'medium' | 'low'; // Impact tính theo thống kê
  aiProfitLoss: number; // P&L từ các trades có condition này
  aiAvgProfit: number; // Lợi nhuận trung bình
  aiRecommendation: 'keep' | 'modify' | 'remove';
}

export interface AIOverallStats {
  aiTotalTrades: number;
  aiWinRate: number;
  aiProfitLoss: number;
  aiAvgProfit: number;
  aiBestPerformingCondition: string;
  aiWorstPerformingCondition: string;
}

export interface AIAnalysisResults {
  aiOverallStats: AIOverallStats;
  aiConditionPerformance: AIConditionPerformance[];
}

/**
 * Tính toán dữ liệu cho AI Strategy Analysis
 * Logic riêng biệt với analytics chính
 */
export function calculateAIStrategyData(
  strategy: TradingStrategy,
  trades: any[]
): AIAnalysisResults {
  
  // Filter trades cho strategy này
  const aiStrategyTrades = trades.filter(trade => 
    trade.strategy === strategy.name || 
    trade.strategy === strategy.id
  );

  if (aiStrategyTrades.length === 0) {
    throw new Error('Không có dữ liệu giao dịch cho chiến lược này');
  }

  console.log('=== AI STRATEGY CALCULATION ===');
  console.log('Strategy:', strategy.name);
  console.log('AI Strategy Trades:', aiStrategyTrades.length);
  console.log('Sample trade structure:', aiStrategyTrades[0]);
  console.log('==============================');

  // Tính overall stats cho AI
  const aiOverallStats = calculateAIOverallStats(aiStrategyTrades);
  
  // Tính performance cho từng condition
  const aiConditionPerformance = calculateAIConditionPerformance(
    strategy, 
    aiStrategyTrades
  );

  // Xác định best/worst performing conditions
  const sortedByWinRate = aiConditionPerformance
    .sort((a, b) => b.aiWinRate - a.aiWinRate);
  
  aiOverallStats.aiBestPerformingCondition = sortedByWinRate[0]?.label || 'N/A';
  aiOverallStats.aiWorstPerformingCondition = 
    sortedByWinRate[sortedByWinRate.length - 1]?.label || 'N/A';

  return {
    aiOverallStats,
    aiConditionPerformance
  };
}

/**
 * Tính toán overall statistics cho AI
 */
function calculateAIOverallStats(aiStrategyTrades: any[]): AIOverallStats {
  const aiWinningTrades = aiStrategyTrades.filter(trade => 
    isWinningTrade(trade)
  );
  const aiLosingTrades = aiStrategyTrades.filter(trade => 
    isLosingTrade(trade)
  );
  
  const aiTotalProfit = aiStrategyTrades.reduce(
    (sum, trade) => sum + (trade.profitLoss || 0), 
    0
  );

  return {
    aiTotalTrades: aiStrategyTrades.length,
    aiWinRate: aiStrategyTrades.length > 0 
      ? (aiWinningTrades.length / aiStrategyTrades.length) * 100 
      : 0,
    aiProfitLoss: aiTotalProfit,
    aiAvgProfit: aiStrategyTrades.length > 0 
      ? aiTotalProfit / aiStrategyTrades.length 
      : 0,
    aiBestPerformingCondition: '',
    aiWorstPerformingCondition: ''
  };
}

/**
 * Tính toán performance cho từng condition dành cho AI
 */
function calculateAIConditionPerformance(
  strategy: TradingStrategy,
  aiStrategyTrades: any[]
): AIConditionPerformance[] {
  
  // Tập hợp tất cả conditions từ strategy
  const allAIConditions = [
    ...(strategy.rules || []).map(r => ({ ...r, type: 'rule' as const })),
    ...(strategy.entryConditions || []).map(r => ({ ...r, type: 'entry' as const })),
    ...(strategy.exitConditions || []).map(r => ({ ...r, type: 'exit' as const }))
  ];

  return allAIConditions.map(condition => {
    // TODO: Logic thực tế để xác định trades nào có condition này được "tích chọn"
    // Hiện tại dùng tất cả trades của strategy làm baseline
    // Trong tương lai cần track condition selection per trade
    const aiConditionTrades = aiStrategyTrades;
    
    const aiWinningTrades = aiConditionTrades.filter(trade => 
      isWinningTrade(trade)
    );
    const aiLosingTrades = aiConditionTrades.filter(trade => 
      isLosingTrade(trade)
    );
    const aiBreakEvenTrades = aiConditionTrades.filter(trade => 
      isBreakEvenTrade(trade)
    );
    
    // Tính win rate theo công thức của bạn:
    // (số giao dịch có profit > 0) / (tổng số - số giao dịch profit = 0) * 100%
    const aiNonBreakEvenTrades = aiConditionTrades.length - aiBreakEvenTrades.length;
    const aiWinRate = aiNonBreakEvenTrades > 0 
      ? (aiWinningTrades.length / aiNonBreakEvenTrades) * 100 
      : 0;
    
    const aiConditionProfit = aiConditionTrades.reduce(
      (sum, trade) => sum + (trade.profitLoss || 0), 
      0
    );

    // TODO: Tính impact thực sự dựa trên thống kê
    // Hiện tại dùng logic đơn giản
    const aiImpact = calculateAIImpact(condition, aiWinRate, aiConditionProfit);
    
    const aiRecommendation = aiWinRate >= 60 ? 'keep' : 
                           aiWinRate >= 40 ? 'modify' : 'remove';

    return {
      id: condition.id,
      label: condition.label,
      type: condition.type,
      aiWinRate,
      aiTotalTrades: aiConditionTrades.length,
      aiWinningTrades: aiWinningTrades.length,
      aiLosingTrades: aiLosingTrades.length,
      aiBreakEvenTrades: aiBreakEvenTrades.length,
      aiImpact,
      aiProfitLoss: aiConditionProfit,
      aiAvgProfit: aiConditionTrades.length > 0 
        ? aiConditionProfit / aiConditionTrades.length 
        : 0,
      aiRecommendation
    };
  });
}

/**
 * Xác định trade thắng
 */
function isWinningTrade(trade: any): boolean {
  return (
    trade.result === 'TP' || 
    trade.result === 'win' || 
    trade.result === 'Win' ||
    (trade.profitLoss && trade.profitLoss > 0) ||
    (trade.pips && trade.pips > 0)
  );
}

/**
 * Xác định trade thua
 */
function isLosingTrade(trade: any): boolean {
  return (
    trade.result === 'SL' ||
    trade.result === 'loss' || 
    trade.result === 'Loss' ||
    (trade.profitLoss && trade.profitLoss < 0) ||
    (trade.pips && trade.pips < 0)
  );
}

/**
 * Xác định trade hòa vốn
 */
function isBreakEvenTrade(trade: any): boolean {
  return (
    trade.result === 'BE' ||
    trade.result === 'breakeven' ||
    (trade.profitLoss === 0) ||
    (trade.pips === 0)
  );
}

/**
 * Tính impact cho AI (cần cải thiện với thống kê thực)
 * TODO: Implement statistical impact calculation
 */
function calculateAIImpact(
  condition: any, 
  aiWinRate: number, 
  aiProfitLoss: number
): 'high' | 'medium' | 'low' {
  
  // Logic đơn giản hiện tại - cần cải thiện với thống kê
  if (condition.type === 'entry' && aiWinRate >= 70) return 'high';
  if (condition.type === 'exit' && Math.abs(aiProfitLoss) > 200) return 'high';
  if (aiWinRate >= 60) return 'medium';
  if (aiWinRate < 40) return 'low';
  
  return 'medium';
}

/**
 * Format dữ liệu cho Gemini AI prompt
 */
export function formatAIDataForGemini(
  strategy: TradingStrategy,
  aiResults: AIAnalysisResults
): {
  aiStrategyName: string;
  aiOverallStatsFormatted: any;
  aiConditionPerformanceFormatted: any[];
} {
  
  return {
    aiStrategyName: strategy.name,
    aiOverallStatsFormatted: {
      totalTrades: aiResults.aiOverallStats.aiTotalTrades,
      winRate: parseFloat(aiResults.aiOverallStats.aiWinRate.toFixed(1)),
      profitLoss: parseFloat(aiResults.aiOverallStats.aiProfitLoss.toFixed(2)),
      avgProfit: parseFloat(aiResults.aiOverallStats.aiAvgProfit.toFixed(2)),
      bestPerformingCondition: aiResults.aiOverallStats.aiBestPerformingCondition,
      worstPerformingCondition: aiResults.aiOverallStats.aiWorstPerformingCondition
    },
    aiConditionPerformanceFormatted: aiResults.aiConditionPerformance.map(cond => ({
      id: cond.id,
      label: cond.label,
      type: cond.type,
      winRate: parseFloat(cond.aiWinRate.toFixed(1)),
      totalTrades: cond.aiTotalTrades,
      winningTrades: cond.aiWinningTrades,
      losingTrades: cond.aiLosingTrades,
      breakEvenTrades: cond.aiBreakEvenTrades,
      impact: cond.aiImpact,
      profitLoss: parseFloat(cond.aiProfitLoss.toFixed(2)),
      avgProfit: parseFloat(cond.aiAvgProfit.toFixed(2)),
      recommendation: cond.aiRecommendation
    }))
  };
}