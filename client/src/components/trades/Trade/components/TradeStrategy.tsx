
import React from 'react';
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

// This component is now a "dumb" component. It receives all its data and handlers via props.
interface TradeStrategyProps {
  strategies: TradingStrategy[];
  isLoadingStrategies: boolean;
  selectedStrategy: TradingStrategy | null;
  strategyChecks: StrategyConditionCheck[];
  handleStrategyCheckToggle: (id: string, passed: boolean) => void;
}

export function TradeStrategy({
  strategies,
  isLoadingStrategies,
  selectedStrategy,
  strategyChecks,
  handleStrategyCheckToggle
}: TradeStrategyProps) {
  const form = useFormContext<TradeFormValues>();

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-medium tracking-tight">Trading Strategy</h3>
        {selectedStrategy && (
          <Badge variant="outline" className="px-2 py-0.5 bg-primary/5 border-primary/10">
            <Icons.nav.analytics className="h-3 w-3 mr-1.5 text-primary" />
            {selectedStrategy.name || 'Unnamed Strategy'}
          </Badge>
        )}
      </div>
      
      <Card className="border-border/30 shadow-sm bg-card/50">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-sm font-medium">Select Strategy</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {isLoadingStrategies ? (
            <div className="h-10 rounded-md bg-muted/50 animate-pulse" />
          ) : (
            <FormField
              control={form.control}
              name="strategy"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {strategies.map(strategy => (
                          <Badge 
                            key={strategy.id} 
                            variant={field.value === strategy.id ? "default" : "outline"}
                            className={cn(
                              "cursor-pointer h-auto py-2 px-3 flex items-center justify-between",
                              field.value === strategy.id 
                                ? "bg-primary/10 text-primary hover:bg-primary/20 border-primary/20" 
                                : "bg-card hover:bg-muted/40 border-border/40"
                            )}
                            onClick={() => field.onChange(strategy.id)}
                          >
                            <div className="flex items-center gap-1.5">
                              <Icons.ui.circleCheck className={cn(
                                "h-3.5 w-3.5",
                                field.value === strategy.id ? "text-primary" : "text-muted-foreground/40"
                              )} />
                              <span className="font-medium text-xs">{strategy.name}</span>
                            </div>
                            {strategy.isDefault && (
                              <div className="rounded-full bg-primary/10 h-1.5 w-1.5"></div>
                            )}
                          </Badge>
                        ))}
                      </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </CardContent>
      </Card>

      {/* This section now correctly receives its state from the parent */}
      {selectedStrategy && (
        <Card className="border-border/30 shadow-sm bg-card/50">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span>Strategy Checklist</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Confirm your strategy rules and conditions were met.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="px-4 pb-4">
            <StrategyChecklist
              strategy={selectedStrategy}
              strategyChecks={strategyChecks}
              onCheckChange={handleStrategyCheckToggle}
            />
          </CardContent>
        </Card>
      )}

      <Card className="border-border/30 shadow-sm bg-card/50">
        <CardContent className="pt-3 px-4 pb-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-1 mb-1">
              <div className="flex items-center gap-1">
                <Icons.analytics.chartLine className="h-3.5 w-3.5 text-primary" />
                <Label htmlFor="techPattern" className="text-sm">Technical Pattern</Label>
              </div>
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
    </div>
  );
}
