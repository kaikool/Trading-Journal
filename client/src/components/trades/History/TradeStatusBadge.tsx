import { Badge } from "@/components/ui/badge";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { TradeStatus, getTradeStatusConfig } from "@/lib/trade-status-config";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface TradeStatusBadgeProps {
  status: TradeStatus;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  iconOnly?: boolean;
}

/**
 * A consistent badge component to display trade status across the application
 * Uses forwardRef to properly work with Tooltip and other components that pass refs
 */
const TradeStatusBadge = forwardRef<HTMLDivElement, TradeStatusBadgeProps>(({
  status,
  className,
  size = 'md',
  showTooltip = true,
  iconOnly = false,
}, ref) => {
  const config = getTradeStatusConfig(status);
  const Icon = config.icon;
  
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

export default TradeStatusBadge;