/**
 * use-timestamp.ts
 * 
 * Hook tùy chỉnh để xử lý các timestamp trong các component React
 * Cung cấp các hàm tiện ích truy cập nhanh và lưu trữ bộ nhớ đệm để tối ưu hiệu suất
 */

import { useMemo, useCallback } from 'react';
import { 
  parseTimestamp, 
  formatTimestamp, 
  DateFormat as DateFormatEnum, 
  TimestampInput,
  safelyParseTradeDate,
  groupTradesByMonth,
  compareTimestamps
} from '@/lib/format-timestamp';

// Re-export DateFormat for convenience
export const DateFormat = DateFormatEnum;

// Tùy chọn cấu hình cho hook
interface UseTimestampOptions {
  defaultFormat?: typeof DateFormatEnum[keyof typeof DateFormatEnum] | string;
  locale?: 'en' | 'vi';
  includeTime?: boolean;
}

/**
 * Hook tùy chỉnh để làm việc với timestamps
 * 
 * @param options Tùy chọn định dạng mặc định
 * @returns Các hàm tiện ích để xử lý timestamp
 */
export function useTimestamp(options: UseTimestampOptions = {}) {
  const { 
    defaultFormat = DateFormat.MEDIUM,
    locale = 'en',
    includeTime = false
  } = options;

  // Tạo bộ nhớ đệm cho việc phân tích timestamp (cải thiện hiệu suất)
  const parseCache = useMemo(() => new Map<TimestampInput, Date | null>(), []);
  
  // Tạo bộ nhớ đệm cho việc định dạng timestamp (cải thiện hiệu suất)
  const formatCache = useMemo(() => new Map<string, string>(), []);

  /**
   * Hàm xử lý timestamp có lưu đệm (caching)
   */
  const parse = useCallback((timestamp: TimestampInput): Date | null => {
    if (!timestamp) return null;
    
    // Kiểm tra cache trước - chuyển đổi cacheKey đúng kiểu
    let cacheKey: string;
    
    if (timestamp instanceof Date) {
      cacheKey = timestamp.toISOString();
    } else if (typeof timestamp === 'object' && timestamp !== null && 'seconds' in timestamp) {
      cacheKey = `firebase_${timestamp.seconds}_${(timestamp.nanoseconds || 0)}`;
    } else {
      cacheKey = String(timestamp);
    }
        
    if (parseCache.has(cacheKey)) {
      return parseCache.get(cacheKey) || null;
    }
    
    // Nếu không có trong cache, phân tích và lưu vào cache
    const result = parseTimestamp(timestamp);
    parseCache.set(cacheKey, result);
    return result;
  }, [parseCache]);

  /**
   * Hàm định dạng timestamp có lưu đệm (caching)
   */
  const format = useCallback((
    timestamp: TimestampInput, 
    formatOption?: typeof DateFormatEnum[keyof typeof DateFormatEnum] | string
  ): string => {
    if (!timestamp) return '';
    
    const format = formatOption || defaultFormat;
    const date = parse(timestamp);
    if (!date) return 'Invalid date';
    
    // Tạo khóa cache từ timestamp và định dạng
    const cacheKey = `${date.toISOString()}_${format}_${locale}_${includeTime}`;
    
    if (formatCache.has(cacheKey)) {
      return formatCache.get(cacheKey) as string;
    }
    
    // Nếu không có trong cache, định dạng và lưu vào cache
    const result = formatTimestamp(date, { 
      format, 
      locale, 
      includeTime 
    });
    
    formatCache.set(cacheKey, result);
    return result;
  }, [defaultFormat, locale, includeTime, parse, formatCache]);

  /**
   * Hàm tạo định dạng tương đối (3 days ago, etc.)
   */
  const formatRelative = useCallback((timestamp: TimestampInput): string => {
    return format(timestamp, DateFormat.RELATIVE);
  }, [format]);

  /**
   * Hàm đặc biệt cho biểu đồ
   */
  const formatForChart = useCallback((timestamp: TimestampInput): string => {
    return format(timestamp, DateFormat.CHART);
  }, [format]);

  /**
   * Hàm đặc biệt cho định dạng tháng-năm trong biểu đồ
   */
  const formatMonthYear = useCallback((timestamp: TimestampInput): string => {
    return format(timestamp, DateFormat.MONTH_SHORT);
  }, [format]);

  /**
   * Tạo bộ dữ liệu theo chuỗi thời gian từ các giao dịch - Phiên bản tối ưu hóa
   * Sử dụng Map để tránh lặp lại các phép tính và cải thiện hiệu suất
   */
  const createTimeSeriesData = useCallback(<T extends { closeDate?: any, profitLoss?: number, id?: string | number }>(
    trades: T[],
    initialBalance: number = 0,
    options = { sortByDate: true }
  ) => {
    // Kết quả mặc định nếu không có giao dịch
    if (!trades || !trades.length) {
      return [{ date: format(new Date(), DateFormat.CHART), balance: initialBalance }];
    }

    // Cache các kết quả phân tích ngày tháng để tránh tính toán lặp lại
    const dateCache = new Map<string | number, Date>();
    
    // Tiền xử lý dữ liệu giao dịch - loại bỏ các giao dịch không có ngày đóng hợp lệ
    const processedTrades: any[] = [];
    
    for (const trade of trades) {
      // Tối ưu: Xử lý ngày tháng với cache để tránh phân tích lặp lại
      let tradeDate: Date | null;
      
      // Nếu có id và đã xử lý id này trước đó, lấy từ cache
      if (trade.id && dateCache.has(trade.id)) {
        tradeDate = dateCache.get(trade.id) || null;
      } else {
        tradeDate = parse(trade.closeDate);
        
        // Lưu vào cache nếu có id
        if (trade.id && tradeDate) {
          dateCache.set(trade.id, tradeDate);
        }
      }
      
      // Bỏ qua nếu không có ngày hợp lệ
      if (!tradeDate) continue;
      
      // Thêm vào danh sách đã xử lý
      processedTrades.push({
        date: tradeDate,
        pl: trade.profitLoss || 0,
        id: trade.id
      });
    }
    
    // Sắp xếp nếu cần
    if (options.sortByDate && processedTrades.length > 0) {
      processedTrades.sort((a, b) => compareTimestamps(a.date, b.date));
    }

    // Tạo bộ dữ liệu cho biểu đồ
    const result = [{ 
      date: format(new Date(0), DateFormat.CHART), 
      balance: initialBalance, 
      profit: 0 
    }];
    
    // Tính toán số dư tích lũy
    let balance = initialBalance;
    
    // Cache format dates để tránh lặp lại xử lý định dạng
    const formatCache = new Map<Date, string>();
    
    for (const trade of processedTrades) {
      balance += trade.pl;
      
      // Tối ưu: Xử lý format date với cache
      let formattedDate: string;
      if (formatCache.has(trade.date)) {
        formattedDate = formatCache.get(trade.date) || '';
      } else {
        formattedDate = format(trade.date, DateFormat.CHART);
        formatCache.set(trade.date, formattedDate);
      }
      
      result.push({
        date: formattedDate,
        balance,
        profit: trade.pl
      });
    }

    return result;
  }, [parse, format]);

  return {
    parse,               // Phân tích timestamp thành đối tượng Date
    format,              // Định dạng timestamp thành chuỗi theo định dạng cụ thể
    formatRelative,      // Định dạng timestamp thành văn bản tương đối ("3 days ago")
    formatForChart,      // Định dạng timestamp cho biểu đồ
    formatMonthYear,     // Định dạng timestamp dạng tháng/năm ngắn gọn
    safelyParseTradeDate,// Phân tích an toàn các trường ngày tháng trong giao dịch
    groupTradesByMonth,  // Nhóm các giao dịch theo tháng
    createTimeSeriesData,// Tạo dữ liệu chuỗi thời gian từ các giao dịch
    DateFormat           // Enum các định dạng hỗ trợ
  };
}