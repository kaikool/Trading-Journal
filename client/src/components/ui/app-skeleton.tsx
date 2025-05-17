import { cn } from "@/lib/utils"

// Empty placeholder for removed skeleton components
export enum SkeletonLevel {
  LIST_ITEM = "list_item",
  CARD = "card",
  FORM = "form",
  PAGE = "page",
  CHART = "chart",
  TABLE = "table",
  STATS = "stats",
  AVATAR = "avatar",
}

interface AppSkeletonProps {
  level: SkeletonLevel;
  className?: string;
  height?: number;
  count?: number;
  customProps?: Record<string, any>;
}

// Simple empty div as replacement for the skeleton component
export function AppSkeleton({ 
  level, 
  className = "", 
  height, 
  count = 1,
  customProps = {}
}: AppSkeletonProps) {
  return null;
}