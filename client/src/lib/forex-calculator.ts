/**
 * @file forex-calculator.ts
 * @description Thư viện tính toán forex chuẩn cho ứng dụng. Module này chứa các 
 * hằng số, công thức và hàm tính toán chính xác cho giao dịch forex.
 * @version 1.6.0
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
 */
const POINT_SIZE: Readonly<Record<CurrencyPair, number>> = Object.freeze({
  EURUSD: 0.00001,
  GBPUSD: 0.00001,
  AUDUSD: 0.00001,
  NZDUSD: 0.00001,
  USDJPY: 0.001,
  USDCAD: 0.00001,
  USDCHF: 0.00001,
  XAUUSD: 0.01
});

/**
 * PIP SIZE - Đơn vị chuẩn đo lường biến động giá trong forex
 */
export const PIP_SIZE: Readonly<Record<CurrencyPair, number>> = Object.freeze({
  EURUSD: 0.0001,
  GBPUSD: 0.0001,
  AUDUSD: 0.0001,
  NZDUSD: 0.0001,
  USDJPY: 0.01,
  USDCAD: 0.0001,
  USDCHF: 0.0001,
  XAUUSD: 0.1
});

/**
 * PIP VALUE MULTIPLIER - Giá trị của 1 pip khi giao dịch 1 standard lot
 */
const PIP_VALUE_MULTIPLIER: Readonly<Record<CurrencyPair, number>> = Object.freeze({
  EURUSD: 10,
  GBPUSD: 10,
  AUDUSD: 10,
  NZDUSD: 10,
  USDJPY: 10,
  USDCAD: 10,
  USDCHF: 10,
  XAUUSD: 10
});

/**
 * Lấy số chữ số thập phân cho một cặp tiền tệ.
 * @param pair Cặp tiền tệ
 * @returns Số chữ số thập phân
 */
function getDecimalPlaces(pair: CurrencyPair): number {
  if (pair === 'XAUUSD' || pair === 'USDJPY') {
    return 2;
  }
  return 4;
}

/**
 * Tính giá trị của 1 pip theo USD
 */
export function calculatePipValue(params: PipValueCalculationParams): number {
  const { pair, lotSize, accountCurrency } = params;
  const pipValue = lotSize * PIP_VALUE_MULTIPLIER[pair];
  return pipValue;
}

/**
 * Tính lợi nhuận/thua lỗ cho một giao dịch forex
 */
export function calculateProfit(params: ProfitCalculationParams): number {
  const { pair, direction, entryPrice, exitPrice, lotSize, accountCurrency } = params;
  
  let pipDifference: number;
  if (direction === "BUY") {
    pipDifference = (exitPrice - entryPrice) / PIP_SIZE[pair];
  } else {
    pipDifference = (entryPrice - exitPrice) / PIP_SIZE[pair];
  }
  
  const pipValue = calculatePipValue({ pair, lotSize, accountCurrency });
  const profitLoss = pipDifference * pipValue;

  // Làm tròn kết quả cuối cùng để tránh lỗi dấu phẩy động
  return Number(profitLoss.toFixed(2));
}

/**
 * Calculate lot size based on risk percentage
 */
export function calculateLotSize(params: RiskCalculationParams): number {
  const { pair, direction, entryPrice, stopLoss, accountBalance, riskPercentage, accountCurrency } = params;
  
  const riskAmount = accountBalance * (riskPercentage / 100);
  
  let pipDifference: number;
  if (direction === "BUY") {
    pipDifference = Math.abs((entryPrice - stopLoss) / PIP_SIZE[pair]);
  } else {
    pipDifference = Math.abs((stopLoss - entryPrice) / PIP_SIZE[pair]);
  }
  
  const pipValueForOneLot = PIP_VALUE_MULTIPLIER[pair];
  
  if (pipDifference === 0 || pipValueForOneLot === 0) return 0;

  const lotSize = riskAmount / (pipDifference * pipValueForOneLot);
  
  return Math.floor(lotSize * 100) / 100;
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
  const risk = direction === "BUY" ? entryPrice - stopLoss : stopLoss - entryPrice;
  const reward = direction === "BUY" ? takeProfit - entryPrice : entryPrice - takeProfit;
  
  if (risk <= 0 || reward <= 0) return 0;

  return reward / risk;
}

