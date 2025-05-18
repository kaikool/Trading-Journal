import React, { useMemo } from 'react';
import { Trade, TradingStrategy } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Icons } from '@/components/icons/icons';
import { formatPercentage, formatCurrency, formatDate } from '@/lib/formatters';

// Types for the recommendation engine
interface StrategyRecommendation {
  strategy: string;
  confidence: number;  // 0-100 value indicating confidence in recommendation
  reasoning: string;   // Why this strategy is recommended
  suitableFor: string[]; // Market conditions, sessions, or emotions
  expectedWinRate: number; // Expected win rate based on analysis
  description?: string; // Optional detailed description
}

interface RecommendationMetrics {
  bestPairs: {
    pair: string;
    winRate: number;
    trades: number;
  }[];
  bestTimeframes: {
    timeframe: string;
    winRate: number;
    trades: number;
  }[];
  optimalSessionTypes: {
    session: string;
    winRate: number;
    trades: number;
  }[];
  emotionalStrengths: {
    emotion: string;
    winRate: number;
    trades: number;
  }[];
  disciplineFactors: {
    followedPlan: number; // Impact on win rate when following plan
    enteredEarly: number; // Impact on win rate when entering early
    revengeTrading: number; // Impact on win rate when revenge trading
  };
}

interface StrategyRecommendationEngineProps {
  trades: Trade[];
  strategies: TradingStrategy[];
  userId: string | null;
}

