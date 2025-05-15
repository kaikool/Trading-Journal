import { Achievement } from "@/types";
import { Icons } from "@/components/icons/icons";
import type { ComponentType } from "react";

// Hàm trợ giúp chuyển đổi tên icon thành component
export const getIconByName = (iconName: string): ComponentType<{ className?: string }> => {
  const icons: Record<string, ComponentType<{ className?: string }>> = {
    // Achievement icons
    "Target": Icons.general.target,
    "Trophy": Icons.achievement.trophy,
    "TrendingUp": Icons.trade.profit,
    "Sword": Icons.achievement.trophy, // Fallback until we add sword
    "Coffee": Icons.achievement.trophy, // Fallback until we add coffee
    "Brain": Icons.achievement.trophy, // Fallback until we add brain
    "HeartHandshake": Icons.achievement.trophy, // Fallback until we add handshake
    "Lightbulb": Icons.achievement.trophy, // Fallback until we add lightbulb
    "LineChart": Icons.nav.analytics,
    "Hourglass": Icons.achievement.trophy, // Fallback until we add hourglass
    "BookOpen": Icons.nav.strategies,
    "CheckCheck": Icons.ui.check,
    "CircleDollarSign": Icons.trade.price,
    "Medal": Icons.achievement.trophy,
    "Award": Icons.achievement.trophy,
    "Clock": Icons.achievement.trophy, // Fallback until we add clock
    "Shield": Icons.achievement.trophy, // Fallback until we add shield
    "BarChart3": Icons.nav.analytics,
    "Calendar": Icons.general.calendar,
    "Globe": Icons.achievement.trophy, // Fallback until we add globe
    "Sun": Icons.achievement.trophy, // Fallback until we add sun
    "Crown": Icons.achievement.crown
  };
  
  return icons[iconName] || Icons.achievement.trophy;
};

// Achievement level colors with expanded range (from bronze to platinum)
export const achievementLevelColors = {
  // Basic levels
  bronze: {
    bg: "bg-amber-700/10 dark:bg-amber-900/20",
    border: "border-amber-700/20 dark:border-amber-700/30",
    text: "text-amber-700 dark:text-amber-500",
    icon: "text-amber-600 dark:text-amber-500",
    shadow: "shadow-amber-700/5"
  },
  silver: {
    bg: "bg-slate-300/15 dark:bg-slate-400/10",
    border: "border-slate-400/30 dark:border-slate-500/30",
    text: "text-slate-700 dark:text-slate-300",
    icon: "text-slate-500 dark:text-slate-400",
    shadow: "shadow-slate-400/10"
  },
  gold: {
    bg: "bg-yellow-400/10 dark:bg-yellow-500/10",
    border: "border-yellow-400/20 dark:border-yellow-500/30",
    text: "text-yellow-700 dark:text-yellow-400",
    icon: "text-yellow-500 dark:text-yellow-400",
    shadow: "shadow-yellow-400/10"
  },
  // Advanced levels
  platinum: {
    bg: "bg-zinc-300/20 dark:bg-zinc-400/10",
    border: "border-zinc-300/30 dark:border-zinc-400/20",
    text: "text-zinc-700 dark:text-zinc-300",
    icon: "text-zinc-600 dark:text-zinc-300",
    shadow: "shadow-zinc-400/10"
  },
  diamond: {
    bg: "bg-blue-400/10 dark:bg-blue-500/10",
    border: "border-blue-400/20 dark:border-blue-400/30",
    text: "text-blue-600 dark:text-blue-400",
    icon: "text-blue-500 dark:text-blue-400",
    shadow: "shadow-blue-400/10"
  },
  sapphire: {
    bg: "bg-indigo-400/10 dark:bg-indigo-500/10",
    border: "border-indigo-400/20 dark:border-indigo-400/30",
    text: "text-indigo-600 dark:text-indigo-400",
    icon: "text-indigo-500 dark:text-indigo-400",
    shadow: "shadow-indigo-400/10"
  },
  ruby: {
    bg: "bg-red-400/10 dark:bg-red-500/10",
    border: "border-red-400/20 dark:border-red-400/30",
    text: "text-red-600 dark:text-red-400",
    icon: "text-red-500 dark:text-red-400",
    shadow: "shadow-red-400/10"
  },
  emerald: {
    bg: "bg-emerald-400/10 dark:bg-emerald-500/10",
    border: "border-emerald-400/20 dark:border-emerald-400/30",
    text: "text-emerald-600 dark:text-emerald-400",
    icon: "text-emerald-500 dark:text-emerald-400",
    shadow: "shadow-emerald-400/10"
  },
  master: {
    bg: "bg-gradient-to-r from-purple-400/10 via-pink-400/10 to-red-400/10 dark:from-purple-500/10 dark:via-pink-500/10 dark:to-red-500/10",
    border: "border-purple-400/20 dark:border-purple-400/30",
    text: "text-purple-600 dark:text-purple-400",
    icon: "text-purple-500 dark:text-purple-400",
    shadow: "shadow-purple-400/10"
  }
};

