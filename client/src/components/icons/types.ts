/**
 * Icon types for centralized icon system
 */
import type { ComponentType } from "react";

// LucideIcon interface compatible with Lucide's interface
export type LucideIcon = ComponentType<{
  size?: number | string;
  strokeWidth?: number;
  absoluteStrokeWidth?: boolean;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
  [key: string]: any;
}>;

// For generic icon use
export type IconProps = {
  className?: string;
  size?: number | string;
  strokeWidth?: number;
  [key: string]: any;
};