import { TradeStatus, getTradeStatusConfig } from "@/lib/trade-status-config";
import { cn } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";

interface TradeStatusPillProps {
  status: TradeStatus;
  size?: 'sm' | 'md' | 'lg';
  selected?: boolean;
  interactive?: boolean;
  onClick?: () => void;
  className?: string;
  title?: string;
}

/**
 * A pill-shaped component to display trade status as selection options
 */
export default function TradeStatusPill({
  status,
  size = 'md',
  selected = false,
  interactive = false,
  onClick,
  className,
  title,
}: TradeStatusPillProps) {
  const config = getTradeStatusConfig(status);
  const Icon = config.icon;
  
  const containerSizeClasses = {
    sm: "py-1.5 px-3",
    md: "py-2 px-4",
    lg: "py-2.5 px-5",
  };
  
  const iconSizeClasses = {
    sm: "h-4 w-4 mr-1.5",
    md: "h-5 w-5 mr-2",
    lg: "h-6 w-6 mr-2.5",
  };
  
  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };
  
  // Extract color class without the 'text-' prefix
  const colorName = config.color.replace('text-', '');
  
  return (
    <div 
      className={cn(
        "inline-flex items-center justify-center",
        interactive && "cursor-pointer transition-colors",
        className
      )}
      onClick={interactive ? onClick : undefined}
      title={title || config.description}
    >
      <div className={cn(
        "relative flex items-center justify-center rounded-full w-full",
        containerSizeClasses[size],
        selected 
          ? `${config.bgColor} text-white` 
          : `${config.lightBgColor} ${config.color} hover:bg-${colorName}/15 border border-${colorName}/30`
      )}>
        <div className="flex items-center justify-center">
          <Icon className={iconSizeClasses[size]} />
          <span className={cn(
            "font-medium whitespace-nowrap",
            textSizeClasses[size],
          )}>
            {config.label}
          </span>
        </div>
        {selected && (
          <div className="absolute -top-1 -right-1 bg-white rounded-full p-0.5">
            <CheckCircle2 className={`h-3.5 w-3.5 ${config.color}`} />
          </div>
        )}
      </div>
    </div>
  );
}