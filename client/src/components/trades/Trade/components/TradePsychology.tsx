
import { useFormContext } from "react-hook-form";
import { FormField, FormItem, FormControl } from "@/components/ui/form";
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { TradeFormValues } from '../types';

export function TradePsychology() {
  const form = useFormContext<TradeFormValues>();
  
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold tracking-tight">Psychology & Discipline</h3>
      
      {/* Trade Discipline - Followed trading plan */}
      <FormField
        control={form.control}
        name="followedPlan"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between">
            <div className="space-y-0.5">
              <Label 
                htmlFor="followedPlan"
                className="font-medium"
              >
                Followed Trading Plan
              </Label>
              <p className="text-xs text-muted-foreground">
                Did you follow your trading strategy rules?
              </p>
            </div>
            <FormControl>
              <Switch
                id="followedPlan"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
          </FormItem>
        )}
      />
      
      {/* Early Entry */}
      <FormField
        control={form.control}
        name="enteredEarly"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between">
            <div className="space-y-0.5">
              <Label 
                htmlFor="enteredEarly"
                className="font-medium"
              >
                Entered Early
              </Label>
              <p className="text-xs text-muted-foreground">
                Did you enter before all conditions were met?
              </p>
            </div>
            <FormControl>
              <Switch
                id="enteredEarly"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
          </FormItem>
        )}
      />
      
      {/* Revenge Trading */}
      <FormField
        control={form.control}
        name="revenge"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between">
            <div className="space-y-0.5">
              <Label 
                htmlFor="revenge"
                className="font-medium"
              >
                Revenge Trading
              </Label>
              <p className="text-xs text-muted-foreground">
                Did you take this trade to recover a previous loss?
              </p>
            </div>
            <FormControl>
              <Switch
                id="revenge"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
          </FormItem>
        )}
      />
      
      {/* Over-leveraged */}
      <FormField
        control={form.control}
        name="overLeveraged"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between">
            <div className="space-y-0.5">
              <Label 
                htmlFor="overLeveraged"
                className="font-medium"
              >
                Over-leveraged
              </Label>
              <p className="text-xs text-muted-foreground">
                Did you risk more than your planned risk percentage?
              </p>
            </div>
            <FormControl>
              <Switch
                id="overLeveraged"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
          </FormItem>
        )}
      />
      
      {/* Moved Stop Loss */}
      <FormField
        control={form.control}
        name="movedStopLoss"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between">
            <div className="space-y-0.5">
              <Label 
                htmlFor="movedStopLoss"
                className="font-medium"
              >
                Moved Stop Loss
              </Label>
              <p className="text-xs text-muted-foreground">
                Did you move your stop loss farther from entry after placing the trade?
              </p>
            </div>
            <FormControl>
              <Switch
                id="movedStopLoss"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
          </FormItem>
        )}
      />
      
      {/* News Event */}
      <FormField
        control={form.control}
        name="hasNews"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between">
            <div className="space-y-0.5">
              <Label 
                htmlFor="hasNews"
                className="font-medium"
              >
                News Event
              </Label>
              <p className="text-xs text-muted-foreground">
                Was there a significant news event around this trade?
              </p>
            </div>
            <FormControl>
              <Switch
                id="hasNews"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  );
}