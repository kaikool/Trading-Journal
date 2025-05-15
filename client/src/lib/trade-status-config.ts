import { TradeResult } from "./forex-calculator";
import { Icons } from "@/components/icons/icons";
import type { ComponentType } from "react";

export type TradeStatus = TradeResult | "OPEN";

export interface TradeStatusConfig {
  id: TradeStatus;
  label: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
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
    icon: Icons.ui.success,
    color: "text-success",
    bgColor: "bg-success",
    lightBgColor: "bg-success/10",
    borderColor: "border-success/30",
  },
  "SL": {
    id: "SL",
    label: "SL HIT",
    description: "Stop Loss Hit",
    icon: Icons.ui.error,
    color: "text-destructive",
    bgColor: "bg-destructive",
    lightBgColor: "bg-destructive/10",
    borderColor: "border-destructive/30",
  },
  "BE": {
    id: "BE",
    label: "BE",
    description: "Trade Closed at Break Even",
    icon: Icons.ui.circle,
    color: "text-warning",
    bgColor: "bg-warning",
    lightBgColor: "bg-warning/10",
    borderColor: "border-warning/30",
  },
  "MANUAL": {
    id: "MANUAL",
    label: "MANUAL",
    description: "Manually Closed Trade",
    icon: Icons.general.hand,
    color: "text-primary",
    bgColor: "bg-primary",
    lightBgColor: "bg-primary/10",
    borderColor: "border-primary/30",
  },
  "OPEN": {
    id: "OPEN",
    label: "OPEN",
    description: "Active Trade",
    icon: Icons.ui.lock,
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

// Functions below have been removed by cleanup as they were not used in the project