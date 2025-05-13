import React, { useMemo, useState } from 'react';
import { useFormContext } from "react-hook-form";
import { FormField, FormItem, FormControl, FormMessage } from "@/components/ui/form";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Icons } from '@/components/icons/icons';
import { TradeFormValues } from '../types';
import { TradingStrategy, StrategyConditionCheck } from '@/types';
import { StrategyChecklist } from '../../StrategyChecklistComponent';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

interface TradeStrategyProps {
  strategies: TradingStrategy[];
  isLoadingStrategies: boolean;
  selectedStrategy: TradingStrategy | null;
  strategyChecks: StrategyConditionCheck[];
  handleStrategyCheckToggle: (id: string, checked: boolean) => void;
}

// Category options with icons and colors
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

// Category component for selecting strategy options
const CategoryBadges = ({ 
  label, 
  icon, 
  options, 
  value, 
  onChange 
}: { 
  label: string; 
  icon: React.ReactNode; 
  options: any[]; 
  value: string | undefined; 
  onChange: (value: string) => void; 
}) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between mb-1">
      <div className="flex items-center gap-1">
        {icon}
        <Label className="text-sm">{label}</Label>
      </div>
      {value && (
        <Badge variant="outline" className="text-xs px-1.5 py-0 h-5 bg-background">
          Selected: {options.find(o => o.value === value)?.label || value}
        </Badge>
      )}
    </div>
    <div className="flex flex-wrap gap-1.5">
      {options.map(option => (
        <Badge 
          key={option.value} 
          variant={value === option.value ? "default" : "outline"}
          className={`cursor-pointer px-2 py-0.5 text-xs font-normal hover:bg-muted/40 ${value === option.value ? option.color : ''}`}
          onClick={() => onChange(option.value)}
        >
          {option.icon}
          {option.label}
        </Badge>
      ))}
    </div>
  </div>
);

