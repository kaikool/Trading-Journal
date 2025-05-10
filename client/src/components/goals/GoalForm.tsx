import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useUserData } from '@/hooks/use-user-data';
import { format } from 'date-fns';

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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CalendarIcon, XCircle } from 'lucide-react';

// Schema để xác thực form dữ liệu
const goalFormSchema = z.object({
  title: z.string().min(1, 'Tiêu đề không được để trống'),
  description: z.string().optional(),
  targetType: z.enum(['profit', 'winRate', 'profitFactor', 'riskRewardRatio', 'balance', 'trades']),
  targetValue: z.coerce.number().positive('Giá trị mục tiêu phải lớn hơn 0'),
  startDate: z.date(),
  endDate: z.date(),
  priority: z.enum(['low', 'medium', 'high']),
  color: z.string().optional(),
});

// Loại dữ liệu cho form
type GoalFormValues = z.infer<typeof goalFormSchema>;

// Props cho component GoalForm
interface GoalFormProps {
  defaultValues?: Partial<GoalFormValues>;
  onSubmit: (data: GoalFormValues) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function GoalForm({ defaultValues, onSubmit, onCancel, isSubmitting = false }: GoalFormProps) {
  const { userData } = useUserData();
  
  // Thiết lập giá trị mặc định cho form
  const today = new Date();
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  
  const form = useForm<GoalFormValues>({
    resolver: zodResolver(goalFormSchema),
    defaultValues: {
      title: '',
      description: '',
      targetType: 'profit',
      targetValue: 0,
      startDate: today,
      endDate: nextMonth,
      priority: 'medium',
      color: '',
      ...defaultValues,
    },
  });

  // Mảng các loại mục tiêu
  const targetTypes = [
    { value: 'profit', label: 'Lợi nhuận' },
    { value: 'winRate', label: 'Tỷ lệ thắng' },
    { value: 'profitFactor', label: 'Hệ số lợi nhuận' },
    { value: 'riskRewardRatio', label: 'Tỷ lệ R:R' },
    { value: 'balance', label: 'Số dư' },
    { value: 'trades', label: 'Số giao dịch' },
  ];

  // Mảng các mức độ ưu tiên
  const priorities = [
    { value: 'low', label: 'Thấp' },
    { value: 'medium', label: 'Trung bình' },
    { value: 'high', label: 'Cao' },
  ];

  // Mảng các màu sắc có sẵn
  const predefinedColors = [
    { value: '#0ea5e9', label: 'Xanh da trời' },
    { value: '#10b981', label: 'Xanh lá cây' },
    { value: '#f59e0b', label: 'Cam' },
    { value: '#ef4444', label: 'Đỏ' },
    { value: '#8b5cf6', label: 'Tím' },
    { value: '#ec4899', label: 'Hồng' },
    { value: '#6b7280', label: 'Xám' },
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tiêu đề mục tiêu</FormLabel>
              <FormControl>
                <Input placeholder="VD: Đạt được lợi nhuận 1000$" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mô tả</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Mô tả chi tiết về mục tiêu này"
                  className="resize-none"
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="targetType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Loại mục tiêu</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn loại mục tiêu" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {targetTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="targetValue"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Giá trị mục tiêu</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step={form.watch('targetType') === 'winRate' ? '0.1' : '1'}
                    min="0"
                    placeholder="VD: 1000"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                  />
                </FormControl>
                <FormDescription>
                  {form.watch('targetType') === 'winRate' && 'Tỷ lệ % (từ 1-100)'}
                  {form.watch('targetType') === 'profitFactor' && 'VD: 2.5'}
                  {form.watch('targetType') === 'riskRewardRatio' && 'VD: 1.5'}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Ngày bắt đầu</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "dd/MM/yyyy")
                        ) : (
                          <span>Chọn ngày</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Ngày kết thúc</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "dd/MM/yyyy")
                        ) : (
                          <span>Chọn ngày</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                      disabled={(date) => date < form.watch('startDate')}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mức độ ưu tiên</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn mức độ ưu tiên" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {priorities.map((priority) => (
                      <SelectItem key={priority.value} value={priority.value}>
                        {priority.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="color"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Màu sắc (tùy chọn)</FormLabel>
                <div className="flex gap-2 items-center">
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || ''}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn màu sắc" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {predefinedColors.map((color) => (
                        <SelectItem key={color.value} value={color.value}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: color.value }}
                            />
                            <span>{color.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {field.value && (
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded-full border"
                        style={{ backgroundColor: field.value }}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => form.setValue('color', '')}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Hủy
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Đang lưu...' : 'Lưu mục tiêu'}
          </Button>
        </div>
      </form>
    </Form>
  );
}