/**
 * @file forex-calculator.ts
 * @description Thư viện tính toán forex chuẩn cho ứng dụng. Module này chứa các 
 * hằng số, công thức và hàm tính toán chính xác cho giao dịch forex.
 * @version 1.5.0
 * 
 * LƯU Ý QUAN TRỌNG:
 * -----------------
 * Các giá trị hằng số trong module này ĐÃ ĐƯỢC KIỂM CHỨNG và tuân theo
 * tiêu chuẩn quốc tế về giao dịch forex. KHÔNG được tự ý thay đổi
 * các giá trị này vì sẽ làm sai lệch kết quả tính toán.
 * 
 * Các trường hợp đặc biệt (như XAUUSD - vàng) đã được xử lý đặc biệt.
 */

/** Định nghĩa loại tiền tệ được hỗ trợ */
export type Currency = "EUR" | "USD" | "JPY" | "GBP" | "AUD" | "CAD" | "CHF" | "NZD" | "XAU";

/** Định nghĩa các cặp tiền tệ được hỗ trợ */
export type CurrencyPair = "EURUSD" | "USDJPY" | "GBPUSD" | "AUDUSD" | "USDCAD" | "USDCHF" | "NZDUSD" | "XAUUSD";

/** Định nghĩa hướng giao dịch: MUA hoặc BÁN */
export type Direction = "BUY" | "SELL";

/** Định nghĩa kết quả giao dịch */
export type TradeResult = "TP" | "SL" | "BE" | "MANUAL";

/** Tham số đầu vào cho hàm tính lợi nhuận */
export interface ProfitCalculationParams {
  pair: CurrencyPair;          // Cặp tiền tệ
  direction: Direction;        // Hướng giao dịch (MUA/BÁN)
  entryPrice: number;          // Giá vào lệnh
  exitPrice: number;           // Giá thoát lệnh
  lotSize: number;             // Khối lượng (lot)
  accountCurrency: Currency;   // Đơn vị tiền tệ tài khoản
}

/** Tham số đầu vào cho hàm tính rủi ro */
export interface RiskCalculationParams {
  pair: CurrencyPair;          // Cặp tiền tệ
  direction: Direction;        // Hướng giao dịch
  entryPrice: number;          // Giá vào lệnh
  stopLoss: number;            // Điểm dừng lỗ
  accountBalance: number;      // Số dư tài khoản
  riskPercentage: number;      // Phần trăm rủi ro
  accountCurrency: Currency;   // Đơn vị tiền tệ tài khoản
}

/** Tham số đầu vào cho hàm tính giá trị pip */
export interface PipValueCalculationParams {
  pair: CurrencyPair;          // Cặp tiền tệ
  lotSize: number;             // Khối lượng (lot)
  accountCurrency: Currency;   // Đơn vị tiền tệ tài khoản
}

/**
 * POINT SIZE - Đơn vị nhỏ nhất của sự thay đổi giá
 * 
 * Đây là đơn vị thực tế mà thị trường di chuyển (điểm giá).
 * Không nên nhầm lẫn với pip, đây là điểm giá thực tế (1 điểm)
 * 
 * CẢNH BÁO: KHÔNG THAY ĐỔI CÁC GIÁ TRỊ NÀY. Các giá trị này
 * tuân theo tiêu chuẩn thị trường forex và được áp dụng ở tất cả các sàn.
 */
const POINT_SIZE: Readonly<Record<CurrencyPair, number>> = Object.freeze({
  EURUSD: 0.00001, // 1 point = 0.00001 (5 decimal places)
  GBPUSD: 0.00001, // 1 point = 0.00001 (5 decimal places)
  AUDUSD: 0.00001, // 1 point = 0.00001 (5 decimal places)
  NZDUSD: 0.00001, // 1 point = 0.00001 (5 decimal places)
  USDJPY: 0.001,   // 1 point = 0.001 (3 decimal places)
  USDCAD: 0.00001, // 1 point = 0.00001 (5 decimal places)
  USDCHF: 0.00001, // 1 point = 0.00001 (5 decimal places)
  XAUUSD: 0.01     // 1 point = 0.01 (2 decimal places)
});

/**
 * PIP SIZE - Đơn vị chuẩn đo lường biến động giá trong forex
 * 
 * Đây là đơn vị chuẩn được sử dụng trong tính toán forex.
 * PIP = Price Interest Point (định nghĩa chuẩn trong thị trường forex)
 * 
 * CẢNH BÁO: KHÔNG THAY ĐỔI CÁC GIÁ TRỊ NÀY. Các giá trị này
 * tuân theo tiêu chuẩn thị trường forex và được áp dụng ở tất cả các sàn.
 */
