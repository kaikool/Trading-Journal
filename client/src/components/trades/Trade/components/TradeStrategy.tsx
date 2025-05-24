import React, { useMemo } from 'react';
import { useFormContext } from "react-hook-form";
import { FormField, FormItem, FormControl, FormMessage } from "@/components/ui/form";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Icons } from '@/components/icons/icons';
import { TradeFormValues } from '../types';
import { TradingStrategy, StrategyConditionCheck } from '@/types';
import { StrategyChecklist } from '../StrategyChecklistComponent';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// Options with colors for various categories
const optionGroups = {
  emotion: [
    { value: "calm", label: "Calm", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
    { value: "confident", label: "Confident", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" },
    { value: "fearful", label: "Fearful", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300" },
    { value: "greedy", label: "Greedy", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" },
    { value: "anxious", label: "Anxious", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300" },
    { value: "excited", label: "Excited", color: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300" },
    { value: "impatient", label: "Impatient", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" },
    { value: "uncertain", label: "Uncertain", color: "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300" },
    { value: "frustrated", label: "Frustrated", color: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300" },
    { value: "regretful", label: "Regretful", color: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300" }
  ],
  market: [
    { value: "trending", label: "Trending", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300" },
    { value: "ranging", label: "Ranging", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
    { value: "volatile", label: "Volatile", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" },
    { value: "consolidating", label: "Consolidating", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300" },
    { value: "breakout", label: "Breakout", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" }
  ],
  session: [
    { value: "london", label: "London", color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300" },
    { value: "newyork", label: "New York", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
    { value: "tokyo", label: "Tokyo", color: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300" },
    { value: "sydney", label: "Sydney", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300" },
    { value: "overlap", label: "Overlap", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" }
  ]
};

// Reusable components
const OptionBadges = ({ 
  options, 
  value, 
  onChange
}: { 
  options: any[]; 
  value: string | undefined; 
  onChange: (value: string) => void; 
}) => (
  <div className="flex flex-wrap gap-1.5">
    {options.map(option => (
      <Badge 
        key={option.value} 
        variant={value === option.value ? "default" : "outline"}
        className={cn(
          "cursor-pointer px-2 py-0.5 text-xs font-normal hover:bg-muted/40",
          value === option.value ? option.color : "border-border/40"
        )}
        onClick={() => onChange(option.value)}
      >
        {option.label}
      </Badge>
    ))}
  </div>
);

const CategorySection = ({ 
  title, 
  options, 
  value, 
  onChange
}: { 
  title: string;
  options: any[];
  value: string | undefined;
  onChange: (value: string) => void;
}) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between">
      <Label className="text-sm font-medium">{title}</Label>
      {value && (
        <Badge variant="outline" className="text-xs px-1.5 py-0 h-5 bg-primary/5 border-primary/10">
          {options.find(o => o.value === value)?.label}
        </Badge>
      )}
    </div>
    <OptionBadges 
      options={options} 
      value={value} 
      onChange={onChange}
    />
  </div>
);

interface TradeStrategyProps {
  strategies: TradingStrategy[];
  isLoadingStrategies: boolean;
  selectedStrategy: TradingStrategy | null;
  strategyChecks: StrategyConditionCheck[];
  handleStrategyCheckToggle: (id: string, checked: boolean) => void;
}

export function TradeStrategy({
  strategies,
  isLoadingStrategies,
  selectedStrategy,
  strategyChecks,
  handleStrategyCheckToggle
}: TradeStrategyProps) {
  const form = useFormContext<TradeFormValues>();
  
  // Find current selected options
  const selectedOptions = useMemo(() => ({
    emotion: form.watch('emotion') 
      ? optionGroups.emotion.find(o => o.value === form.watch('emotion')) 
      : null,
    market: form.watch('marketCondition') 
      ? optionGroups.market.find(o => o.value === form.watch('marketCondition')) 
      : null,
    session: form.watch('sessionType') 
      ? optionGroups.session.find(o => o.value === form.watch('sessionType')) 
      : null,
    pattern: form.watch('techPattern')
  }), [
    form.watch('emotion'), 
    form.watch('marketCondition'), 
    form.watch('sessionType'),
    form.watch('techPattern')
  ]);
  
  // Check if any option is selected
  const hasSelections = useMemo(() => 
    Object.values(selectedOptions).some(value => value), 
    [selectedOptions]
  );
  
  return (
    <div className="space-y-5">
      {/* Header with selected strategy badge */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-medium tracking-tight">Trading Strategy</h3>
        
        {selectedStrategy && (
          <Badge variant="outline" className="px-2 py-0.5 bg-primary/5 border-primary/10">
            <Icons.nav.analytics className="h-3 w-3 mr-1.5 text-primary" />
            {selectedStrategy.name}
          </Badge>
        )}
      </div>
      
      {/* Strategy selection card */}
      <Card className="border-border/30 shadow-sm bg-card/50">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-sm font-medium">
            Select Strategy
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {isLoadingStrategies ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[1, 2, 3, 4].map(i => (
                <div 
                  key={i} 
                  className="h-10 rounded-md bg-muted/50 animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {strategies.map(strategy => (
                <Badge 
                  key={strategy.id} 
                  variant={form.watch('strategy') === strategy.id ? "default" : "outline"}
                  className={cn(
                    "cursor-pointer h-auto py-2 px-3 flex items-center justify-between",
                    form.watch('strategy') === strategy.id 
                      ? "bg-primary/10 text-primary hover:bg-primary/20 border-primary/20" 
                      : "bg-card hover:bg-muted/40 border-border/40"
                  )}
                  onClick={() => form.setValue('strategy', strategy.id)}
                >
                  <div className="flex items-center gap-1.5">
                    <Icons.ui.circleCheck className={cn(
                      "h-3.5 w-3.5",
                      form.watch('strategy') === strategy.id ? "text-primary" : "text-muted-foreground/40"
                    )} />
                    <span className="font-medium text-xs">{strategy.name}</span>
                  </div>
                  {strategy.isDefault && (
                    <div className="rounded-full bg-primary/10 h-1.5 w-1.5"></div>
                  )}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Strategy checklist section */}
      {selectedStrategy && strategyChecks.length > 0 && (
        <Card className="border-border/30 shadow-sm bg-card/50">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span>Strategy Checklist</span>
              <Badge variant="outline" className="h-5 px-1.5 bg-primary/5 border-primary/20 text-xs">
                {strategyChecks.filter(c => c.checked && c.passed).length}/{strategyChecks.length}
              </Badge>
            </CardTitle>
            <CardDescription className="text-xs">
              Confirm your strategy conditions
            </CardDescription>
          </CardHeader>
          
          <CardContent className="px-4 pb-4">
            <StrategyChecklist
              strategy={selectedStrategy}
              value={strategyChecks}
              showCompliance={false}
              onChange={(checks) => {
                if (checks.length > 0) {
                  for (const check of checks) {
                    handleStrategyCheckToggle(check.conditionId, check.checked);
                  }
                }
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* Technical pattern input card */}
      <Card className="border-border/30 shadow-sm bg-card/50">
        <CardContent className="pt-3 px-4 pb-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-1 mb-1">
              <div className="flex items-center gap-1">
                <Icons.analytics.chartLine className="h-3.5 w-3.5 text-primary" />
                <Label htmlFor="techPattern" className="text-sm">Technical Pattern</Label>
              </div>
              {selectedOptions.pattern && (
                <Badge variant="outline" className="text-xs px-1.5 py-0 h-5 bg-primary/5 border-primary/10">
                  {selectedOptions.pattern}
                </Badge>
              )}
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
                      className="h-8 text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Market context and trading session */}
      <Card className="border-border/30 shadow-sm bg-card/50">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-sm font-medium">
            Market Context
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="space-y-5">
            {/* Market condition */}
            <FormField
              control={form.control}
              name="marketCondition"
              render={({ field }) => (
                <FormItem>
                  <CategorySection
                    title="Market Condition"
                    options={optionGroups.market}
                    value={field.value}
                    onChange={field.onChange}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Session type */}
            <FormField
              control={form.control}
              name="sessionType"
              render={({ field }) => (
                <FormItem>
                  <CategorySection
                    title="Trading Session"
                    options={optionGroups.session}
                    value={field.value}
                    onChange={field.onChange}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Trading psychology */}
      <Card className="border-border/30 shadow-sm bg-card/50">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-sm font-medium">
            Trading Psychology
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <FormField
            control={form.control}
            name="emotion"
            render={({ field }) => (
              <FormItem>
                <CategorySection
                  title="Emotional State"
                  options={optionGroups.emotion}
                  value={field.value}
                  onChange={field.onChange}
                />
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>
      
      {/* Selected options summary */}
      {hasSelections && (
        <Card className="border-border/30 shadow-sm bg-muted/5">
          <CardHeader className="pb-0 pt-3 px-4">
            <CardTitle className="text-xs font-medium">
              Selected Parameters
            </CardTitle>
          </CardHeader>
          
          <CardContent className="px-4 pb-4 pt-3">
            <div className="flex flex-wrap gap-2">
              {selectedStrategy && (
                <Badge variant="outline" className="bg-primary/5 text-xs px-2 border-primary/20">
                  {selectedStrategy.name}
                </Badge>
              )}
              
              {selectedOptions.pattern && (
                <Badge variant="outline" className="bg-background text-xs px-2">
                  {selectedOptions.pattern}
                </Badge>
              )}
              
              {selectedOptions.market && (
                <Badge className={`text-xs px-2 ${selectedOptions.market.color}`}>
                  {selectedOptions.market.label}
                </Badge>
              )}
              
              {selectedOptions.session && (
                <Badge className={`text-xs px-2 ${selectedOptions.session.color}`}>
                  {selectedOptions.session.label}
                </Badge>
              )}
              
              {selectedOptions.emotion && (
                <Badge className={`text-xs px-2 ${selectedOptions.emotion.color}`}>
                  {selectedOptions.emotion.label}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}