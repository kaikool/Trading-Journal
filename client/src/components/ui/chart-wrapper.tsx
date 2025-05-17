import React from "react";
import { Icons } from "@/components/icons/icons";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

interface ChartWrapperProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  isLoading?: boolean;
  hasData?: boolean;
  emptyMessage?: string;
  emptyDescription?: string;
  className?: string;
  height?: number | string;
  actions?: React.ReactNode;
}

/**
 * Common wrapper component for all chart types
 * 
 * Provides consistent styling, loading states, empty states,
 * and responsive behavior across the application.
 */
export function ChartWrapper({
  children,
  title,
  description,
  isLoading = false,
  hasData = true,
  emptyMessage = "No data available",
  emptyDescription = "Once data is available, it will be displayed here",
  className,
  height = 250,
  actions
}: ChartWrapperProps) {
  // Skip rendering if loading
  if (isLoading) {
    return null;
  }
  
  // Show empty state if no data
  if (!hasData) {
    return (
      <Card className={cn(
        "relative w-full shadow-sm bg-card border border-border/30",
        className
      )}>
        <div 
          style={{ height: typeof height === 'number' ? `${height}px` : height }}
          className="flex flex-col items-center justify-center p-6 bg-muted/5 rounded-md border border-dashed border-border/50 m-4"
        >
          <Icons.ui.barChart className="h-10 w-10 text-muted-foreground/20 mb-3" />
          <div className="text-base font-medium text-center">
            {emptyMessage}
          </div>
          <div className="text-xs text-muted-foreground mt-2 text-center max-w-xs">
            {emptyDescription}
          </div>
        </div>
      </Card>
    );
  }
  
  // Show chart content
  return (
    <Card 
      className={cn(
        "relative w-full shadow-sm bg-card border border-border/30 overflow-hidden",
        className
      )}
    >
      {(title || actions) && (
        <div className="flex items-center justify-between p-4 border-b border-border/20 mb-1">
          <div>
            {title && <h3 className="text-sm font-medium">{title}</h3>}
            {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
          </div>
          {actions && <div className="flex items-center space-x-2">{actions}</div>}
        </div>
      )}
      <div 
        className="p-3 pt-2 w-full"
        style={{ 
          height: typeof height === 'number' ? `${height}px` : height,
          minHeight: typeof height === 'number' ? `${height}px` : height,
          minWidth: '100px'  
        }}
      >
        {children}
      </div>
    </Card>
  );
}