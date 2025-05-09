/**
 * format-number.ts
 * 
 * Tiện ích để định dạng số trong ứng dụng một cách nhất quán.
 * Sử dụng cấu hình từ config.ts để đảm bảo định dạng số đồng nhất toàn ứng dụng.
 */

import { UI_CONFIG } from "@/lib/config";

/**
 * Định dạng số thành chuỗi hiển thị
 * 
 * @param value Giá trị số cần định dạng
 * @param options Tùy chọn định dạng (có thể ghi đè cấu hình mặc định)
 * @returns Chuỗi đã được định dạng
 */
export function formatNumber(
  value: number,
  options: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    locale?: string;
  } = {}
): string {
  const {
    minimumFractionDigits = UI_CONFIG.NUMBER_FORMAT.DECIMAL_PLACES,
    maximumFractionDigits = UI_CONFIG.NUMBER_FORMAT.DECIMAL_PLACES,
    locale = UI_CONFIG.NUMBER_FORMAT.LOCALE
  } = options;

  return new Intl.NumberFormat(locale, {
    minimumFractionDigits,
    maximumFractionDigits
  }).format(value);
}

/**
 * Định dạng số thành chuỗi tiền tệ
 * 
 * @param value Giá trị số cần định dạng
 * @param options Tùy chọn định dạng (có thể ghi đè cấu hình mặc định)
 * @returns Chuỗi tiền tệ đã được định dạng
 */
export function formatCurrency(
  value: number,
  options: {
    symbol?: string;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    locale?: string;
  } = {}
): string {
  const {
    symbol = UI_CONFIG.CURRENCY_SYMBOL,
    minimumFractionDigits = UI_CONFIG.NUMBER_FORMAT.CURRENCY_DECIMAL_PLACES,
    maximumFractionDigits = UI_CONFIG.NUMBER_FORMAT.CURRENCY_DECIMAL_PLACES,
    locale = UI_CONFIG.NUMBER_FORMAT.LOCALE
  } = options;

  return `${symbol}${formatNumber(value, {
    minimumFractionDigits,
    maximumFractionDigits,
    locale
  })}`;
}

/**
 * Định dạng số thành chuỗi phần trăm
 * 
 * @param value Giá trị số cần định dạng (0.15 = 15%)
 * @param options Tùy chọn định dạng (có thể ghi đè cấu hình mặc định)
 * @returns Chuỗi phần trăm đã được định dạng
 */
export function formatPercentage(
  value: number,
  options: {
    includeSign?: boolean;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    locale?: string;
  } = {}
): string {
  const {
    includeSign = false,
    minimumFractionDigits = UI_CONFIG.NUMBER_FORMAT.PERCENTAGE_DECIMAL_PLACES,
    maximumFractionDigits = UI_CONFIG.NUMBER_FORMAT.PERCENTAGE_DECIMAL_PLACES,
    locale = UI_CONFIG.NUMBER_FORMAT.LOCALE
  } = options;

  // Convert decimal to percentage (e.g., 0.15 to 15)
  const percentValue = value * 100;
  
  const formattedValue = formatNumber(Math.abs(percentValue), {
    minimumFractionDigits,
    maximumFractionDigits,
    locale
  });
  
  // Add sign if requested and value is not zero
  const sign = includeSign && percentValue > 0 ? '+' : percentValue < 0 ? '-' : '';
  
  return `${sign}${formattedValue}%`;
}

/**
 * Định dạng số thành chuỗi pips
 * 
 * @param value Giá trị pips
 * @param options Tùy chọn định dạng
 * @returns Chuỗi pips đã được định dạng
 */
export function formatPips(
  value: number,
  options: {
    includeSign?: boolean;
    includeUnit?: boolean;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    locale?: string;
  } = {}
): string {
  const {
    includeSign = false,
    includeUnit = true,
    minimumFractionDigits = 1,
    maximumFractionDigits = 1,
    locale = UI_CONFIG.NUMBER_FORMAT.LOCALE
  } = options;

  const formattedValue = formatNumber(Math.abs(value), {
    minimumFractionDigits,
    maximumFractionDigits,
    locale
  });
  
  // Add sign if requested and value is not zero
  const sign = includeSign && value > 0 ? '+' : value < 0 ? '-' : '';
  const unit = includeUnit ? ' pips' : '';
  
  return `${sign}${formattedValue}${unit}`;
}

/**
 * Định dạng tỷ lệ risk/reward
 * 
 * @param risk Giá trị rủi ro
 * @param reward Giá trị phần thưởng
 * @returns Chuỗi đã được định dạng (ví dụ: "1:3")
 */
export function formatRiskReward(risk: number, reward: number): string {
  if (risk <= 0) return 'N/A';
  
  const ratio = reward / risk;
  return `1:${ratio.toFixed(1)}`;
}