// Màu sắc cho các category thành tích
export const achievementCategoryColors = {
  discipline: {
    bg: "bg-violet-400/10",
    text: "text-violet-600 dark:text-violet-400",
    label: "Discipline"
  },
  performance: {
    bg: "bg-green-400/10",
    text: "text-green-600 dark:text-green-400",
    label: "Performance"
  },
  consistency: {
    bg: "bg-blue-400/10",
    text: "text-blue-600 dark:text-blue-400",
    label: "Consistency"
  },
  learning: {
    bg: "bg-amber-400/10",
    text: "text-amber-600 dark:text-amber-400",
    label: "Learning"
  }
};

// Define achievements structure
export const defineAchievements = (): Achievement[] => {
  return [
    // DISCIPLINE ACHIEVEMENTS - BRONZE LEVEL
    {
      id: "discipline-plan-follower",
      name: "Plan Follower",
      description: "Complete 5 trades following your trading plan",
      icon: "CheckCheck",
      category: "discipline",
      level: "bronze",
      criteria: {
        metricName: "followedPlanTrades",
        metricValue: 5,
        comparison: "greater"
      },
      points: 10
    },
    {
      id: "discipline-patience",
      name: "Patient Trader",
      description: "Don't enter early for 5 consecutive trades",
      icon: "Hourglass",
      category: "discipline",
      level: "bronze",
      criteria: {
        metricName: "notEnteredEarlyStreak",
        metricValue: 5,
        comparison: "greater",
        streak: true
      },
      points: 15
    },
    {
      id: "discipline-emotional-control",
      name: "Emotional Control",
      description: "No revenge trading for 5 consecutive trades",
      icon: "Brain",
      category: "discipline",
      level: "bronze",
      criteria: {
        metricName: "noRevengeTradesStreak",
        metricValue: 5,
        comparison: "greater",
        streak: true
      },
      points: 15
    },
    
    // DISCIPLINE ACHIEVEMENTS - SILVER LEVEL
    {
      id: "discipline-plan-master",
      name: "Plan Master",
      description: "Complete 15 trades following your trading plan",
      icon: "CheckCheck",
      category: "discipline",
      level: "silver",
      criteria: {
        metricName: "followedPlanTrades",
        metricValue: 15,
        comparison: "greater"
      },
      points: 25
    },
    {
      id: "discipline-patience-pro",
      name: "Patience Professional",
      description: "Don't enter early for 10 consecutive trades",
      icon: "Hourglass",
      category: "discipline",
      level: "silver",
      criteria: {
        metricName: "notEnteredEarlyStreak",
        metricValue: 10,
        comparison: "greater",
        streak: true
      },
      points: 30
    },
    {
      id: "discipline-risk-manager",
      name: "Risk Manager",
      description: "Complete 10 trades without moving your stop loss",
      icon: "Shield",
      category: "discipline",
      level: "silver",
      criteria: {
        metricName: "notMovedStopLossStreak",
        metricValue: 10,
        comparison: "greater",
        streak: true
      },
      points: 35
    },
    
    // DISCIPLINE ACHIEVEMENTS - GOLD LEVEL
    {
      id: "discipline-zen-trader",
      name: "Zen Trader",
      description: "Complete 20 trades with no revenge trading",
      icon: "Brain",
      category: "discipline",
      level: "gold",
      criteria: {
        metricName: "noRevengeTradesTotal",
        metricValue: 20,
        comparison: "greater"
      },
      points: 50
    },
    {
      id: "discipline-position-master",
      name: "Position Master",
      description: "Trade for a month without over-leveraging once",
      icon: "Shield",
      category: "discipline",
      level: "gold",
      criteria: {
        metricName: "notOverLeveragedDays",
        metricValue: 30,
        comparison: "greater",
        streak: true
      },
      points: 60
    },
    
    // DISCIPLINE ACHIEVEMENTS - PLATINUM & DIAMOND LEVELS
    {
      id: "discipline-iron-discipline",
      name: "Iron Discipline",
      description: "Maintain 90% plan adherence over 50+ trades",
      icon: "Shield",
      category: "discipline",
      level: "platinum",
      criteria: {
        metricName: "planAdherenceMinTrades50",
        metricValue: 90,
        comparison: "greater"
      },
      points: 75
    },
    {
      id: "discipline-emotional-master",
      name: "Emotional Master",
      description: "No revenge trading for 50 consecutive trades",
      icon: "Brain",
      category: "discipline",
      level: "diamond",
      criteria: {
        metricName: "noRevengeTradesStreak",
        metricValue: 50,
        comparison: "greater",
        streak: true
      },
      points: 90
    },
    
    // DISCIPLINE ACHIEVEMENTS - HIGHEST LEVELS
    {
      id: "discipline-grandmaster",
      name: "Discipline Grandmaster",
      description: "Trade for 100 consecutive days following your plan perfectly",
      icon: "Award",
      category: "discipline",
      level: "master",
      criteria: {
        metricName: "perfectPlanDaysStreak",
        metricValue: 100,
        comparison: "greater",
        streak: true
      },
      points: 150
    },
    
    // PERFORMANCE ACHIEVEMENTS - BRONZE LEVEL
    {
      id: "performance-first-win",
      name: "First Win",
      description: "Complete your first winning trade",
      icon: "Trophy",
      category: "performance",
      level: "bronze",
      criteria: {
        metricName: "winningTrades",
        metricValue: 1,
        comparison: "greater"
      },
      points: 5
    },
    {
      id: "performance-win-streak-3",
      name: "Winning Streak",
      description: "Achieve 3 winning trades in a row",
      icon: "TrendingUp",
      category: "performance",
      level: "bronze",
      criteria: {
        metricName: "winningStreak",
        metricValue: 3,
        comparison: "greater",
        streak: true
      },
      points: 15
    },
    {
      id: "performance-profit-1-percent",
      name: "First Step",
      description: "Reach 1% of your initial balance in profit",
      icon: "CircleDollarSign",
      category: "performance",
      level: "bronze",
      criteria: {
        metricName: "totalProfitPercentage",
        metricValue: 1,
        comparison: "greater"
      },
      points: 10
    },
    
    // PERFORMANCE ACHIEVEMENTS - SILVER LEVEL
    {
      id: "performance-win-streak-5",
      name: "Winning Surge",
      description: "Achieve 5 winning trades in a row",
      icon: "TrendingUp",
      category: "performance",
      level: "silver",
      criteria: {
        metricName: "winningStreak",
        metricValue: 5,
        comparison: "greater",
        streak: true
      },
      points: 25
    },
    {
      id: "performance-win-rate-60",
      name: "Consistent Performer",
      description: "Maintain a 60% win rate over 20+ trades",
      icon: "BarChart3",
      category: "performance", 
      level: "silver",
      criteria: {
        metricName: "winRateMinTrades20",
        metricValue: 60,
        comparison: "greater"
      },
      points: 30
    },
    {
      id: "performance-profit-5-percent",
      name: "Growth Path",
      description: "Reach 5% of your initial balance in profit",
      icon: "CircleDollarSign",
      category: "performance",
      level: "silver",
      criteria: {
        metricName: "totalProfitPercentage",
        metricValue: 5,
        comparison: "greater"
      },
      points: 35
    },
    
    // PERFORMANCE ACHIEVEMENTS - GOLD LEVEL
    {
      id: "performance-win-streak-10",
      name: "Unstoppable",
      description: "Achieve 10 winning trades in a row",
      icon: "TrendingUp",
      category: "performance",
      level: "gold",
      criteria: {
        metricName: "winningStreak",
        metricValue: 10,
        comparison: "greater",
        streak: true
      },
      points: 50
    },
    {
      id: "performance-profit-20-percent",
      name: "Significant Growth",
      description: "Reach 20% of your initial balance in profit",
      icon: "CircleDollarSign",
      category: "performance",
      level: "gold",
      criteria: {
        metricName: "totalProfitPercentage",
        metricValue: 20,
        comparison: "greater"
      },
      points: 60
    },
    {
      id: "performance-risk-reward-master",
      name: "Risk-Reward Master",
      description: "Maintain an average risk-reward ratio of 1:3 over 30+ trades",
      icon: "LineChart",
      category: "performance",
      level: "gold",
      criteria: {
        metricName: "avgRiskRewardMinTrades30",
        metricValue: 3,
        comparison: "greater"
      },
      points: 65
    },
    
    // PERFORMANCE ACHIEVEMENTS - PLATINUM & DIAMOND LEVELS
    {
      id: "performance-profit-50-percent",
      name: "Wealth Builder",
      description: "Reach 50% of your initial balance in profit",
      icon: "CircleDollarSign",
      category: "performance",
      level: "platinum",
      criteria: {
        metricName: "totalProfitPercentage",
        metricValue: 50,
        comparison: "greater"
      },
      points: 75
    },
    {
      id: "performance-win-rate-75",
      name: "Trading Virtuoso",
      description: "Maintain a 75% win rate over 30+ trades",
      icon: "Award",
      category: "performance",
      level: "diamond",
      criteria: {
        metricName: "winRateMinTrades30",
        metricValue: 75,
        comparison: "greater"
      },
      points: 90
    },
    
    // PERFORMANCE ACHIEVEMENTS - HIGHEST LEVELS
    {
      id: "performance-double-balance",
      name: "Account Doubler",
      description: "Double your initial account balance",
      icon: "Trophy",
      category: "performance",
      level: "ruby",
      criteria: {
        metricName: "totalProfitPercentage",
        metricValue: 100,
        comparison: "greater"
      },
      points: 120
    },
    {
      id: "performance-win-streak-20",
      name: "Trading Legend",
      description: "Achieve 20 winning trades in a row",
      icon: "Medal",
      category: "performance",
      level: "emerald",
      criteria: {
        metricName: "winningStreak",
        metricValue: 20,
        comparison: "greater",
        streak: true
      },
      points: 150
    },
    {
      id: "performance-profit-master",
      name: "Trading Oracle",
      description: "Triple your initial account balance",
      icon: "Award",
      category: "performance",
      level: "master",
      criteria: {
        metricName: "totalProfitPercentage",
        metricValue: 200,
        comparison: "greater"
      },
      points: 200
    },
    
    // CONSISTENCY ACHIEVEMENTS - BRONZE LEVEL
    {
      id: "consistency-trade-habit",
      name: "Trading Habit",
      description: "Complete at least 5 trades",
      icon: "Coffee",
      category: "consistency",
      level: "bronze",
      criteria: {
        metricName: "totalTrades",
        metricValue: 5,
        comparison: "greater"
      },
      points: 5
    },
    {
      id: "consistency-notes-taker",
      name: "Note Taker",
      description: "Add notes to 3 consecutive trades",
      icon: "BookOpen",
      category: "consistency",
      level: "bronze",
      criteria: {
        metricName: "tradesWithNotesStreak",
        metricValue: 3,
        comparison: "greater",
        streak: true
      },
      points: 10
    },
    {
      id: "consistency-weekly-trader",
      name: "Weekly Trader",
      description: "Trade at least once a week for 4 consecutive weeks",
      icon: "Calendar",
      category: "consistency",
      level: "bronze",
      criteria: {
        metricName: "weeksWithTrades",
        metricValue: 4,
        comparison: "greater",
        streak: true
      },
      points: 15
    },
    
    // CONSISTENCY ACHIEVEMENTS - SILVER LEVEL
    {
      id: "consistency-trade-volume",
      name: "Volume Trader",
      description: "Complete at least 25 trades",
      icon: "BarChart3",
      category: "consistency",
      level: "silver",
      criteria: {
        metricName: "totalTrades",
        metricValue: 25,
        comparison: "greater"
      },
      points: 25
    },
    {
      id: "consistency-daily-trader",
      name: "Daily Trader",
      description: "Trade at least once a day for 5 consecutive days",
      icon: "Calendar",
      category: "consistency",
      level: "silver",
      criteria: {
        metricName: "daysWithTrades",
        metricValue: 5,
        comparison: "greater",
        streak: true
      },
      points: 30
    },
    {
      id: "consistency-session-master",
      name: "Session Master",
      description: "Successfully trade in all major market sessions (Asian, European, US)",
      icon: "Globe",
      category: "consistency",
      level: "silver",
      criteria: {
        metricName: "uniqueSessionsTraded",
        metricValue: 3,
        comparison: "equals"
      },
      points: 35
    },
    
    // CONSISTENCY ACHIEVEMENTS - GOLD LEVEL
    {
      id: "consistency-centurion",
      name: "Trading Centurion",
      description: "Complete at least 100 trades",
      icon: "Medal",
      category: "consistency",
      level: "gold",
      criteria: {
        metricName: "totalTrades",
        metricValue: 100,
        comparison: "greater"
      },
      points: 50
    },
    {
      id: "consistency-all-weather",
      name: "All-Weather Trader",
      description: "Maintain positive results in all market conditions",
      icon: "Sun",
      category: "consistency",
      level: "gold",
      criteria: {
        metricName: "profitableInAllConditions",
        metricValue: 1,
        comparison: "equals"
      },
      points: 60
    },
    
    // CONSISTENCY ACHIEVEMENTS - PLATINUM & DIAMOND LEVELS
    {
      id: "consistency-trade-master",
      name: "Trading Master",
      description: "Complete at least 200 trades",
      icon: "Medal",
      category: "consistency",
      level: "platinum",
      criteria: {
        metricName: "totalTrades",
        metricValue: 200,
        comparison: "greater"
      },
      points: 75
    },
    {
      id: "consistency-monthly-pro",
      name: "Monthly Professional",
      description: "Trade consistently every day for a full month",
      icon: "Calendar",
      category: "consistency",
      level: "diamond",
      criteria: {
        metricName: "dailyTradeStreak",
        metricValue: 30,
        comparison: "greater",
        streak: true
      },
      points: 90
    },
    
    // CONSISTENCY ACHIEVEMENTS - HIGHEST LEVELS
    {
      id: "consistency-major-pairs",
      name: "Major Pairs Expert",
      description: "Successfully trade all major currency pairs",
      icon: "Globe",
      category: "consistency",
      level: "sapphire",
      criteria: {
        metricName: "majorPairsTraded",
        metricValue: 7,
        comparison: "greater"
      },
      points: 100
    },
    {
      id: "consistency-trade-legend",
      name: "Trading Legend",
      description: "Complete at least 500 trades",
      icon: "Award",
      category: "consistency",
      level: "ruby",
      criteria: {
        metricName: "totalTrades",
        metricValue: 500,
        comparison: "greater"
      },
      points: 125
    },
    {
      id: "consistency-grandmaster",
      name: "Consistency Grandmaster",
      description: "Trade consistently every day for a full quarter",
      icon: "Crown",
      category: "consistency",
      level: "master",
      criteria: {
        metricName: "dailyTradeStreak",
        metricValue: 90,
        comparison: "greater",
        streak: true
      },
      points: 200
    },
    
    // LEARNING ACHIEVEMENTS - BRONZE LEVEL
    {
      id: "learning-strategy-creator",
      name: "Strategy Creator",
      description: "Create your first trading strategy",
      icon: "Lightbulb",
      category: "learning",
      level: "bronze",
      criteria: {
        metricName: "strategiesCreated",
        metricValue: 1,
        comparison: "greater"
      },
      points: 10
    },
    {
      id: "learning-chart-analyst",
      name: "Chart Analyst",
      description: "Upload charts for at least one trade",
      icon: "LineChart",
      category: "learning",
      level: "bronze",
      criteria: {
        metricName: "tradesWithCharts",
        metricValue: 1,
        comparison: "greater"
      },
      points: 10
    },
    {
      id: "learning-pattern-spotter",
      name: "Pattern Spotter",
      description: "Document 3 different technical patterns in your trades",
      icon: "LineChart",
      category: "learning",
      level: "bronze",
      criteria: {
        metricName: "uniquePatternsTraded",
        metricValue: 3,
        comparison: "greater"
      },
      points: 15
    },
    
    // LEARNING ACHIEVEMENTS - SILVER LEVEL
    {
      id: "learning-strategy-master",
      name: "Strategy Master",
      description: "Create 3 different trading strategies",
      icon: "Lightbulb",
      category: "learning",
      level: "silver",
      criteria: {
        metricName: "strategiesCreated",
        metricValue: 3,
        comparison: "greater"
      },
      points: 25
    },
    {
      id: "learning-market-scholar",
      name: "Market Scholar",
      description: "Successfully trade 5 different currency pairs",
      icon: "Globe",
      category: "learning",
      level: "silver",
      criteria: {
        metricName: "uniquePairsTraded",
        metricValue: 5,
        comparison: "greater"
      },
      points: 30
    },
    
    // LEARNING ACHIEVEMENTS - GOLD AND BEYOND
    {
      id: "learning-trade-scientist",
      name: "Trade Scientist",
      description: "Record and analyze 50 trades with detailed notes",
      icon: "BookOpen",
      category: "learning",
      level: "gold",
      criteria: {
        metricName: "tradesWithDetailedNotes",
        metricValue: 50,
        comparison: "greater"
      },
      points: 50
    },
    {
      id: "learning-master-strategist",
      name: "Master Strategist",
      description: "Have a strategy with 70%+ win rate over 30+ trades",
      icon: "Award",
      category: "learning",
      level: "diamond",
      criteria: {
        metricName: "strategyWinRateMinTrades30",
        metricValue: 70,
        comparison: "greater"
      },
      points: 80
    },
    
    // LEARNING ACHIEVEMENTS - HIGHEST LEVELS
    {
      id: "learning-pattern-master",
      name: "Pattern Master",
      description: "Successfully identify and trade 10 different chart patterns",
      icon: "LineChart",
      category: "learning",
      level: "platinum",
      criteria: {
        metricName: "uniquePatternsTraded",
        metricValue: 10,
        comparison: "greater"
      },
      points: 90
    },
    {
      id: "learning-market-guru",
      name: "Market Guru",
      description: "Successfully trade all types of market conditions with positive results",
      icon: "Globe",
      category: "learning",
      level: "sapphire",
      criteria: {
        metricName: "allMarketConditionsProfitable",
        metricValue: 1,
        comparison: "equals"
      },
      points: 120
    },
    {
      id: "learning-psychology-master",
      name: "Psychology Master",
      description: "Demonstrate perfect emotional control for 100 consecutive trades",
      icon: "Brain",
      category: "learning",
      level: "ruby",
      criteria: {
        metricName: "perfectEmotionalControlStreak",
        metricValue: 100,
        comparison: "greater",
        streak: true
      },
      points: 150
    },
    {
      id: "learning-trading-sage",
      name: "Trading Sage",
      description: "Create and profitably execute 10 different trading strategies",
      icon: "Award",
      category: "learning",
      level: "master",
      criteria: {
        metricName: "profitableStrategiesCreated",
        metricValue: 10,
        comparison: "greater"
      },
      points: 200
    }
  ];
};