const PIP_SIZE: Readonly<Record<CurrencyPair, number>> = Object.freeze({
  EURUSD: 0.0001,  // 1 pip = 0.0001 (4 decimal places) = 10 points
  GBPUSD: 0.0001,  // 1 pip = 0.0001 (4 decimal places) = 10 points
  AUDUSD: 0.0001,  // 1 pip = 0.0001 (4 decimal places) = 10 points
  NZDUSD: 0.0001,  // 1 pip = 0.0001 (4 decimal places) = 10 points
  USDJPY: 0.01,    // 1 pip = 0.01 (2 decimal places) = 10 points
  USDCAD: 0.0001,  // 1 pip = 0.0001 (4 decimal places) = 10 points
  USDCHF: 0.0001,  // 1 pip = 0.0001 (4 decimal places) = 10 points
  XAUUSD: 0.1      // 1 pip = 0.1 (1 decimal place) = 10 points
});

/**
 * PIP VALUE MULTIPLIER - Giá trị của 1 pip khi giao dịch 1 standard lot
 * 
 * Giá trị này là chuẩn trên tất cả các sàn giao dịch forex.
 * Là hệ số nhân để tính giá trị pip (USD) dựa trên kích thước lot.
 * 
 * QUAN TRỌNG:
 * - Với các cặp forex tiêu chuẩn: 1 standard lot = 100,000 đơn vị base currency
 * - Với XAUUSD (Vàng): 1 standard lot = 100 ounce vàng
 * 
 * Ví dụ XAUUSD:
 * - 1 ounce (0.01 lot) với di chuyển giá 1 pip (0.1$) = $0.1
 * - 10 ounce (0.1 lot) với di chuyển giá 1 pip (0.1$) = $1
 * - 100 ounce (1 lot) với di chuyển giá 1 pip (0.1$) = $10
 */
const PIP_VALUE_MULTIPLIER: Readonly<Record<CurrencyPair, number>> = Object.freeze({
  EURUSD: 10,   // $10 per pip for 1 lot (100,000 units)
  GBPUSD: 10,   // $10 per pip for 1 lot
  AUDUSD: 10,   // $10 per pip for 1 lot
  NZDUSD: 10,   // $10 per pip for 1 lot
  USDJPY: 10,   // $10 per pip for 1 lot (xấp xỉ, tùy tỷ giá USD/JPY)
  USDCAD: 10,   // $10 per pip for 1 lot (nếu tài khoản USD)
  USDCHF: 10,   // $10 per pip for 1 lot (nếu tài khoản USD)
  XAUUSD: 10    // $10 per pip for 1 lot (100 ounce)
});

/** Định nghĩa kích thước lot chuẩn */
const STANDARD_LOT: Readonly<number> = 100000;  // 1 lot = 100,000 units
const MINI_LOT: Readonly<number> = 10000;       // 0.1 lot = 10,000 units
const MICRO_LOT: Readonly<number> = 1000;       // 0.01 lot = 1,000 units

/**
 * Tính giá trị của 1 pip theo USD
 * Công thức: Giá trị pip = kích thước lot * giá trị pip cho 1 lot
 * 
 * Ví dụ:
 * - EURUSD, lot 0.1: 0.1 * $10 = $1 mỗi pip
 * - XAUUSD, lot 0.05: 0.05 * $10 = $0.5 mỗi pip
 * 
 * @param params Thông số tính toán pip
 * @returns Giá trị của 1 pip theo USD
 */
export function calculatePipValue(params: PipValueCalculationParams): number {
  const { pair, lotSize, accountCurrency } = params;
  
  // Công thức chuẩn: Giá trị pip = Kích thước lot * Giá trị 1 pip cho 1 lot
  const pipValue = lotSize * PIP_VALUE_MULTIPLIER[pair];
  
  // Return pip value (USD)
  return pipValue;
}

