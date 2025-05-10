import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';

// Define validation schema for the form
const milestoneFormSchema = z.object({
  title: z.string().min(1, 'Title cannot be empty'),
  targetValue: z.coerce.number().positive('Target value must be greater than 0'),
  isCompleted: z.boolean().default(false),
});

// Type for form data
type MilestoneFormValues = z.infer<typeof milestoneFormSchema>;

// Props for MilestoneForm component
interface MilestoneFormProps {
  goalId: number;
  goalType: string;
  goalTarget: number;
  defaultValues?: Partial<MilestoneFormValues>;
  onSubmit: (data: MilestoneFormValues) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function MilestoneForm({
  goalId,
  goalType,
  goalTarget,
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: MilestoneFormProps) {
  
  // Set up form with default values
  const form = useForm<MilestoneFormValues>({
    resolver: zodResolver(milestoneFormSchema),
    defaultValues: {
      title: '',
      targetValue: 0,
      isCompleted: false,
      ...defaultValues,
    },
  });

  // Format description based on goal type
  const getTargetDescription = (type: string) => {
    switch (type) {
      case 'profit':
      case 'balance':
        return 'Enter value in USD (e.g. 500)';
      case 'winRate':
        return 'Enter percentage value (e.g. 55)';
      case 'profitFactor':
      case 'riskRewardRatio':
        return 'Enter decimal value (e.g. 1.5)';
      case 'trades':
        return 'Enter number of trades';
      default:
        return '';
    }
  };

  // Format label for target type
  const getTargetTypeLabel = (type: string) => {
    switch (type) {
      case 'profit': return 'Profit';
      case 'winRate': return 'Win Rate';
      case 'profitFactor': return 'Profit Factor';
      case 'riskRewardRatio': return 'R:R Ratio';
      case 'balance': return 'Balance';
      case 'trades': return 'Number of Trades';
      default: return type;
    }
  };

  // Format numeric step based on goal type
  const getStep = (type: string) => {
    switch (type) {
      case 'winRate':
      case 'profitFactor':
      case 'riskRewardRatio':
        return '0.1';
      default:
        return '1';
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Milestone Title</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Reach 50% of the goal" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="targetValue"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Milestone Value ({getTargetTypeLabel(goalType)})</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step={getStep(goalType)}
                  min="0"
                  max={goalType === 'winRate' ? 100 : undefined}
                  placeholder={`Ex: ${goalTarget / 2}`}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                {getTargetDescription(goalType)}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isCompleted"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Mark as Completed</FormLabel>
                <FormDescription>
                  Turn on if this milestone has been achieved
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Milestone'}
          </Button>
        </div>
      </form>
    </Form>
  );
}