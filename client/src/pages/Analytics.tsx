
import { useMemo, lazy, Suspense, useState, useEffect, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Icons } from "@/components/icons/icons";
import { useToast } from "@/hooks/use-toast";
import { useUserDataQuery } from "@/hooks/use-user-data-query";
import { useTradesQuery } from "@/hooks/use-trades-query";
import { useAuth } from "@/hooks/use-auth";
import { getClosedTrades, calculateCurrentBalance } from "@/lib/balance-calculation-rules";
import { calculateWinRate } from "@/lib/forex-calculator";
import { motion, AnimatePresence, PanInfo } from "framer-motion";

import { debug, logError } from "@/lib/debug";
import { getStrategies } from "@/lib/firebase";
import { TradingStrategy } from "@/types";
import { tradeUpdateService, TradeChangeObserver } from "@/services/trade-update-service";

// Lazy loading components
const OverviewTab = lazy(() => import("@/components/analytics/OverviewTab"));
const StrategyTab = lazy(() => import("@/components/analytics/StrategyTab"));
const DisciplineTab = lazy(() => import("@/components/analytics/DisciplineTab"));
const EmotionTab = lazy(() => import("@/components/analytics/EmotionTab"));
const AdvancedTab = lazy(() => import("@/components/analytics/AdvancedTab"));
const StrategyRecommendationEngine = lazy(() => import("@/components/analytics/StrategyRecommendationEngine").then(module => ({ default: module.StrategyRecommendationEngine })));

// Window declaration
declare global {
  interface Window {
    balanceLogged: boolean;
  }
}

const tabs = [
  "overview",
  "strategy",
  "discipline",
  "emotion",
  "advanced",
  "recommendations",
];

// Changed from slide to fade animation
const fadeVariants = {
  enter: {
    opacity: 0,
  },
  center: {
    zIndex: 1,
    opacity: 1,
  },
  exit: {
    zIndex: 0,
    opacity: 0,
  },
};

const SWIPE_CONFIDENCE_THRESHOLD = 10000;

