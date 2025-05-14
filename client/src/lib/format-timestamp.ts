/**
 * format-timestamp.ts
 * 
 * Một tiện ích tập trung để xử lý nhất quán các timestamp trong ứng dụng.
 * Hỗ trợ nhiều định dạng thời gian và là nguồn thông tin duy nhất cho định dạng timestamp.
 */

import { format, formatDistanceToNow, isValid, parseISO } from 'date-fns';
import { vi, enUS } from 'date-fns/locale';

// Kiểu dữ liệu timestamp có thể đến từ Firebase hoặc nhiều nguồn khác nhau
export type TimestampInput = 
  | Date 
  | string 
  | number 
  | { seconds: number; nanoseconds: number } 
  | null 
  | undefined;

// Các định dạng thường dùng cho ứng dụng
export enum DateFormat {
  SHORT = 'short',             // 12/31/2023
  MEDIUM = 'medium',           // Dec 31, 2023
  LONG = 'long',               // December 31, 2023
  ISO = 'iso',                 // 2023-12-31
  TIME = 'time',               // 14:30
  DATE_TIME = 'dateTime',      // Dec 31, 2023 14:30
  MONTH_YEAR = 'monthYear',    // Dec 2023
  RELATIVE = 'relative',       // 2 days ago
  CHART = 'chart',             // Dec 31 (for charts)
  MONTH_SHORT = 'monthShort'   // Dec 23 (for monthly charts)
}

// Cài đặt cho tiện ích định dạng thời gian
interface FormatOptions {
  format?: DateFormat | string;
  locale?: 'en' | 'vi';
  includeTime?: boolean;
  timezone?: string;
}

// Ngôn ngữ mặc định (có thể lấy từ cài đặt người dùng)
const DEFAULT_LOCALE = 'en';

/**
 * Chuyển đổi bất kỳ dạng timestamp nào thành đối tượng Date.
 * Đây là hàm cốt lõi để xử lý tất cả các loại timestamp có thể có trong hệ thống.
 * Bản cập nhật: Xử lý an toàn hơn với kiểm tra null cho seconds
 */
export function parseTimestamp(timestamp: TimestampInput): Date | null {
  if (!timestamp) return null;

  try {
    // Xử lý định dạng Firebase Timestamp
    if (typeof timestamp === 'object' && 
        'seconds' in timestamp && 
        timestamp.seconds !== null && 
        timestamp.seconds !== undefined) {
      return new Date(timestamp.seconds * 1000);
    }

    // Xử lý Date
    if (timestamp instanceof Date) {
      return isValid(timestamp) ? timestamp : null;
    }

    // Xử lý timestamps dạng ISO string
    if (typeof timestamp === 'string') {
      // Kiểm tra xem đây có phải là timestamp ISO
      const date = parseISO(timestamp);
      if (isValid(date)) return date;

      // Thử parse như một timestamp thông thường
      const numberDate = new Date(timestamp);
      return isValid(numberDate) ? numberDate : null;
    }

    // Xử lý timestamp dạng số (unix timestamp)
    if (typeof timestamp === 'number') {
      // Kiểm tra xem đây là milliseconds hay seconds
      const date = timestamp > 1000000000000
        ? new Date(timestamp) // milliseconds
        : new Date(timestamp * 1000); // seconds
      return isValid(date) ? date : null;
    }

    return null;
  } catch (error) {
    console.error('Error parsing timestamp:', error, timestamp);
    return null;
  }
}

/**
 * Trích xuất giá trị milliseconds từ bất kỳ dạng timestamp nào một cách an toàn.
 * Hữu ích cho việc so sánh timestamp trong các hàm sắp xếp.
 * 
 * @param timestamp Bất kỳ dạng timestamp nào được hỗ trợ
 * @returns milliseconds epoch hoặc 0 nếu không thể phân tích
 */
