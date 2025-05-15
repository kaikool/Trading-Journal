/**
 * format-number.ts
 * 
 * Tiện ích để định dạng số trong ứng dụng một cách nhất quán.
 * Sử dụng cấu hình từ config.ts để đảm bảo định dạng số đồng nhất toàn ứng dụng.
 * 
 * Mỗi loại dữ liệu số có quy tắc định dạng riêng phù hợp với ngữ cảnh:
 * - Giá (Entry, Exit): Tùy thuộc vào cặp tiền tệ (XAUUSD: 2, USDJPY: 3, các cặp khác: 5)
 * - Tiền tệ: 2 số thập phân, theo chuẩn tiền tệ
 * - Pips: 1 số thập phân 
 * - Profit/Loss: 2 số thập phân
 * - Tỷ lệ (RR, Win Rate): 2 số thập phân
 * - Phần trăm: 1 số thập phân (ví dụ: 12.5%)
 */

import { UI_CONFIG } from "@/lib/config";
import { type CurrencyPair } from "@/lib/forex-calculator";

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
 * @param value Giá trị số cần định dạng
 * @param options Tùy chọn định dạng (có thể ghi đè cấu hình mặc định)
 * @returns Chuỗi phần trăm đã được định dạng
 */
export function formatPercentage(
  value: number,
  options: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    locale?: string;
  } = {}
): string {
  const {
    minimumFractionDigits = UI_CONFIG.NUMBER_FORMAT.PERCENTAGE_DECIMAL_PLACES,
    maximumFractionDigits = UI_CONFIG.NUMBER_FORMAT.PERCENTAGE_DECIMAL_PLACES,
    locale = UI_CONFIG.NUMBER_FORMAT.LOCALE
  } = options;

  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits,
    maximumFractionDigits
  }).format(value / 100);
}

/**
 * Định dạng giá trị pip
 * 
 * @param value Giá trị pip cần định dạng
 * @param options Tùy chọn định dạng
 * @returns Chuỗi pip đã được định dạng
 */
export function formatPips(
  value: number,
  options: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    includeUnit?: boolean;
    locale?: string;
  } = {}
): string {
  const {
    minimumFractionDigits = UI_CONFIG.NUMBER_FORMAT.PIPS_DECIMAL_PLACES,
    maximumFractionDigits = UI_CONFIG.NUMBER_FORMAT.PIPS_DECIMAL_PLACES,
    includeUnit = false,
    locale = UI_CONFIG.NUMBER_FORMAT.LOCALE
  } = options;

  const formattedValue = formatNumber(value, {
    minimumFractionDigits,
    maximumFractionDigits,
    locale
  });

  return includeUnit ? `${formattedValue} pips` : formattedValue;
}

/**
 * Định dạng giá trị lợi nhuận/thua lỗ
 * 
 * @param value Giá trị P&L cần định dạng
 * @param options Tùy chọn định dạng
 * @returns Chuỗi P&L đã được định dạng
 */
export function formatProfitLoss(
  value: number,
  options: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    showPlusSign?: boolean;
    includeSymbol?: boolean;
    symbol?: string;
    locale?: string;
  } = {}
): string {
  const {
    minimumFractionDigits = UI_CONFIG.NUMBER_FORMAT.PROFIT_LOSS_DECIMAL_PLACES,
    maximumFractionDigits = UI_CONFIG.NUMBER_FORMAT.PROFIT_LOSS_DECIMAL_PLACES,
    showPlusSign = true,
    includeSymbol = true,
    symbol = UI_CONFIG.CURRENCY_SYMBOL,
    locale = UI_CONFIG.NUMBER_FORMAT.LOCALE
  } = options;

  const formattedValue = formatNumber(Math.abs(value), {
    minimumFractionDigits,
    maximumFractionDigits,
    locale
  });

  const signPrefix = value > 0 && showPlusSign ? '+' : value < 0 ? '-' : '';
  const symbolPrefix = includeSymbol ? symbol : '';

  return `${signPrefix}${symbolPrefix}${formattedValue}`;
}

/**
 * Định dạng tỷ lệ risk:reward
 * 
 * @param value Giá trị tỷ lệ cần định dạng
 * @param options Tùy chọn định dạng
 * @returns Chuỗi tỷ lệ đã được định dạng
 */
export function formatRiskReward(
  value: number,
  options: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    formatAsRatio?: boolean;
    locale?: string;
  } = {}
): string {
  const {
    minimumFractionDigits = UI_CONFIG.NUMBER_FORMAT.RISK_REWARD_DECIMAL_PLACES,
    maximumFractionDigits = UI_CONFIG.NUMBER_FORMAT.RISK_REWARD_DECIMAL_PLACES,
    formatAsRatio = true,
    locale = UI_CONFIG.NUMBER_FORMAT.LOCALE
  } = options;

  if (formatAsRatio) {
    // Format as "1:X" ratio
    const formattedValue = formatNumber(value, {
      minimumFractionDigits,
      maximumFractionDigits,
      locale
    });
    return `1:${formattedValue}`;
  } else {
    // Format as simple number
    return formatNumber(value, {
      minimumFractionDigits,
      maximumFractionDigits,
      locale
    });
  }
}

/**
 * Định dạng giá theo cặp tiền tệ
 * Mỗi cặp tiền tệ có quy tắc hiển thị số thập phân riêng:
 * - XAUUSD: 2 số thập phân (ví dụ: 1923.45)
 * - USDJPY: 3 số thập phân (ví dụ: 143.500)
 * - Các cặp khác: 5 số thập phân (ví dụ: 1.05260)
 * 
 * @param value Giá trị cần định dạng
 * @param pair Cặp tiền tệ
 * @returns Chuỗi đã được định dạng theo quy tắc của cặp tiền tệ
 */
export function formatPriceForPair(
  value: number | string,
  pair?: string
): string {
  if (value === null || value === undefined) return '';
  
  // Convert to number if string
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  // Check if valid number
  if (isNaN(numValue)) return '';
  
  const upperPair = pair?.toUpperCase() || 'XAUUSD';
  
  // Define decimal places based on currency pair
  let decimalPlaces: number;
  
  // Sử dụng cấu hình từ config.ts
  if (upperPair === 'XAUUSD') {
    decimalPlaces = UI_CONFIG.NUMBER_FORMAT.PRICE_DECIMAL_PLACES.XAUUSD;
  } else if (upperPair === 'USDJPY') {
    decimalPlaces = UI_CONFIG.NUMBER_FORMAT.PRICE_DECIMAL_PLACES.USDJPY;
  } else if (upperPair.includes('JPY')) {
    decimalPlaces = UI_CONFIG.NUMBER_FORMAT.PRICE_DECIMAL_PLACES.JPY_PAIRS;
  } else {
    decimalPlaces = UI_CONFIG.NUMBER_FORMAT.PRICE_DECIMAL_PLACES.DEFAULT;
  }
  
  return formatNumber(numValue, {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces
  });
}