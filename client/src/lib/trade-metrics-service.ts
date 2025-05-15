/**
 * Trade Metrics Service
 * 
 * Dịch vụ tính toán các chỉ số (metrics) cần thiết cho hệ thống thành tựu
 * Dịch vụ này cung cấp các phương thức để tính toán và lưu trữ các giá trị metrics
 * từ dữ liệu giao dịch của người dùng.
 */

import { db } from './firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  query,
  where,
  orderBy,
  getDocs,
  serverTimestamp,
  Timestamp,
  limit
} from 'firebase/firestore';
import { Trade, User } from '@/types';

// Tất cả các loại metrics mà hệ thống theo dõi
export interface TradeMetrics {
  // Thống kê cơ bản
  totalTrades: number;            // Tổng số giao dịch
  winningTrades: number;          // Số giao dịch thắng
  losingTrades: number;           // Số giao dịch thua
  breakEvenTrades: number;        // Số giao dịch hòa vốn
  winRate: number;                // Tỷ lệ thắng

  // Metrics cho thành tựu kỷ luật
  followedPlanTrades: number;     // Số giao dịch tuân theo kế hoạch
  noRevengeTradesStreak: number;  // Số giao dịch liên tiếp không có revenge trading
  notEnteredEarlyStreak: number;  // Số giao dịch liên tiếp không vào lệnh sớm
  notMovedStopLossStreak: number; // Số giao dịch liên tiếp không dịch chuyển SL
  notOverLeveragedDays: number;   // Số ngày liên tiếp không overleverage
  planAdherencePercent: number;   // Phần trăm tuân thủ kế hoạch (0-100)
  perfectPlanDaysStreak: number;  // Số ngày liên tiếp tuân thủ kế hoạch hoàn hảo

  // Metrics cho thành tựu hiệu suất
  winningStreak: number;          // Số giao dịch thắng liên tiếp hiện tại
  longestWinningStreak: number;   // Chuỗi thắng dài nhất
  totalProfitPercent: number;     // Tổng lợi nhuận (% so với balance ban đầu)
  avgRiskRewardRatio: number;     // Tỷ lệ risk-reward trung bình

  // Metrics cho thành tựu nhất quán
  tradesWithNotesStreak: number;  // Số giao dịch liên tiếp có ghi chú
  daysWithTradesStreak: number;   // Số ngày liên tiếp có giao dịch
  weeksWithTradesStreak: number;  // Số tuần liên tiếp có giao dịch

  // Metrics cho thành tựu học tập
  uniquePairsTradedCount: number;              // Số cặp tiền tệ khác nhau đã giao dịch
  uniqueStrategiesCount: number;               // Số chiến lược khác nhau đã sử dụng
  profitableStrategiesCreated: number;         // Số chiến lược có lợi nhuận đã tạo
  perfectEmotionalControlStreak: number;       // Số giao dịch liên tiếp kiểm soát cảm xúc hoàn hảo
  allMarketConditionsProfitable: number;       // Đã giao dịch thành công trong tất cả điều kiện thị trường

  // Thêm các metrics khác nếu cần
  updatedAt: Timestamp | null;    // Thời gian cập nhật gần nhất
}

// Giá trị mặc định cho metrics mới tạo
export const DEFAULT_METRICS: TradeMetrics = {
  totalTrades: 0,
  winningTrades: 0,
  losingTrades: 0,
  breakEvenTrades: 0,
  winRate: 0,

  followedPlanTrades: 0,
  noRevengeTradesStreak: 0,
  notEnteredEarlyStreak: 0,
  notMovedStopLossStreak: 0,
  notOverLeveragedDays: 0,
  planAdherencePercent: 0,
  perfectPlanDaysStreak: 0,

  winningStreak: 0,
  longestWinningStreak: 0,
  totalProfitPercent: 0,
  avgRiskRewardRatio: 0,

  tradesWithNotesStreak: 0,
  daysWithTradesStreak: 0,
  weeksWithTradesStreak: 0,

  uniquePairsTradedCount: 0,
  uniqueStrategiesCount: 0,
  profitableStrategiesCreated: 0,
  perfectEmotionalControlStreak: 0,
  allMarketConditionsProfitable: 0,

  updatedAt: null
};

