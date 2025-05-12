import React from 'react';
import { useFormContext } from "react-hook-form";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { TradeFormValues } from '../types';

export function NotesSection() {
  const form = useFormContext<TradeFormValues>();
  
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold tracking-tight">Notes</h3>
      
      <div className="space-y-2">
        <div className="flex justify-between mb-1.5">
          <Label htmlFor="notes" className="font-medium">Additional Notes</Label>
          <span className="text-xs text-muted-foreground">Optional</span>
        </div>
        <Input
          id="notes"
          placeholder="Enter any additional thoughts or observations about this trade..."
          className="max-w-full h-[38px]"
          {...form.register("notes")}
        />
      </div>
    </div>
  );
}