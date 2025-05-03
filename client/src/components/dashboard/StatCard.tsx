import React from "react";
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
  // Color configuration for different card styles
  const colorConfig = {
    default: {
      iconClass: "text-primary bg-primary/10",
      progressClass: "bg-gradient-to-r from-primary/80 to-primary",
      gradientClass: "bg-gradient-to-br from-primary/5 to-primary/0",
    },
    gold: {
      iconClass: "text-amber-500 bg-amber-500/10",
      progressClass: "bg-gradient-to-r from-amber-400 to-amber-500",
      gradientClass: "bg-gradient-to-br from-amber-500/5 to-amber-500/0",
    },
    teal: {
      iconClass: "text-teal-600 bg-teal-500/10",
      progressClass: "bg-gradient-to-r from-teal-500/80 to-teal-600",
      gradientClass: "bg-gradient-to-br from-teal-500/5 to-teal-500/0",
    },
    primary: {
      iconClass: "text-primary bg-primary/10",
      progressClass: "bg-gradient-to-r from-primary/80 to-primary",
      gradientClass: "bg-gradient-to-br from-primary/5 to-primary/0",
    },
  };

  // Loading/skeleton state
  if (isLoading) {
    return (
      <div className="stat-card-skeleton">
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
      </div>
    );
  }

  return (
    <div className="stat-card group">
      {/* Gradient background effect */}
      <div className={cn(
        "stat-card-bg",
        colorConfig[color].gradientClass
      )} />
      
      {/* Card header with title and icon */}
      <div className="stat-card-header">
        <span className="stat-card-title">{title}</span>
        <div className={cn("stat-card-icon-container", colorConfig[color].iconClass)}>
          {icon}
        </div>
      </div>
      
      {/* Main value display */}
      <div className="stat-card-value">
        {value}
        {suffix && <span className="stat-card-suffix">{suffix}</span>}
      </div>
      
      {/* Progress bar (if needed) */}
      {progressValue !== undefined && (
        <div className="stat-card-progress-container">
          <div 
            className={cn(
              "stat-card-progress", 
              colorConfig[color].progressClass
            )} 
            style={{"--progress-width": `${progressValue}%`} as React.CSSProperties}
          />
        </div>
      )}
      
      {/* Supporting text/content (optional) */}
      {supportingText && (
        <div className="stat-card-supporting-text">
          {supportingText}
        </div>
      )}
    </div>
  );
}