class TradeMetricsService {
  /**
   * Khởi tạo dữ liệu metrics cho người dùng mới
   * @param userId - ID người dùng Firebase
   */
  async initializeUserMetrics(userId: string): Promise<void> {
    try {
      // Kiểm tra xem đã có metrics chưa
      const metricsRef = doc(db, 'userMetrics', userId);
      const docSnapshot = await getDoc(metricsRef);
      
      // Nếu chưa có, tạo mới với giá trị mặc định
      if (!docSnapshot.exists()) {
        await setDoc(metricsRef, {
          ...DEFAULT_METRICS,
          userId,
          updatedAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error initializing user metrics:', error);
    }
  }
  
  /**
   * Lấy dữ liệu metrics hiện tại của người dùng
   * @param userId - ID người dùng Firebase
   */
  async getUserMetrics(userId: string): Promise<TradeMetrics | null> {
    try {
      // Đảm bảo đã có document metrics
      await this.initializeUserMetrics(userId);
      
      // Lấy dữ liệu metrics
      const metricsRef = doc(db, 'userMetrics', userId);
      const docSnapshot = await getDoc(metricsRef);
      
      if (docSnapshot.exists()) {
        return docSnapshot.data() as TradeMetrics;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching user metrics:', error);
      return null;
    }
  }
  
  /**
   * Cập nhật các metrics cụ thể cho người dùng
   * @param userId - ID người dùng Firebase
   * @param metricsUpdate - Các metrics cần cập nhật
   */
  async updateUserMetrics(
    userId: string, 
    metricsUpdate: Partial<TradeMetrics>
  ): Promise<void> {
    try {
      // Lấy dữ liệu metrics hiện tại
      await this.getUserMetrics(userId);
      
      // Thêm timestamp cập nhật
      const updateData = {
        ...metricsUpdate,
        updatedAt: serverTimestamp()
      };
      
      // Cập nhật vào Firestore
      const metricsRef = doc(db, 'userMetrics', userId);
      await updateDoc(metricsRef, updateData);
    } catch (error) {
      console.error('Error updating user metrics:', error);
    }
  }
  
  /**
   * Đếm các cặp tiền tệ khác nhau đã giao dịch
   */
  async countUniquePairsTraded(userId: string): Promise<number> {
    try {
      const tradesRef = collection(db, 'trades');
      const q = query(tradesRef, where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      
      // Dùng Set để đếm các giá trị duy nhất
      const uniquePairs = new Set<string>();
      
      querySnapshot.forEach((doc) => {
        const trade = doc.data() as Trade;
        if (trade.pair) {
          uniquePairs.add(trade.pair);
        }
      });
      
      return uniquePairs.size;
    } catch (error) {
      console.error('Error counting unique pairs:', error);
      return 0;
    }
  }
  
  /**
   * Đếm các chiến lược khác nhau đã sử dụng
   */
  async countUniqueStrategies(userId: string): Promise<number> {
    try {
      const tradesRef = collection(db, 'trades');
      const q = query(tradesRef, where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      
      // Dùng Set để đếm các giá trị duy nhất
      const uniqueStrategies = new Set<string>();
      
      querySnapshot.forEach((doc) => {
        const trade = doc.data() as Trade;
        if (trade.strategy) {
          uniqueStrategies.add(trade.strategy);
        }
      });
      
      return uniqueStrategies.size;
    } catch (error) {
      console.error('Error counting unique strategies:', error);
      return 0;
    }
  }

  /**
   * Đếm số chiến lược có lợi nhuận đã tạo
   * Chiến lược có lợi nhuận: có ít nhất 3 giao dịch và tỷ lệ thắng > 50%
   */
  async countProfitableStrategies(userId: string): Promise<number> {
    try {
      const tradesRef = collection(db, 'trades');
      const q = query(tradesRef, where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      
      // Nhóm giao dịch theo chiến lược
      const strategiesMap = new Map<string, {
        trades: number;
        wins: number;
      }>();
      
      querySnapshot.forEach((doc) => {
        const trade = doc.data() as Trade;
        if (!trade.strategy) return;
        
        // Lấy hoặc tạo mới entry cho chiến lược này
        const strategyData = strategiesMap.get(trade.strategy) || { trades: 0, wins: 0 };
        
        // Tăng số lượng giao dịch
        strategyData.trades += 1;
        
        // Đếm thắng nếu có lợi nhuận
        if ((trade.pips || 0) > 0) {
          strategyData.wins += 1;
        }
        
        // Cập nhật map
        strategiesMap.set(trade.strategy, strategyData);
      });
      
      // Đếm số chiến lược có lợi nhuận (ít nhất 3 giao dịch và tỷ lệ thắng > 50%)
      let profitableCount = 0;
      
      strategiesMap.forEach((data) => {
        if (data.trades >= 3) {
          const winRate = (data.wins / data.trades) * 100;
          if (winRate > 50) {
            profitableCount += 1;
          }
        }
      });
      
      return profitableCount;
    } catch (error) {
      console.error('Error counting profitable strategies:', error);
      return 0;
    }
  }
  
  /**
   * Tính toán chuỗi giao dịch không có revenge trading
   */
  async calculateNoRevengeTradesStreak(userId: string): Promise<number> {
    try {
      const tradesRef = collection(db, 'trades');
      const q = query(
        tradesRef, 
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(50) // Giới hạn số lượng giao dịch kiểm tra để tối ưu hiệu suất
      );
      
      const querySnapshot = await getDocs(q);
      let streak = 0;
      
      // Đếm số giao dịch liên tiếp không có revenge trading
      for (const doc of querySnapshot.docs) {
        const trade = doc.data() as Trade;
        
        // Nếu không có dữ liệu discipline, bỏ qua
        if (!trade.discipline) break;
        
        // Nếu có revenge trading, dừng đếm
        if (trade.discipline.revenge) {
          break;
        }
        
        streak += 1;
      }
      
      return streak;
    } catch (error) {
      console.error('Error calculating no revenge trades streak:', error);
      return 0;
    }
  }
  
  /**
   * Tính toán chuỗi giao dịch không vào lệnh sớm
   */
  async calculateNotEnteredEarlyStreak(userId: string): Promise<number> {
    try {
      const tradesRef = collection(db, 'trades');
      const q = query(
        tradesRef, 
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      
      const querySnapshot = await getDocs(q);
      let streak = 0;
      
      for (const doc of querySnapshot.docs) {
        const trade = doc.data() as Trade;
        
        if (!trade.discipline) break;
        
        if (trade.discipline.enteredEarly) {
          break;
        }
        
        streak += 1;
      }
      
      return streak;
    } catch (error) {
      console.error('Error calculating not entered early streak:', error);
      return 0;
    }
  }
  
  /**
   * Tính toán chuỗi giao dịch không dịch chuyển stop loss
   */
  async calculateNotMovedStopLossStreak(userId: string): Promise<number> {
    try {
      const tradesRef = collection(db, 'trades');
      const q = query(
        tradesRef, 
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      
      const querySnapshot = await getDocs(q);
      let streak = 0;
      
      for (const doc of querySnapshot.docs) {
        const trade = doc.data() as Trade;
        
        if (!trade.discipline) break;
        
        if (trade.discipline.movedStopLoss) {
          break;
        }
        
        streak += 1;
      }
      
      return streak;
    } catch (error) {
      console.error('Error calculating not moved stop loss streak:', error);
      return 0;
    }
  }
  
  /**
   * Tính toán chuỗi giao dịch thắng liên tiếp
   */
  async calculateWinningStreak(userId: string): Promise<{current: number, longest: number}> {
    try {
      const tradesRef = collection(db, 'trades');
      const q = query(
        tradesRef, 
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      let currentStreak = 0;
      let longestStreak = 0;
      let tempStreak = 0;
      
      // Tính chuỗi thắng hiện tại (từ giao dịch gần nhất)
      for (const doc of querySnapshot.docs) {
        const trade = doc.data() as Trade;
        
        // Bỏ qua giao dịch chưa đóng
        if (trade.isOpen || !trade.closeDate) continue;
        
        // Giao dịch thắng nếu pips > 0
        if ((trade.pips || 0) > 0) {
          currentStreak += 1;
        } else {
          break;
        }
      }
      
      // Tính chuỗi thắng dài nhất từ trước đến nay
      // Reset querySnapshot để đọc lại từ đầu
      for (const doc of querySnapshot.docs) {
        const trade = doc.data() as Trade;
        
        // Bỏ qua giao dịch chưa đóng
        if (trade.isOpen || !trade.closeDate) continue;
        
        if ((trade.pips || 0) > 0) {
          tempStreak += 1;
        } else {
          // Cập nhật chuỗi dài nhất nếu tempStreak lớn hơn
          if (tempStreak > longestStreak) {
            longestStreak = tempStreak;
          }
          
          // Reset tempStreak
          tempStreak = 0;
        }
      }
      
      // Kiểm tra lần cuối nếu tempStreak > longestStreak
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }
      
      return { current: currentStreak, longest: longestStreak };
    } catch (error) {
      console.error('Error calculating winning streak:', error);
      return { current: 0, longest: 0 };
    }
  }
  
  /**
   * Tính toán tỷ lệ tuân thủ kế hoạch
   */
  async calculatePlanAdherence(userId: string): Promise<{adherencePercent: number, minTrades: boolean}> {
    try {
      const tradesRef = collection(db, 'trades');
      const q = query(tradesRef, where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      
      let totalTrades = 0;
      let followedPlanCount = 0;
      
      querySnapshot.forEach((doc) => {
        const trade = doc.data() as Trade;
        
        // Chỉ tính giao dịch đã đóng
        if (trade.isOpen || !trade.closeDate) return;
        
        totalTrades += 1;
        
        if (trade.discipline && trade.discipline.followedPlan) {
          followedPlanCount += 1;
        }
      });
      
      const adherencePercent = totalTrades === 0 ? 0 : (followedPlanCount / totalTrades) * 100;
      const minTrades = totalTrades >= 50; // Có ít nhất 50 giao dịch
      
      return { adherencePercent, minTrades };
    } catch (error) {
      console.error('Error calculating plan adherence:', error);
      return { adherencePercent: 0, minTrades: false };
    }
  }
  
  /**
   * Tính toán tổng lợi nhuận theo phần trăm so với balance ban đầu
   */
  async calculateTotalProfitPercentage(userId: string): Promise<number> {
    try {
      // Lấy thông tin người dùng
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        return 0;
      }
      
      const userData = userDoc.data() as User;
      
      // Nếu không có initialBalance, không thể tính phần trăm
      if (!userData.initialBalance || userData.initialBalance === 0) {
        return 0;
      }
      
      // Tính lợi nhuận
      const netProfit = userData.currentBalance - userData.initialBalance;
      
      // Tính phần trăm
      return (netProfit / userData.initialBalance) * 100;
    } catch (error) {
      console.error('Error calculating total profit percentage:', error);
      return 0;
    }
  }
  
  /**
   * Tính toán số giao dịch có ghi chú liên tiếp
   */
  async calculateTradesWithNotesStreak(userId: string): Promise<number> {
    try {
      const tradesRef = collection(db, 'trades');
      const q = query(
        tradesRef, 
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      
      const querySnapshot = await getDocs(q);
      let streak = 0;
      
      for (const doc of querySnapshot.docs) {
        const trade = doc.data() as Trade;
        
        if (!trade.notes || trade.notes.trim() === '') {
          break;
        }
        
        streak += 1;
      }
      
      return streak;
    } catch (error) {
      console.error('Error calculating trades with notes streak:', error);
      return 0;
    }
  }
  
  /**
   * Tính toán kiểm soát cảm xúc hoàn hảo liên tiếp
   * Kiểm soát cảm xúc hoàn hảo = không revenge + không overleverage + không vào lệnh sớm + không dịch chuyển SL
   */
  async calculatePerfectEmotionalControlStreak(userId: string): Promise<number> {
    try {
      const tradesRef = collection(db, 'trades');
      const q = query(
        tradesRef, 
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(100) // Kiểm tra nhiều hơn vì thành tựu này yêu cầu 100 giao dịch
      );
      
      const querySnapshot = await getDocs(q);
      let streak = 0;
      
      for (const doc of querySnapshot.docs) {
        const trade = doc.data() as Trade;
        
        if (!trade.discipline) break;
        
        // Kiểm tra tất cả các yếu tố kiểm soát cảm xúc
        const isPerfect = 
          !trade.discipline.revenge && 
          !trade.discipline.overLeveraged && 
          !trade.discipline.enteredEarly && 
          !trade.discipline.movedStopLoss;
        
        if (!isPerfect) {
          break;
        }
        
        streak += 1;
      }
      
      return streak;
    } catch (error) {
      console.error('Error calculating perfect emotional control streak:', error);
      return 0;
    }
  }
  
  /**
   * Kiểm tra nếu đã giao dịch thành công trong tất cả điều kiện thị trường
   * Điều kiện: có giao dịch thắng trong mỗi loại market condition
   */
  async checkAllMarketConditionsProfitable(userId: string): Promise<boolean> {
    try {
      const tradesRef = collection(db, 'trades');
      const q = query(tradesRef, where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      
      // Định nghĩa các loại điều kiện thị trường
      const marketConditions = [
        'uptrend',
        'downtrend',
        'ranging',
        'volatile',
        'breakout'
      ];
      
      // Map để theo dõi các điều kiện đã có giao dịch thắng
      const successfulConditions = new Map<string, boolean>();
      
      // Khởi tạo tất cả điều kiện là false
      marketConditions.forEach(condition => {
        successfulConditions.set(condition.toLowerCase(), false);
      });
      
      // Kiểm tra từng giao dịch
      querySnapshot.forEach((doc) => {
        const trade = doc.data() as Trade;
        
        // Bỏ qua giao dịch chưa đóng hoặc không có market condition
        if (trade.isOpen || !trade.closeDate || !trade.marketCondition) return;
        
        // Nếu là giao dịch thắng, đánh dấu điều kiện thị trường là thành công
        if ((trade.pips || 0) > 0) {
          const condition = trade.marketCondition.toLowerCase();
          successfulConditions.set(condition, true);
        }
      });
      
      // Kiểm tra xem tất cả điều kiện đã có giao dịch thắng chưa
      let allSuccessful = true;
      
      marketConditions.forEach(condition => {
        if (!successfulConditions.get(condition.toLowerCase())) {
          allSuccessful = false;
        }
      });
      
      return allSuccessful;
    } catch (error) {
      console.error('Error checking all market conditions profitable:', error);
      return false;
    }
  }
  
  /**
   * Tính toán tất cả các metrics và cập nhật vào Firestore
   * Gọi hàm này khi có thay đổi giao dịch để đảm bảo metrics luôn được cập nhật
   */
  async calculateAndUpdateAllMetrics(userId: string): Promise<TradeMetrics | null> {
    try {
      // Đảm bảo đã có document metrics
      await this.initializeUserMetrics(userId);
      
      // Tính toán các metrics riêng lẻ
      const uniquePairsCount = await this.countUniquePairsTraded(userId);
      const uniqueStrategiesCount = await this.countUniqueStrategies(userId);
      const profitableStrategiesCount = await this.countProfitableStrategies(userId);
      const noRevengeStreak = await this.calculateNoRevengeTradesStreak(userId);
      const notEnteredEarlyStreak = await this.calculateNotEnteredEarlyStreak(userId);
      const notMovedStopLossStreak = await this.calculateNotMovedStopLossStreak(userId);
      const { current: winningStreak, longest: longestWinningStreak } = await this.calculateWinningStreak(userId);
      const { adherencePercent, minTrades } = await this.calculatePlanAdherence(userId);
      const totalProfitPercent = await this.calculateTotalProfitPercentage(userId);
      const tradesWithNotesStreak = await this.calculateTradesWithNotesStreak(userId);
      const perfectEmotionalControlStreak = await this.calculatePerfectEmotionalControlStreak(userId);
      const allMarketConditionsProfitable = await this.checkAllMarketConditionsProfitable(userId);
      
      // Tạo object cập nhật metrics
      const metricsUpdate: Partial<TradeMetrics> = {
        uniquePairsTradedCount: uniquePairsCount,
        uniqueStrategiesCount: uniqueStrategiesCount,
        profitableStrategiesCreated: profitableStrategiesCount,
        noRevengeTradesStreak: noRevengeStreak,
        notEnteredEarlyStreak: notEnteredEarlyStreak,
        notMovedStopLossStreak: notMovedStopLossStreak,
        winningStreak: winningStreak,
        longestWinningStreak: longestWinningStreak,
        planAdherencePercent: adherencePercent,
        totalProfitPercent: totalProfitPercent,
        tradesWithNotesStreak: tradesWithNotesStreak,
        perfectEmotionalControlStreak: perfectEmotionalControlStreak,
        allMarketConditionsProfitable: allMarketConditionsProfitable ? 1 : 0
      };
      
      // Cập nhật vào Firestore
      await this.updateUserMetrics(userId, metricsUpdate);
      
      // Trả về metrics đã cập nhật
      return await this.getUserMetrics(userId);
    } catch (error) {
      console.error('Error calculating and updating all metrics:', error);
      return null;
    }
  }
}

export const tradeMetricsService = new TradeMetricsService();

// Export các hàm tiện ích
export const getUserMetrics = (userId: string) => tradeMetricsService.getUserMetrics(userId);
export const calculateAndUpdateAllMetrics = (userId: string) => tradeMetricsService.calculateAndUpdateAllMetrics(userId);