/**
 * Tính lợi nhuận/thua lỗ cho một giao dịch forex
 * 
 * Công thức: PnL = Số pip * Giá trị mỗi pip
 * Trong đó:
 * - Số pip = (Giá thoát - Giá vào) / PIP_SIZE (đã chuẩn hóa)
 * - Giá trị mỗi pip = lotSize * Giá trị của 1 pip cho 1 lot
 * 
 * Ví dụ XAUUSD: lot = 0.05, di chuyển 100 điểm (2300 - 2200)
 * - Số pip = (2300 - 2200) / 0.1 = 1,000 pip
 * - Giá trị mỗi pip = 0.05 * $10 = $0.5 mỗi pip
 * - PnL = 1,000 pip * $0.5 mỗi pip = $500
 * 
 * Ví dụ EURUSD: lot = 0.1, di chuyển 10 điểm (1.0900 - 1.0890)
 * - Số pip = (1.0900 - 1.0890) / 0.0001 = 100 pip
 * - Giá trị mỗi pip = 0.1 * $10 = $1 mỗi pip
 * - PnL = 100 pip * $1 mỗi pip = $100
 */
export function calculateProfit(params: ProfitCalculationParams): number {
  const { pair, direction, entryPrice, exitPrice, lotSize, accountCurrency } = params;
  
  // Tính số pip chênh lệch
  let pipDifference: number;
  if (direction === "BUY") {
    // Lệnh MUA: giá tăng (exit > entry) thì lời, giá giảm (exit < entry) thì lỗ
    pipDifference = (exitPrice - entryPrice) / PIP_SIZE[pair];
  } else {
    // Lệnh BÁN: giá giảm (exit < entry) thì lời, giá tăng (exit > entry) thì lỗ
    pipDifference = (entryPrice - exitPrice) / PIP_SIZE[pair];
  }
  
  // Tính giá trị của mỗi pip
  const pipValue = calculatePipValue({ pair, lotSize, accountCurrency });
  
  // Tính lợi nhuận/thua lỗ
  return pipDifference * pipValue;
}

/**
 * Calculate lot size based on risk percentage
 */
export function calculateLotSize(params: RiskCalculationParams): number {
  const { pair, direction, entryPrice, stopLoss, accountBalance, riskPercentage, accountCurrency } = params;
  
  // Calculate risk amount
  const riskAmount = accountBalance * (riskPercentage / 100);
  
  // Calculate pip difference between entry and stop loss
  let pipDifference: number;
  if (direction === "BUY") {
    pipDifference = Math.abs((entryPrice - stopLoss) / PIP_SIZE[pair]);
  } else {
    pipDifference = Math.abs((stopLoss - entryPrice) / PIP_SIZE[pair]);
  }
  
  // Calculate pip value for lot = 1
  const pipValueForOneLot = PIP_VALUE_MULTIPLIER[pair];
  
  // Calculate required lot size
  const lotSize = riskAmount / (pipDifference * pipValueForOneLot);
  
  // Round to 2 decimal places (0.01 lot precision)
  return Math.floor(lotSize * 100) / 100;
}

/**
 * Get current price for a currency pair
 * In a real application, this would be fetched from an API
 */
function getQuote(pair: CurrencyPair): number {
  // Sample values, in a real application these would be fetched from API
  const mockQuotes: Record<CurrencyPair, number> = {
    EURUSD: 1.0820,
    GBPUSD: 1.2650,
    AUDUSD: 0.6550,
    NZDUSD: 0.6050,
    USDJPY: 151.50,
    USDCAD: 1.3650,
    USDCHF: 0.9050,
    XAUUSD: 2300.00
  };
  
  return mockQuotes[pair] || 1.0;
}

/**
 * Calculate risk/reward ratio
 */
export function calculateRiskRewardRatio(
  entryPrice: number,
  stopLoss: number,
  takeProfit: number,
  direction: Direction
): number {
  if (direction === "BUY") {
    const risk = entryPrice - stopLoss;
    const reward = takeProfit - entryPrice;
    return risk > 0 ? reward / risk : 0;
  } else {
    const risk = stopLoss - entryPrice;
    const reward = entryPrice - takeProfit;
    return risk > 0 ? reward / risk : 0;
  }
}

/**
 * Format risk/reward ratio
 */
export function formatRiskRewardRatio(ratio: number): string {
  if (ratio <= 0) return "N/A";
  return `1:${ratio.toFixed(1)}`;
}

/**
 * Tính toán tỷ lệ thắng chuẩn xác theo cách đã định nghĩa trong phần PHÂN LOẠI THẮNG/THUA
 * 
 * Công thức: Win Rate = Số lệnh thắng / (Tổng số lệnh - Số lệnh break-even) * 100%
 * Trong đó:
 * - Lệnh thắng: pip > 0
 * - Lệnh thua: pip < 0
 * - Lệnh break-even: pip = 0
 * 
 * @param trades - Mảng các giao dịch cần tính tỷ lệ thắng
 * @param pipField - Tên field chứa giá trị pip (mặc định: "pips")
 * @returns Tỷ lệ thắng (số từ 0-100)
 */
