/**
 * SavedStrategyAnalyses.tsx
 * 
 * Component hiển thị các phân tích AI chiến lược đã lưu (tối đa 5 phân tích)
 * Tự động xóa phân tích cũ nhất nếu vượt quá 5
 */

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Icons } from "@/components/icons/icons";
import { useToast } from "@/hooks/use-toast";
import { TradingStrategy } from "@/types";
import { useAuth } from "@/hooks/use-auth";
import { getStrategyAnalyses, deleteStrategyAnalysis } from "@/lib/firebase";
import { formatDistanceToNow, format } from 'date-fns';
import { enUS } from 'date-fns/locale';

// Interface for a saved analysis
interface SavedAnalysis {
  id: string;
  strategyId: string;
  strategyName: string;
  createdAt: any; // Firebase Timestamp
  data: {
    overallPerformance: {
      totalTrades: number;
      winRate: number;
      avgProfit: number;
      profitFactor: number;
    };
    conditionPerformance: {
      id: string;
      label: string;
      type: string;
      winRate: number;
      totalTrades: number;
      impact: string;
    }[];
    recommendations?: {
      id: string;
      title: string;
      description: string;
      confidence: number;
      impact: string;
      type: string;
    }[];
    summary: string;
  };
}

export default function SavedStrategyAnalyses() {
  const { userId } = useAuth();
  const { toast } = useToast();
  
  const [savedAnalyses, setSavedAnalyses] = useState<SavedAnalysis[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string | null>(null);

  // Load saved analyses
  useEffect(() => {
    const loadSavedAnalyses = async () => {
      if (!userId) return;
      
      setIsLoading(true);
      try {
        const analyses = await getStrategyAnalyses(userId);
        setSavedAnalyses(analyses as SavedAnalysis[] || []);
        
        // Auto select the newest analysis if there's any
        if (analyses && analyses.length > 0) {
          setSelectedAnalysisId(analyses[0].id);
        }
      } catch (error) {
        console.error('Error loading saved analyses:', error);
        toast({
          title: "Error",
          description: "Could not load saved analyses",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadSavedAnalyses();
  }, [userId, toast]);

  // Handle deleting an analysis
  const handleDeleteAnalysis = async (analysisId: string) => {
    if (!userId) return;
    
    try {
      await deleteStrategyAnalysis(userId, analysisId);
      
      // Update state
      setSavedAnalyses(prev => prev.filter(analysis => analysis.id !== analysisId));
      
      // If the deleted analysis was selected, select another one
      if (selectedAnalysisId === analysisId) {
        const remainingAnalyses = savedAnalyses.filter(a => a.id !== analysisId);
        setSelectedAnalysisId(remainingAnalyses.length > 0 ? remainingAnalyses[0].id : null);
      }
      
      toast({
        title: "Analysis Deleted",
        description: "Analysis has been successfully deleted",
      });
    } catch (error) {
      console.error('Error deleting analysis:', error);
      toast({
        title: "Error",
        description: "Could not delete the analysis",
        variant: "destructive",
      });
    }
  };

  // Find the selected analysis
  const selectedAnalysis = savedAnalyses.find(a => a.id === selectedAnalysisId);

  // Format date for display with improved readability
  const formatDate = (timestamp: any) => {
    if (!timestamp || !timestamp.toDate) return 'N/A';
    
    try {
      const date = timestamp.toDate();
      // Format to more specific date/time for better readability
      const timeAgo = formatDistanceToNow(date, { addSuffix: true, locale: enUS });
      
      // Make it more readable by shortening and making it more precise
      return timeAgo
        .replace('about ', '')
        .replace('less than a minute ago', 'just now');
    } catch (e) {
      console.error('Error formatting date:', e);
      return 'N/A';
    }
  };

  // Get impact color for badges
  const getImpactColor = (impact: string) => {
    switch (impact.toLowerCase()) {
      case 'high':
        return 'bg-red-500/10 text-red-700 border-red-200 dark:bg-red-500/20 dark:text-red-400 dark:border-red-800';
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-700 border-yellow-200 dark:bg-yellow-500/20 dark:text-yellow-400 dark:border-yellow-800';
      case 'low':
        return 'bg-green-500/10 text-green-700 border-green-200 dark:bg-green-500/20 dark:text-green-400 dark:border-green-800';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-200 dark:bg-gray-500/20 dark:text-gray-400 dark:border-gray-800';
    }
  };

  // Get performance color based on win rate
  const getPerformanceColor = (winRate: number) => {
    if (winRate >= 60) return 'text-green-600 dark:text-green-400';
    if (winRate >= 40) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  // Format detailed date with time
  const formatDetailedDate = (timestamp: any) => {
    if (!timestamp || !timestamp.toDate) return 'N/A';
    
    try {
      const date = timestamp.toDate();
      return format(date, 'MMM dd, yyyy \'at\' HH:mm', { locale: enUS });
    } catch (e) {
      console.error('Error formatting detailed date:', e);
      return 'N/A';
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Icons.ui.spinner className="w-8 h-8 animate-spin text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">Loading saved analyses...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Empty State */}
      {savedAnalyses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
            <Icons.nav.analytics className="h-8 w-8 text-muted-foreground/40" />
          </div>
          <h3 className="text-lg font-medium text-muted-foreground mb-2">No saved analyses yet</h3>
          <p className="text-sm text-muted-foreground/80 max-w-md">
            Analyze strategies in the "AI Analysis" tab and save them for later review. 
            You can save up to 5 analyses.
          </p>
        </div>
      ) : (
        /* Toggle List */
        <Accordion type="single" collapsible className="space-y-3">
          {savedAnalyses.map((analysis) => (
            <AccordionItem
              key={analysis.id}
              value={analysis.id}
              className="border border-border/50 rounded-lg overflow-hidden bg-card"
            >
              <AccordionTrigger className="px-4 py-3 hover:bg-muted/30 transition-colors [&[data-state=open]>div>div:last-child]:rotate-180">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3 text-left">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex-shrink-0">
                      <Icons.nav.analytics className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{analysis.strategyName}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDetailedDate(analysis.createdAt)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant="secondary" className="text-xs px-2 py-0.5">
                      <Icons.trade.profit className="h-3 w-3 mr-1" />
                      {analysis.data.overallPerformance?.winRate || 0}% win rate
                    </Badge>
                    
                    <div 
                      className="h-8 w-8 rounded-md flex items-center justify-center text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteAnalysis(analysis.id);
                      }}
                    >
                      <Icons.ui.x className="h-3.5 w-3.5" />
                    </div>
                  </div>
                </div>
              </AccordionTrigger>
              
              <AccordionContent className="px-4 pb-4 space-y-4">
                {/* Overall Performance Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/20 rounded-lg">
                  <div className="text-center">
                    <div className="text-lg font-semibold">{analysis.data.overallPerformance?.totalTrades || 0}</div>
                    <div className="text-xs text-muted-foreground">Total Trades</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-lg font-semibold ${getPerformanceColor(analysis.data.overallPerformance?.winRate || 0)}`}>
                      {analysis.data.overallPerformance?.winRate || 0}%
                    </div>
                    <div className="text-xs text-muted-foreground">Win Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                      ${analysis.data.overallPerformance?.avgProfit?.toFixed(2) || '0.00'}
                    </div>
                    <div className="text-xs text-muted-foreground">Avg Profit</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                      {analysis.data.overallPerformance?.profitFactor?.toFixed(2) || '0.00'}
                    </div>
                    <div className="text-xs text-muted-foreground">Profit Factor</div>
                  </div>
                </div>

                {/* AI Summary */}
                {analysis.data.summary && (
                  <div className="p-4 bg-blue-50/50 dark:bg-blue-950/20 rounded-lg border border-blue-200/30 dark:border-blue-800/30">
                    <h4 className="font-medium text-sm mb-2 flex items-center">
                      <Icons.nav.analytics className="h-4 w-4 mr-2 text-blue-600" />
                      AI Analysis Summary
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {analysis.data.summary}
                    </p>
                  </div>
                )}

                {/* Recommendations */}
                {analysis.data.recommendations && analysis.data.recommendations.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm flex items-center">
                      <Icons.ui.zap className="h-4 w-4 mr-2 text-yellow-600" />
                      AI Recommendations ({analysis.data.recommendations.length})
                    </h4>
                    
                    <div className="space-y-2">
                      {analysis.data.recommendations.slice(0, 3).map((recommendation) => (
                        <div 
                          key={recommendation.id}
                          className="p-3 rounded-lg border border-border/30 bg-background/50"
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h5 className="font-medium text-sm">{recommendation.title}</h5>
                            <Badge className={`${getImpactColor(recommendation.impact)} text-xs`}>
                              {recommendation.impact}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">{recommendation.description}</p>
                          <div className="text-xs text-muted-foreground">
                            Confidence: <span className="font-medium">{recommendation.confidence}%</span>
                          </div>
                        </div>
                      ))}
                      
                      {analysis.data.recommendations.length > 3 && (
                        <div className="text-center py-2">
                          <span className="text-xs text-muted-foreground">
                            +{analysis.data.recommendations.length - 3} more recommendations
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}