// calculateAchievementTotalPoints function removed - not used in the project

// Calculate user level based on total points
export function calculateUserLevel(totalPoints: number): number {
  // Updated thresholds for 9 levels
  const levelThresholds = [0, 50, 150, 300, 500, 800, 1200, 1700, 2500];
  let level = 1;
  
  for (let i = 1; i < levelThresholds.length; i++) {
    if (totalPoints >= levelThresholds[i]) {
      level = i + 1;
    } else {
      break;
    }
  }
  
  return level;
}

// Calculate level progress percentage
export function calculateLevelProgress(totalPoints: number): number {
  const level = calculateUserLevel(totalPoints);
  // One more threshold for calculating progress of the last level
  const levelThresholds = [0, 50, 150, 300, 500, 800, 1200, 1700, 2500, 3500];
  
  if (level >= 9) return 100; // Max level is 9
  
  const currentLevelThreshold = levelThresholds[level - 1];
  const nextLevelThreshold = levelThresholds[level];
  const pointsForNextLevel = nextLevelThreshold - currentLevelThreshold;
  const pointsProgress = totalPoints - currentLevelThreshold;
  
  return Math.min(100, Math.floor((pointsProgress / pointsForNextLevel) * 100));
}

// Convert achievement level to display label
export function achievementLevelLabel(level: string): string {
  const labels = {
    bronze: "Bronze",
    silver: "Silver",
    gold: "Gold",
    platinum: "Platinum",
    diamond: "Diamond",
    sapphire: "Sapphire",
    ruby: "Ruby",
    emerald: "Emerald",
    master: "Master"
  };
  
  return labels[level as keyof typeof labels] || level;
}

// Achievement level rank order for sorting
export const achievementLevelRank: Record<string, number> = {
  bronze: 1,
  silver: 2,
  gold: 3,
  platinum: 4,
  diamond: 5,
  sapphire: 6,
  ruby: 7,
  emerald: 8,
  master: 9
};