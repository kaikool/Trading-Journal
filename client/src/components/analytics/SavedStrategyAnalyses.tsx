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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Icons } from "@/components/icons/icons";
import { useToast } from "@/hooks/use-toast";
import { TradingStrategy } from "@/types";
import { useAuth } from "@/hooks/use-auth";
import { getStrategyAnalyses, deleteStrategyAnalysis } from "@/lib/firebase";
import { formatDistanceToNow } from 'date-fns';
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

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-purple-950/30 border border-blue-200/30 dark:border-blue-800/30">
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-800 dark:[mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.05))]" />
        <div className="relative p-8">
          <h2 className="text-xl font-bold mb-4">Saved Strategy Analyses</h2>
          
          {savedAnalyses.length === 0 ? (
            <div className="p-6 text-center bg-white/60 dark:bg-gray-800/60 backdrop-blur rounded-xl border border-white/20 dark:border-gray-700/20">
              <Icons.nav.analytics className="h-16 w-16 text-muted-foreground/40 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">No saved analyses yet</h3>
              <p className="text-sm text-muted-foreground/80">
                Analyze strategies in the "AI Analysis" tab and save them for later review
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-4">
              {savedAnalyses.map((analysis) => (
                <Button
                  key={analysis.id}
                  variant={selectedAnalysisId === analysis.id ? "default" : "outline"}
                  size="sm"
                  className={`h-auto text-left py-3 px-4 ${
                    selectedAnalysisId === analysis.id ? 'border-primary/40' : 'bg-white/80 dark:bg-black/20'
                  }`}
                  onClick={() => setSelectedAnalysisId(analysis.id)}
                >
                  <div className="space-y-1">
                    <div className="font-medium px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                      {analysis.strategyName}
                    </div>
                    <div className="text-xs flex items-center gap-1.5 font-medium text-gray-600 dark:text-gray-400">
                      <Icons.ui.calendar className="h-3 w-3 mr-0.5" />
                      {formatDate(analysis.createdAt)}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Analysis Detail */}
      {selectedAnalysis && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold">{selectedAnalysis.strategyName}</h3>
              <p className="text-sm text-muted-foreground">
                Analysis from {formatDate(selectedAnalysis.createdAt)}
              </p>
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              onClick={() => handleDeleteAnalysis(selectedAnalysis.id)}
            >
              <Icons.ui.x className="h-4 w-4" />
              <span className="sr-only">Delete analysis</span>
            </Button>
          </div>
          
          {/* Overall Performance section has been removed */}
          
          {/* Condition Performance section has been removed */}
          
          {/* Recommendations */}
          {selectedAnalysis.data.recommendations && selectedAnalysis.data.recommendations.length > 0 && (
            <div className="bg-white dark:bg-background border border-border/40 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-border/30 bg-muted/20">
                <h3 className="font-semibold">AI Recommendations</h3>
              </div>
              
              <div className="p-4 space-y-3">
                {selectedAnalysis.data.recommendations.map((recommendation) => (
                  <div 
                    key={recommendation.id}
                    className="p-4 rounded-lg border border-border/30"
                  >
                    <h4 className="font-medium mb-2">{recommendation.title}</h4>
                    <p className="text-sm text-muted-foreground mb-3">{recommendation.description}</p>
                    
                    <div className="flex items-center gap-3">
                      <Badge className={getImpactColor(recommendation.impact)}>
                        {recommendation.impact}
                      </Badge>
                      
                      <div className="text-sm">
                        Confidence: <span className="font-medium">{recommendation.confidence}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}