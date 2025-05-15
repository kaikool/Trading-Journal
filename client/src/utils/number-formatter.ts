/**
 * Tiện ích định dạng số cho toàn bộ ứng dụng
 * Cung cấp các hàm tiêu chuẩn để định dạng số thập phân một cách nhất quán
 */

/**
 * Loại dữ liệu được định dạng
 */
export type NumberFormatType = 
  | 'price'        // Giá entry, exit, SL, TP
  | 'pips'         // Số pip lãi/lỗ
  | 'percentage'   // Tỷ lệ phần trăm (win rate, etc)
  | 'money'        // Số tiền (profit/loss)
  | 'ratio'        // Tỷ lệ (risk:reward)
  | 'lotSize';     // Khối lượng giao dịch

/**
 * Các cấu hình định dạng số
 */
interface NumberFormatOptions {
  type: NumberFormatType;
  currency?: string;
  pair?: string;
  significantDigits?: boolean; // Nếu true, giữ lại chữ số có nghĩa thay vì số cố định
  minimumDigits?: number;      // Số chữ số tối thiểu (chỉ áp dụng với significantDigits)
}

/**
 * Cấu hình độ chính xác mặc định cho từng loại dữ liệu
 */
const DEFAULT_PRECISION: Record<NumberFormatType, number> = {
  price: 5,         // Mặc định 5 chữ số thập phân cho giá
  pips: 2,          // 2 chữ số thập phân cho pip
  percentage: 2,    // 2 chữ số thập phân cho phần trăm
  money: 2,         // 2 chữ số thập phân cho tiền
  ratio: 2,         // 2 chữ số thập phân cho tỷ lệ
  lotSize: 2,       // 2 chữ số thập phân cho khối lượng
};

/**
 * Cấu hình độ chính xác theo cặp tiền tệ
 */
const PAIR_PRECISION: Record<string, number> = {
  'EURUSD': 5,
  'GBPUSD': 5,
  'USDJPY': 3,
  'USDCHF': 5,
  'AUDUSD': 5,
  'NZDUSD': 5,
  'USDCAD': 5,
  'XAUUSD': 2, // Gold chỉ cần 2 chữ số thập phân
  'XAGUSD': 2, // Silver chỉ cần 2 chữ số thập phân
};

/**
 * Định dạng số theo loại dữ liệu và các tùy chọn
 * 
 * @param value Giá trị cần định dạng
 * @param options Tùy chọn định dạng
 * @returns Chuỗi đã được định dạng
 */
export function formatNumber(value: number | undefined | null, options: NumberFormatOptions): string {
  if (value === undefined || value === null) {
    return '-';
  }

  // Xác định độ chính xác dựa trên loại dữ liệu và cặp tiền tệ (nếu có)
  let precision = DEFAULT_PRECISION[options.type];
  
  // Nếu là giá và có cung cấp cặp tiền, sử dụng độ chính xác theo cặp
  if (options.type === 'price' && options.pair && PAIR_PRECISION[options.pair]) {
    precision = PAIR_PRECISION[options.pair];
  }
  
  // Nếu yêu cầu chữ số có nghĩa
  if (options.significantDigits) {
    const minDigits = options.minimumDigits || 2;
    return formatSignificantDigits(value, precision, minDigits);
  }

  // Định dạng dựa trên loại
  switch (options.type) {
    case 'money':
      return formatMoney(value, options.currency, precision);
    
    case 'percentage':
      return formatPercentage(value, precision);
    
    case 'ratio':
      return formatRatio(value, precision);
    
    default:
      // Các loại khác sử dụng định dạng số thông thường
      return formatDecimal(value, precision);
  }
}

/**
 * Định dạng số thập phân với độ chính xác nhất định
 * 
 * @param value Giá trị cần định dạng
 * @param precision Số chữ số thập phân
 * @returns Chuỗi đã được định dạng
 */
export function formatDecimal(value: number, precision: number = 2): string {
  // Tránh sai số làm tròn đối với các số rất nhỏ
  if (Math.abs(value) < 0.00000001) {
    return '0' + (precision > 0 ? '.' + '0'.repeat(precision) : '');
  }

  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  }).format(value);
}

/**
 * Định dạng số tiền với ký hiệu tiền tệ
 * 
 * @param value Giá trị tiền
 * @param currency Mã tiền tệ (USD, EUR,...)
 * @param precision Số chữ số thập phân
 * @returns Chuỗi tiền đã định dạng
 */
export function formatMoney(value: number, currency: string = 'USD', precision: number = 2): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  }).format(value);
}

/**
 * Định dạng phần trăm
 * 
 * @param value Giá trị phần trăm (ví dụ: 0.75 cho 75%)
 * @param precision Số chữ số thập phân
 * @returns Chuỗi phần trăm đã định dạng
 */
