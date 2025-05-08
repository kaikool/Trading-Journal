import { useMemo, lazy, Suspense } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Icons } from "@/components/icons/icons";
import { useToast } from "@/hooks/use-toast";
import { useDataCache } from "@/contexts/DataCacheContext";
import { hasClosedTrades, getClosedTrades, calculateCurrentBalance, calculatePnL } from "@/lib/balance-calculation-rules";
import { UI_CONFIG, DASHBOARD_CONFIG } from "@/lib/config";
import { calculateWinRate } from "@/lib/forex-calculator"; // Import hàm tính toán tỷ lệ thắng
import { LoadingFallback } from "@/components/dynamic/LoadingFallback";
import { debug, logError } from "@/lib/debug";

// Áp dụng lazy loading cho các tab components
const OverviewTab = lazy(() => import("@/components/analytics/OverviewTab"));
const StrategyTab = lazy(() => import("@/components/analytics/StrategyTab"));
const DisciplineTab = lazy(() => import("@/components/analytics/DisciplineTab"));
const EmotionTab = lazy(() => import("@/components/analytics/EmotionTab"));
const AdvancedTab = lazy(() => import("@/components/analytics/AdvancedTab"));

// Thêm khai báo cho window
declare global {
  interface Window {
    balanceLogged: boolean;
  }
}