export function calculateWinRate(trades: any[], pipField: string = "pips"): number {
  if (!trades || trades.length === 0) return 0;
  
  // Lọc các giao dịch theo định nghĩa
  const winningTrades = trades.filter(t => (t[pipField] || 0) > 0);
  const breakEvenTrades = trades.filter(t => (t[pipField] || 0) === 0);
  
  // Tính số lượng giao dịch không bao gồm break-even
  const nonBreakEvenTrades = trades.length - breakEvenTrades.length;
  
  // Tính tỷ lệ thắng
  return nonBreakEvenTrades > 0 ? (winningTrades.length / nonBreakEvenTrades) * 100 : 0;
}

/**
 * Calculate stop loss price based on risk percentage
 */
export function calculateStopLossPrice(
  entryPrice: number,
  accountBalance: number,
  riskPercentage: number,
  lotSize: number,
  direction: Direction,
  pair: CurrencyPair,
  accountCurrency: Currency
): number {
  // Calculate risk amount
  const riskAmount = accountBalance * (riskPercentage / 100);
  
  // Calculate pip value
  const pipValue = calculatePipValue({ 
    pair, 
    lotSize, 
    accountCurrency 
  });
  
  // Calculate required pip distance
  const pipDistance = riskAmount / pipValue;
  
  // Calculate stop loss price
  if (direction === "BUY") {
    return entryPrice - (pipDistance * PIP_SIZE[pair]);
  } else {
    return entryPrice + (pipDistance * PIP_SIZE[pair]);
  }
}

/**
 * Calculate take profit price based on risk/reward ratio
 */
export function calculateTakeProfitPrice(
  entryPrice: number,
  stopLoss: number,
  riskRewardRatio: number,
  direction: Direction
): number {
  if (direction === "BUY") {
    const risk = entryPrice - stopLoss;
    return entryPrice + (risk * riskRewardRatio);
  } else {
    const risk = stopLoss - entryPrice;
    return entryPrice - (risk * riskRewardRatio);
  }
}

/**
 * Format price with appropriate decimal places based on currency pair
 * 
 * XAUUSD: xxxx.xx (2 decimal places)
 * USDJPY: xxx.xx (2 decimal places)
 * EURUSD and other pairs: x.xxxx (4 decimal places)
 */
export function formatPrice(price: number, pair: CurrencyPair): string {
  if (pair === "XAUUSD") {
    return price.toFixed(2); // Format gold price as xxxx.xx
  } else if (pair === "USDJPY") {
    return price.toFixed(2); // Format JPY pairs as xxx.xx
  } else {
    return price.toFixed(4); // Format other pairs as x.xxxx
  }
}

/**
 * Calculate pips from entry and exit prices
 * 
 * QUAN TRỌNG: Định nghĩa về pip và chiều của pip
 * 1. BUY (lệnh MUA):
 *    - Nếu exit > entry: pip > 0 (lãi) ✓
 *    - Nếu exit < entry: pip < 0 (lỗ) ✓
 *    - Công thức: (exit - entry) / PIP_SIZE
 * 
 * 2. SELL (lệnh BÁN):
 *    - Nếu exit < entry: pip > 0 (lãi) ✓ 
 *    - Nếu exit > entry: pip < 0 (lỗ) ✓
 *    - Công thức: (entry - exit) / PIP_SIZE
 * 
 * CÁCH PHÂN LOẠI THẮNG/THUA ĐÚNG (CẬP NHẬT NGÀY 26/04/2025):
 * - Với MỌI giao dịch (cả BUY và SELL): pip > 0 là thắng, pip < 0 là thua, pip = 0 là break-even
 * - Khi tính Win Rate, PHẢI loại bỏ các giao dịch break-even:
 *   + Win Rate = Số lệnh thắng / (Tổng số lệnh - Số lệnh break-even) * 100%
 *   + Lưu ý: Công thức này áp dụng cho TẤT CẢ các biểu đồ và thống kê
 * 
 * - Khi tính Profit Factor cần sử dụng profitLoss từ các giao dịch dựa trên phân loại theo pip:
 *   + Profit Factor = Tổng profitLoss từ lệnh THẮNG / |Tổng profitLoss từ lệnh THUA|
 *   + Dựa trên dữ liệu profitLoss thực tế: 10603.6 / 1362 = 7.78
 * 
 * - ĐẢM BẢO TÍNH NHẤT QUÁN: Tất cả các biểu đồ, thống kê và phân tích PHẢI sử dụng quy tắc này
 * 
 * CÁCH KIỂM TRA:
 * Lệnh SELL: 
 * VD: SELL XAUUSD 2000, thoát ở 1990 => pip = (2000-1990)/0.1 = +100 (lãi)
 * VD: SELL XAUUSD 2000, thoát ở 2010 => pip = (2000-2010)/0.1 = -100 (lỗ)
 */