export default function Analytics() {
  const { trades, isLoading: tradesLoading } = useTradesQuery();
  const { userData, isLoading: userLoading } = useUserDataQuery();
  const { userId } = useAuth();
  const { toast } = useToast();
  const isLoading = userLoading || tradesLoading;
  const [strategies, setStrategies] = useState<TradingStrategy[]>([]);
  
  // Simplified state, removed direction
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  const handleTabChange = (newIndex: number) => {
    setActiveTabIndex(newIndex);
  };

  const handleDragEnd = (e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const swipe = info.offset.x * info.velocity.x;

    if (swipe < -SWIPE_CONFIDENCE_THRESHOLD) {
      const nextIndex = activeTabIndex + 1;
      if (nextIndex < tabs.length) {
        handleTabChange(nextIndex);
      }
    } else if (swipe > SWIPE_CONFIDENCE_THRESHOLD) {
      const prevIndex = activeTabIndex - 1;
      if (prevIndex >= 0) {
        handleTabChange(prevIndex);
      }
    }
  };

  const devLog = (message: string, data?: any) => {
    debug(message, data);
  };
  
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
  
  const lastUpdateTimeRef = useRef(0);
  
  useEffect(() => {
    if (!userId) return;
    const observer: TradeChangeObserver = {
      onTradesChanged: (action) => {
        const now = Date.now();
        if (now - lastUpdateTimeRef.current < 500) {
          debug("[Analytics] Debouncing update, too frequent");
          return;
        }
        lastUpdateTimeRef.current = now;
        debug(`[Analytics] Received trade update notification (${action})`);
      }
    };
    const unregister = tradeUpdateService.registerObserver(observer);
    return () => {
      unregister();
    };
  }, [userId]);

  const analyticsData = useMemo(() => {
    const closedTrades = getClosedTrades(trades);
    if (closedTrades.length === 0) {
      if (!userData) {
        devLog("[Analytics] userData not available, returning empty analytics data");
        return { totalTrades: 0, winningTrades: 0, losingTrades: 0, winRate: 0, netProfit: 0, initialBalance: 0, currentBalance: 0, pairPerformance: [], strategyPerformance: [], emotionPerformance: [], disciplineMetrics: { followedPlan: { yes: 0, no: 0, winRateYes: 0, winRateNo: 0 }, enteredEarly: { yes: 0, no: 0, winRateYes: 0, winRateNo: 0 }, revenge: { yes: 0, no: 0, winRateYes: 0, winRateNo: 0 } }, trades: [] };
      }
      const initialBalance = userData.initialBalance;
      devLog("[Analytics] No closed trades, using initial balance:", initialBalance);
      return { totalTrades: 0, winningTrades: 0, losingTrades: 0, winRate: 0, netProfit: 0, initialBalance: initialBalance, currentBalance: initialBalance, pairPerformance: [], strategyPerformance: [], emotionPerformance: [], disciplineMetrics: { followedPlan: { yes: 0, no: 0, winRateYes: 0, winRateNo: 0 }, enteredEarly: { yes: 0, no: 0, winRateYes: 0, winRateNo: 0 }, revenge: { yes: 0, no: 0, winRateYes: 0, winRateNo: 0 } }, trades: [] };
    }
    
    const pairData: Record<string, any> = {};
    const strategyData: Record<string, any> = {};
    const emotionData: Record<string, any> = {};
    let netProfit = 0;
    const disciplineCounters = { followedPlan: { yes: 0, no: 0, yesWins: 0, noWins: 0 }, enteredEarly: { yes: 0, no: 0, yesWins: 0, noWins: 0 }, revenge: { yes: 0, no: 0, yesWins: 0, noWins: 0 } };
    
    closedTrades.forEach(trade => {
      const profitLoss = trade.profitLoss || 0;
      const pips = trade.pips || 0;
      netProfit += profitLoss;
      
      const pair = trade.pair;
      if (!pairData[pair]) {
        pairData[pair] = { pair, trades: 0, wins: 0, losses: 0, breakEven: 0, netProfit: 0 };
      }
      pairData[pair].trades++;
      if (pips > 0) pairData[pair].wins++;
      else if (pips < 0) pairData[pair].losses++;
      else if (pips === 0) pairData[pair].breakEven = (pairData[pair].breakEven || 0) + 1;
      pairData[pair].netProfit += profitLoss;
      
      const strategyId = trade.strategy || 'Unknown';
      const strategyObj = strategies.find(s => s.id === strategyId);
      const strategy = strategyObj ? strategyObj.name : (strategyId === 'Unknown' ? 'Không xác định' : strategyId);
      if (!strategyData[strategyId]) {
        strategyData[strategyId] = { strategyId, strategy, trades: 0, wins: 0, losses: 0, breakEven: 0, netProfit: 0 };
      }
      strategyData[strategyId].trades++;
      if (pips > 0) strategyData[strategyId].wins++;
      else if (pips < 0) strategyData[strategyId].losses++;
      else if (pips === 0) strategyData[strategyId].breakEven = (strategyData[strategyId].breakEven || 0) + 1;
      strategyData[strategyId].netProfit += profitLoss;
      
      const emotion = trade.emotion || 'Neutral';
      if (!emotionData[emotion]) {
        emotionData[emotion] = { emotion, trades: 0, wins: 0, losses: 0, breakEven: 0 };
      }
      emotionData[emotion].trades++;
      if (pips > 0) emotionData[emotion].wins++;
      else if (pips < 0) emotionData[emotion].losses++;
      else if (pips === 0) emotionData[emotion].breakEven = (emotionData[emotion].breakEven || 0) + 1;
      
      if (trade.followedPlan) {
        disciplineCounters.followedPlan.yes++;
        if (pips > 0) disciplineCounters.followedPlan.yesWins++;
      } else {
        disciplineCounters.followedPlan.no++;
        if (pips > 0) disciplineCounters.followedPlan.noWins++;
      }
      if (trade.enteredEarly) {
        disciplineCounters.enteredEarly.yes++;
        if (pips > 0) disciplineCounters.enteredEarly.yesWins++;
      } else {
        disciplineCounters.enteredEarly.no++;
        if (pips > 0) disciplineCounters.enteredEarly.noWins++;
      }
      if (trade.revenge) {
        disciplineCounters.revenge.yes++;
        if (pips > 0) disciplineCounters.revenge.yesWins++;
      } else {
        disciplineCounters.revenge.no++;
        if (pips > 0) disciplineCounters.revenge.noWins++;
      }
    });
    
    const pairPerformance = Object.values(pairData).map(data => {
      const tempTrades = [ ...Array(data.wins).fill({ pips: 1 }), ...Array(data.losses).fill({ pips: -1 }), ...Array(data.breakEven || 0).fill({ pips: 0 }) ];
      return { ...data, winRate: calculateWinRate(tempTrades), value: Math.abs(data.netProfit) };
    });
    const strategyPerformance = Object.values(strategyData).map(data => {
      const tempTrades = [ ...Array(data.wins).fill({ pips: 1 }), ...Array(data.losses).fill({ pips: -1 }), ...Array(data.breakEven || 0).fill({ pips: 0 }) ];
      const strategyName = strategies.find(s => s.id === data.strategyId)?.name;
      return { strategy: strategyName || data.strategy, trades: data.trades, wins: data.wins, losses: data.losses, breakEven: data.breakEven || 0, netProfit: data.netProfit, winRate: calculateWinRate(tempTrades), value: Math.abs(data.netProfit) };
    });
    const emotionPerformance = Object.values(emotionData).map(data => {
      const tempTrades = [ ...Array(data.wins).fill({ pips: 1 }), ...Array(data.losses).fill({ pips: -1 }), ...Array(data.breakEven || 0).fill({ pips: 0 }) ];
      return { ...data, winRate: calculateWinRate(tempTrades), value: data.trades };
    });
    
    const getWinRate = (wins: number, total: number, breakEvenCount: number = 0) => {
      const tempTrades = [ ...Array(wins).fill({ pips: 1 }), ...Array(total - wins - breakEvenCount).fill({ pips: -1 }), ...Array(breakEvenCount).fill({ pips: 0 }) ];
      return calculateWinRate(tempTrades);
    };

    const disciplineMetrics = {
      followedPlan: { yes: disciplineCounters.followedPlan.yes, no: disciplineCounters.followedPlan.no, winRateYes: getWinRate(disciplineCounters.followedPlan.yesWins, disciplineCounters.followedPlan.yes), winRateNo: getWinRate(disciplineCounters.followedPlan.noWins, disciplineCounters.followedPlan.no) },
      enteredEarly: { yes: disciplineCounters.enteredEarly.yes, no: disciplineCounters.enteredEarly.no, winRateYes: getWinRate(disciplineCounters.enteredEarly.yesWins, disciplineCounters.enteredEarly.yes), winRateNo: getWinRate(disciplineCounters.enteredEarly.noWins, disciplineCounters.enteredEarly.no) },
      revenge: { yes: disciplineCounters.revenge.yes, no: disciplineCounters.revenge.no, winRateYes: getWinRate(disciplineCounters.revenge.yesWins, disciplineCounters.revenge.yes), winRateNo: getWinRate(disciplineCounters.revenge.noWins, disciplineCounters.revenge.no) }
    };
    
    if (!userData) {
      devLog("[Analytics] userData not available for final calculation");
      return { totalTrades: 0, winningTrades: 0, losingTrades: 0, winRate: 0, netProfit: 0, initialBalance: 0, currentBalance: 0, pairPerformance: [], strategyPerformance: [], emotionPerformance: [], disciplineMetrics: { followedPlan: { yes: 0, no: 0, winRateYes: 0, winRateNo: 0 }, enteredEarly: { yes: 0, no: 0, winRateYes: 0, winRateNo: 0 }, revenge: { yes: 0, no: 0, winRateYes: 0, winRateNo: 0 } }, trades: [] };
    }
    
    const initialBalance = userData.initialBalance;
    devLog("[Analytics] Using initial balance for final calculation:", initialBalance);
    const currentBalance = calculateCurrentBalance(initialBalance, trades);
    const winningTrades = closedTrades.filter(trade => (trade.pips || 0) > 0).length;
    const losingTrades = closedTrades.filter(trade => (trade.pips || 0) < 0).length;
    const breakEvenTrades = closedTrades.filter(trade => (trade.pips || 0) === 0).length;
    
    return { totalTrades: closedTrades.length, winningTrades: winningTrades, losingTrades: losingTrades, breakEvenTrades: breakEvenTrades, winRate: calculateWinRate(closedTrades, "pips"), netProfit, initialBalance, currentBalance, pairPerformance, strategyPerformance, emotionPerformance, disciplineMetrics, trades: closedTrades };
  }, [trades, userData, strategies]);

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
      <div className="flex flex-col mb-4">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-primary/90 via-primary to-primary/80 bg-clip-text text-transparent">
          Analytics
        </h1>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          Advanced analytics and insights for your trading performance
        </p>
      </div>
      
      {!userData ? (
        <div className="h-[400px] bg-background/5 rounded-md"></div>
      ) : analyticsData.totalTrades === 0 ? (
        <EmptyState />
      ) : (
        <Tabs 
          value={tabs[activeTabIndex]} 
          onValueChange={(value) => handleTabChange(tabs.indexOf(value))}
          className="w-full"
        >
          <div className="w-full overflow-x-auto pb-2 hide-scrollbar">
            <TabsList className="inline-flex items-center justify-start space-x-2 p-1">
              <TabsTrigger value="overview" className="flex-shrink-0 flex items-center justify-center gap-1.5 data-[state=active]:bg-primary/10 rounded-md transition-all text-xs sm:text-sm px-3 py-1.5">
                <Icons.analytics.barChart className="h-4 w-4" />
                <span className="whitespace-nowrap">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="strategy" className="flex-shrink-0 flex items-center justify-center gap-1.5 data-[state=active]:bg-primary/10 rounded-md transition-all text-xs sm:text-sm px-3 py-1.5">
                <Icons.analytics.lineChart className="h-4 w-4" />
                <span className="whitespace-nowrap">Strategy</span>
              </TabsTrigger>
              <TabsTrigger value="discipline" className="flex-shrink-0 flex items-center justify-center gap-1.5 data-[state=active]:bg-primary/10 rounded-md transition-all text-xs sm:text-sm px-3 py-1.5">
                <Icons.analytics.trending className="h-4 w-4" />
                <span className="whitespace-nowrap">Discipline</span>
              </TabsTrigger>
              <TabsTrigger value="emotion" className="flex-shrink-0 flex items-center justify-center gap-1.5 data-[state=active]:bg-primary/10 rounded-md transition-all text-xs sm:text-sm px-3 py-1.5">
                <Icons.analytics.pieChart className="h-4 w-4" />
                <span className="whitespace-nowrap">Emotion</span>
              </TabsTrigger>
              <TabsTrigger value="advanced" className="flex-shrink-0 flex items-center justify-center gap-1.5 data-[state=active]:bg-primary/10 rounded-md transition-all text-xs sm:text-sm px-3 py-1.5">
                <Icons.analytics.stats className="h-4 w-4" />
                <span className="whitespace-nowrap">Advanced</span>
              </TabsTrigger>
              <TabsTrigger value="recommendations" className="flex-shrink-0 flex items-center justify-center gap-1.5 data-[state=active]:bg-primary/10 rounded-md transition-all text-xs sm:text-sm px-3 py-1.5">
                <Icons.analytics.lightbulb className="h-4 w-4" />
                <span className="whitespace-nowrap">Recommendations</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="relative overflow-hidden">
            <AnimatePresence initial={false}>
              <motion.div
                key={activeTabIndex}
                variants={fadeVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ opacity: { duration: 0.3 } }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={1}
                onDragEnd={handleDragEnd}
              >
                <Suspense fallback={<div className="h-[300px] bg-background/5 rounded-md"></div>}>
                  {activeTabIndex === 0 && <OverviewTab data={analyticsData} />}
                  {activeTabIndex === 1 && <StrategyTab data={analyticsData} />}
                  {activeTabIndex === 2 && <DisciplineTab data={analyticsData} />}
                  {activeTabIndex === 3 && <EmotionTab data={analyticsData} />}
                  {activeTabIndex === 4 && <AdvancedTab data={analyticsData} />}
                  {activeTabIndex === 5 && <StrategyRecommendationEngine trades={analyticsData.trades} strategies={strategies} />}
                </Suspense>
              </motion.div>
            </AnimatePresence>
          </div>
        </Tabs>
      )}
    </div>
  );
}