export default function Analytics() {
  // Sử dụng DataCache thay vì local state
  const { trades, userData, isLoading, userId } = useDataCache();
  const { toast } = useToast();

  // Logs only in development environment using debug utility
  const devLog = (message: string, data?: any) => {
    // debug() already checks for environment
    debug(message, data);
  };

  // Aggregate analytics data - optimized version with memoization
  const analyticsData = useMemo(() => {
    // Lọc trades đã đóng sử dụng hàm helper từ balance-calculation-rules
    const closedTrades = getClosedTrades(trades);
    
    if (closedTrades.length === 0) {
      // Không tính toán nếu userData chưa được load
      if (!userData) {
        devLog("[Analytics] userData not available, returning empty analytics data");
        return {
          totalTrades: 0,
          winningTrades: 0,
          losingTrades: 0,
          winRate: 0,
          netProfit: 0,
          initialBalance: 0,
          currentBalance: 0,
          pairPerformance: [],
          strategyPerformance: [],
          emotionPerformance: [],
          disciplineMetrics: {
            followedPlan: { yes: 0, no: 0, winRateYes: 0, winRateNo: 0 },
            enteredEarly: { yes: 0, no: 0, winRateYes: 0, winRateNo: 0 },
            revenge: { yes: 0, no: 0, winRateYes: 0, winRateNo: 0 }
          },
          trades: []
        };
      }
      
      // Lấy initial balance từ userData khi đã có userData
      const initialBalance = userData.initialBalance;
      devLog("[Analytics] No closed trades, using initial balance:", initialBalance);
      
      return {
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        winRate: 0,
        netProfit: 0,
        initialBalance: initialBalance,
        currentBalance: initialBalance,
        pairPerformance: [],
        strategyPerformance: [],
        emotionPerformance: [],
        disciplineMetrics: {
          followedPlan: { yes: 0, no: 0, winRateYes: 0, winRateNo: 0 },
          enteredEarly: { yes: 0, no: 0, winRateYes: 0, winRateNo: 0 },
          revenge: { yes: 0, no: 0, winRateYes: 0, winRateNo: 0 }
        },
        trades: []
      };
    }
    
    // Tối ưu bước 2: Phân tích tất cả dữ liệu trong một lần duyệt qua mảng
    const pairData: Record<string, any> = {};
    const strategyData: Record<string, any> = {};
    const emotionData: Record<string, any> = {};
    
    let winningTradesCount = 0;
    let netProfit = 0;
    
    // Đếm cho các discipline metrics
    const disciplineCounters = {
      followedPlan: { yes: 0, no: 0, yesWins: 0, noWins: 0 },
      enteredEarly: { yes: 0, no: 0, yesWins: 0, noWins: 0 },
      revenge: { yes: 0, no: 0, yesWins: 0, noWins: 0 }
    };
    
    // Duyệt qua mỗi giao dịch chỉ một lần
    closedTrades.forEach(trade => {
      const profitLoss = trade.profitLoss || 0;
      const pips = trade.pips || 0;
      // Đúng theo forex-calculator.ts: pip > 0 = win, pip < 0 = loss, pip = 0 = break even
      const isWin = pips > 0;
      const isLoss = pips < 0;
      const isBreakEven = pips === 0;
      
      // Tính tổng lợi nhuận
      netProfit += profitLoss;
      
      // Phân tích theo cặp tiền - sử dụng pip theo forex-calculator.ts
      const pair = trade.pair;
      if (!pairData[pair]) {
        pairData[pair] = { pair, trades: 0, wins: 0, losses: 0, breakEven: 0, netProfit: 0 };
      }
      pairData[pair].trades++;
      // Công thức từ forex-calculator.ts: pip > 0 là thắng, pip < 0 là thua, pip = 0 là hòa
      if (pips > 0) pairData[pair].wins++;
      else if (pips < 0) pairData[pair].losses++;
      else if (pips === 0) pairData[pair].breakEven = (pairData[pair].breakEven || 0) + 1;
      pairData[pair].netProfit += profitLoss;
      
      // Phân tích theo chiến lược - sử dụng pip theo forex-calculator.ts
      const strategy = trade.strategy || 'Unknown';
      if (!strategyData[strategy]) {
        strategyData[strategy] = { strategy, trades: 0, wins: 0, losses: 0, breakEven: 0, netProfit: 0 };
      }
      strategyData[strategy].trades++;
      // Công thức từ forex-calculator.ts: pip > 0 là thắng, pip < 0 là thua, pip = 0 là hòa
      if (pips > 0) strategyData[strategy].wins++;
      else if (pips < 0) strategyData[strategy].losses++;
      else if (pips === 0) strategyData[strategy].breakEven = (strategyData[strategy].breakEven || 0) + 1;
      strategyData[strategy].netProfit += profitLoss;
      
      // Phân tích theo cảm xúc - sử dụng pip theo forex-calculator.ts
      const emotion = trade.emotion || 'Neutral';
      if (!emotionData[emotion]) {
        emotionData[emotion] = { emotion, trades: 0, wins: 0, losses: 0, breakEven: 0 };
      }
      emotionData[emotion].trades++;
      // Công thức từ forex-calculator.ts: pip > 0 là thắng, pip < 0 là thua, pip = 0 là hòa
      if (pips > 0) emotionData[emotion].wins++;
      else if (pips < 0) emotionData[emotion].losses++;
      else if (pips === 0) emotionData[emotion].breakEven = (emotionData[emotion].breakEven || 0) + 1;
      
      // Phân tích kỷ luật sử dụng pip > 0 để xác định thắng/thua
      // 1. Followed Plan
      if (trade.followedPlan) {
        disciplineCounters.followedPlan.yes++;
        if (pips > 0) disciplineCounters.followedPlan.yesWins++;
      } else {
        disciplineCounters.followedPlan.no++;
        if (pips > 0) disciplineCounters.followedPlan.noWins++;
      }
      
      // 2. Entered Early
      if (trade.enteredEarly) {
        disciplineCounters.enteredEarly.yes++;
        if (pips > 0) disciplineCounters.enteredEarly.yesWins++;
      } else {
        disciplineCounters.enteredEarly.no++;
        if (pips > 0) disciplineCounters.enteredEarly.noWins++;
      }
      
      // 3. Revenge Trading
      if (trade.revenge) {
        disciplineCounters.revenge.yes++;
        if (pips > 0) disciplineCounters.revenge.yesWins++;
      } else {
        disciplineCounters.revenge.no++;
        if (pips > 0) disciplineCounters.revenge.noWins++;
      }
    });
    
    // Chuẩn bị dữ liệu cho các biểu đồ, sử dụng phương pháp tính win rate trừ bỏ break even trades
    // để đảm bảo tính nhất quán với các công thức khác
    const pairPerformance = Object.values(pairData).map(data => {
      // Tạo mảng trades tạm thời để tính toán theo cách chuẩn
      const tempTrades = [
        ...Array(data.wins).fill({ pips: 1 }),        // Trades thắng (pip > 0)
        ...Array(data.losses).fill({ pips: -1 }),     // Trades thua (pip < 0)
        ...Array(data.breakEven || 0).fill({ pips: 0 }) // Trades hòa (pip = 0)
      ];
      
      return {
        ...data,
        // Sử dụng hàm calculateWinRate từ forex-calculator.ts cho tính nhất quán
        winRate: calculateWinRate(tempTrades),
        value: Math.abs(data.netProfit) // Cho biểu đồ
      };
    });
    
    const strategyPerformance = Object.values(strategyData).map(data => {
      // Tạo mảng trades tạm thời để tính toán theo cách chuẩn
      const tempTrades = [
        ...Array(data.wins).fill({ pips: 1 }),        // Trades thắng (pip > 0)
        ...Array(data.losses).fill({ pips: -1 }),     // Trades thua (pip < 0)
        ...Array(data.breakEven || 0).fill({ pips: 0 }) // Trades hòa (pip = 0)
      ];
      
      return {
        ...data,
        // Sử dụng hàm calculateWinRate từ forex-calculator.ts cho tính nhất quán
        winRate: calculateWinRate(tempTrades),
        value: Math.abs(data.netProfit) // Cho biểu đồ
      };
    });
    
    const emotionPerformance = Object.values(emotionData).map(data => {
      // Tạo mảng trades tạm thời để tính toán theo cách chuẩn
      const tempTrades = [
        ...Array(data.wins).fill({ pips: 1 }),        // Trades thắng (pip > 0)
        ...Array(data.losses).fill({ pips: -1 }),     // Trades thua (pip < 0)
        ...Array(data.breakEven || 0).fill({ pips: 0 }) // Trades hòa (pip = 0)
      ];
      
      return {
        ...data,
        // Sử dụng hàm calculateWinRate từ forex-calculator.ts cho tính nhất quán
        winRate: calculateWinRate(tempTrades),
        value: data.trades // Cho biểu đồ
      };
    });
    
    // Tính tỷ lệ thắng cho các discipline metrics theo cách phân loại như calculateWinRate()
    // Sử dụng cách tính chuẩn từ forex-calculator.ts
    const getWinRate = (wins: number, total: number, breakEvenCount: number = 0) => {
      // Tạo mảng trades tạm thời để tính toán theo cách chuẩn
      const tempTrades = [
        ...Array(wins).fill({ pips: 1 }),        // Trades thắng (pip > 0)
        ...Array(total - wins - breakEvenCount).fill({ pips: -1 }), // Trades thua (pip < 0)
        ...Array(breakEvenCount).fill({ pips: 0 }) // Trades hòa (pip = 0)
      ];
      
      // Dùng hàm calculateWinRate từ forex-calculator.ts
      return calculateWinRate(tempTrades);
    };

    const disciplineMetrics = {
      followedPlan: {
        yes: disciplineCounters.followedPlan.yes,
        no: disciplineCounters.followedPlan.no,
        winRateYes: getWinRate(disciplineCounters.followedPlan.yesWins, disciplineCounters.followedPlan.yes),
        winRateNo: getWinRate(disciplineCounters.followedPlan.noWins, disciplineCounters.followedPlan.no),
      },
      enteredEarly: {
        yes: disciplineCounters.enteredEarly.yes,
        no: disciplineCounters.enteredEarly.no,
        winRateYes: getWinRate(disciplineCounters.enteredEarly.yesWins, disciplineCounters.enteredEarly.yes),
        winRateNo: getWinRate(disciplineCounters.enteredEarly.noWins, disciplineCounters.enteredEarly.no),
      },
      revenge: {
        yes: disciplineCounters.revenge.yes,
        no: disciplineCounters.revenge.no,
        winRateYes: getWinRate(disciplineCounters.revenge.yesWins, disciplineCounters.revenge.yes),
        winRateNo: getWinRate(disciplineCounters.revenge.noWins, disciplineCounters.revenge.no),
      }
    };
    
    // Tính toán số liệu cuối cùng sử dụng các hàm từ balance-calculation-rules
    // Không tính toán nếu userData chưa được load
    if (!userData) {
      devLog("[Analytics] userData not available for final calculation");
      return {
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        winRate: 0,
        netProfit: 0,
        initialBalance: 0,
        currentBalance: 0,
        pairPerformance: [],
        strategyPerformance: [],
        emotionPerformance: [],
        disciplineMetrics: {
          followedPlan: { yes: 0, no: 0, winRateYes: 0, winRateNo: 0 },
          enteredEarly: { yes: 0, no: 0, winRateYes: 0, winRateNo: 0 },
          revenge: { yes: 0, no: 0, winRateYes: 0, winRateNo: 0 }
        },
        trades: []
      };
    }
    
    // Lấy initialBalance từ userData khi đã có userData
    const initialBalance = userData.initialBalance;
    devLog("[Analytics] Using initial balance for final calculation:", initialBalance);
    
    // Luôn tính toán currentBalance từ trades để đảm bảo tính nhất quán
    const currentBalance = calculateCurrentBalance(initialBalance, trades);
    
    // Tính toán thống nhất dựa trên pip
    const winningTrades = closedTrades.filter(trade => (trade.pips || 0) > 0).length;
    const losingTrades = closedTrades.filter(trade => (trade.pips || 0) < 0).length;
    const breakEvenTrades = closedTrades.filter(trade => (trade.pips || 0) === 0).length;
    
    return {
      totalTrades: closedTrades.length,
      winningTrades: winningTrades,
      losingTrades: losingTrades,
      breakEvenTrades: breakEvenTrades,
      winRate: calculateWinRate(closedTrades, "pips"),
      netProfit,
      initialBalance,
      currentBalance,
      pairPerformance,
      strategyPerformance,
      emotionPerformance,
      disciplineMetrics,
      trades: closedTrades
    };
  }, [trades, userData]);

  // Sử dụng hàm calculateWinRate đã được định nghĩa trong forex-calculator.ts
  // Không định nghĩa lại ở đây để đảm bảo tính nhất quán

  // Skeleton loading component - cải thiện UX
  const TabLoadingFallback = () => (
    <div className="space-y-6">
      {/* KPI Row Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="border rounded-lg p-4 shadow-sm h-[120px] animate-pulse">
            <div className="flex items-center justify-between">
              <div className="h-4 w-24 bg-muted rounded mb-3"></div>
              <div className="h-8 w-8 rounded-full bg-muted"></div>
            </div>
            <div className="h-6 w-20 bg-muted rounded mt-2 mb-4"></div>
            <div className="h-3 w-32 bg-muted/50 rounded"></div>
          </div>
        ))}
      </div>
      
      {/* Chart Skeletons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border rounded-lg p-5 shadow-sm animate-pulse">
          <div className="h-5 w-36 bg-muted rounded mb-2"></div>
          <div className="h-3 w-48 bg-muted/50 rounded mb-6"></div>
          <div className="h-[220px] bg-muted/30 rounded-lg flex items-center justify-center">
            <Icons.ui.spinner className="h-6 w-6 animate-spin text-muted-foreground/40" />
          </div>
        </div>
        
        <div className="border rounded-lg p-5 shadow-sm animate-pulse">
          <div className="h-5 w-36 bg-muted rounded mb-2"></div>
          <div className="h-3 w-48 bg-muted/50 rounded mb-6"></div>
          <div className="h-[220px] bg-muted/30 rounded-lg flex items-center justify-center">
            <Icons.ui.spinner className="h-6 w-6 animate-spin text-muted-foreground/40" />
          </div>
        </div>
      </div>
    </div>
  );

  // Empty state component
  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center h-[400px] text-center">
      <Icons.analytics.barChart className="h-16 w-16 text-muted-foreground/20 mb-4" />
      <h3 className="text-lg font-semibold mb-2">No Trade Data Available</h3>
      <p className="text-muted-foreground max-w-md mb-4">
        Complete some trades to see your analytics dashboard. Performance metrics will appear here when you have closed trades.
      </p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-0 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col mb-4">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-primary/90 via-primary to-primary/80 bg-clip-text text-transparent">
          Analytics
        </h1>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          Advanced analytics and insights for your trading performance
        </p>
      </div>
      
      {/* Main content */}
      {!userData ? (
        <LoadingFallback height={400} showSpinner={false} />
      ) : analyticsData.totalTrades === 0 ? (
        <EmptyState />
      ) : (
        <Tabs defaultValue="overview" className="w-full">
          <div className="overflow-x-auto mb-4 sm:mb-6 touch-pan-x">
            <div className="min-w-max mx-auto px-1">
              <TabsList className="w-fit sm:w-auto flex flex-nowrap h-auto justify-start p-1 space-x-1 rounded-xl bg-muted/80">
                <TabsTrigger value="overview" className="flex items-center justify-center h-9 px-2 sm:px-4 gap-1.5 data-[state=active]:bg-primary/10 rounded-md transition-all">
                  <Icons.analytics.barChart className="h-4 w-4 flex-shrink-0" />
                  <span className="inline whitespace-nowrap text-xs sm:text-sm font-medium">Overview</span>
                </TabsTrigger>
                <TabsTrigger value="strategy" className="flex items-center justify-center h-9 px-2 sm:px-4 gap-1.5 data-[state=active]:bg-primary/10 rounded-md transition-all">
                  <Icons.analytics.lineChart className="h-4 w-4 flex-shrink-0" />
                  <span className="inline whitespace-nowrap text-xs sm:text-sm font-medium">Strategy</span>
                </TabsTrigger>
                <TabsTrigger value="discipline" className="flex items-center justify-center h-9 px-2 sm:px-4 gap-1.5 data-[state=active]:bg-primary/10 rounded-md transition-all">
                  <Icons.analytics.trending className="h-4 w-4 flex-shrink-0" />
                  <span className="inline whitespace-nowrap text-xs sm:text-sm font-medium">Discipline</span>
                </TabsTrigger>
                <TabsTrigger value="emotion" className="flex items-center justify-center h-9 px-2 sm:px-4 gap-1.5 data-[state=active]:bg-primary/10 rounded-md transition-all">
                  <Icons.analytics.pieChart className="h-4 w-4 flex-shrink-0" />
                  <span className="inline whitespace-nowrap text-xs sm:text-sm font-medium">Emotion</span>
                </TabsTrigger>
                <TabsTrigger value="advanced" className="flex items-center justify-center h-9 px-2 sm:px-4 gap-1.5 data-[state=active]:bg-primary/10 rounded-md transition-all">
                  <Icons.analytics.stats className="h-4 w-4 flex-shrink-0" />
                  <span className="inline whitespace-nowrap text-xs sm:text-sm font-medium">Advanced</span>
                </TabsTrigger>

              </TabsList>
            </div>
          </div>
          
          {/* Tabs content với Suspense cho dynamic import */}
            <TabsContent value="overview">
              <Suspense fallback={<LoadingFallback height={300} showSpinner={true} />}>
                <OverviewTab data={analyticsData} />
              </Suspense>
            </TabsContent>
            
            <TabsContent value="strategy">
              <Suspense fallback={<LoadingFallback height={300} showSpinner={true} />}>
                <StrategyTab data={analyticsData} />
              </Suspense>
            </TabsContent>
            
            <TabsContent value="discipline">
              <Suspense fallback={<LoadingFallback height={300} showSpinner={true} />}>
                <DisciplineTab data={analyticsData} />
              </Suspense>
            </TabsContent>
            
            <TabsContent value="emotion">
              <Suspense fallback={<LoadingFallback height={300} showSpinner={true} />}>
                <EmotionTab data={analyticsData} />
              </Suspense>
            </TabsContent>
            
            <TabsContent value="advanced">
              <Suspense fallback={<LoadingFallback height={300} showSpinner={true} />}>
                <AdvancedTab data={analyticsData} />
              </Suspense>
            </TabsContent>
            

        </Tabs>
      )}
    </div>
  );
}