export function formatPercentage(value: number, precision: number = 2): string {
  // Kiểm tra xem giá trị có đã là phần trăm chưa (> 1)
  const percentValue = value > 1 ? value : value * 100;
  
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  }).format(percentValue / 100);
}

/**
 * Định dạng tỷ lệ (ví dụ: Risk-Reward Ratio)
 * 
 * @param value Giá trị tỷ lệ
 * @param precision Số chữ số thập phân
 * @returns Chuỗi tỷ lệ đã định dạng
 */
export function formatRatio(value: number, precision: number = 2): string {
  const formatted = formatDecimal(value, precision);
  return `${formatted}:1`;
}

/**
 * Định dạng số với chữ số có nghĩa
 * 
 * @param value Giá trị cần định dạng
 * @param maxDigits Số chữ số thập phân tối đa
 * @param minDigits Số chữ số thập phân tối thiểu
 * @returns Chuỗi đã được định dạng
 */
export function formatSignificantDigits(
  value: number, 
  maxDigits: number = 5, 
  minDigits: number = 2
): string {
  if (Math.abs(value) < 0.00000001) {
    return '0' + (minDigits > 0 ? '.' + '0'.repeat(minDigits) : '');
  }
  
  // Tìm vị trí chữ số khác 0 đầu tiên sau dấu thập phân
  const absValue = Math.abs(value);
  const valueStr = absValue.toString();
  
  // Nếu không có dấu thập phân, trả về số nguyên
  if (!valueStr.includes('.')) {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: minDigits,
      maximumFractionDigits: minDigits,
    }).format(value);
  }
  
  const [intPart, decPart] = valueStr.split('.');
  
  // Nếu phần nguyên khác 0, sử dụng định dạng decimal thông thường
  if (intPart !== '0') {
    return formatDecimal(value, Math.min(maxDigits, minDigits));
  }
  
  // Tìm vị trí của chữ số khác 0 đầu tiên trong phần thập phân
  let significantIndex = 0;
  for (let i = 0; i < decPart.length; i++) {
    if (decPart[i] !== '0') {
      significantIndex = i;
      break;
    }
  }
  
  // Số chữ số thập phân = vị trí chữ số có nghĩa + số chữ số muốn giữ
  const precisionNeeded = Math.min(
    significantIndex + maxDigits,
    decPart.length
  );
  
  // Nhưng không ít hơn số chữ số tối thiểu
  const finalPrecision = Math.max(precisionNeeded, minDigits);
  
  return formatDecimal(value, finalPrecision);
}

/**
 * Định dạng pip theo cặp tiền tệ
 * 
 * @param value Giá trị pip
 * @param includeSign Có hiển thị dấu +/- không
 * @returns Chuỗi pip đã định dạng
 */
export function formatPips(value: number | undefined | null, includeSign: boolean = true): string {
  if (value === undefined || value === null) {
    return '-';
  }
  
  const precision = DEFAULT_PRECISION.pips;
  let formatted = formatDecimal(Math.abs(value), precision);
  
  if (includeSign && value !== 0) {
    formatted = (value > 0 ? '+' : '-') + formatted;
  }
  
  return formatted;
}

/**
 * Định dạng giá theo cặp tiền tệ
 * 
 * @param value Giá trị
 * @param pair Cặp tiền tệ
 * @returns Chuỗi giá đã định dạng
 */
export function formatPrice(value: number | undefined | null, pair: string): string {
  if (value === undefined || value === null) {
    return '-';
  }
  
  const precision = PAIR_PRECISION[pair] || DEFAULT_PRECISION.price;
  return formatDecimal(value, precision);
}

/**
 * Định dạng profit/loss
 * 
 * @param value Giá trị profit/loss
 * @param currency Loại tiền tệ
 * @param includeSign Có hiển thị dấu +/- không
 * @returns Chuỗi profit/loss đã định dạng
 */
export function formatProfitLoss(
  value: number | undefined | null, 
  currency: string = 'USD',
  includeSign: boolean = true
): string {
  if (value === undefined || value === null) {
    return '-';
  }
  
  const precision = DEFAULT_PRECISION.money;
  const formatted = formatMoney(Math.abs(value), currency, precision);
  
  if (includeSign && value !== 0) {
    return (value > 0 ? '+' : '-') + formatted;
  }
  
  return formatted;
}

/**
 * Định dạng kết quả (WIN/LOSS) của giao dịch
 * 
 * @param profitLoss Giá trị lợi nhuận/thua lỗ
 * @returns Chuỗi "WIN", "LOSS" hoặc "BREAK EVEN"
 */
export function formatTradeResult(profitLoss: number | undefined | null): string {
  if (profitLoss === undefined || profitLoss === null) {
    return '-';
  }
  
  if (profitLoss > 0) {
    return 'WIN';
  } else if (profitLoss < 0) {
    return 'LOSS';
  } else {
    return 'BREAK EVEN';
  }
}