export function getTimestampMilliseconds(timestamp: TimestampInput): number {
  if (!timestamp) return 0;
  
  try {
    // Xử lý Firebase Timestamp
    if (typeof timestamp === 'object' && 
        'seconds' in timestamp && 
        timestamp.seconds !== null &&
        timestamp.seconds !== undefined) {
      return timestamp.seconds * 1000;
    }
    
    // Xử lý Date object
    if (timestamp instanceof Date) {
      if (isValid(timestamp)) return timestamp.getTime();
      return 0;
    }
    
    // Xử lý timestamp dạng số
    if (typeof timestamp === 'number') {
      if (timestamp > 1000000000000) return timestamp; // milliseconds
      return timestamp * 1000; // seconds
    }
    
    // Xử lý string
    if (typeof timestamp === 'string') {
      const date = parseTimestamp(timestamp);
      return date ? date.getTime() : 0;
    }
    
    return 0;
  } catch (error) {
    console.error('Error getting timestamp milliseconds:', error, timestamp);
    return 0;
  }
}

/**
 * Định dạng timestamp theo định dạng cụ thể, locale và timezone
 */
export function formatTimestamp(
  timestamp: TimestampInput,
  options: FormatOptions = {}
): string {
  const date = parseTimestamp(timestamp);
  if (!date) return 'Invalid date';

  const {
    format: dateFormat = DateFormat.MEDIUM,
    locale = DEFAULT_LOCALE,
    includeTime = false
  } = options;

  // Chọn locale phù hợp
  const localeObj = locale === 'vi' ? vi : enUS;

  try {
    // Xử lý các định dạng được định nghĩa trước
    switch (dateFormat) {
      case DateFormat.SHORT:
        return format(date, 'dd/MM/yyyy', { locale: localeObj });
        
      case DateFormat.MEDIUM:
        return format(date, 'd MMM yyyy', { locale: localeObj });
        
      case DateFormat.LONG:
        return format(date, 'd MMMM yyyy', { locale: localeObj });
        
      case DateFormat.ISO:
        return format(date, 'yyyy-MM-dd');
        
      case DateFormat.TIME:
        return format(date, 'HH:mm');
        
      case DateFormat.DATE_TIME:
        return format(date, 'd MMM yyyy HH:mm', { locale: localeObj });
        
      case DateFormat.MONTH_YEAR:
        return format(date, 'MMM yyyy', { locale: localeObj });
        
      case DateFormat.RELATIVE:
        return formatDistanceToNow(date, { addSuffix: true, locale: localeObj });
        
      case DateFormat.CHART:
        return format(date, 'd MMM', { locale: localeObj });
        
      case DateFormat.MONTH_SHORT:
        return format(date, 'MMM yy', { locale: localeObj });
        
      default:
        // Sử dụng định dạng tùy chỉnh nếu được cung cấp
        return format(date, dateFormat as string, { locale: localeObj });
    }
  } catch (error) {
    console.error('Error formatting date:', error, { date, options });
    return 'Format error';
  }
}

/**
 * Hook để sử dụng với Firebase Timestamp
 * Tự động chuyển đổi tất cả các loại timestamp thành dạng Date
 */
export function safelyParseTradeDate<T extends { closeDate?: any, createdAt?: any }>(trade: T): T & { 
  parsedCloseDate?: Date | null, 
  parsedEntryDate?: Date | null 
} {
  if (!trade) return trade;

  const parsedCloseDate = parseTimestamp(trade.closeDate);
  const parsedEntryDate = parseTimestamp(trade.createdAt);

  return {
    ...trade,
    parsedCloseDate,
    parsedEntryDate
  };
}

/**
 * Nhóm các giao dịch theo tháng và trả về dạng map
 * Hữu ích cho các biểu đồ theo tháng (phân tích hoạt động giao dịch)
 * 
 * Phiên bản tối ưu hóa với caching để tăng hiệu suất khi xử lý nhiều giao dịch
 */