// Strategy selection card component
const StrategySelectionCard = ({ 
  strategies, 
  isLoading, 
  selectedId, 
  onChange 
}: { 
  strategies: TradingStrategy[]; 
  isLoading: boolean; 
  selectedId: string | undefined; 
  onChange: (id: string) => void 
}) => (
  <Card className="border-border/30 shadow-sm">
    <CardHeader className="pb-2 pt-4 px-4">
      <CardTitle className="text-sm font-medium flex items-center gap-1.5">
        <Icons.nav.analytics className="h-3.5 w-3.5 text-primary" />
        Trading Strategy
      </CardTitle>
      <CardDescription className="text-xs">
        Select your preferred trading strategy
      </CardDescription>
    </CardHeader>
    <CardContent className="px-4 pb-4">
      {isLoading ? (
        <div className="flex items-center justify-center py-6">
          <Icons.ui.spinner className="h-5 w-5 mr-2 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Loading strategies...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {strategies.map(strategy => (
            <Badge 
              key={strategy.id} 
              variant={selectedId === strategy.id ? "default" : "outline"}
              className={cn(
                "cursor-pointer h-auto py-2 px-3 flex items-center justify-between gap-2",
                selectedId === strategy.id 
                  ? "bg-primary/10 text-primary hover:bg-primary/20 border-primary/20" 
                  : "bg-card hover:bg-muted/40 border-border/40"
              )}
              onClick={() => onChange(strategy.id)}
            >
              <div className="flex items-center gap-1.5">
                <Icons.ui.checkCircle className={cn(
                  "h-3.5 w-3.5",
                  selectedId === strategy.id ? "text-primary" : "text-muted-foreground/40"
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
);

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
  
  // Maintain active section state
  const [activeSection, setActiveSection] = useState<string | null>(null);
  
  // Toggle section visibility
  const toggleSection = (section: string) => {
    setActiveSection(activeSection === section ? null : section);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold tracking-tight">Trading Strategy</h3>
        
        {selectedStrategy && (
          <Badge variant="outline" className="px-2 py-0.5 bg-primary/5 border-primary/10">
            <Icons.nav.analytics className="h-3 w-3 mr-1.5 text-primary" />
            {selectedStrategy.name}
          </Badge>
        )}
      </div>
      
      {/* Strategy selection */}
      <StrategySelectionCard 
        strategies={strategies}
        isLoading={isLoadingStrategies}
        selectedId={form.watch('strategy')}
        onChange={(id) => form.setValue('strategy', id)}
      />
      
      {/* Technical Pattern input */}
      <Card className="border-border/30 shadow-sm">
        <CardContent className="pt-4 px-4 pb-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-1 mb-1">
              <div className="flex items-center gap-1">
                <Icons.analytics.chartLine className="h-3.5 w-3.5 text-muted-foreground" />
                <Label htmlFor="techPattern" className="text-sm">Technical Pattern</Label>
              </div>
              {form.watch('techPattern') && (
                <Badge variant="outline" className="text-xs px-1.5 py-0 h-5 bg-primary/5 border-primary/10">
                  {form.watch('techPattern')}
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
                      className="h-9"
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
      
      {/* Market Conditions Card */}
      <Card className="border-border/30 shadow-sm">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-medium flex items-center gap-1.5">
            <Icons.analytics.lineChart className="h-3.5 w-3.5 text-primary" />
            Market Context
          </CardTitle>
          <CardDescription className="text-xs">
            Define the market conditions for this trade
          </CardDescription>
        </CardHeader>
        
        <CardContent className="px-4 pb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Market Condition Options */}
            <FormField
              control={form.control}
              name="marketCondition"
              render={({ field }) => (
                <FormItem>
                  <CategoryBadges
                    label="Market Condition"
                    icon={<Icons.analytics.trendingUp className="h-3.5 w-3.5 text-muted-foreground" />}
                    options={marketConditionOptions}
                    value={field.value}
                    onChange={field.onChange}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Session Type Options */}
            <FormField
              control={form.control}
              name="sessionType"
              render={({ field }) => (
                <FormItem>
                  <CategoryBadges
                    label="Trading Session"
                    icon={<Icons.general.clock className="h-3.5 w-3.5 text-muted-foreground" />}
                    options={sessionOptions}
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
      
      {/* Emotion Card */}
      <Card className="border-border/30 shadow-sm">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-medium flex items-center gap-1.5">
            <Icons.general.heart className="h-3.5 w-3.5 text-primary" />
            Trading Psychology
          </CardTitle>
          <CardDescription className="text-xs">
            Identify your emotional state during this trade
          </CardDescription>
        </CardHeader>
        
        <CardContent className="px-4 pb-4">
          <FormField
            control={form.control}
            name="emotion"
            render={({ field }) => (
              <FormItem>
                <CategoryBadges
                  label="Emotion"
                  icon={<Icons.general.heart className="h-3.5 w-3.5 text-muted-foreground" />}
                  options={emotionOptions}
                  value={field.value}
                  onChange={field.onChange}
                />
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>
      
      {/* Selected Options Summary */}
      {(selectedEmotion || selectedMarketCondition || selectedSession || form.watch('techPattern')) && (
        <Card className="border-border/30 shadow-sm bg-muted/5">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs font-medium flex items-center gap-1.5">
              <Icons.ui.circleCheck className="h-3.5 w-3.5 text-primary" />
              Selected Strategy Parameters
            </CardTitle>
          </CardHeader>
          
          <CardContent className="px-4 pb-4 pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Strategy</div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedStrategy ? (
                    <Badge variant="outline" className="bg-background text-xs px-2">
                      <Icons.nav.analytics className="h-3 w-3 mr-1 text-primary" />
                      {selectedStrategy.name}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-background text-xs px-2 text-muted-foreground">
                      <Icons.ui.info className="h-3 w-3 mr-1" />
                      Not selected
                    </Badge>
                  )}
                  
                  {form.watch('techPattern') && (
                    <Badge variant="outline" className="bg-background text-xs px-2">
                      <Icons.analytics.chartLine className="h-3 w-3 mr-1 text-muted-foreground" />
                      {form.watch('techPattern')}
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Market Context</div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedMarketCondition ? (
                    <Badge className={`text-xs px-2 ${selectedMarketCondition.color}`}>
                      {selectedMarketCondition.icon}
                      {selectedMarketCondition.label}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-background text-xs px-2 text-muted-foreground">
                      <Icons.ui.info className="h-3 w-3 mr-1" />
                      No condition
                    </Badge>
                  )}
                  
                  {selectedSession && (
                    <Badge className={`text-xs px-2 ${selectedSession.color}`}>
                      {selectedSession.icon}
                      {selectedSession.label}
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="space-y-1 sm:col-span-2">
                <div className="text-xs text-muted-foreground">Psychology</div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedEmotion ? (
                    <Badge className={`text-xs px-2 ${selectedEmotion.color}`}>
                      {selectedEmotion.icon}
                      {selectedEmotion.label}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-background text-xs px-2 text-muted-foreground">
                      <Icons.ui.info className="h-3 w-3 mr-1" />
                      No emotion selected
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Strategy checklist section */}
      {selectedStrategy && strategyChecks.length > 0 && (
        <Card className="border-border/30 shadow-sm">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-medium flex items-center gap-1.5">
              <Icons.trade.listChecks className="h-3.5 w-3.5 text-primary" />
              Strategy Checklist
            </CardTitle>
            <CardDescription className="text-xs">
              Review and confirm your strategy conditions
            </CardDescription>
          </CardHeader>
          
          <CardContent className="px-4 pb-4">
            <StrategyChecklist
              strategy={selectedStrategy}
              value={strategyChecks}
              onChange={(checks) => {
                if (checks.length > 0) {
                  // Update all checks based on the new value
                  for (const check of checks) {
                    handleStrategyCheckToggle(check.conditionId, check.checked);
                  }
                }
              }}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}