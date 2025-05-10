import { 
  type User, type InsertUser,
  type Trade, type InsertTrade,
  type Goal, type InsertGoal,
  type GoalMilestone, type InsertGoalMilestone
} from "@shared/schema";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User>;
  
  // Trade operations
  createTrade(trade: InsertTrade): Promise<Trade>;
  getTradeById(id: number): Promise<Trade | undefined>;
  getTradesByUserId(userId: number): Promise<Trade[]>;
  updateTrade(id: number, tradeData: Partial<Trade>): Promise<Trade>;
  deleteTrade(id: number): Promise<void>;
  
  // Goal operations
  createGoal(goal: InsertGoal): Promise<Goal>;
  getGoalById(id: number): Promise<Goal | undefined>;
  getGoalsByUserId(userId: number): Promise<Goal[]>;
  updateGoal(id: number, goalData: Partial<Goal>): Promise<Goal>;
  deleteGoal(id: number): Promise<void>;
  calculateGoalProgress(goalId: number): Promise<number>;
  
  // GoalMilestone operations
  createGoalMilestone(milestone: InsertGoalMilestone): Promise<GoalMilestone>;
  getGoalMilestonesByGoalId(goalId: number): Promise<GoalMilestone[]>;
  updateGoalMilestone(id: number, milestoneData: Partial<GoalMilestone>): Promise<GoalMilestone>;
  deleteGoalMilestone(id: number): Promise<void>;
  
  // Analytics operations
  getTradeStats(userId: number): Promise<TradeStats>;
  getPerformanceData(userId: number): Promise<PerformanceData>;
  getGoalsProgress(userId: number): Promise<GoalsProgressData>;
}

// Types for analytics
interface TradeStats {
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
}

interface PerformanceByPair {
  pair: string;
  trades: number;
  winRate: number;
  netProfit: number;
}

interface PerformanceByStrategy {
  strategy: string;
  trades: number;
  winRate: number;
  netProfit: number;
}

interface PerformanceData {
  byPair: PerformanceByPair[];
  byStrategy: PerformanceByStrategy[];
  byEmotion: {
    emotion: string;
    trades: number;
    winRate: number;
  }[];
  bySession: {
    session: string;
    trades: number;
    winRate: number;
  }[];
  byDiscipline: {
    followedPlan: {
      yes: number;
      no: number;
      winRateYes: number;
      winRateNo: number;
    };
    enteredEarly: {
      yes: number;
      no: number;
      winRateYes: number;
      winRateNo: number;
    };
    revenge: {
      yes: number;
      no: number;
      winRateYes: number;
      winRateNo: number;
    };
  };
}

// Goal progress tracking data
interface GoalProgressItem {
  id: number;
  title: string;
  targetType: string;
  targetValue: number;
  currentValue: number;
  progressPercentage: number;
  isCompleted: boolean;
  startDate: Date;
  endDate: Date;
  daysLeft: number;
  priority: string;
  color: string | null;
  milestones?: {
    id: number;
    title: string;
    targetValue: number;
    isCompleted: boolean;
    progressPercentage: number;
  }[];
}

interface GoalsProgressData {
  activeGoals: GoalProgressItem[];
  completedGoals: GoalProgressItem[];
  upcomingMilestones: {
    id: number;
    goalId: number;
    goalTitle: string;
    title: string;
    targetValue: number;
    progressPercentage: number;
  }[];
  overallProgress: {
    totalGoals: number;
    completedGoals: number;
    progressPercentage: number;
  };
}

// Memory storage implementation
export class MemStorage implements IStorage {
  private usersMap: Map<number, User>;
  private tradesMap: Map<number, Trade>;
  private goalsMap: Map<number, Goal>;
  private milestonesMap: Map<number, GoalMilestone>;
  private userIdCounter: number;
  private tradeIdCounter: number;
  private goalIdCounter: number;
  private milestoneIdCounter: number;
  