export function calculatePips(
  pair: CurrencyPair,
  direction: Direction,
  entryPrice: number,
  exitPrice: number
): number {
  if (direction === "BUY") {
    // BUY: exit > entry = win (pip > 0), exit < entry = loss (pip < 0)
    return (exitPrice - entryPrice) / PIP_SIZE[pair];
  } else {
    // SELL: exit < entry = win (pip > 0), exit > entry = loss (pip < 0)
    return (entryPrice - exitPrice) / PIP_SIZE[pair];
  }
}

/**
 * Tính Profit Factor từ danh sách giao dịch
 * 
 * Profit Factor = Tổng lợi nhuận từ các giao dịch thắng / Tổng thua lỗ từ các giao dịch thua (giá trị tuyệt đối)
 * 
 * - Chỉ tính các giao dịch đã đóng
 * - Lệnh thắng: pip > 0
 * - Lệnh thua: pip < 0
 * - Không tính các lệnh break-even (pip = 0)
 * 
 * @param trades - Danh sách các giao dịch cần tính
 * @param pipField - Tên trường chứa giá trị pip (mặc định: "pips")
 * @param profitLossField - Tên trường chứa giá trị lợi nhuận/thua lỗ (mặc định: "profitLoss")
 * @returns Profit Factor
 */
export function calculateProfitFactor(
  trades: any[], 
  pipField: string = "pips", 
  profitLossField: string = "profitLoss"
): number {
  if (!trades || trades.length === 0) return 0;
  
  // Tính tổng lợi nhuận từ các lệnh thắng (pip > 0)
  const totalProfit = trades
    .filter(t => (t[pipField] || 0) > 0)
    .reduce((sum, t) => sum + Math.abs(t[profitLossField] || 0), 0);
  
  // Tính tổng thua lỗ từ các lệnh thua (pip < 0)
  const totalLoss = trades
    .filter(t => (t[pipField] || 0) < 0)
    .reduce((sum, t) => sum + Math.abs(t[profitLossField] || 0), 0);
  
  // Tính Profit Factor
  return totalLoss === 0 ? totalProfit : totalProfit / totalLoss;
}

/**
 * Tính Average Risk Reward Ratio từ danh sách giao dịch
 * 
 * Average Risk Reward Ratio = Trung bình lợi nhuận của các lệnh thắng / Trung bình thua lỗ của các lệnh thua
 * 
 * @param trades - Danh sách các giao dịch cần tính
 * @param pipField - Tên trường chứa giá trị pip (mặc định: "pips")
 * @param profitLossField - Tên trường chứa giá trị lợi nhuận/thua lỗ (mặc định: "profitLoss")
 * @returns Average Risk Reward Ratio
 */
export function calculateAverageRiskRewardRatio(
  trades: any[], 
  pipField: string = "pips", 
  profitLossField: string = "profitLoss"
): number {
  if (!trades || trades.length === 0) return 0;
  
  // Lọc các lệnh thắng/thua
  const winningTrades = trades.filter(t => (t[pipField] || 0) > 0);
  const losingTrades = trades.filter(t => (t[pipField] || 0) < 0);
  
  // Kiểm tra xem có đủ dữ liệu không
  if (winningTrades.length === 0 || losingTrades.length === 0) return 0;
  
  // Tính trung bình lợi nhuận của các lệnh thắng
  const avgWin = winningTrades.reduce((sum, t) => sum + Math.abs(t[profitLossField] || 0), 0) / winningTrades.length;
  
  // Tính trung bình thua lỗ của các lệnh thua
  const avgLoss = losingTrades.reduce((sum, t) => sum + Math.abs(t[profitLossField] || 0), 0) / losingTrades.length;
  
  // Tính Average Risk Reward Ratio
  return avgLoss === 0 ? 0 : avgWin / avgLoss;
}

// Không cần export type ở đây vì đã export trực tiếp ở trên
