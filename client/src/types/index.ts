import { Timestamp } from "firebase/firestore";
import { CurrencyPair, Direction, TradeResult } from "@/lib/forex-calculator";

export interface User {
  id: string;
  email: string;
  displayName: string;
  initialBalance: number;
  currentBalance: number;
  createdAt: Timestamp;
}

// Object containing a specific condition of the strategy
export interface StrategyCondition {
  id: string; // Unique ID for this condition
  label: string; // Display label (e.g., "EMA 50 uptrend")
  indicator?: string; // Indicator used (e.g., "EMA", "RSI", "Bollinger Bands")
  timeframe?: string; // Timeframe (e.g., "M5", "M15", "H1", "H4", "D1")
  expectedValue?: string; // Expected value (e.g., "Uptrend", "Above 30", "Cross up")
  description?: string; // Detailed description of the condition
  order: number; // Display order in the list
}

export interface TradingStrategy {
  id: string;
  userId: string;
  name: string;
  description: string;

  // New structure with specific conditions
  rules: StrategyCondition[]; // General rules of the strategy
  entryConditions: StrategyCondition[]; // Entry conditions
  exitConditions: StrategyCondition[]; // Exit conditions

  // Other fields remain unchanged
  timeframes: string[];
  riskRewardRatio?: number;
  notes?: string;
  isDefault?: boolean;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

// Results of checking strategy conditions when creating a trade
export interface StrategyConditionCheck {
  conditionId: string; // ID of the strategy condition
  passed: boolean; // Whether the condition is satisfied
}

/** Trạng thái xử lý ảnh auto-capture */
export type CaptureStatus = "pending" | "uploaded" | "empty" | "error";

/** Metadata tùy chọn của ảnh (nếu muốn lưu kèm) */
export interface ImageMeta {
  width?: number;
  height?: number;
  bytes?: number;
  publicId?: string; // public_id từ API (nếu có)
}

export interface Trade {
  id: string;
  userId: string;
  pair: CurrencyPair;
  direction: Direction;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  lotSize: number;

  // Trade status
  isOpen?: boolean;

  // Information when closing a position
  closeDate?: Timestamp;
  exitPrice?: number;
  result?: TradeResult;
  pips?: number;
  profitLoss?: number;
  closingNote?: string;

  // Analysis information
  strategy: string; 
  usedRules?: string[];
  usedEntryConditions?: string[];
  usedExitConditions?: string[];
  
  techPattern: string;
  emotion: string;
  
  // Discipline Fields
  followedPlan?: boolean;
  enteredEarly?: boolean;
  revenge?: boolean;
  overLeveraged?: boolean;
  movedStopLoss?: boolean;

  marketCondition: string;
  sessionType: string;
  hasNews: boolean;

  // Notes and images
  notes?: string;
  entryImage?: string;
  entryImageM15?: string;
  exitImage?: string;
  exitImageM15?: string;

  // Image metadata
  entryImageMeta?: ImageMeta;
  entryImageM15Meta?: ImageMeta;
  exitImageMeta?: ImageMeta;
  exitImageM15Meta?: ImageMeta;

  // Capture status
  captureStatus?: CaptureStatus;
  errorMessage?: string;
  captureRequestedAt?: Timestamp;
  captureCompletedAt?: Timestamp;

  // Timestamps
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  riskRewardRatio?: number;
  strategyChecks?: StrategyConditionCheck[];
}


export interface TradeStats {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalProfit: number;
  totalLoss: number;
  netProfit: number;
  avgProfit: number;
  avgLoss: number;
  profitFactor: number;
  largestWin: number;
  largestLoss: number;
  avgRiskRewardRatio: number;
  expectancy: number;
}

export interface PerformanceByPair {
  pair: CurrencyPair;
  trades: number;
  winRate: number;
  netProfit: number;
  avgRiskRewardRatio: number;
}

export interface PerformanceByStrategy {
  strategy: string;
  trades: number;
  winRate: number;
  netProfit: number;
  avgRiskRewardRatio: number;
}

export interface PerformanceByEmotion {
  emotion: string;
  trades: number;
  winRate: number;
  netProfit: number;
}

export interface TradeFilterOptions {
  startDate?: Date;
  endDate?: Date;
  pair?: CurrencyPair[];
  direction?: Direction[];
  result?: TradeResult[];
  strategy?: string[];
  emotion?: string[];
  hasFollowedPlan?: boolean;
  hasEnteredEarly?: boolean;
  hasRevenge?: boolean;
  hasMovedSL?: boolean;
  hasOverLeveraged?: boolean;
  sessionType?: string[];
  hasNews?: boolean;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: "discipline" | "performance" | "consistency" | "learning";
  level:
    | "bronze"
    | "silver"
    | "gold"
    | "platinum"
    | "diamond"
    | "sapphire"
    | "ruby"
    | "emerald"
    | "master";
  criteria: {
    metricName: string;
    metricValue: number;
    comparison: "greater" | "equals" | "less";
    streak?: boolean; // Achievement streak effect
  };
  points: number; // Points awarded when achieved
  dateEarned?: string; // Date achieved
  progress?: number; // Current progress (0-100)
  isComplete?: boolean; // Whether completed or not
}

export interface UserAchievements {
  userId: string;
  totalPoints: number;
  level: number;
  achievements: {
    [achievementId: string]: {
      isComplete: boolean;
      dateEarned?: string;
      progress?: number;
    };
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Goal interface for Firebase
export interface Goal {
  id: string;
  userId: string;
  title: string;
  description?: string;
  targetType:
    | "profit"
    | "winRate"
    | "profitFactor"
    | "riskRewardRatio"
    | "balance"
    | "trades";
  targetValue: number;
  currentValue: number;
  startDate: Timestamp | Date;
  endDate: Timestamp | Date;
  isCompleted: boolean;
  priority: "low" | "medium" | "high";
  color?: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

// Interface for Goal milestones
export interface Milestone {
  id: string;
  goalId: string;
  title: string;
  description?: string;
  targetType?: string; // Thêm targetType để tương thích với code hiện tại
  targetValue: number;
  currentValue?: number; // Thêm currentValue để tương thích với code hiện tại
  isCompleted: boolean;
  completedDate?: Timestamp | null;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export interface AppSettings {
  theme: "light" | "dark" | "system";
  currency: "USD" | "EUR" | "GBP" | "JPY";
  defaultRiskPerTrade: number;
  defaultRiskRewardRatio: number;
  defaultLotSize: number;
  language: "en" | "fr" | "de" | "es" | "ja";
  notifications: boolean;
  dateFormat: "MM/DD/YYYY" | "DD/MM/YYYY" | "YYYY-MM-DD";
  showBalanceHistory: boolean;
  autoCalculateLotSize: boolean;
  defaultTimeframe: "M5" | "M15" | "H1" | "H4" | "D1";
  showAchievements?: boolean; // Show notification when achievement is earned
}

export interface ChartDataPoint {
  date: string;
  value: number;
}

export interface TradeHistoryChartData {
  dates: string[];
  balances: number[];
  profits: number[];
  losses: number[];
}

export interface RecentActivity {
  id: string;
  type: "trade" | "deposit" | "withdrawal";
  pair?: CurrencyPair;
  direction?: Direction;
  amount: number;
  date: Timestamp;
  description?: string;
}