export function StrategyRecommendationEngine({ 
  trades, 
  strategies,
  userId 
}: StrategyRecommendationEngineProps) {
  // Skip processing if no data
  if (!trades.length || !strategies.length || !userId) {
    return <RecommendationEmptyState />;
  }

  // Calculate recommendation metrics from trade history
  const metrics = useMemo(() => calculateRecommendationMetrics(trades), [trades]);
  
  // Generate personalized strategy recommendations
  const recommendations = useMemo(() => 
    generateRecommendations(trades, strategies, metrics), 
    [trades, strategies, metrics]
  );

  // No recommendations generated
  if (!recommendations.length) {
    return <RecommendationNeedsMoreDataState />;
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Icons.analytics.brain className="h-5 w-5 text-primary" />
            Strategy Recommendations
          </CardTitle>
          
          <Badge variant="outline" className="bg-primary/5 border-primary/10 px-2 py-0.5">
            <Icons.general.lightbulb className="h-3.5 w-3.5 mr-1 text-primary" />
            Personalized for you
          </Badge>
        </div>
        <CardDescription>
          Recommendations based on your {trades.length} trades and trading patterns
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="recommendations" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="recommendations">
              <Icons.ui.chevronsUpDown className="h-4 w-4 mr-1.5" />
              Recommendations
            </TabsTrigger>
            <TabsTrigger value="insights">
              <Icons.analytics.lightbulb className="h-4 w-4 mr-1.5" />
              Trading Insights
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="recommendations" className="space-y-4">
            {recommendations.map((recommendation, index) => (
              <RecommendationCard 
                key={`${recommendation.strategy}-${index}`} 
                recommendation={recommendation} 
              />
            ))}
          </TabsContent>
          
          <TabsContent value="insights" className="space-y-4">
            <TradingInsights metrics={metrics} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// Component to display an individual recommendation
function RecommendationCard({ recommendation }: { recommendation: StrategyRecommendation }) {
  // Determine the confidence level display
  const confidenceColor = recommendation.confidence > 80 
    ? 'text-success' 
    : recommendation.confidence > 60 
    ? 'text-warning' 
    : 'text-muted-foreground';

  return (
    <Card className="overflow-hidden border border-primary/10">
      <div className="bg-primary/5 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <Icons.analytics.brainCircuit className="h-5 w-5 text-primary mr-2" />
          <h3 className="font-medium">{recommendation.strategy}</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs">Confidence:</span>
          <span className={`text-sm font-medium ${confidenceColor}`}>
            {recommendation.confidence}%
          </span>
        </div>
      </div>
      
      <CardContent className="p-4 space-y-3">
        <p className="text-sm">{recommendation.reasoning}</p>
        
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Expected Win Rate</span>
            <span className="font-medium">{formatPercentage(recommendation.expectedWinRate)}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Suitable For</span>
            <div className="flex flex-wrap gap-1">
              {recommendation.suitableFor.slice(0, 2).map((item, i) => (
                <Badge key={i} variant="outline" className="px-1 py-0 text-xs">
                  {item}
                </Badge>
              ))}
              {recommendation.suitableFor.length > 2 && (
                <Badge variant="outline" className="px-1 py-0 text-xs">
                  +{recommendation.suitableFor.length - 2}
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        {recommendation.description && (
          <div className="pt-2 border-t border-border/50">
            <p className="text-xs text-muted-foreground">{recommendation.description}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Component showing trading insights from metrics
function TradingInsights({ metrics }: { metrics: RecommendationMetrics }) {
  return (
    <div className="space-y-4">
      {/* Best Currency Pairs */}
      {metrics.bestPairs.length > 0 && (
        <Alert>
          <Icons.trade.currencyPair className="h-4 w-4 text-primary" />
          <AlertTitle>Best Currency Pairs</AlertTitle>
          <AlertDescription>
            You perform best with {metrics.bestPairs.map(pair => 
              `${pair.pair} (${formatPercentage(pair.winRate)} win rate)`).join(', ')}
          </AlertDescription>
        </Alert>
      )}
      
      {/* Optimal Session Types */}
      {metrics.optimalSessionTypes.length > 0 && (
        <Alert>
          <Icons.general.clock className="h-4 w-4 text-primary" />
          <AlertTitle>Optimal Trading Sessions</AlertTitle>
          <AlertDescription>
            Your win rate is highest during {metrics.optimalSessionTypes.map(session => 
              `${session.session} sessions (${formatPercentage(session.winRate)})`).join(', ')}
          </AlertDescription>
        </Alert>
      )}
      
      {/* Emotional Strengths */}
      {metrics.emotionalStrengths.length > 0 && (
        <Alert>
          <Icons.general.heart className="h-4 w-4 text-primary" />
          <AlertTitle>Emotional Trading Strengths</AlertTitle>
          <AlertDescription>
            You trade best when feeling {metrics.emotionalStrengths.map(emotion => 
              `${emotion.emotion} (${formatPercentage(emotion.winRate)} win rate)`).join(', ')}
          </AlertDescription>
        </Alert>
      )}
      
      {/* Discipline Impact */}
      <Alert>
        <Icons.analytics.target className="h-4 w-4 text-primary" />
        <AlertTitle>Discipline Impact</AlertTitle>
        <AlertDescription>
          <ul className="list-disc pl-5 text-sm space-y-1 mt-1">
            <li>Following your plan improves win rate by {formatPercentage(metrics.disciplineFactors.followedPlan)}</li>
            <li>Entering early impacts win rate by {formatPercentage(metrics.disciplineFactors.enteredEarly)}</li>
            <li>Revenge trading decreases win rate by {formatPercentage(Math.abs(metrics.disciplineFactors.revengeTrading))}</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
}

// Empty state when no trades or strategies
function RecommendationEmptyState() {
  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <CardTitle className="text-lg font-semibold">Strategy Recommendations</CardTitle>
        <CardDescription>
          Not enough data to generate recommendations
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center py-6">
        <div className="rounded-full bg-muted/20 p-3 mb-4">
          <Icons.analytics.brain className="h-8 w-8 text-muted-foreground/40" />
        </div>
        <h3 className="text-base font-medium mb-2">Add More Trading Data</h3>
        <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
          Our recommendation engine needs your trading history and defined strategies
          to generate personalized recommendations.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" size="sm">
            <Icons.trade.entry className="h-4 w-4 mr-2" />
            Record Trades
          </Button>
          <Button variant="outline" size="sm">
            <Icons.ui.plus className="h-4 w-4 mr-2" />
            Create Strategies
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Needs more data state
function RecommendationNeedsMoreDataState() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Strategy Recommendations</CardTitle>
        <CardDescription>
          Building your personalized recommendations
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center py-6">
        <div className="rounded-full bg-primary/10 p-3 mb-4">
          <Icons.analytics.brain className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-base font-medium mb-2">More Data Required</h3>
        <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
          We're analyzing your trading patterns, but need more diverse trades
          to generate meaningful strategy recommendations.
        </p>
        <Alert className="bg-muted/20 border-primary/10">
          <Icons.general.lightbulb className="h-4 w-4 text-primary" />
          <AlertTitle>Recommendation</AlertTitle>
          <AlertDescription className="text-xs">
            Continue recording trades with detailed information about strategy, emotions,
            and market conditions to receive personalized recommendations.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}

// Calculate metrics for generating recommendations
function calculateRecommendationMetrics(trades: Trade[]): RecommendationMetrics {
  // Only consider closed trades for analysis
  const closedTrades = trades.filter(trade => !trade.isOpen && trade.result);
  
  // Initialize metrics object
  const metrics: RecommendationMetrics = {
    bestPairs: [],
    bestTimeframes: [], // This would be populated if timeframe data was in trades
    optimalSessionTypes: [],
    emotionalStrengths: [],
    disciplineFactors: {
      followedPlan: 0,
      enteredEarly: 0,
      revengeTrading: 0
    }
  };

  // Calculate best pairs
  const pairMap = new Map<string, { wins: number, trades: number }>();
  closedTrades.forEach(trade => {
    const pair = trade.pair;
    if (!pairMap.has(pair)) {
      pairMap.set(pair, { wins: 0, trades: 0 });
    }
    
    const pairStats = pairMap.get(pair)!;
    pairStats.trades++;
    if (trade.result === 'win') {
      pairStats.wins++;
    }
  });
  
  // Convert map to array and sort by win rate
  metrics.bestPairs = Array.from(pairMap.entries())
    .filter(([_, stats]) => stats.trades >= 5) // Only consider pairs with enough trades
    .map(([pair, stats]) => ({
      pair,
      trades: stats.trades,
      winRate: (stats.wins / stats.trades) * 100
    }))
    .sort((a, b) => b.winRate - a.winRate)
    .slice(0, 3); // Top 3 pairs
  
  // Calculate optimal session types
  const sessionMap = new Map<string, { wins: number, trades: number }>();
  closedTrades.forEach(trade => {
    const session = trade.sessionType || 'Unknown';
    if (!sessionMap.has(session)) {
      sessionMap.set(session, { wins: 0, trades: 0 });
    }
    
    const sessionStats = sessionMap.get(session)!;
    sessionStats.trades++;
    if (trade.result === 'win') {
      sessionStats.wins++;
    }
  });
  
  // Convert session map to array and sort
  metrics.optimalSessionTypes = Array.from(sessionMap.entries())
    .filter(([_, stats]) => stats.trades >= 3) // Need minimum trades for significance
    .map(([session, stats]) => ({
      session,
      trades: stats.trades,
      winRate: (stats.wins / stats.trades) * 100
    }))
    .sort((a, b) => b.winRate - a.winRate)
    .slice(0, 2); // Top 2 sessions
  
  // Calculate emotional strengths
  const emotionMap = new Map<string, { wins: number, trades: number }>();
  closedTrades.forEach(trade => {
    const emotion = trade.emotion || 'Not recorded';
    if (!emotionMap.has(emotion)) {
      emotionMap.set(emotion, { wins: 0, trades: 0 });
    }
    
    const emotionStats = emotionMap.get(emotion)!;
    emotionStats.trades++;
    if (trade.result === 'win') {
      emotionStats.wins++;
    }
  });
  
  // Convert emotion map to array and sort
  metrics.emotionalStrengths = Array.from(emotionMap.entries())
    .filter(([emotion, stats]) => stats.trades >= 3 && emotion !== 'Not recorded') 
    .map(([emotion, stats]) => ({
      emotion,
      trades: stats.trades,
      winRate: (stats.wins / stats.trades) * 100
    }))
    .sort((a, b) => b.winRate - a.winRate)
    .slice(0, 2); // Top 2 emotional states
  
  // Calculate discipline impact on win rates
  const followedPlanYes = closedTrades.filter(t => t.followedPlan === true);
  const followedPlanNo = closedTrades.filter(t => t.followedPlan === false);
  
  const followedPlanYesWinRate = followedPlanYes.length ? 
    followedPlanYes.filter(t => t.result === 'win').length / followedPlanYes.length * 100 : 0;
  const followedPlanNoWinRate = followedPlanNo.length ? 
    followedPlanNo.filter(t => t.result === 'win').length / followedPlanNo.length * 100 : 0;
  
  // Impact of following plan on win rate
  metrics.disciplineFactors.followedPlan = followedPlanYesWinRate - followedPlanNoWinRate;
  
  // Calculate impact of entering early
  const enteredEarlyYes = closedTrades.filter(t => t.enteredEarly === true);
  const enteredEarlyNo = closedTrades.filter(t => t.enteredEarly === false);
  
  const enteredEarlyYesWinRate = enteredEarlyYes.length ? 
    enteredEarlyYes.filter(t => t.result === 'win').length / enteredEarlyYes.length * 100 : 0;
  const enteredEarlyNoWinRate = enteredEarlyNo.length ? 
    enteredEarlyNo.filter(t => t.result === 'win').length / enteredEarlyNo.length * 100 : 0;
  
  // Impact of entering early on win rate
  metrics.disciplineFactors.enteredEarly = enteredEarlyYesWinRate - enteredEarlyNoWinRate;
  
  // Calculate impact of revenge trading
  const revengeYes = closedTrades.filter(t => t.revenge === true);
  const revengeNo = closedTrades.filter(t => t.revenge === false);
  
  const revengeYesWinRate = revengeYes.length ? 
    revengeYes.filter(t => t.result === 'win').length / revengeYes.length * 100 : 0;
  const revengeNoWinRate = revengeNo.length ? 
    revengeNo.filter(t => t.result === 'win').length / revengeNo.length * 100 : 0;
  
  // Impact of revenge trading on win rate (usually negative)
  metrics.disciplineFactors.revengeTrading = revengeYesWinRate - revengeNoWinRate;
  
  return metrics;
}

// Generate personalized strategy recommendations
function generateRecommendations(
  trades: Trade[],
  strategies: TradingStrategy[],
  metrics: RecommendationMetrics
): StrategyRecommendation[] {
  // Not enough data to make recommendations
  if (trades.length < 10) {
    return [];
  }
  
  const closedTrades = trades.filter(trade => !trade.isOpen && trade.result);
  const recommendations: StrategyRecommendation[] = [];
  
  // 1. Evaluate strategies based on past performance
  const strategyPerformance = new Map<string, { wins: number, trades: number }>();
  
  closedTrades.forEach(trade => {
    if (!trade.strategy) return;
    
    if (!strategyPerformance.has(trade.strategy)) {
      strategyPerformance.set(trade.strategy, { wins: 0, trades: 0 });
    }
    
    const stats = strategyPerformance.get(trade.strategy)!;
    stats.trades++;
    if (trade.result === 'win') {
      stats.wins++;
    }
  });
  
  // Convert to array and calculate win rates
  const strategyStats = Array.from(strategyPerformance.entries())
    .map(([strategy, stats]) => ({
      strategy,
      trades: stats.trades,
      winRate: stats.trades > 0 ? (stats.wins / stats.trades) * 100 : 0
    }))
    .filter(s => s.trades >= 3); // Only consider strategies with enough trades
  
  // 2. Find the best performing strategy
  const bestStrategies = [...strategyStats].sort((a, b) => b.winRate - a.winRate);
  
  if (bestStrategies.length > 0) {
    const bestStrategy = bestStrategies[0];
    const strategyObj = strategies.find(s => s.name === bestStrategy.strategy);
    
    if (strategyObj) {
      // Create recommendation for best performing strategy
      recommendations.push({
        strategy: bestStrategy.strategy,
        confidence: Math.min(90, 50 + bestStrategy.trades * 2), // Confidence increases with more trades
        reasoning: `This strategy has your highest win rate at ${formatPercentage(bestStrategy.winRate)} across ${bestStrategy.trades} trades.`,
        suitableFor: [
          ...(metrics.bestPairs.map(p => p.pair) || []),
          ...(metrics.optimalSessionTypes.map(s => s.session) || [])
        ],
        expectedWinRate: bestStrategy.winRate,
        description: strategyObj.description || 'Your highest performing strategy based on historical data.'
      });
    }
  }
  
  // 3. Create a recommendation based on discipline metrics
  if (Math.abs(metrics.disciplineFactors.followedPlan) > 10 ||
      Math.abs(metrics.disciplineFactors.revengeTrading) > 10) {
    
    let disciplineStrategy: TradingStrategy | undefined;
    
    // Look for a strategy with simple, clear rules
    disciplineStrategy = strategies.find(s => 
      s.rules.length <= 5 && 
      s.entryConditions.length <= 3 &&
      s.exitConditions.length <= 3
    );
    
    if (disciplineStrategy) {
      recommendations.push({
        strategy: disciplineStrategy.name,
        confidence: 75,
        reasoning: 'This structured strategy with clear rules aligns with your discipline patterns.',
        suitableFor: [
          'Emotional trading',
          'High-stress markets',
          ...(metrics.emotionalStrengths.map(e => e.emotion) || [])
        ],
        expectedWinRate: calculateExpectedWinRate(
          disciplineStrategy,
          metrics,
          strategyStats
        ),
        description: 'Your trading data shows significant performance variance based on discipline factors. This strategy provides clear rules to maintain discipline.'
      });
    }
  }
  
  // 4. Create a recommendation based on market or pair performance
  if (metrics.bestPairs.length > 0) {
    // Find strategies that might work well with the best pairs
    const bestPair = metrics.bestPairs[0].pair;
    const pairStrategy = strategies.find(s => 
      !recommendations.some(r => r.strategy === s.name) &&
      (s.description?.toLowerCase().includes(bestPair.toLowerCase()) ||
       s.name.toLowerCase().includes(bestPair.toLowerCase().split('/')[0]))
    );
    
    if (pairStrategy) {
      recommendations.push({
        strategy: pairStrategy.name,
        confidence: 65,
        reasoning: `This strategy complements your success with ${bestPair}, your best performing pair (${formatPercentage(metrics.bestPairs[0].winRate)} win rate).`,
        suitableFor: [
          bestPair,
          ...(metrics.optimalSessionTypes.map(s => s.session) || [])
        ],
        expectedWinRate: calculateExpectedWinRate(
          pairStrategy,
          metrics,
          strategyStats
        ),
        description: `Specialized approach that leverages your demonstrated strength in ${bestPair} trading.`
      });
    }
  }
  
  // Ensure we have at least one recommendation
  if (recommendations.length === 0 && strategies.length > 0) {
    // Get the strategy with most comprehensive rules
    const fallbackStrategy = [...strategies].sort((a, b) => {
      const totalConditionsA = a.rules.length + a.entryConditions.length + a.exitConditions.length;
      const totalConditionsB = b.rules.length + b.entryConditions.length + b.exitConditions.length;
      return totalConditionsB - totalConditionsA;
    })[0];
    
    recommendations.push({
      strategy: fallbackStrategy.name,
      confidence: 50,
      reasoning: 'This comprehensive strategy provides clear structure for your trading.',
      suitableFor: ['All market conditions', 'Structured approach'],
      expectedWinRate: 55, // Conservative estimate
      description: 'Based on your trading history, a well-defined strategy with clear rules could improve consistency.'
    });
  }
  
  return recommendations;
}

// Helper function to calculate expected win rate
function calculateExpectedWinRate(
  strategy: TradingStrategy,
  metrics: RecommendationMetrics,
  strategyStats: {strategy: string, trades: number, winRate: number}[]
): number {
  // Find if this strategy has historical data
  const existingStats = strategyStats.find(s => s.strategy === strategy.name);
  if (existingStats) {
    return existingStats.winRate;
  }
  
  // If no historical data, estimate based on discipline factors
  const baseWinRate = 52; // Conservative base win rate
  
  // Adjust based on strategy complexity (simpler = higher consistency)
  const complexityAdjustment = 
    Math.max(0, 5 - (strategy.rules.length + strategy.entryConditions.length + strategy.exitConditions.length));
  
  // Adjust based on discipline factors
  const disciplineAdjustment = 
    (metrics.disciplineFactors.followedPlan > 0 ? 3 : 0) +
    (metrics.disciplineFactors.enteredEarly > 0 ? 2 : 0) +
    (metrics.disciplineFactors.revengeTrading < 0 ? 2 : 0);
  
  return baseWinRate + complexityAdjustment + disciplineAdjustment;
}