export function groupTradesByMonth<T extends Record<string, any>>(
  trades: T[],
  options: { dateProp?: 'closeDate' | 'createdAt' } = {}
): Record<string, T[]> {
  if (!trades || trades.length === 0) {
    return {};
  }
  
  const { dateProp = 'createdAt' } = options;
  const result: Record<string, T[]> = {};
  
  // Cache các kết quả đã tính toán để tránh xử lý lặp lại
  const dateCache = new Map<any, Date | null>();
  const monthKeyCache = new Map<Date | null, string>();
  
  // ID cache để tránh tính toán lặp lại trên cùng một giao dịch
  const processedIds = new Set<string | number>();
  
  for (const trade of trades) {
    // Bỏ qua giao dịch không hợp lệ
    if (!trade || !(dateProp in trade)) {
      continue;
    }
    
    // Nếu giao dịch có ID, kiểm tra xem đã xử lý chưa
    const tradeId = trade.id;
    if (tradeId && processedIds.has(tradeId)) {
      continue; // Bỏ qua giao dịch đã xử lý
    }
    
    // Lưu ID đã xử lý
    if (tradeId) {
      processedIds.add(tradeId);
    }
    
    // Xử lý ngày tháng từ cache nếu có
    let date: Date | null;
    const dateValue = trade[dateProp];
    
    if (dateCache.has(dateValue)) {
      date = dateCache.get(dateValue) || null;
    } else {
      date = parseTimestamp(dateValue);
      dateCache.set(dateValue, date); // Lưu vào cache
    }
    
    if (!date) continue;
    
    // Xử lý định dạng tháng từ cache nếu có
    let monthKey: string;
    if (monthKeyCache.has(date)) {
      monthKey = monthKeyCache.get(date)!;
    } else {
      monthKey = formatTimestamp(date, { format: DateFormat.MONTH_YEAR });
      monthKeyCache.set(date, monthKey); // Lưu vào cache
    }
    
    // Thêm vào nhóm kết quả
    if (!result[monthKey]) {
      result[monthKey] = [];
    }
    
    result[monthKey].push(trade);
  }
  
  return result;
}

/**
 * Lấy ngày đầu tiên và cuối cùng của một tháng từ chuỗi tháng
 * Ví dụ: "Jan 2023" -> { firstDay: Date, lastDay: Date }
 */
export function getMonthBoundaries(monthStr: string): { firstDay: Date, lastDay: Date } | null {
  try {
    const [month, yearStr] = monthStr.split(' ');
    const monthMap: Record<string, number> = {
      Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
      Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
    };
    
    if (!month || !yearStr || !(month in monthMap)) {
      throw new Error(`Invalid month string: ${monthStr}`);
    }
    
    const year = yearStr.length === 2 ? 2000 + parseInt(yearStr, 10) : parseInt(yearStr, 10);
    const firstDay = new Date(year, monthMap[month], 1);
    const lastDay = new Date(year, monthMap[month] + 1, 0);
    
    return { firstDay, lastDay };
  } catch (error) {
    console.error('Error parsing month string:', error, monthStr);
    return null;
  }
}

/**
 * So sánh hai timestamps
 * Trả về số âm nếu a < b, số dương nếu a > b, 0 nếu bằng nhau
 */
export function compareTimestamps(a: TimestampInput, b: TimestampInput): number {
  const dateA = parseTimestamp(a);
  const dateB = parseTimestamp(b);
  
  if (!dateA && !dateB) return 0;
  if (!dateA) return -1;
  if (!dateB) return 1;
  
  return dateA.getTime() - dateB.getTime();
}

/**
 * Kiểm tra xem hai timestamps có cùng ngày hay không
 */
export function isSameDay(a: TimestampInput, b: TimestampInput): boolean {
  const dateA = parseTimestamp(a);
  const dateB = parseTimestamp(b);
  
  if (!dateA || !dateB) return false;
  
  return format(dateA, 'yyyy-MM-dd') === format(dateB, 'yyyy-MM-dd');
}

/**
 * Kiểm tra xem hai timestamps có cùng tháng hay không
 */
export function isSameMonth(a: TimestampInput, b: TimestampInput): boolean {
  const dateA = parseTimestamp(a);
  const dateB = parseTimestamp(b);
  
  if (!dateA || !dateB) return false;
  
  return format(dateA, 'yyyy-MM') === format(dateB, 'yyyy-MM');
}