import { 
  type User, type InsertUser,
  type Trade, type InsertTrade
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
  
  // Analytics operations
  getTradeStats(userId: number): Promise<TradeStats>;
  getPerformanceData(userId: number): Promise<PerformanceData>;
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

// Memory storage implementation
export class MemStorage implements IStorage {
  private usersMap: Map<number, User>;
  private tradesMap: Map<number, Trade>;
  private userIdCounter: number;
  private tradeIdCounter: number;
  
  constructor() {
    this.usersMap = new Map();
    this.tradesMap = new Map();
    this.userIdCounter = 1;
    this.tradeIdCounter = 1;
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
    };
    
    this.tradesMap.set(id, trade);
    
    // Update user balance
    if (trade.status === 'CLOSED' && trade.userId && trade.profitLoss !== undefined && trade.profitLoss !== null) {
      const user = await this.getUser(trade.userId);
      if (user && trade.profitLoss !== null) {
        await this.updateUser(user.id, {
          currentBalance: user.currentBalance + trade.profitLoss,
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
    
    const oldProfitLoss = trade.profitLoss || 0;
    const oldStatus = trade.isOpen === false;
    
    const updatedTrade = {
      ...trade,
      ...tradeData,
      updatedAt: new Date(),
    };
    
    this.tradesMap.set(id, updatedTrade);
    
    // Update user balance if trade is now closed or profit/loss changed
    if (
      trade.userId && 
      (
        (updatedTrade.isOpen === false && oldStatus !== false) ||
        (updatedTrade.isOpen === false && updatedTrade.profitLoss !== oldProfitLoss)
      )
    ) {
      const user = await this.getUser(trade.userId);
      if (user) {
        // Subtract old value and add new value
        const balanceAdjustment = (updatedTrade.profitLoss || 0) - (oldStatus === false ? oldProfitLoss : 0);
        
        await this.updateUser(user.id, {
          currentBalance: user.currentBalance + balanceAdjustment,
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
    
    this.tradesMap.delete(id);
    
    // Update user balance if trade was closed and had profit/loss
    if (trade.isOpen === false && trade.userId && trade.profitLoss !== undefined && trade.profitLoss !== null) {
      const user = await this.getUser(trade.userId);
      if (user && trade.profitLoss !== null) {
        await this.updateUser(user.id, {
          currentBalance: user.currentBalance - trade.profitLoss,
        });
      }
    }
  }
  
  // Analytics operations
  async getTradeStats(userId: number): Promise<TradeStats> {
    const trades = await this.getTradesByUserId(userId);
    const closedTrades = trades.filter(trade => trade.status === 'CLOSED');
    
    if (closedTrades.length === 0) {
      return {
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        winRate: 0,
        totalProfit: 0,
        totalLoss: 0,
        netProfit: 0,
        avgProfit: 0,
        avgLoss: 0,
        profitFactor: 0,
        largestWin: 0,
        largestLoss: 0,
        avgRiskRewardRatio: 0,
      };
    }
    
    const winningTrades = closedTrades.filter(trade => (trade.profitLoss || 0) > 0);
    const losingTrades = closedTrades.filter(trade => (trade.profitLoss || 0) < 0);
    
    const totalProfit = winningTrades.reduce((sum, trade) => sum + (trade.profitLoss || 0), 0);
    const totalLoss = Math.abs(losingTrades.reduce((sum, trade) => sum + (trade.profitLoss || 0), 0));
    
    const avgProfit = winningTrades.length > 0 ? totalProfit / winningTrades.length : 0;
    const avgLoss = losingTrades.length > 0 ? totalLoss / losingTrades.length : 0;
    
    const largestWin = winningTrades.length > 0 
      ? Math.max(...winningTrades.map(trade => trade.profitLoss || 0)) 
      : 0;
    
    const largestLoss = losingTrades.length > 0 
      ? Math.abs(Math.min(...losingTrades.map(trade => trade.profitLoss || 0))) 
      : 0;
    
    const tradesWithRR = closedTrades.filter(trade => trade.riskRewardRatio !== undefined);
    const avgRiskRewardRatio = tradesWithRR.length > 0
      ? tradesWithRR.reduce((sum, trade) => sum + (trade.riskRewardRatio || 0), 0) / tradesWithRR.length
      : 0;
    
    return {
      totalTrades: closedTrades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate: closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0,
      totalProfit,
      totalLoss,
      netProfit: totalProfit - totalLoss,
      avgProfit,
      avgLoss,
      profitFactor: totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? totalProfit : 0,
      largestWin,
      largestLoss,
      avgRiskRewardRatio,
    };
  }
  
  async getPerformanceData(userId: number): Promise<PerformanceData> {
    const trades = await this.getTradesByUserId(userId);
    const closedTrades = trades.filter(trade => trade.status === 'CLOSED');
    
    // Performance by Pair
    const pairMap = new Map<string, { trades: number; wins: number; profit: number }>();
    
    closedTrades.forEach(trade => {
      const pair = trade.pair || 'Unknown';
      const isWin = (trade.profitLoss || 0) > 0;
      const profit = trade.profitLoss || 0;
      
      if (!pairMap.has(pair)) {
        pairMap.set(pair, { trades: 0, wins: 0, profit: 0 });
      }
      
      const pairStats = pairMap.get(pair)!;
      pairStats.trades++;
      if (isWin) pairStats.wins++;
      pairStats.profit += profit;
    });
    
    const byPair = Array.from(pairMap.entries()).map(([pair, stats]) => ({
      pair,
      trades: stats.trades,
      winRate: stats.trades > 0 ? (stats.wins / stats.trades) * 100 : 0,
      netProfit: stats.profit,
    }));
    
    // Performance by Strategy
    const strategyMap = new Map<string, { trades: number; wins: number; profit: number }>();
    
    closedTrades.forEach(trade => {
      const strategy = trade.strategy || 'Unknown';
      const isWin = (trade.profitLoss || 0) > 0;
      const profit = trade.profitLoss || 0;
      
      if (!strategyMap.has(strategy)) {
        strategyMap.set(strategy, { trades: 0, wins: 0, profit: 0 });
      }
      
      const strategyStats = strategyMap.get(strategy)!;
      strategyStats.trades++;
      if (isWin) strategyStats.wins++;
      strategyStats.profit += profit;
    });
    
    const byStrategy = Array.from(strategyMap.entries()).map(([strategy, stats]) => ({
      strategy,
      trades: stats.trades,
      winRate: stats.trades > 0 ? (stats.wins / stats.trades) * 100 : 0,
      netProfit: stats.profit,
    }));
    
    // Performance by Emotion
    const emotionMap = new Map<string, { trades: number; wins: number }>();
    
    closedTrades.forEach(trade => {
      const emotion = trade.emotion || 'Unknown';
      const isWin = (trade.profitLoss || 0) > 0;
      
      if (!emotionMap.has(emotion)) {
        emotionMap.set(emotion, { trades: 0, wins: 0 });
      }
      
      const emotionStats = emotionMap.get(emotion)!;
      emotionStats.trades++;
      if (isWin) emotionStats.wins++;
    });
    
    const byEmotion = Array.from(emotionMap.entries()).map(([emotion, stats]) => ({
      emotion,
      trades: stats.trades,
      winRate: stats.trades > 0 ? (stats.wins / stats.trades) * 100 : 0,
    }));
    
    // Performance by Session
    const sessionMap = new Map<string, { trades: number; wins: number }>();
    
    closedTrades.forEach(trade => {
      const session = trade.sessionType || 'Unknown';
      const isWin = (trade.profitLoss || 0) > 0;
      
      if (!sessionMap.has(session)) {
        sessionMap.set(session, { trades: 0, wins: 0 });
      }
      
      const sessionStats = sessionMap.get(session)!;
      sessionStats.trades++;
      if (isWin) sessionStats.wins++;
    });
    
    const bySession = Array.from(sessionMap.entries()).map(([session, stats]) => ({
      session,
      trades: stats.trades,
      winRate: stats.trades > 0 ? (stats.wins / stats.trades) * 100 : 0,
    }));
    
    // Performance by Discipline metrics
    // 1. Followed plan
    const followedPlanYes = closedTrades.filter(trade => trade.followedPlan === true);
    const followedPlanNo = closedTrades.filter(trade => trade.followedPlan === false);
    
    const followedPlanYesWins = followedPlanYes.filter(trade => (trade.profitLoss || 0) > 0).length;
    const followedPlanNoWins = followedPlanNo.filter(trade => (trade.profitLoss || 0) > 0).length;
    
    // 2. Entered early
    const enteredEarlyYes = closedTrades.filter(trade => trade.enteredEarly === true);
    const enteredEarlyNo = closedTrades.filter(trade => trade.enteredEarly === false);
    
    const enteredEarlyYesWins = enteredEarlyYes.filter(trade => (trade.profitLoss || 0) > 0).length;
    const enteredEarlyNoWins = enteredEarlyNo.filter(trade => (trade.profitLoss || 0) > 0).length;
    
    // 3. Revenge trading
    const revengeYes = closedTrades.filter(trade => trade.isRevenge === true);
    const revengeNo = closedTrades.filter(trade => trade.isRevenge === false);
    
    const revengeYesWins = revengeYes.filter(trade => (trade.profitLoss || 0) > 0).length;
    const revengeNoWins = revengeNo.filter(trade => (trade.profitLoss || 0) > 0).length;
    
    return {
      byPair,
      byStrategy,
      byEmotion,
      bySession,
      byDiscipline: {
        followedPlan: {
          yes: followedPlanYes.length,
          no: followedPlanNo.length,
          winRateYes: followedPlanYes.length > 0 ? (followedPlanYesWins / followedPlanYes.length) * 100 : 0,
          winRateNo: followedPlanNo.length > 0 ? (followedPlanNoWins / followedPlanNo.length) * 100 : 0,
        },
        enteredEarly: {
          yes: enteredEarlyYes.length,
          no: enteredEarlyNo.length,
          winRateYes: enteredEarlyYes.length > 0 ? (enteredEarlyYesWins / enteredEarlyYes.length) * 100 : 0,
          winRateNo: enteredEarlyNo.length > 0 ? (enteredEarlyNoWins / enteredEarlyNo.length) * 100 : 0,
        },
        revenge: {
          yes: revengeYes.length,
          no: revengeNo.length,
          winRateYes: revengeYes.length > 0 ? (revengeYesWins / revengeYes.length) * 100 : 0,
          winRateNo: revengeNo.length > 0 ? (revengeNoWins / revengeNo.length) * 100 : 0,
        },
      },
    };
  }
}

export const storage = new MemStorage();