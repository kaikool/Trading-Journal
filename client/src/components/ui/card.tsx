import * as React from "react"

import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    hover?: boolean;
    variant?: 'default' | 'outline' | 'elevated' | 'subtle' | 'glass';
    gradient?: boolean;
  }
>(({ className, hover = true, variant = 'default', gradient = false, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg text-card-foreground relative overflow-hidden",
      // Base variants với màu nền tinh tế hơn
      variant === 'default' && "bg-card/95 border-border/30 border shadow-[var(--shadow-sm)]",
      variant === 'outline' && "bg-card/80 border-border/40 border",
      variant === 'elevated' && "bg-card/95 border-0 shadow-[var(--shadow-md)]",
      variant === 'subtle' && "bg-muted/30 border-border/20 border backdrop-blur-[2px]",
      variant === 'glass' && "bg-background/60 border-border/25 border backdrop-blur-[8px] shadow-[var(--shadow-sm)]",
      // Hover effect
      hover && "transition-all duration-200 ease-in-out hover:shadow-[var(--shadow-md)] hover:bg-card/99",
      // Optional gradient overlay
      gradient && "gradient-card",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    compact?: boolean;
    withIcon?: boolean;
  }
>(({ className, compact = false, withIcon = false, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col relative z-10",
      compact ? "p-4" : "p-6", 
      withIcon ? "space-y-1" : "space-y-1.5",
      className
    )}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement> & {
    withIcon?: boolean;
    iconPosition?: 'left' | 'right';
  }
>(({ className, withIcon = false, iconPosition = 'left', ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "font-semibold leading-tight tracking-tight",
      withIcon ? "flex items-center gap-2" : "",
      iconPosition === 'right' ? "justify-between" : "",
      // Kích thước font có thể tùy chỉnh qua class
      className?.includes("text-") ? "" : "text-lg",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn(
      "text-sm text-muted-foreground/80 relative z-10",
      className
    )}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    compact?: boolean;
    padded?: boolean;
  }
>(({ className, compact = false, padded = true, ...props }, ref) => (
  <div 
    ref={ref} 
    className={cn(
      "relative z-10", 
      padded ? (compact ? "px-4 pb-4 pt-0" : "px-6 pb-6 pt-0") : "",
      className
    )} 
    {...props} 
  />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    compact?: boolean;
  }
>(({ className, compact = false, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center relative z-10", 
      compact ? "px-4 pb-4 pt-0" : "px-6 pb-6 pt-0",
      className
    )}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
