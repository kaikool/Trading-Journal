import React from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color?: "default" | "gold" | "teal" | "primary";
  suffix?: string;
  supportingText?: string | React.ReactNode;
  progressValue?: number;
  isLoading?: boolean;
}

export default function StatCard({
  title,
  value,
  icon,
  color = "default",
  suffix,
  supportingText,
  progressValue,
  isLoading = false,
}: StatCardProps) {
  // Enhanced color palette with Apple-inspired gradients
  const colors = {
    default: {
      icon: "text-primary bg-primary/10",
      progressBg: "bg-gradient-to-r from-primary/80 to-primary",
      gradientFrom: "from-primary/5",
      gradientTo: "to-primary/0",
    },
    gold: {
      icon: "text-amber-500 bg-amber-500/10",
      progressBg: "bg-gradient-to-r from-amber-400 to-amber-500",
      gradientFrom: "from-amber-500/5",
      gradientTo: "to-amber-500/0",
    },
    teal: {
      icon: "text-teal-600 bg-teal-500/10",
      progressBg: "bg-gradient-to-r from-teal-500/80 to-teal-600",
      gradientFrom: "from-teal-500/5",
      gradientTo: "to-teal-500/0",
    },
    primary: {
      icon: "text-primary bg-primary/10",
      progressBg: "bg-gradient-to-r from-primary/80 to-primary",
      gradientFrom: "from-primary/5",
      gradientTo: "to-primary/0",
    },
  };

  if (isLoading) {
    return (
      <Card className="p-6 shadow-sm h-[138px] animate-pulse border border-border/30">
        <div className="flex justify-between mb-2 relative z-10">
          <div className="h-5 w-24 bg-muted/60 rounded-md" />
          <div className="h-7 w-7 bg-muted/60 rounded-full" />
        </div>
        <div className="h-8 w-20 bg-muted/60 rounded-md mb-2" />
        {progressValue !== undefined && (
          <div className="relative z-10 mt-4 pt-1">
            <div className="w-full bg-muted/60 rounded-full h-2" />
          </div>
        )}
        {supportingText && (
          <div className="h-5 w-36 bg-muted/60 rounded-md mt-2" />
        )}
      </Card>
    );
  }

  return (
    <Card className="p-6 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden relative border border-border/30 group">
      {/* Apple-inspired subtle gradient background and effects */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br opacity-50 group-hover:opacity-70 transition-opacity",
        colors[color].gradientFrom,
        colors[color].gradientTo
      )} />
      
      <div className="flex justify-between mb-3 relative z-10">
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        <div className={cn("flex items-center justify-center p-1.5 rounded-full", colors[color].icon)}>
          {icon}
        </div>
      </div>
      
      <div className="text-3xl font-semibold mb-2 relative z-10 tracking-tight">
        {value}
        {suffix && <span className="text-lg ml-1 text-foreground/80">{suffix}</span>}
      </div>
      
      {progressValue !== undefined && (
        <div className="relative z-10 mt-2 pt-1">
          <div className="w-full bg-muted/40 rounded-full h-1.5">
            <div 
              className={cn("h-1.5 rounded-full progress-animate", colors[color].progressBg)} 
              style={{ 
                width: `${progressValue}%`,
                '--progress-width': `${progressValue}%`
              } as React.CSSProperties}
            />
          </div>
        </div>
      )}
      
      {supportingText && (
        <div className="flex items-center relative z-10 mt-2">
          {supportingText}
        </div>
      )}
    </Card>
  );
}
