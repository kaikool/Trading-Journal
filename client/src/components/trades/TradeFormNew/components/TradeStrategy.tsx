import React, { useMemo } from 'react';
import { useFormContext } from "react-hook-form";
import { FormField, FormItem, FormControl, FormMessage } from "@/components/ui/form";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Icons } from '@/components/icons/icons';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TradeFormValues } from '../types';
import { TradingStrategy, StrategyConditionCheck } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';

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
  { value: "overlap", label: "Session Overlap", icon: <Icons.ui.check className="h-3 w-3 mr-1" />, color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" },
];

export function TradeStrategy({
  strategies,
  isLoadingStrategies,
  selectedStrategy,
  strategyChecks,
  handleStrategyCheckToggle,
}: TradeStrategyProps) {
  const form = useFormContext<TradeFormValues>();
  
  const selectedStrategyId = form.watch('strategyId');
  const emotion = form.watch('emotion');
  const marketCondition = form.watch('marketCondition');
  const tradingSession = form.watch('session');
  
  // Find the currently selected emotion option
  const selectedEmotion = emotionOptions.find(e => e.value === emotion);
  const selectedMarketCondition = marketConditionOptions.find(m => m.value === marketCondition);
  const selectedSession = sessionOptions.find(s => s.value === tradingSession);
  
  // Format strategy name and generate strategy card info
  const formatStrategyName = (name: string) => {
    if (!name) return "Untitled Strategy";
    if (name.length <= 25) return name;
    return `${name.substring(0, 22)}...`;
  };
  
  return (
    <div className="space-y-4">
      {/* Strategy selection */}
      <div className="mb-2 space-y-3">
        <FormField
          control={form.control}
          name="strategyId"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <Label className="flex items-center">
                  <Icons.ui.target className="h-3.5 w-3.5 mr-1.5 text-primary" />
                  Trading Strategy
                </Label>
              </div>
              <FormControl>
                <Select 
                  value={field.value} 
                  onValueChange={field.onChange}
                  disabled={isLoadingStrategies}
                >
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue placeholder="Select a strategy" />
                  </SelectTrigger>
                  <SelectContent>
                    {strategies.map((strategy) => (
                      <SelectItem key={strategy.id} value={strategy.id}>
                        {strategy.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      
      {/* Strategy card - shows details of the selected strategy */}
      {selectedStrategy && (
        <Card className="border-border/30 shadow-sm">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-medium flex items-center gap-1.5">
              <Icons.trade.strategy className="h-3.5 w-3.5 text-primary" />
              {formatStrategyName(selectedStrategy.name)}
            </CardTitle>
            <CardDescription className="text-xs">
              {selectedStrategy.description || "No description provided"}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="px-4 pb-4">
            <div className="grid grid-cols-3 gap-3 mb-4">
              {/* Trade emotion */}
              <FormField
                control={form.control}
                name="emotion"
                render={({ field }) => (
                  <FormItem>
                    <Label className="text-xs text-muted-foreground">Emotion</Label>
                    <div className="h-9 mt-1">
                      <FormControl>
                        <Select 
                          value={field.value} 
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className="h-8 w-full border-dashed text-xs">
                            <SelectValue>
                              {selectedEmotion ? (
                                <span className="flex items-center truncate">
                                  {selectedEmotion.icon}
                                  {selectedEmotion.label}
                                </span>
                              ) : "Select..."}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {emotionOptions.map((emotion) => (
                              <SelectItem 
                                key={emotion.value} 
                                value={emotion.value}
                                className="text-xs"
                              >
                                <span className="flex items-center">
                                  {emotion.icon}
                                  {emotion.label}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Market condition */}
              <FormField
                control={form.control}
                name="marketCondition"
                render={({ field }) => (
                  <FormItem>
                    <Label className="text-xs text-muted-foreground">Market Condition</Label>
                    <div className="h-9 mt-1">
                      <FormControl>
                        <Select 
                          value={field.value} 
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className="h-8 w-full border-dashed text-xs">
                            <SelectValue>
                              {selectedMarketCondition ? (
                                <span className="flex items-center truncate">
                                  {selectedMarketCondition.icon}
                                  {selectedMarketCondition.label}
                                </span>
                              ) : "Select..."}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {marketConditionOptions.map((condition) => (
                              <SelectItem 
                                key={condition.value} 
                                value={condition.value}
                                className="text-xs"
                              >
                                <span className="flex items-center">
                                  {condition.icon}
                                  {condition.label}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Trading session */}
              <FormField
                control={form.control}
                name="session"
                render={({ field }) => (
                  <FormItem>
                    <Label className="text-xs text-muted-foreground">Trading Session</Label>
                    <div className="h-9 mt-1">
                      <FormControl>
                        <Select 
                          value={field.value} 
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className="h-8 w-full border-dashed text-xs">
                            <SelectValue>
                              {selectedSession ? (
                                <span className="flex items-center truncate">
                                  {selectedSession.icon}
                                  {selectedSession.label}
                                </span>
                              ) : "Select..."}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {sessionOptions.map((session) => (
                              <SelectItem 
                                key={session.value} 
                                value={session.value}
                                className="text-xs"
                              >
                                <span className="flex items-center">
                                  {session.icon}
                                  {session.label}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <Separator className="my-3" />
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Notes</Label>
                <FormField
                  control={form.control}
                  name="strategyNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Any special notes for this trade"
                          className="h-8 text-xs bg-muted/20"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Pattern</Label>
                <FormField
                  control={form.control}
                  name="pattern"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Trading pattern identified"
                          className="h-8 text-xs bg-muted/20"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Strategy checklist section */}
      {selectedStrategy && strategyChecks.length > 0 && (
        <Card className="border-border/30 shadow-sm overflow-hidden">
          <div className="bg-muted/10 border-b border-border/40 py-2.5 px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Icons.trade.listChecks className="h-3.5 w-3.5 text-primary" />
                <span className="text-sm font-medium">Strategy Checklist</span>
              </div>
              <Badge variant="outline" className="h-5 px-1.5 bg-primary/5 text-xs">
                {strategyChecks.filter(c => c.checked && c.passed).length}/{strategyChecks.length} met
              </Badge>
            </div>
          </div>
          
          <CardContent className="px-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Strategy Rules */}
              {selectedStrategy.rules && selectedStrategy.rules.length > 0 && (
                <div className="rounded-md border border-border/30 overflow-hidden bg-background/50">
                  <div className="flex items-center justify-between border-b border-border/30 bg-muted/5 px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      <Icons.nav.analytics className="h-3.5 w-3.5 text-primary" />
                      <span className="text-sm font-medium">Strategy Rules</span>
                    </div>
                    <Badge variant="outline" className="h-5 px-1.5 bg-primary/5 text-xs">
                      {strategyChecks.filter(c => c.checked && c.passed && selectedStrategy.rules.some(r => r.id === c.conditionId)).length}/{selectedStrategy.rules.length}
                    </Badge>
                  </div>
                  <div className="divide-y divide-border/30">
                    {selectedStrategy.rules.map((condition, index) => {
                      const check = strategyChecks.find(c => c.conditionId === condition.id) || {
                        conditionId: condition.id,
                        checked: false,
                        passed: false
                      };
                      return (
                        <div key={`rule-${condition.id || index}`} className="p-3 hover:bg-muted/5 transition-colors">
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-0.5">
                              <Checkbox
                                id={`check-${check.conditionId}`}
                                checked={check.passed}
                                onCheckedChange={(checked: boolean) => {
                                  handleStrategyCheckToggle(check.conditionId, checked);
                                }}
                                className="h-4 w-4 border-primary/40 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <label
                                  htmlFor={`check-${check.conditionId}`}
                                  className="text-sm font-medium cursor-pointer flex-1"
                                >
                                  {condition.label || "Untitled condition"}
                                </label>
                                {check.checked && (
                                  <Badge 
                                    variant={check.passed ? "default" : "outline"} 
                                    className={`text-[10px] h-4 px-1.5 ml-2 ${check.passed 
                                      ? "bg-success/20 hover:bg-success/20 text-success border-success/20" 
                                      : "bg-destructive/10 hover:bg-destructive/10 text-destructive border-destructive/20"}`}
                                  >
                                    {check.passed 
                                      ? <span className="flex items-center"><Icons.ui.check className="h-2.5 w-2.5 mr-0.5" />Passed</span> 
                                      : <span className="flex items-center"><Icons.ui.x className="h-2.5 w-2.5 mr-0.5" />Failed</span>}
                                  </Badge>
                                )}
                              </div>
                              
                              {condition.description && (
                                <p className="text-xs text-muted-foreground">
                                  {condition.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {/* Entry Conditions */}
              {selectedStrategy.entryConditions && selectedStrategy.entryConditions.length > 0 && (
                <div className="rounded-md border border-border/30 overflow-hidden bg-background/50">
                  <div className="flex items-center justify-between border-b border-border/30 bg-muted/5 px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      <Icons.trade.entry className="h-3.5 w-3.5 text-primary" />
                      <span className="text-sm font-medium">Entry Conditions</span>
                    </div>
                    <Badge variant="outline" className="h-5 px-1.5 bg-primary/5 text-xs">
                      {strategyChecks.filter(c => c.checked && c.passed && selectedStrategy.entryConditions.some(r => r.id === c.conditionId)).length}/{selectedStrategy.entryConditions.length}
                    </Badge>
                  </div>
                  <div className="divide-y divide-border/30">
                    {selectedStrategy.entryConditions.map((condition, index) => {
                      const check = strategyChecks.find(c => c.conditionId === condition.id) || {
                        conditionId: condition.id,
                        checked: false,
                        passed: false
                      };
                      return (
                        <div key={`entry-${condition.id || index}`} className="p-3 hover:bg-muted/5 transition-colors">
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-0.5">
                              <Checkbox
                                id={`check-${check.conditionId}`}
                                checked={check.passed}
                                onCheckedChange={(checked: boolean) => {
                                  handleStrategyCheckToggle(check.conditionId, checked);
                                }}
                                className="h-4 w-4 border-primary/40 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <label
                                  htmlFor={`check-${check.conditionId}`}
                                  className="text-sm font-medium cursor-pointer flex-1"
                                >
                                  {condition.label || "Untitled condition"}
                                </label>
                                {check.checked && (
                                  <Badge 
                                    variant={check.passed ? "default" : "outline"} 
                                    className={`text-[10px] h-4 px-1.5 ml-2 ${check.passed 
                                      ? "bg-success/20 hover:bg-success/20 text-success border-success/20" 
                                      : "bg-destructive/10 hover:bg-destructive/10 text-destructive border-destructive/20"}`}
                                  >
                                    {check.passed 
                                      ? <span className="flex items-center"><Icons.ui.check className="h-2.5 w-2.5 mr-0.5" />Passed</span> 
                                      : <span className="flex items-center"><Icons.ui.x className="h-2.5 w-2.5 mr-0.5" />Failed</span>}
                                  </Badge>
                                )}
                              </div>
                              
                              {condition.description && (
                                <p className="text-xs text-muted-foreground">
                                  {condition.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}