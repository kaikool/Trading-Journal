import React from 'react';
import { useFormContext } from "react-hook-form";
import { FormField, FormItem, FormControl, FormMessage } from "@/components/ui/form";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Icons } from '@/components/icons/icons';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TradeFormValues } from '../types';
import { TradingStrategy, StrategyConditionCheck } from '@/types';
import { StrategyChecklist } from '../../StrategyChecklistComponent';

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
  
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold tracking-tight">Trading Strategy</h3>
      
      {/* Strategy */}
      <div className="space-y-2">
        <div className="flex justify-between mb-1.5">
          <Label htmlFor="strategy" className="font-medium">Strategy</Label>
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
                  <SelectTrigger id="strategy">
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
                    <SelectItem key={strategy.id} value={strategy.id}>
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
        <div className="flex justify-between mb-1.5">
          <Label htmlFor="techPattern" className="font-medium">Technical Pattern</Label>
          <span className="text-xs text-muted-foreground">Optional</span>
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
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      
      {/* Emotion */}
      <div className="space-y-2">
        <div className="flex justify-between mb-1.5">
          <Label htmlFor="emotion" className="font-medium">Emotion</Label>
        </div>
        <FormField
          control={form.control}
          name="emotion"
          render={({ field }) => (
            <FormItem>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                value={field.value || undefined}
              >
                <FormControl>
                  <SelectTrigger id="emotion">
                    <SelectValue placeholder="How did you feel during this trade?" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="calm">Calm</SelectItem>
                  <SelectItem value="confident">Confident</SelectItem>
                  <SelectItem value="fearful">Fearful</SelectItem>
                  <SelectItem value="greedy">Greedy</SelectItem>
                  <SelectItem value="anxious">Anxious</SelectItem>
                  <SelectItem value="excited">Excited</SelectItem>
                  <SelectItem value="impatient">Impatient</SelectItem>
                  <SelectItem value="uncertain">Uncertain</SelectItem>
                  <SelectItem value="frustrated">Frustrated</SelectItem>
                  <SelectItem value="regretful">Regretful</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      
      {/* Market condition */}
      <div className="space-y-2">
        <div className="flex justify-between mb-1.5">
          <Label htmlFor="marketCondition" className="font-medium">Market Condition</Label>
          <span className="text-xs text-muted-foreground">Optional</span>
        </div>
        <FormField
          control={form.control}
          name="marketCondition"
          render={({ field }) => (
            <FormItem>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                value={field.value || undefined}
              >
                <FormControl>
                  <SelectTrigger id="marketCondition">
                    <SelectValue placeholder="Select market condition" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="trending">Trending</SelectItem>
                  <SelectItem value="ranging">Ranging</SelectItem>
                  <SelectItem value="volatile">Volatile</SelectItem>
                  <SelectItem value="consolidating">Consolidating</SelectItem>
                  <SelectItem value="breakout">Breakout</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      
      {/* Session type */}
      <div className="space-y-2">
        <div className="flex justify-between mb-1.5">
          <Label htmlFor="sessionType" className="font-medium">Session Type</Label>
          <span className="text-xs text-muted-foreground">Optional</span>
        </div>
        <FormField
          control={form.control}
          name="sessionType"
          render={({ field }) => (
            <FormItem>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                value={field.value || undefined}
              >
                <FormControl>
                  <SelectTrigger id="sessionType">
                    <SelectValue placeholder="Select session" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="london">London</SelectItem>
                  <SelectItem value="newyork">New York</SelectItem>
                  <SelectItem value="tokyo">Tokyo</SelectItem>
                  <SelectItem value="sydney">Sydney</SelectItem>
                  <SelectItem value="overlap">Session Overlap</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      
      {/* Strategy checklist */}
      {selectedStrategy && strategyChecks.length > 0 && (
        <div className="mt-6 space-y-3">
          <h4 className="text-sm font-medium">Strategy Checklist</h4>
          
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
        </div>
      )}
    </div>
  );
}