  constructor() {
    this.usersMap = new Map();
    this.tradesMap = new Map();
    this.goalsMap = new Map();
    this.milestonesMap = new Map();
    this.userIdCounter = 1;
    this.tradeIdCounter = 1;
    this.goalIdCounter = 1;
    this.milestoneIdCounter = 1;
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.usersMap.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.usersMap.values()).find(
      (user) => user.username === username
    );
  }
  
  async createUser(userData: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    
    const user: User = {
      id,
      ...userData,
      createdAt: now,
      updatedAt: now,
      initialBalance: userData.initialBalance || 10000,
      currentBalance: userData.initialBalance || 10000,
      settings: {},
    };
    
    this.usersMap.set(id, user);
    return user;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User> {
    const user = await this.getUser(id);
    
    if (!user) {
      throw new Error("User not found");
    }
    
    const updatedUser = {
      ...user,
      ...userData,
      updatedAt: new Date(),
    };
    
    this.usersMap.set(id, updatedUser);
    return updatedUser;
  }
  
  // Trade operations
  async createTrade(tradeData: InsertTrade): Promise<Trade> {
    const id = this.tradeIdCounter++;
    const now = new Date();
    
    const trade: Trade = {
      id,
      ...tradeData,
      createdAt: now,
      updatedAt: now,
      pips: null,
      profitLoss: null,
    };
    
    this.tradesMap.set(id, trade);
    
    // If trade is closed, update user balance
    if (trade.closeDate && trade.profitLoss !== null) {
      const user = await this.getUser(trade.userId);
      
      if (user) {
        await this.updateUser(user.id, {
          currentBalance: user.currentBalance + Number(trade.profitLoss),
        });
      }
    }
    
    return trade;
  }
  
  async getTradeById(id: number): Promise<Trade | undefined> {
    return this.tradesMap.get(id);
  }
  
  async getTradesByUserId(userId: number): Promise<Trade[]> {
    return Array.from(this.tradesMap.values())
      .filter((trade) => trade.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  
  async updateTrade(id: number, tradeData: Partial<Trade>): Promise<Trade> {
    const trade = await this.getTradeById(id);
    
    if (!trade) {
      throw new Error("Trade not found");
    }
    
    // Store old profit/loss value
    const oldProfitLoss = trade.profitLoss;
    
    const updatedTrade = {
      ...trade,
      ...tradeData,
      updatedAt: new Date(),
    };
    
    this.tradesMap.set(id, updatedTrade);
    
    // If profit/loss changed, update user balance
    if (updatedTrade.profitLoss !== null && updatedTrade.profitLoss !== oldProfitLoss) {
      const user = await this.getUser(updatedTrade.userId);
      
      if (user) {
        // Subtract old P/L and add new P/L
        let newBalance = user.currentBalance;
        
        if (oldProfitLoss !== null) {
          newBalance -= Number(oldProfitLoss);
        }
        
        newBalance += Number(updatedTrade.profitLoss);
        
        await this.updateUser(user.id, {
          currentBalance: newBalance,
        });
      }
    }
    
    return updatedTrade;
  }
  
  async deleteTrade(id: number): Promise<void> {
    const trade = await this.getTradeById(id);
    
    if (!trade) {
      throw new Error("Trade not found");
    }
    
    // If trade was closed and had P/L, update user balance
    if (trade.closeDate && trade.profitLoss !== null) {
      const user = await this.getUser(trade.userId);
      
      if (user) {
        await this.updateUser(user.id, {
          currentBalance: user.currentBalance - Number(trade.profitLoss),
        });
      }
    }
    
    this.tradesMap.delete(id);
  }
  
  // Analytics operations
  async getTradeStats(userId: number): Promise<TradeStats> {
    const trades = await this.getTradesByUserId(userId);
    
    // Filter closed trades with P/L
    const closedTrades = trades.filter(
      (trade) => trade.closeDate && trade.profitLoss !== null
    );
    
    // Calculate stats
    const winningTrades = closedTrades.filter((trade) => Number(trade.profitLoss) > 0);
    const losingTrades = closedTrades.filter((trade) => Number(trade.profitLoss) < 0);
    
    const totalProfit = winningTrades.reduce(
      (sum, trade) => sum + Number(trade.profitLoss),
      0
    );
    
    const totalLoss = losingTrades.reduce(
      (sum, trade) => sum + Number(trade.profitLoss),
      0
    );
    
    return {
      totalTrades: closedTrades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate: closedTrades.length > 0 
        ? (winningTrades.length / closedTrades.length) * 100 
        : 0,
      totalProfit,
      totalLoss,
      netProfit: totalProfit + totalLoss,
      avgProfit: winningTrades.length > 0 
        ? totalProfit / winningTrades.length 
        : 0,
      avgLoss: losingTrades.length > 0 
        ? totalLoss / losingTrades.length 
        : 0,
      profitFactor: Math.abs(totalLoss) > 0 
        ? Math.abs(totalProfit / totalLoss) 
        : totalProfit > 0 ? Infinity : 0,
      largestWin: winningTrades.length > 0 
        ? Math.max(...winningTrades.map((trade) => Number(trade.profitLoss))) 
        : 0,
      largestLoss: losingTrades.length > 0 
        ? Math.min(...losingTrades.map((trade) => Number(trade.profitLoss))) 
        : 0,
      avgRiskRewardRatio: closedTrades.length > 0
        ? closedTrades.reduce((sum, trade) => {
            const risk = Math.abs(Number(trade.entryPrice) - Number(trade.stopLoss));
            const reward = Math.abs(Number(trade.takeProfit) - Number(trade.entryPrice));
            return sum + (reward / risk);
          }, 0) / closedTrades.length
        : 0,
    };
  }
  
  async getPerformanceData(userId: number): Promise<PerformanceData> {
    const trades = await this.getTradesByUserId(userId);
    
    // Filter closed trades
    const closedTrades = trades.filter(
      (trade) => trade.closeDate && trade.profitLoss !== null
    );
    
    // Calculate pair performance
    const pairMap = new Map<string, { trades: Trade[] }>();
    
    closedTrades.forEach((trade) => {
      const pair = trade.pair as string;
      
      if (!pairMap.has(pair)) {
        pairMap.set(pair, { trades: [] });
      }
      
      pairMap.get(pair)?.trades.push(trade);
    });
    
    const byPair = Array.from(pairMap.entries()).map(([pair, data]) => {
      const winningTrades = data.trades.filter((trade) => Number(trade.profitLoss) > 0);
      
      return {
        pair,
        trades: data.trades.length,
        winRate: data.trades.length > 0 
          ? (winningTrades.length / data.trades.length) * 100 
          : 0,
        netProfit: data.trades.reduce(
          (sum, trade) => sum + Number(trade.profitLoss),
          0
        ),
      };
    });
    
    // Calculate strategy performance
    const strategyMap = new Map<string, { trades: Trade[] }>();
    
    closedTrades.forEach((trade) => {
      const strategy = trade.strategy;
      
      if (!strategyMap.has(strategy)) {
        strategyMap.set(strategy, { trades: [] });
      }
      
      strategyMap.get(strategy)?.trades.push(trade);
    });
    
    const byStrategy = Array.from(strategyMap.entries()).map(([strategy, data]) => {
      const winningTrades = data.trades.filter((trade) => Number(trade.profitLoss) > 0);
      
      return {
        strategy,
        trades: data.trades.length,
        winRate: data.trades.length > 0 
          ? (winningTrades.length / data.trades.length) * 100 
          : 0,
        netProfit: data.trades.reduce(
          (sum, trade) => sum + Number(trade.profitLoss),
          0
        ),
      };
    });
    
    // Calculate emotion performance
    const emotionMap = new Map<string, { trades: Trade[] }>();
    
    closedTrades.forEach((trade) => {
      const emotion = trade.emotion || "Unknown";
      
      if (!emotionMap.has(emotion)) {
        emotionMap.set(emotion, { trades: [] });
      }
      
      emotionMap.get(emotion)?.trades.push(trade);
    });
    
    const byEmotion = Array.from(emotionMap.entries()).map(([emotion, data]) => {
      const winningTrades = data.trades.filter((trade) => Number(trade.profitLoss) > 0);
      
      return {
        emotion,
        trades: data.trades.length,
        winRate: data.trades.length > 0 
          ? (winningTrades.length / data.trades.length) * 100 
          : 0,
      };
    });
    
    // Calculate session performance
    const sessionMap = new Map<string, { trades: Trade[] }>();
    
    closedTrades.forEach((trade) => {
      const session = trade.sessionType || "Unknown";
      
      if (!sessionMap.has(session)) {
        sessionMap.set(session, { trades: [] });
      }
      
      sessionMap.get(session)?.trades.push(trade);
    });
    
    const bySession = Array.from(sessionMap.entries()).map(([session, data]) => {
      const winningTrades = data.trades.filter((trade) => Number(trade.profitLoss) > 0);
      
      return {
        session,
        trades: data.trades.length,
        winRate: data.trades.length > 0 
          ? (winningTrades.length / data.trades.length) * 100 
          : 0,
      };
    });
    
    // Calculate discipline performance
    const followedPlanYes = closedTrades.filter((trade) => trade.followedPlan);
    const followedPlanNo = closedTrades.filter((trade) => !trade.followedPlan);
    
    const enteredEarlyYes = closedTrades.filter((trade) => trade.enteredEarly);
    const enteredEarlyNo = closedTrades.filter((trade) => !trade.enteredEarly);
    
    const revengeYes = closedTrades.filter((trade) => trade.revenge);
    const revengeNo = closedTrades.filter((trade) => !trade.revenge);
    
    return {
      byPair,
      byStrategy,
      byEmotion,
      bySession,
      byDiscipline: {
        followedPlan: {
          yes: followedPlanYes.length,
          no: followedPlanNo.length,
          winRateYes: followedPlanYes.length > 0
            ? (followedPlanYes.filter((trade) => Number(trade.profitLoss) > 0).length / followedPlanYes.length) * 100
            : 0,
          winRateNo: followedPlanNo.length > 0
            ? (followedPlanNo.filter((trade) => Number(trade.profitLoss) > 0).length / followedPlanNo.length) * 100
            : 0,
        },
        enteredEarly: {
          yes: enteredEarlyYes.length,
          no: enteredEarlyNo.length,
          winRateYes: enteredEarlyYes.length > 0
            ? (enteredEarlyYes.filter((trade) => Number(trade.profitLoss) > 0).length / enteredEarlyYes.length) * 100
            : 0,
          winRateNo: enteredEarlyNo.length > 0
            ? (enteredEarlyNo.filter((trade) => Number(trade.profitLoss) > 0).length / enteredEarlyNo.length) * 100
            : 0,
        },
        revenge: {
          yes: revengeYes.length,
          no: revengeNo.length,
          winRateYes: revengeYes.length > 0
            ? (revengeYes.filter((trade) => Number(trade.profitLoss) > 0).length / revengeYes.length) * 100
            : 0,
          winRateNo: revengeNo.length > 0
            ? (revengeNo.filter((trade) => Number(trade.profitLoss) > 0).length / revengeNo.length) * 100
            : 0,
        },
      },
    };
  }
  
  // Goal operations
  async createGoal(goalData: InsertGoal): Promise<Goal> {
    const id = this.goalIdCounter++;
    const now = new Date();
    
    const goal: Goal = {
      id,
      ...goalData,
      currentValue: 0,
      isCompleted: false,
      createdAt: now,
      updatedAt: now,
      milestones: [],
    };
    
    this.goalsMap.set(id, goal);
    return goal;
  }
  
  async getGoalById(id: number): Promise<Goal | undefined> {
    return this.goalsMap.get(id);
  }
  
  async getGoalsByUserId(userId: number): Promise<Goal[]> {
    return Array.from(this.goalsMap.values())
      .filter((goal) => goal.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  
  async updateGoal(id: number, goalData: Partial<Goal>): Promise<Goal> {
    const goal = await this.getGoalById(id);
    
    if (!goal) {
      throw new Error("Goal not found");
    }
    
    const updatedGoal = {
      ...goal,
      ...goalData,
      updatedAt: new Date(),
    };
    
    this.goalsMap.set(id, updatedGoal);
    return updatedGoal;
  }
  
  async deleteGoal(id: number): Promise<void> {
    const goal = await this.getGoalById(id);
    
    if (!goal) {
      throw new Error("Goal not found");
    }
    
    // Delete all milestones for this goal
    const milestones = await this.getGoalMilestonesByGoalId(id);
    for (const milestone of milestones) {
      await this.deleteGoalMilestone(milestone.id);
    }
    
    this.goalsMap.delete(id);
  }
  
  async calculateGoalProgress(goalId: number): Promise<number> {
    const goal = await this.getGoalById(goalId);
    
    if (!goal) {
      throw new Error("Goal not found");
    }
    
    // Get current value based on goal target type
    const currentValue = await this.getGoalCurrentValue(goal);
    
    // Update the goal with the current value
    await this.updateGoal(goalId, { currentValue });
    
    // Calculate progress percentage
    const progress = Math.min(100, (currentValue / goal.targetValue) * 100);
    
    // If progress is 100% or more, mark goal as completed
    if (progress >= 100 && !goal.isCompleted) {
      await this.updateGoal(goalId, { isCompleted: true });
    }
    
    return progress;
  }
  
  // Helper method to get current value based on goal type
  private async getGoalCurrentValue(goal: Goal): Promise<number> {
    const user = await this.getUser(goal.userId);
    
    if (!user) {
      throw new Error("User not found");
    }
    
    const stats = await this.getTradeStats(goal.userId);
    
    switch (goal.targetType) {
      case "profit":
        return stats.netProfit;
      case "winRate":
        return stats.winRate;
      case "profitFactor":
        return stats.profitFactor;
      case "riskRewardRatio":
        return stats.avgRiskRewardRatio;
      case "balance":
        return user.currentBalance;
      case "trades":
        return stats.totalTrades;
      default:
        return 0;
    }
  }
  
  // GoalMilestone operations
  async createGoalMilestone(milestoneData: InsertGoalMilestone): Promise<GoalMilestone> {
    const id = this.milestoneIdCounter++;
    const now = new Date();
    
    const milestone: GoalMilestone = {
      id,
      ...milestoneData,
      isCompleted: false,
      completedDate: null,
      createdAt: now,
      updatedAt: now,
    };
    
    this.milestonesMap.set(id, milestone);
    
    // Update the goal's milestones array
    const goal = await this.getGoalById(milestone.goalId);
    if (goal) {
      const milestones = goal.milestones || [];
      await this.updateGoal(goal.id, { 
        milestones: [...milestones, milestone] 
      });
    }
    
    return milestone;
  }
  
  async getGoalMilestonesByGoalId(goalId: number): Promise<GoalMilestone[]> {
    return Array.from(this.milestonesMap.values())
      .filter((milestone) => milestone.goalId === goalId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }
  
  async updateGoalMilestone(id: number, milestoneData: Partial<GoalMilestone>): Promise<GoalMilestone> {
    const milestone = this.milestonesMap.get(id);
    
    if (!milestone) {
      throw new Error("Milestone not found");
    }
    
    const updatedMilestone = {
      ...milestone,
      ...milestoneData,
      updatedAt: new Date(),
    };
    
    // If milestone is completed and completedDate is not set, set it
    if (updatedMilestone.isCompleted && !updatedMilestone.completedDate) {
      updatedMilestone.completedDate = new Date();
    }
    
    this.milestonesMap.set(id, updatedMilestone);
    
    // Update the milestone in the goal's milestones array
    const goal = await this.getGoalById(milestone.goalId);
    if (goal && goal.milestones) {
      const updatedMilestones = goal.milestones.map(m => 
        m.id === id ? updatedMilestone : m
      );
      await this.updateGoal(goal.id, { milestones: updatedMilestones });
    }
    
    return updatedMilestone;
  }
  
  async deleteGoalMilestone(id: number): Promise<void> {
    const milestone = this.milestonesMap.get(id);
    
    if (!milestone) {
      throw new Error("Milestone not found");
    }
    
    this.milestonesMap.delete(id);
    
    // Remove the milestone from the goal's milestones array
    const goal = await this.getGoalById(milestone.goalId);
    if (goal && goal.milestones) {
      const updatedMilestones = goal.milestones.filter(m => m.id !== id);
      await this.updateGoal(goal.id, { milestones: updatedMilestones });
    }
  }
  
  // Goals progress analytics
  async getGoalsProgress(userId: number): Promise<GoalsProgressData> {
    const goals = await this.getGoalsByUserId(userId);
    const now = new Date();
    
    // Calculate progress for each goal
    const goalsWithProgress: GoalProgressItem[] = await Promise.all(
      goals.map(async (goal) => {
        const progress = await this.calculateGoalProgress(goal.id);
        const milestones = await this.getGoalMilestonesByGoalId(goal.id);
        
        // Calculate days left
        const endDate = new Date(goal.endDate);
        const daysLeft = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
        
        // Calculate milestone progress
        const milestonesWithProgress = milestones.map(milestone => {
          const progressPercentage = goal.currentValue >= milestone.targetValue ? 100 : 
            Math.min(100, (goal.currentValue / milestone.targetValue) * 100);
          
          return {
            id: milestone.id,
            title: milestone.title,
            targetValue: milestone.targetValue,
            isCompleted: milestone.isCompleted,
            progressPercentage
          };
        });
        
        return {
          id: goal.id,
          title: goal.title,
          targetType: goal.targetType,
          targetValue: goal.targetValue,
          currentValue: goal.currentValue,
          progressPercentage: progress,
          isCompleted: goal.isCompleted,
          startDate: goal.startDate,
          endDate: goal.endDate,
          daysLeft,
          priority: goal.priority,
          color: goal.color || null,
          milestones: milestonesWithProgress
        };
      })
    );
    
    // Split goals into active and completed
    const activeGoals = goalsWithProgress.filter(goal => !goal.isCompleted);
    const completedGoals = goalsWithProgress.filter(goal => goal.isCompleted);
    
    // Find upcoming milestones (not completed, sorted by progress)
    const allMilestones = goalsWithProgress.flatMap(goal => 
      (goal.milestones || []).map(milestone => ({
        id: milestone.id,
        goalId: goal.id,
        goalTitle: goal.title,
        title: milestone.title,
        targetValue: milestone.targetValue,
        progressPercentage: milestone.progressPercentage
      }))
    );
    
    const upcomingMilestones = allMilestones
      .filter(milestone => milestone.progressPercentage < 100)
      .sort((a, b) => b.progressPercentage - a.progressPercentage)
      .slice(0, 5);
    
    // Calculate overall progress
    const totalGoals = goals.length;
    const completedGoalsCount = completedGoals.length;
    const overallProgressPercentage = totalGoals > 0 
      ? (completedGoalsCount / totalGoals) * 100 
      : 0;
    
    return {
      activeGoals,
      completedGoals,
      upcomingMilestones,
      overallProgress: {
        totalGoals,
        completedGoals: completedGoalsCount,
        progressPercentage: overallProgressPercentage
      }
    };
  }
}

export const storage = new MemStorage();
