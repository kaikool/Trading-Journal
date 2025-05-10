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

// Định nghĩa schema xác thực cho form
const milestoneFormSchema = z.object({
  title: z.string().min(1, 'Tiêu đề không được để trống'),
  targetValue: z.coerce.number().positive('Giá trị mục tiêu phải lớn hơn 0'),
  isCompleted: z.boolean().default(false),
});

// Loại dữ liệu cho form
type MilestoneFormValues = z.infer<typeof milestoneFormSchema>;

// Props cho component MilestoneForm
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
  
  // Thiết lập form với giá trị mặc định
  const form = useForm<MilestoneFormValues>({
    resolver: zodResolver(milestoneFormSchema),
    defaultValues: {
      title: '',
      targetValue: 0,
      isCompleted: false,
      ...defaultValues,
    },
  });

  // Format mô tả dựa trên loại mục tiêu
  const getTargetDescription = (type: string) => {
    switch (type) {
      case 'profit':
      case 'balance':
        return 'Nhập giá trị bằng USD (vd: 500)';
      case 'winRate':
        return 'Nhập giá trị tỷ lệ % (vd: 55)';
      case 'profitFactor':
      case 'riskRewardRatio':
        return 'Nhập giá trị thập phân (vd: 1.5)';
      case 'trades':
        return 'Nhập số lượng giao dịch';
      default:
        return '';
    }
  };

  // Format label cho loại mục tiêu
  const getTargetTypeLabel = (type: string) => {
    switch (type) {
      case 'profit': return 'Lợi nhuận';
      case 'winRate': return 'Tỷ lệ thắng';
      case 'profitFactor': return 'Hệ số lợi nhuận';
      case 'riskRewardRatio': return 'Tỷ lệ R:R';
      case 'balance': return 'Số dư';
      case 'trades': return 'Số giao dịch';
      default: return type;
    }
  };

  // Format giá trị số dựa vào loại mục tiêu
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
              <FormLabel>Tiêu đề cột mốc</FormLabel>
              <FormControl>
                <Input placeholder="VD: Đạt 50% mục tiêu" {...field} />
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
              <FormLabel>Giá trị cột mốc ({getTargetTypeLabel(goalType)})</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step={getStep(goalType)}
                  min="0"
                  max={goalType === 'winRate' ? 100 : undefined}
                  placeholder={`VD: ${goalTarget / 2}`}
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
                <FormLabel className="text-base">Đánh dấu hoàn thành</FormLabel>
                <FormDescription>
                  Bật nếu cột mốc này đã đạt được
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
            Hủy
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Đang lưu...' : 'Lưu cột mốc'}
          </Button>
        </div>
      </form>
    </Form>
  );
}