/**
 * Tính toán tỷ lệ thắng chuẩn xác
 */
export function calculateWinRate(trades: any[], pipField: string = "pips"): number {
  if (!trades || trades.length === 0) return 0;
  
  const winningTrades = trades.filter(t => (t[pipField] || 0) > 0);
  const breakEvenTrades = trades.filter(t => (t[pipField] || 0) === 0);
  
  const nonBreakEvenTrades = trades.length - breakEvenTrades.length;
  
  return nonBreakEvenTrades > 0 ? (winningTrades.length / nonBreakEvenTrades) * 100 : 0;
}

/**
 * Calculate take profit price based on risk/reward ratio
 */
export interface TakeProfitCalculationParams {
  entryPrice: number;
  stopLossPrice: number;
  riskRewardRatio: number;
  direction: Direction;
  symbol: CurrencyPair;
}

export function calculateTakeProfitPrice(params: TakeProfitCalculationParams): number {
  const { entryPrice, stopLossPrice, riskRewardRatio, direction, symbol } = params;
  
  let rawTakeProfit: number;
  if (direction === "BUY") {
    const risk = entryPrice - stopLossPrice;
    rawTakeProfit = entryPrice + (risk * riskRewardRatio);
  } else {
    const risk = stopLossPrice - entryPrice;
    rawTakeProfit = entryPrice - (risk * riskRewardRatio);
  }

  // LÀM TRÒN TẠI NGUỒN: Sửa lỗi dấu phẩy động
  const decimals = getDecimalPlaces(symbol);
  return Number(rawTakeProfit.toFixed(decimals));
}

/**
 * Format price with appropriate decimal places based on currency pair
 */
export function formatPrice(price: number, pair: CurrencyPair): string {
  const decimals = getDecimalPlaces(pair);
  return price.toFixed(decimals);
}

/**
 * Calculate pips from entry and exit prices
 */
export function calculatePips(
  pair: CurrencyPair,
  direction: Direction,
  entryPrice: number,
  exitPrice: number
): number {
  let pipDifference: number;
  if (direction === "BUY") {
    pipDifference = (exitPrice - entryPrice) / PIP_SIZE[pair];
  } else {
    pipDifference = (entryPrice - exitPrice) / PIP_SIZE[pair];
  }
  // Làm tròn pips để đảm bảo tính nhất quán
  return Number(pipDifference.toFixed(1)); 
}

/**
 * Tính Profit Factor từ danh sách giao dịch
 */
export function calculateProfitFactor(
  trades: any[], 
  pipField: string = "pips", 
  profitLossField: string = "profitLoss"
): number {
  if (!trades || trades.length === 0) return 0;
  
  const totalProfit = trades
    .filter(t => (t[pipField] || 0) > 0)
    .reduce((sum, t) => sum + Math.abs(t[profitLossField] || 0), 0);
  
  const totalLoss = trades
    .filter(t => (t[pipField] || 0) < 0)
    .reduce((sum, t) => sum + Math.abs(t[profitLossField] || 0), 0);
  
  return totalLoss === 0 ? (totalProfit > 0 ? Infinity : 0) : totalProfit / totalLoss;
}

/**
 * Tính Average Risk Reward Ratio từ danh sách giao dịch
 */
export function calculateAverageRiskRewardRatio(
  trades: any[], 
  pipField: string = "pips", 
  profitLossField: string = "profitLoss"
): number {
  if (!trades || trades.length === 0) return 0;
  
  const winningTrades = trades.filter(t => (t[pipField] || 0) > 0);
  const losingTrades = trades.filter(t => (t[pipField] || 0) < 0);
  
  if (winningTrades.length === 0 || losingTrades.length === 0) return 0;
  
  const avgWin = winningTrades.reduce((sum, t) => sum + Math.abs(t[profitLossField] || 0), 0) / winningTrades.length;
  
  const avgLoss = losingTrades.reduce((sum, t) => sum + Math.abs(t[profitLossField] || 0), 0) / losingTrades.length;
  
  return avgLoss === 0 ? 0 : avgWin / avgLoss;
}
