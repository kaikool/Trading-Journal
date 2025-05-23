import { useMemo, lazy, Suspense, useState, useEffect, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Icons } from "@/components/icons/icons";
import { useToast } from "@/hooks/use-toast";
import { useUserDataQuery } from "@/hooks/use-user-data-query";
import { useTradesQuery } from "@/hooks/use-trades-query";
import { useAuth } from "@/hooks/use-auth";
import { getClosedTrades, calculateCurrentBalance } from "@/lib/balance-calculation-rules";
import { calculateWinRate } from "@/lib/forex-calculator"; // Import hàm tính toán tỷ lệ thắng

import { debug, logError } from "@/lib/debug";
import { getStrategies } from "@/lib/firebase";
import { TradingStrategy } from "@/types";
import { tradeUpdateService, TradeChangeObserver } from "@/services/trade-update-service";

// Áp dụng lazy loading cho các tab components
const OverviewTab = lazy(() => import("@/components/analytics/OverviewTab"));
const StrategyTab = lazy(() => import("@/components/analytics/StrategyTab"));
const DisciplineTab = lazy(() => import("@/components/analytics/DisciplineTab"));
const EmotionTab = lazy(() => import("@/components/analytics/EmotionTab"));
const AdvancedTab = lazy(() => import("@/components/analytics/AdvancedTab"));
const AIAnalysisTab = lazy(() => import("@/components/analytics/AIAnalysisTab"));
const SavedAnalysisTab = lazy(() => import("@/components/analytics/SavedAnalysisTab"));
const StrategyRecommendationEngine = lazy(() => import("@/components/recommendations/StrategyRecommendationEngine").then(module => ({ default: module.StrategyRecommendationEngine })));

// Thêm khai báo cho window
declare global {
  interface Window {
    balanceLogged: boolean;
  }
}



