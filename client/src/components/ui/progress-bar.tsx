import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useLoadingStore } from "@/hooks/use-loading-store";

interface ProgressBarProps {
  className?: string;
  height?: number;
  color?: "primary" | "secondary" | "accent" | "info";
  fixed?: boolean;
  showOnPageLoading?: boolean;
  showOnAppLoading?: boolean;
}

export function ProgressBar({
  className,
  height = 3,
  color = "primary",
  fixed = true,
  showOnPageLoading = true,
  showOnAppLoading = true,
}: ProgressBarProps) {
  const isPageLoading = useLoadingStore(state => state.isPageLoading);
  const isAppLoading = useLoadingStore(state => state.isAppLoading);
  const progress = useLoadingStore(state => state.progress);
  const [visible, setVisible] = useState(false);
  
  // Calculate if progress bar should be visible
  useEffect(() => {
    const shouldShow = (showOnPageLoading && isPageLoading()) ||
                      (showOnAppLoading && isAppLoading());
    
    if (shouldShow && !visible) {
      setVisible(true);
    } else if (!shouldShow && visible) {
      // Small delay before hiding to allow complete animation
      const timer = setTimeout(() => {
        setVisible(false);
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [isPageLoading, isAppLoading, showOnPageLoading, showOnAppLoading, visible]);
  
  // Get the color classes based on the color prop
  const getColorClasses = () => {
    switch (color) {
      case "primary":
        return "bg-primary";
      case "secondary":
        return "bg-secondary";
      case "accent":
        return "bg-accent";
      case "info":
        return "bg-blue-500";
      default:
        return "bg-primary";
    }
  };
  
  // If not visible, don't render
  if (!visible) return null;
  
  return (
    <div
      className={cn(
        "w-full overflow-hidden",
        fixed && "fixed top-0 left-0 z-50",
        className
      )}
      style={{ height: `${height}px` }}
    >
      <div
        className={cn(
          "h-full transition-all ease-out duration-300",
          getColorClasses(),
          progress >= 100 ? "animate-progress-complete" : ""
        )}
        style={{
          width: `${progress}%`,
          transition: progress > 0 && progress < 100
            ? "width 300ms cubic-bezier(0.4, 0, 0.2, 1)"
            : "none"
        }}
      />
    </div>
  );
}