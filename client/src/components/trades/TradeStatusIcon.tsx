import { TradeStatus, getTradeStatusConfig } from "@/lib/trade-status-config";
import { cn } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";

interface TradeStatusIconProps {
  status: TradeStatus;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  selected?: boolean;
  interactive?: boolean;
  onClick?: () => void;
  className?: string;
  title?: string;
}

/**
 * A consistent icon component to display trade status across the application
 */
export default function TradeStatusIcon({
  status,
  size = 'md',
  selected = false,
  interactive = false,
  onClick,
  className,
  title,
}: TradeStatusIconProps) {
  const config = getTradeStatusConfig(status);
  const Icon = config.icon;
  
  const containerSizeClasses = {
    sm: "h-10 w-10",
    md: "h-12 w-12",
    lg: "h-14 w-14",
    xl: "h-16 w-16",
  };
  
  const iconSizeClasses = {
    sm: "h-5 w-5",
    md: "h-6 w-6",
    lg: "h-7 w-7",
    xl: "h-8 w-8",
  };
  
  // Extract color class without the 'text-' prefix
  const colorName = config.color.replace('text-', '');
  
  return (
    <div 
      className={cn(
        "flex flex-col items-center",
        interactive && "cursor-pointer transition-all",
        selected && "scale-110",
        className
      )}
      onClick={interactive ? onClick : undefined}
      title={title || config.description}
    >
      <div className={cn(
        "relative flex items-center justify-center rounded-full mb-1 transition-all",
        containerSizeClasses[size],
        selected 
          ? `${config.bgColor} text-white ring-4 ring-${colorName}/20` 
          : `${config.lightBgColor} ${config.color} hover:bg-${colorName}/20`
      )}>
        <Icon className={iconSizeClasses[size]} />
        {selected && (
          <div className="absolute -top-1 -right-1 bg-white rounded-full p-0.5">
            <CheckCircle2 className={`h-4 w-4 ${config.color}`} />
          </div>
        )}
      </div>
      <span className="text-xs font-medium">{config.label}</span>
    </div>
  );
}