export default function Analytics() {
  // Sử dụng React Query hooks thay vì DataCache
  const { trades, isLoading: tradesLoading } = useTradesQuery();
  const { userData, isLoading: userLoading } = useUserDataQuery();
  const { userId } = useAuth();
  const { toast } = useToast();
  const isLoading = userLoading || tradesLoading;
  // State để lưu danh sách chiến lược
  const [strategies, setStrategies] = useState<TradingStrategy[]>([]);

  // Logs only in development environment using debug utility
  const devLog = (message: string, data?: any) => {
    // debug() already checks for environment
    debug(message, data);
  };
  
  // Lấy danh sách chiến lược khi component mount
  useEffect(() => {
    const fetchStrategies = async () => {
      if (!userId) return;
      
      try {
        const userStrategies = await getStrategies(userId);
        setStrategies(userStrategies);
      } catch (error) {
        logError("Error loading strategies for analytics:", error);
      }
    };
    
    fetchStrategies();
  }, [userId]);
  
  // Reference cho thời gian cập nhật cuối cùng để tránh quá nhiều cập nhật
  const lastUpdateTimeRef = useRef(0);
  
  // Đăng ký observer với TradeUpdateService để cập nhật phân tích khi có thay đổi giao dịch
  useEffect(() => {
    if (!userId) return;
    
    // Tạo observer theo chuẩn TradeChangeObserver
    const observer: TradeChangeObserver = {
      onTradesChanged: (action) => {
        // Chỉ cập nhật tối đa mỗi 500ms để tránh cập nhật quá nhiều
        const now = Date.now();
        if (now - lastUpdateTimeRef.current < 500) {
          debug("[Analytics] Debouncing update, too frequent");
          return;
        }
        
        lastUpdateTimeRef.current = now;
        debug(`[Analytics] Received trade update notification (${action})`);
        
        // Lưu ý: Không cần gọi refetch() thủ công ở đây vì useTradesQuery 
        // đã được thiết lập để tự động cập nhật thông qua observer trong useEffect
        // Nó sẽ tự động cập nhật khi TradeUpdateService thông báo thay đổi
      }
    };
    
    // Đăng ký observer
    const unregister = tradeUpdateService.registerObserver(observer);
    
    // Cleanup khi component unmount
    return () => {
      unregister();
    };
  }, [userId]);

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
      const strategyId = trade.strategy || 'Unknown';
      
      // Lấy tên chiến lược từ ID
      const strategyObj = strategies.find(s => s.id === strategyId);
      const strategy = strategyObj ? strategyObj.name : (strategyId === 'Unknown' ? 'Không xác định' : strategyId);
      
      if (!strategyData[strategyId]) {
        strategyData[strategyId] = { strategyId, strategy, trades: 0, wins: 0, losses: 0, breakEven: 0, netProfit: 0 };
      }
      strategyData[strategyId].trades++;
      // Công thức từ forex-calculator.ts: pip > 0 là thắng, pip < 0 là thua, pip = 0 là hòa
      if (pips > 0) strategyData[strategyId].wins++;
      else if (pips < 0) strategyData[strategyId].losses++;
      else if (pips === 0) strategyData[strategyId].breakEven = (strategyData[strategyId].breakEven || 0) + 1;
      strategyData[strategyId].netProfit += profitLoss;
      
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
      
      // Tìm tên chiến lược từ danh sách strategies đã tải
      const strategyName = strategies.find(s => s.id === data.strategyId)?.name;
      
      return {
        strategy: strategyName || data.strategy, // Ưu tiên tên từ danh sách strategies
        trades: data.trades,
        wins: data.wins,
        losses: data.losses,
        breakEven: data.breakEven || 0,
        netProfit: data.netProfit,
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
  }, [trades, userData, strategies]);

  // Sử dụng hàm calculateWinRate đã được định nghĩa trong forex-calculator.ts
  // Không định nghĩa lại ở đây để đảm bảo tính nhất quán

  // Empty loading component
  const TabLoadingFallback = () => null;

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
        <div className="h-[400px] bg-background/5 rounded-md"></div>
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
                
                <TabsTrigger value="recommendations" className="flex items-center justify-center h-9 px-2 sm:px-4 gap-1.5 data-[state=active]:bg-primary/10 rounded-md transition-all">
                  <Icons.analytics.lightbulb className="h-4 w-4 flex-shrink-0" />
                  <span className="inline whitespace-nowrap text-xs sm:text-sm font-medium">Recommendations</span>
                </TabsTrigger>

              </TabsList>
            </div>
          </div>
          
          {/* Tabs content với Suspense cho dynamic import */}
            <TabsContent value="overview">
              <Suspense fallback={<div className="h-[300px] bg-background/5 rounded-md"></div>}>
                <OverviewTab data={analyticsData} />
              </Suspense>
            </TabsContent>
            
            <TabsContent value="strategy">
              <Suspense fallback={<div className="h-[300px] bg-background/5 rounded-md"></div>}>
                <StrategyTab data={analyticsData} />
              </Suspense>
            </TabsContent>
            
            <TabsContent value="discipline">
              <Suspense fallback={<div className="h-[300px] bg-background/5 rounded-md"></div>}>
                <DisciplineTab data={analyticsData} />
              </Suspense>
            </TabsContent>
            
            <TabsContent value="emotion">
              <Suspense fallback={<div className="h-[300px] bg-background/5 rounded-md"></div>}>
                <EmotionTab data={analyticsData} />
              </Suspense>
            </TabsContent>
            
            <TabsContent value="advanced">
              <Suspense fallback={<div className="h-[300px] bg-background/5 rounded-md"></div>}>
                <AdvancedTab data={analyticsData} />
              </Suspense>
            </TabsContent>
            
            <TabsContent value="recommendations">
              <Suspense fallback={<div className="h-[300px] bg-background/5 rounded-md"></div>}>
                <StrategyRecommendationEngine trades={analyticsData.trades} strategies={strategies} />
              </Suspense>
            </TabsContent>
            

        </Tabs>
      )}
    </div>
  );
}