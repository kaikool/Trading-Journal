import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export type Direction = "BUY" | "SELL";

interface DirectionBadgeProps {
  direction: Direction;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  iconOnly?: boolean;
  variant?: string; // Giữ lại để tương thích với code hiện tại, nhưng không còn sử dụng
}

/**
 * A consistent badge component to display trade direction across the application
 * Uses forwardRef to properly work with Tooltip and other components that pass refs
 */
const DirectionBadge = React.forwardRef<HTMLDivElement, DirectionBadgeProps>(({
  direction,
  className,
  size = 'md',
  showTooltip = true,
  iconOnly = false,
  variant, // Tham số này không còn được sử dụng, nhưng giữ để tương thích ngược
}, ref) => {
  // Chỉ sử dụng một loại icon duy nhất cho toàn bộ ứng dụng
  const Icon = direction === "BUY" ? TrendingUp : TrendingDown;
  
  // Configuration based on direction
  const config = {
    label: direction,
    description: direction === "BUY" ? "Buy/Long Position" : "Sell/Short Position",
    bgColor: direction === "BUY" ? "bg-success" : "bg-destructive",
    color: direction === "BUY" ? "text-success" : "text-destructive",
    lightBgColor: direction === "BUY" ? "bg-success/10" : "bg-destructive/10",
  };
  
  const sizeClasses = {
    sm: "text-xs px-1.5 py-0.5",
    md: "text-xs px-2 py-1",
    lg: "text-sm px-2.5 py-1.5"
  };
  
  const iconSizeClasses = {
    sm: "h-3 w-3 mr-0.5",
    md: "h-3.5 w-3.5 mr-1",
    lg: "h-4 w-4 mr-1.5"
  };

  const badge = (
    <Badge 
      className={cn(
        config.bgColor,
        "hover:bg-opacity-90",
        "flex items-center font-medium",
        sizeClasses[size],
        iconOnly ? "rounded-full p-0 h-6 w-6 flex items-center justify-center" : "",
        className
      )}
    >
      <Icon className={cn(
        iconOnly ? "mr-0" : iconSizeClasses[size]
      )} />
      {!iconOnly && config.label}
    </Badge>
  );
  
  if (showTooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {badge}
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>{config.description}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  return badge;
});

export default DirectionBadge;