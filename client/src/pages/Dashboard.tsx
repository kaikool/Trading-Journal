import { useMemo, Suspense } from "react";
import { format } from "date-fns";

import { useUserDataQuery } from "@/hooks/use-user-data-query";
import { useTradesQuery } from "@/hooks/use-trades-query";
import { debug } from "@/lib/debug";
import { 
  hasClosedTrades, 
  getClosedTrades, 
  calculateCurrentBalance,
  calculatePnL
} from "@/lib/balance-calculation-rules";
import { 
  calculateWinRate, 
  calculateProfitFactor,
  calculateAverageRiskRewardRatio
} from "@/lib/forex-calculator";



// Import UI components

// Import regular components
import { 
  AccountSummaryCard, 
  TradingStatsCard 
} from "@/components/dashboard";

// Import lazy-loaded components with Suspense
import { 
  LazyPerformanceChart, 
  LazyRecentTradesCard,
  AppSkeleton, 
  SkeletonLevel 
} from "@/components/dynamic";

// Define types
interface DataPoint {
  date: string;
  balance: number;
  formattedDate: string;
}

export default function Dashboard() {
  // Sử dụng React Query hooks thay vì useDataCache
  const { userData } = useUserDataQuery();
  const { trades } = useTradesQuery();

  
  // Logs only in development environment - using debug utility
  const devLog = (message: string, data?: any) => {
    // debug() already checks for environment
    debug(message, data);
  };
  
  // Performance data calculation - memoized directly
  const performanceData = useMemo((): DataPoint[] => {
    // Đã loại bỏ log không cần thiết gây ghi log trùng lặp
    
    // Make sure userData is loaded to avoid flickering with default balance
    if (!userData) {
      return []; // Return empty array to show loading state instead of default balance
    }
    
    // Use initialBalance from userData only when it's available
    const initialBalance = userData.initialBalance;
    
    // If no trades, show just the initial balance point
    if (!trades.length) {
      devLog("[Dashboard] No trades available, showing only initial balance");
      return [{
        date: new Date().toISOString(),
        balance: initialBalance,
        formattedDate: format(new Date(), 'MMM dd')
      }];
    }
    
    // Filter and sort trades
    const sortedTrades = [...trades]
      .filter(trade => trade.status !== "OPEN" && trade.profitLoss !== undefined)
      .sort((a, b) => {
        // Xử lý an toàn khi so sánh các timestamp
        let timeA = 0;
        let timeB = 0;
        
        // Trích xuất thời gian từ a.createdAt
        if (a.createdAt) {
          if (typeof a.createdAt === 'object' && 'seconds' in a.createdAt) {
            timeA = a.createdAt.seconds * 1000;
          } else if (a.createdAt instanceof Date) {
            timeA = a.createdAt.getTime();
          } else if (typeof a.createdAt === 'number') {
            timeA = a.createdAt;
          }
        }
        
        // Trích xuất thời gian từ b.createdAt
        if (b.createdAt) {
          if (typeof b.createdAt === 'object' && 'seconds' in b.createdAt) {
            timeB = b.createdAt.seconds * 1000;
          } else if (b.createdAt instanceof Date) {
            timeB = b.createdAt.getTime();
          } else if (typeof b.createdAt === 'number') {
            timeB = b.createdAt;
          }
        }
        
        return timeA - timeB;
      });
    
    // Đã loại bỏ devlog để cải thiện hiệu suất
    
    if (sortedTrades.length === 0) {
      // Không có giao dịch đã đóng
      return [{
        date: new Date().toISOString(),
        balance: initialBalance,
        formattedDate: format(new Date(), 'MMM dd')
      }];
    }
    
    // Get valid date - handle with extra safety
    let firstTradeDate;
    try {
      // Check Firebase Timestamp format with seconds/nanoseconds
      if (sortedTrades[0].createdAt && 
          typeof sortedTrades[0].createdAt === 'object' && 
          'seconds' in sortedTrades[0].createdAt &&
          sortedTrades[0].createdAt.seconds !== null) {
        // Convert Firebase Timestamp manually
        firstTradeDate = new Date(sortedTrades[0].createdAt.seconds * 1000);
      }
      // Check if it's a Firestore timestamp with toDate method
      else if (sortedTrades[0].createdAt && 
               typeof sortedTrades[0].createdAt === 'object' && 
               sortedTrades[0].createdAt.toDate) {
        firstTradeDate = sortedTrades[0].createdAt.toDate();
      } 
      // Handle string or number timestamp
      else if (typeof sortedTrades[0].createdAt === 'string' || typeof sortedTrades[0].createdAt === 'number') {
        firstTradeDate = new Date(sortedTrades[0].createdAt);
      }
      // If it's already a Date object
      else if (sortedTrades[0].createdAt instanceof Date) {
        firstTradeDate = sortedTrades[0].createdAt;
      }
      // Fallback
      else {
        firstTradeDate = new Date();
      }
    } catch {
      firstTradeDate = new Date(); // Fallback
    }
      
    // Create performance data points
    const performanceData: DataPoint[] = [{
      date: firstTradeDate.toISOString(),
      balance: initialBalance,
      formattedDate: format(firstTradeDate, 'MMM dd')
    }];
    
    let runningBalance = initialBalance;
    
    sortedTrades.forEach(trade => {
      if (trade.profitLoss) {
        runningBalance += trade.profitLoss;
        
        // Capture any exceptions from date parsing
        let tradeDate;
        try {
          // Handle Firebase Timestamp format with seconds/nanoseconds (JSON serialized)
          if (trade.createdAt && 
              typeof trade.createdAt === 'object' && 
              'seconds' in trade.createdAt &&
              trade.createdAt.seconds !== null) {
            // Convert Firebase Timestamp manually
            tradeDate = new Date(trade.createdAt.seconds * 1000);
          }
          // Handle dates with multiple checks
          else if (trade.createdAt && typeof trade.createdAt === 'object' && 'toDate' in trade.createdAt) {
            tradeDate = trade.createdAt.toDate();
          } 
          else if (trade.createdAt instanceof Date) {
            tradeDate = trade.createdAt;
          }
          else if (typeof trade.createdAt === 'string' || typeof trade.createdAt === 'number') {
            tradeDate = new Date(trade.createdAt);
          }
          else {
            // Fallback to current date
            tradeDate = new Date();
          }
          
          // Validate date before using
          if (isNaN(tradeDate.getTime())) {
            tradeDate = new Date(); // Fallback to current date
          }
        } catch {
          tradeDate = new Date(); // Fallback to current date
        }
          
        performanceData.push({
          date: tradeDate.toISOString(),
          balance: runningBalance,
          formattedDate: format(tradeDate, 'MMM dd')
        });
      }
    });
    
    devLog("[Dashboard] Generated performance data points:", performanceData.length);
    
    return performanceData;
  }, [trades, userData]);
  
  // Trading stats calculation - memoized directly
  const tradingStats = useMemo(() => {
    if (!trades.length) {
      return {
        totalTrades: 0,
        winRate: 0,
        profitFactor: 0,
        avgRiskRewardRatio: 0
      };
    }
    
    // Lọc chỉ lấy giao dịch đã đóng sử dụng cùng điều kiện với hasClosedTrades
    const closedTrades = trades.filter(trade => {
      // Phải có giá đóng và ngày đóng
      if (!trade.exitPrice || !trade.closeDate) return false;
      
      // Trạng thái phải đóng (không phải OPEN, hoặc isOpen = false)
      if (trade.status === "OPEN") return false;
      if ('isOpen' in trade && trade.isOpen === true) return false;
      
      return true;
    });
    
    // Log for debugging, only in development
    devLog("Dashboard trading stats calculation:", {
      allTrades: trades.length,
      closedTrades: closedTrades.length,
      openTrades: trades.length - closedTrades.length,
    });
    
    const totalTrades = closedTrades.length;
    
    if (totalTrades === 0) {
      return {
        totalTrades: 0,
        winRate: 0,
        profitFactor: 0,
        avgRiskRewardRatio: 0
      };
    }
    
    // Sử dụng hàm tính win rate từ forex-calculator
    const winRate = calculateWinRate(closedTrades);
    
    // Phân loại các loại giao dịch để tính toán thêm (sử dụng kết quả từ calculateWinRate)
    const trueWinningTrades = closedTrades.filter(trade => (trade.pips || 0) > 0);
    const trueLosingTrades = closedTrades.filter(trade => (trade.pips || 0) < 0);
    const trueBreakEvenTrades = closedTrades.filter(trade => (trade.pips || 0) === 0);
    
    // Log kết quả phân loại lệnh
    devLog("Dashboard trading stats by PIP:", {
      winning: trueWinningTrades.length,
      losing: trueLosingTrades.length,
      breakEven: trueBreakEvenTrades.length,
      total: closedTrades.length
    });
    
    // Tạo mảng debugging theo quy tắc phân loại từ forex-calculator
    // Dựa vào pips > 0 = WIN, pips < 0 = LOSS, pips = 0 = BE
    const debugTrades = closedTrades.map(trade => {
      const pips = trade.pips || 0;
      const profitLoss = trade.profitLoss || 0;
      let category;
      
      // Áp dụng quy tắc phân loại từ forex-calculator
      if (pips === 0) {
        category = "BE";
      } else if (pips > 0) {
        category = "WIN"; 
      } else {
        category = "LOSS";
      }
      
      return {
        id: trade.id,
        direction: trade.direction,
        pips,
        profitLoss,
        category
      };
    });
    
    // Log debug info
    devLog("DEBUG TRADES CALCULATION:", debugTrades);
    
    // Sử dụng hàm tính Profit Factor từ forex-calculator
    const profitFactor = calculateProfitFactor(closedTrades);
    
    // Sử dụng hàm tính Average Risk/Reward Ratio từ forex-calculator
    const avgRiskRewardRatio = calculateAverageRiskRewardRatio(closedTrades);
    
    // Log chi tiết về lợi nhuận/lỗ để phân tích (vẫn giữ lại để debug)
    devLog("Chi tiết profit/loss:", {
      tradesWithProfit: closedTrades.filter(t => (t.profitLoss || 0) > 0).length,
      tradesWithLoss: closedTrades.filter(t => (t.profitLoss || 0) < 0).length,
      tradesWithBreakEven: closedTrades.filter(t => (t.profitLoss || 0) === 0).length,
      individualProfits: closedTrades
        .filter(t => (t.pips || 0) > 0)
        .map(t => ({
          id: t.id,
          pair: t.pair,
          direction: t.direction,
          pips: t.pips,
          profitLoss: t.profitLoss
        })),
      individualLosses: closedTrades
        .filter(t => (t.pips || 0) < 0)
        .map(t => ({
          id: t.id,
          pair: t.pair,
          direction: t.direction,
          pips: t.pips,
          profitLoss: t.profitLoss
        }))
    });
    
    return {
      totalTrades,
      winRate,
      profitFactor,
      avgRiskRewardRatio
    };
  }, [trades]);
  
  /**
   * IMPORTANT: Quy tắc tính toán số dư tài khoản
   * 
   * 1. Khi chưa có giao dịch:
   *    - Current Balance = Initial Balance
   *    - KHÔNG hiển thị P&L và phần trăm lãi/lỗ
   *    - Hiển thị "No trade history yet" thay vì P&L
   * 
   * 2. Khi đã có giao dịch:
   *    - Current Balance = Initial Balance + Tổng P&L của tất cả giao dịch đã đóng
   *    - P&L = Current Balance - Initial Balance
   *    - P&L Percentage = (P&L / Initial Balance) * 100
   * 
   * 3. Khi thay đổi Initial Balance:
   *    - Nếu chưa có giao dịch, Current Balance = Initial Balance mới
   *    - Nếu đã có giao dịch, Current Balance = Initial Balance mới + Tổng P&L
   */
  
  // Tính toán balance từ trades
  const balanceData = useMemo(() => {
    // Không tính toán nếu userData chưa được load
    if (!userData) {
      return {
        initialBalance: 0,
        currentBalance: 0,
        profitLoss: 0,
        profitLossPercentage: 0,
        hasTrades: false
      };
    }
    
    // Lấy initialBalance từ userData - đảm bảo userData đã tồn tại
    const initialBalance = userData.initialBalance;
    
    // Kiểm tra xem có giao dịch đã đóng nào không
    const hasTrades = hasClosedTrades(trades);
    
    // Tính toán current balance từ initial balance và trades
    const currentBalance = calculateCurrentBalance(initialBalance, trades);
    
    // Tính P&L từ balance
    const pnlData = calculatePnL(initialBalance, currentBalance, trades);
    
    return {
      initialBalance,
      currentBalance,
      profitLoss: pnlData.profitLoss,
      profitLossPercentage: pnlData.profitLossPercentage,
      hasTrades
    };
  }, [trades, userData]);
  
  // Lấy giá trị từ memoized object
  const { initialBalance, currentBalance, profitLoss, profitLossPercentage, hasTrades } = balanceData;

  // Lấy giá trị totalProfit và totalLoss từ forex-calculator để sử dụng trong TradingStatsCard
  const statsValues = useMemo(() => {
    if (!trades.length) return { totalProfit: 0, totalLoss: 0 };
    
    const closedTrades = getClosedTrades(trades);
    
    // Tính tổng lợi nhuận từ các giao dịch thắng (pip > 0)
    const totalProfit = closedTrades
      .filter(t => (t.pips || 0) > 0)
      .reduce((sum, t) => sum + Math.abs(t.profitLoss || 0), 0);
    
    // Tính tổng thua lỗ từ các giao dịch thua (pip < 0)
    const totalLoss = closedTrades
      .filter(t => (t.pips || 0) < 0)
      .reduce((sum, t) => sum + Math.abs(t.profitLoss || 0), 0);
    
    return { totalProfit, totalLoss };
  }, [trades]);
  
  return (
    <div className="max-w-7xl mx-auto px-0 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col mb-4">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-primary via-primary/90 to-primary/70 bg-clip-text text-transparent">
          Trading Dashboard
        </h1>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          View your trading activity and performance metrics
        </p>
      </div>
      
      {/* Main content layout */}
      <div className="grid grid-cols-1 gap-6">
        {/* First row: Account Summary */}
        {userData ? (
          <AccountSummaryCard
            currentBalance={currentBalance}
            initialBalance={initialBalance}
            profitLoss={profitLoss}
            profitLossPercentage={profitLossPercentage}
            isLoading={false} // Không cần hiện loading vì đã có userData
            hasTrades={hasTrades}
          />
        ) : (
          <AppSkeleton 
            level={SkeletonLevel.STATS} 
            height={160}
            customProps={{ showProgress: true, showFooterText: true }} 
          />
        )}
        
        {/* Second row: Trading Stats */}
        {userData ? (
          <TradingStatsCard
            totalTrades={tradingStats.totalTrades}
            winRate={tradingStats.winRate}
            profitFactor={tradingStats.profitFactor}
            avgRiskRewardRatio={tradingStats.avgRiskRewardRatio}
            isLoading={false} // Không cần hiện loading vì đã có userData
            totalProfit={statsValues.totalProfit}
            totalLoss={statsValues.totalLoss}
          />
        ) : (
          <AppSkeleton 
            level={SkeletonLevel.STATS} 
            height={160}
            className="p-4"
          />
        )}
        
        {/* Third row: Performance Chart - Lazy loaded */}
        <div className="suspense-boundary">
          <Suspense fallback={<AppSkeleton level={SkeletonLevel.CHART} />}>
            {userData ? (
              <LazyPerformanceChart 
                data={performanceData}
                isLoading={false} // Không cần hiện loading vì đã có userData
              />
            ) : (
              <AppSkeleton level={SkeletonLevel.CHART} />
            )}
          </Suspense>
        </div>
        
        {/* Fourth row: Recent Trades - Lazy loaded */}
        <div className="suspense-boundary">
          <Suspense fallback={<AppSkeleton level={SkeletonLevel.LIST} />}>
            {userData ? (
              <LazyRecentTradesCard 
                trades={trades.slice(0, 5)}
                isLoading={false} // Không cần hiện loading vì đã có dữ liệu
              />
            ) : (
              <AppSkeleton level={SkeletonLevel.LIST} height={400} />
            )}
          </Suspense>
        </div>
      </div>
    </div>
  );
}