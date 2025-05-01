import { TradeResult } from "./forex-calculator";
import { 
  CheckCircle2, 
  Ban, 
  CircleDot, 
  Hand, 
  Lock
} from "lucide-react";
import { LucideIcon } from "lucide-react";

export type TradeStatus = TradeResult | "OPEN";

export interface TradeStatusConfig {
  id: TradeStatus;
  label: string;
  description: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  lightBgColor: string;
  borderColor: string;
}

export const TRADE_STATUS_CONFIG: Record<TradeStatus, TradeStatusConfig> = {
  "TP": {
    id: "TP",
    label: "TP HIT",
    description: "Take Profit Hit",
    icon: CheckCircle2,
    color: "text-success",
    bgColor: "bg-success",
    lightBgColor: "bg-success/10",
    borderColor: "border-success/30",
  },
  "SL": {
    id: "SL",
    label: "SL HIT",
    description: "Stop Loss Hit",
    icon: Ban,
    color: "text-destructive",
    bgColor: "bg-destructive",
    lightBgColor: "bg-destructive/10",
    borderColor: "border-destructive/30",
  },
  "BE": {
    id: "BE",
    label: "BE",
    description: "Trade Closed at Break Even",
    icon: CircleDot,
    color: "text-warning",
    bgColor: "bg-warning",
    lightBgColor: "bg-warning/10",
    borderColor: "border-warning/30",
  },
  "MANUAL": {
    id: "MANUAL",
    label: "MANUAL",
    description: "Manually Closed Trade",
    icon: Hand,
    color: "text-primary",
    bgColor: "bg-primary",
    lightBgColor: "bg-primary/10",
    borderColor: "border-primary/30",
  },
  "OPEN": {
    id: "OPEN",
    label: "OPEN",
    description: "Active Trade",
    icon: Lock,
    color: "text-primary",
    bgColor: "bg-primary",
    lightBgColor: "bg-primary/10",
    borderColor: "border-primary/30",
  }
};

/**
 * Get the configuration for a specific trade status
 */
export function getTradeStatusConfig(status: TradeStatus): TradeStatusConfig {
  return TRADE_STATUS_CONFIG[status];
}

/**
 * Get a styled badge component classes for a trade status
 */
export function getTradeStatusClasses(status: TradeStatus): {
  badgeClasses: string;
  iconClasses: string;
} {
  const config = getTradeStatusConfig(status);
  return {
    badgeClasses: `${config.bgColor} hover:${config.bgColor}`,
    iconClasses: "h-3.5 w-3.5 mr-1"
  };
}

/**
 * Get the appropriate color classes for a trade status in different contexts
 */
export function getTradeStatusColorClasses(status: TradeStatus, type: 'text' | 'bg' | 'lightBg' | 'border' = 'text'): string {
  const config = getTradeStatusConfig(status);
  switch (type) {
    case 'text': return config.color;
    case 'bg': return config.bgColor;
    case 'lightBg': return config.lightBgColor;
    case 'border': return config.borderColor;
    default: return config.color;
  }
}