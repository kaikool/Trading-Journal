/**
 * timestamp.ts
 * 
 * Cung cấp các hàm tiện ích để xử lý timestamp trong ứng dụng.
 * File này thay thế và chuẩn hóa các hàm xử lý timestamp trùng lặp trong dự án.
 */

import { getTimestampMilliseconds, TimestampInput } from '@/lib/format-timestamp';

/**
 * Trích xuất giá trị milliseconds từ bất kỳ dạng timestamp nào.
 * Đây là hàm chung duy nhất để lấy timestamp trong ứng dụng.
 * 
 * @param timestamp Bất kỳ dạng timestamp nào được hỗ trợ
 * @returns milliseconds epoch hoặc 0 nếu không thể phân tích
 */
export function getTimeStamp(timestamp: TimestampInput): number {
  return getTimestampMilliseconds(timestamp);
}

// getTimeStampMilionSecond function removed - not used in the project