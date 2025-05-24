import React from 'react';
import { useFormContext } from "react-hook-form";
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { TradeFormValues } from '../types';

export function NotesSection() {
  const form = useFormContext<TradeFormValues>();
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold tracking-tight">Notes</h3>
        <span className="text-xs text-muted-foreground px-2 py-1 bg-muted/30 rounded-sm">Optional</span>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between mb-1.5">
          <Label htmlFor="notes" className="font-medium">Trade Analysis & Observations</Label>
        </div>
        <Textarea
          id="notes"
          placeholder="Write your detailed thoughts about this trade, including what went well, what could be improved, and any market observations..."
          className="min-h-[150px] resize-y"
          {...form.register("notes")}
        />
        <p className="text-xs text-muted-foreground mt-1.5">
          Tip: Include details about your emotions, market conditions, and what you learned from this trade.
        </p>
      </div>
    </div>
  );
}