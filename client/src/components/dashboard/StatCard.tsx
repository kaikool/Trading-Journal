import React from "react";
import { cn } from "@/lib/utils";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardIcon, 
  CardGradient,
  CardValue
} from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color?: "default" | "gold" | "teal" | "primary" | "success" | "warning" | "destructive";
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
  // Map color options to UI card component properties
  const colorMapping = {
    default: "primary",
    gold: "warning",
    teal: "success",
    primary: "primary",
    success: "success",
    warning: "warning",
    destructive: "destructive"
  };

  // Map to gradient variant - handle both string approaches
  const gradientVariant = colorMapping[color] || "primary";
  
  // Icon color based on card color
  const iconColor = color === "gold" ? "warning" : colorMapping[color] || "primary";
  
  // Progress bar styles based on color
  const progressBarClass = 
    color === "gold" ? "bg-gradient-to-r from-amber-400/70 via-amber-400/90 to-amber-500" :
    color === "teal" ? "bg-gradient-to-r from-teal-500/70 via-teal-500/90 to-teal-600" :
    color === "success" ? "bg-gradient-to-r from-success/70 via-success/90 to-success" :
    color === "warning" ? "bg-gradient-to-r from-warning/70 via-warning/90 to-warning" :
    color === "destructive" ? "bg-gradient-to-r from-destructive/70 via-destructive/90 to-destructive" :
    "bg-gradient-to-r from-primary/70 via-primary/90 to-primary";

  // Skip rendering if loading
  if (isLoading) {
    return null;
  }

  return (
    <Card className="relative overflow-hidden card-spotlight">
      {/* Gradient background for card */}
      <CardGradient 
        variant={gradientVariant as any} 
        intensity="subtle" 
        direction="top-right" 
      />
      
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <CardIcon 
            color={iconColor as any} 
            size="sm"
            variant="soft"
          >
            {icon}
          </CardIcon>
          {title}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <CardValue
          size="md"
          status="default"
          className="mb-1"
        >
          {value}
          {suffix && <span className="ml-1 text-lg opacity-80">{suffix}</span>}
        </CardValue>
        
        {/* Progress bar (if needed) */}
        {progressValue !== undefined && (
          <div className="w-full bg-muted/20 rounded-full h-2 mt-3">
            <div 
              className={cn(
                "h-full rounded-full", 
                progressBarClass
              )} 
              style={{width: `${progressValue}%`}}
            />
          </div>
        )}
        
        {/* Supporting text/content (optional) */}
        {supportingText && (
          <div className="text-sm text-muted-foreground mt-2">
            {supportingText}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
