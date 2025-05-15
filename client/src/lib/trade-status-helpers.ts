import { Trade } from "@/types";
import { TradeStatus } from "./trade-status-config";

/**
 * Determine trade status based on trade data
 */
export function determineTradeStatus(trade: Trade): TradeStatus {
  if (trade.isOpen) {
    return "OPEN";
  }
  
  return trade.result as TradeStatus || "MANUAL";
}

// getTradeResultDisplay function removed - not used in the project