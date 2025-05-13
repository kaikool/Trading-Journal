import React, { useMemo } from 'react';
import { useFormContext } from "react-hook-form";
import { FormField, FormItem, FormControl, FormMessage } from "@/components/ui/form";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Icons } from '@/components/icons/icons';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TradeFormValues } from '../types';
import { TradingStrategy, StrategyConditionCheck } from '@/types';
import { StrategyChecklist } from '../../StrategyChecklistComponent';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

interface TradeStrategyProps {
  strategies: TradingStrategy[];
  isLoadingStrategies: boolean;
  selectedStrategy: TradingStrategy | null;
  strategyChecks: StrategyConditionCheck[];
  handleStrategyCheckToggle: (id: string, checked: boolean) => void;
}

const emotionOptions = [
  { value: "calm", label: "Calm", icon: <Icons.ui.info className="h-3 w-3 mr-1" />, color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
  { value: "confident", label: "Confident", icon: <Icons.analytics.award className="h-3 w-3 mr-1" />, color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" },
  { value: "fearful", label: "Fearful", icon: <Icons.ui.warning className="h-3 w-3 mr-1" />, color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300" },
  { value: "greedy", label: "Greedy", icon: <Icons.ui.dollarSign className="h-3 w-3 mr-1" />, color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" },
  { value: "anxious", label: "Anxious", icon: <Icons.general.clock className="h-3 w-3 mr-1" />, color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300" },
  { value: "excited", label: "Excited", icon: <Icons.ui.circleDot className="h-3 w-3 mr-1" />, color: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300" },
  { value: "impatient", label: "Impatient", icon: <Icons.general.clock className="h-3 w-3 mr-1" />, color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" },
  { value: "uncertain", label: "Uncertain", icon: <Icons.ui.info className="h-3 w-3 mr-1" />, color: "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300" },
  { value: "frustrated", label: "Frustrated", icon: <Icons.trade.arrowUp className="h-3 w-3 mr-1" />, color: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300" },
  { value: "regretful", label: "Regretful", icon: <Icons.ui.refresh className="h-3 w-3 mr-1" />, color: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300" }
];

const marketConditionOptions = [
  { value: "trending", label: "Trending", icon: <Icons.analytics.trendingUp className="h-3 w-3 mr-1" />, color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300" },
  { value: "ranging", label: "Ranging", icon: <Icons.ui.moveVertical className="h-3 w-3 mr-1" />, color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
  { value: "volatile", label: "Volatile", icon: <Icons.analytics.activity className="h-3 w-3 mr-1" />, color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" },
  { value: "consolidating", label: "Consolidating", icon: <Icons.analytics.compare className="h-3 w-3 mr-1" />, color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300" },
  { value: "breakout", label: "Breakout", icon: <Icons.analytics.trending className="h-3 w-3 mr-1" />, color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" },
];

const sessionOptions = [
  { value: "london", label: "London", icon: <Icons.ui.circleDot className="h-3 w-3 mr-1" />, color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300" },
  { value: "newyork", label: "New York", icon: <Icons.general.database className="h-3 w-3 mr-1" />, color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
  { value: "tokyo", label: "Tokyo", icon: <Icons.ui.sun className="h-3 w-3 mr-1" />, color: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300" },
  { value: "sydney", label: "Sydney", icon: <Icons.general.database className="h-3 w-3 mr-1" />, color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300" },
  { value: "overlap", label: "Session Overlap", icon: <Icons.ui.circleCheck className="h-3 w-3 mr-1" />, color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" },
];

export function TradeStrategy({
  strategies,
  isLoadingStrategies,
  selectedStrategy,
  strategyChecks,
  handleStrategyCheckToggle
}: TradeStrategyProps) {
  const form = useFormContext<TradeFormValues>();
  
  // Find current emotion option
  const selectedEmotion = useMemo(() => {
    const currentValue = form.watch('emotion');
    return currentValue ? emotionOptions.find(option => option.value === currentValue) : null;
  }, [form.watch('emotion')]);
  
  // Find current market condition option
  const selectedMarketCondition = useMemo(() => {
    const currentValue = form.watch('marketCondition');
    return currentValue ? marketConditionOptions.find(option => option.value === currentValue) : null;
  }, [form.watch('marketCondition')]);
  
  // Find current session option
  const selectedSession = useMemo(() => {
    const currentValue = form.watch('sessionType');
    return currentValue ? sessionOptions.find(option => option.value === currentValue) : null;
  }, [form.watch('sessionType')]);
  
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold tracking-tight">Trading Strategy</h3>
        
        {selectedStrategy && (
          <Badge variant="outline" className="px-2 py-0.5 bg-primary/5 border-primary/10">
            <Icons.nav.analytics className="h-3 w-3 mr-1.5 text-primary" />
            {selectedStrategy.name}
          </Badge>
        )}
      </div>
      
      <Card className="border-border/30 shadow-sm overflow-hidden">
        <div className="bg-muted/10 border-b border-border/40 py-2.5 px-4">
          <div className="flex items-center gap-1.5">
            <Icons.ui.settings2 className="h-3.5 w-3.5 text-primary" />
            <span className="text-sm font-medium">Strategy Configuration</span>
          </div>
        </div>
        
        <CardContent className="px-4 py-4 space-y-5">
          {/* Strategy Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Icons.nav.analytics className="h-3.5 w-3.5 text-muted-foreground" />
                <Label htmlFor="strategy" className="text-sm">Strategy</Label>
              </div>
              <FormField
                control={form.control}
                name="strategy"
                render={({ field }) => (
                  <FormItem>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                      disabled={isLoadingStrategies}
                    >
                      <FormControl>
                        <SelectTrigger id="strategy" className="h-9">
                          {isLoadingStrategies ? (
                            <div className="flex items-center gap-2">
                              <Icons.ui.spinner className="h-3 w-3 animate-spin" />
                              <span>Loading strategies...</span>
                            </div>
                          ) : (
                            <SelectValue placeholder="Select strategy" />
                          )}
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {strategies.map(strategy => (
                          <SelectItem key={strategy.id} value={strategy.id} className="text-sm">
                            {strategy.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Technical Pattern */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Icons.analytics.chartLine className="h-3.5 w-3.5 text-muted-foreground" />
                <Label htmlFor="techPattern" className="text-sm">Technical Pattern</Label>
              </div>
              <FormField
                control={form.control}
                name="techPattern"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        id="techPattern"
                        placeholder="e.g., Double Top, Engulfing Pattern"
                        className="h-9"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
          
          <Separator className="my-1" />
            
          {/* Emotions and Market Conditions in one row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Emotions as Badges */}
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <Icons.general.heart className="h-3.5 w-3.5 text-muted-foreground" />
                  <Label className="text-sm">Emotion</Label>
                </div>
                {selectedEmotion && (
                  <Badge className="h-5 px-1.5 bg-primary/10 border-primary/20 text-primary text-xs">
                    {selectedEmotion.label}
                  </Badge>
                )}
              </div>
              
              <FormField
                control={form.control}
                name="emotion"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex flex-wrap gap-1.5 bg-muted/5 p-2 rounded-md border border-border/30">
                      {emotionOptions.map(option => (
                        <Badge 
                          key={option.value} 
                          variant={field.value === option.value ? "default" : "outline"}
                          className={`cursor-pointer px-2 py-0.5 text-xs font-normal hover:bg-background ${field.value === option.value ? option.color : ''}`}
                          onClick={() => field.onChange(option.value)}
                        >
                          {option.icon}
                          {option.label}
                        </Badge>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Market conditions as Badges */}
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <Icons.analytics.lineChart className="h-3.5 w-3.5 text-muted-foreground" />
                  <Label className="text-sm">Market Condition</Label>
                </div>
                {selectedMarketCondition && (
                  <Badge className="h-5 px-1.5 bg-primary/10 border-primary/20 text-primary text-xs">
                    {selectedMarketCondition.label}
                  </Badge>
                )}
              </div>
              
              <FormField
                control={form.control}
                name="marketCondition"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex flex-wrap gap-1.5 bg-muted/5 p-2 rounded-md border border-border/30">
                      {marketConditionOptions.map(option => (
                        <Badge 
                          key={option.value} 
                          variant={field.value === option.value ? "default" : "outline"}
                          className={`cursor-pointer px-2 py-0.5 text-xs font-normal hover:bg-background ${field.value === option.value ? option.color : ''}`}
                          onClick={() => field.onChange(option.value)}
                        >
                          {option.icon}
                          {option.label}
                        </Badge>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
          
          {/* Session Type as Badges */}
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <Icons.general.clock className="h-3.5 w-3.5 text-muted-foreground" />
                <Label className="text-sm">Trading Session</Label>
              </div>
              {selectedSession && (
                <Badge className="h-5 px-1.5 bg-primary/10 border-primary/20 text-primary text-xs">
                  {selectedSession.label}
                </Badge>
              )}
            </div>
            
            <FormField
              control={form.control}
              name="sessionType"
              render={({ field }) => (
                <FormItem>
                  <div className="flex flex-wrap gap-1.5 bg-muted/5 p-2 rounded-md border border-border/30">
                    {sessionOptions.map(option => (
                      <Badge 
                        key={option.value} 
                        variant={field.value === option.value ? "default" : "outline"}
                        className={`cursor-pointer px-2 py-0.5 text-xs font-normal hover:bg-background ${field.value === option.value ? option.color : ''}`}
                        onClick={() => field.onChange(option.value)}
                      >
                        {option.icon}
                        {option.label}
                      </Badge>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>
      

    </div>
  );
}