import { Trade } from "@/types";
import { TradeStatus } from "./trade-status-config";

/**
 * Xác định trạng thái giao dịch dựa trên dữ liệu của giao dịch
 */
export function determineTradeStatus(trade: Trade): TradeStatus {
  if (trade.isOpen) {
    return "OPEN";
  }
  
  return trade.result as TradeStatus || "MANUAL";
}

/**
 * Format hiển thị kết quả của giao dịch (pip và lợi nhuận)
 */
export function getTradeResultDisplay(trade: Trade): {
  profitClass: string;
  prefix: string;
  hasProfit: boolean;
} {
  if (trade.isOpen) {
    return {
      profitClass: "text-blue-500",
      prefix: "",
      hasProfit: false
    };
  }
  
  const profitLoss = trade.profitLoss || 0;
  const isProfit = profitLoss > 0;
  const isBreakEven = profitLoss === 0;
  
  return {
    profitClass: isProfit 
      ? "text-green-500" 
      : isBreakEven 
        ? "text-amber-500" 
        : "text-red-500",
    prefix: isProfit ? "+" : "",
    hasProfit: isProfit
  };
}