import * as React from "react"

import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    hover?: boolean;
    variant?: 'default' | 'outline' | 'elevated' | 'subtle' | 'glass';
    gradient?: boolean;
    noOverflow?: boolean;
  }
>(({ className, hover = true, variant = 'default', gradient = false, noOverflow = false, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg text-card-foreground relative",
      // Conditional overflow handling
      noOverflow ? "overflow-visible" : "overflow-hidden",
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
    noOverflow?: boolean;
  }
>(({ className, compact = false, padded = true, noOverflow = false, ...props }, ref) => (
  <div 
    ref={ref} 
    className={cn(
      "relative z-10", 
      padded ? (compact ? "px-4 pb-4 pt-0" : "px-6 pb-6 pt-0") : "",
      noOverflow ? "overflow-visible" : "",
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

// Thêm các thành phần mới để hỗ trợ thiết kế card hiện đại

const CardIcon = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    size?: 'sm' | 'md' | 'lg';
    variant?: 'solid' | 'soft' | 'outline';
    color?: 'primary' | 'success' | 'warning' | 'destructive' | 'muted';
  }
>(({ className, size = 'md', variant = 'soft', color = 'primary', ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center justify-center rounded-full shrink-0",
      // Size variations
      size === 'sm' && "w-8 h-8",
      size === 'md' && "w-10 h-10", 
      size === 'lg' && "w-12 h-12",
      // Style variations
      variant === 'solid' && color === 'primary' && "bg-primary text-primary-foreground",
      variant === 'solid' && color === 'success' && "bg-success text-success-foreground",
      variant === 'solid' && color === 'warning' && "bg-warning text-warning-foreground",
      variant === 'solid' && color === 'destructive' && "bg-destructive text-destructive-foreground",
      variant === 'solid' && color === 'muted' && "bg-muted text-muted-foreground",
      // Soft style (default)
      variant === 'soft' && color === 'primary' && "bg-primary/15 text-primary",
      variant === 'soft' && color === 'success' && "bg-success/15 text-success",
      variant === 'soft' && color === 'warning' && "bg-warning/15 text-warning",
      variant === 'soft' && color === 'destructive' && "bg-destructive/15 text-destructive",
      variant === 'soft' && color === 'muted' && "bg-muted/30 text-muted-foreground",
      // Outline style
      variant === 'outline' && color === 'primary' && "border border-primary/30 text-primary",
      variant === 'outline' && color === 'success' && "border border-success/30 text-success",
      variant === 'outline' && color === 'warning' && "border border-warning/30 text-warning",
      variant === 'outline' && color === 'destructive' && "border border-destructive/30 text-destructive",
      variant === 'outline' && color === 'muted' && "border border-muted-foreground/30 text-muted-foreground",
      className
    )}
    {...props}
  />
))
CardIcon.displayName = "CardIcon"

const CardGradient = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: 'default' | 'primary' | 'success' | 'warning' | 'destructive';
    intensity?: 'subtle' | 'medium' | 'strong';
    direction?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'radial';
  }
>(({ 
  className, 
  variant = 'default', 
  intensity = 'subtle', 
  direction = 'top-right',
  ...props 
}, ref) => (
  <div
    ref={ref}
    className={cn(
      "absolute inset-0 z-0 opacity-70 pointer-events-none",
      // Intensity options
      intensity === 'subtle' && "opacity-50", 
      intensity === 'medium' && "opacity-70",
      intensity === 'strong' && "opacity-85",
      // Direction options
      direction === 'top-left' && "bg-gradient-to-br",
      direction === 'top-right' && "bg-gradient-to-bl",
      direction === 'bottom-left' && "bg-gradient-to-tr",
      direction === 'bottom-right' && "bg-gradient-to-tl",
      direction === 'radial' && "bg-radial",
      // Variant colors
      variant === 'default' && "from-card/20 to-background",
      variant === 'primary' && "from-primary/10 via-primary/5 to-background",
      variant === 'success' && "from-success/10 via-success/5 to-background",
      variant === 'warning' && "from-warning/10 via-warning/5 to-background",
      variant === 'destructive' && "from-destructive/10 via-destructive/5 to-background",
      className
    )}
    {...props}
  />
))
CardGradient.displayName = "CardGradient"

const CardImage = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    position?: 'top' | 'left' | 'right' | 'bottom' | 'background';
    aspectRatio?: 'auto' | 'square' | 'video' | '4/3';
    gradient?: boolean;
  }
>(({ 
  className, 
  position = 'top',
  aspectRatio = 'auto',
  gradient = false,
  ...props 
}, ref) => (
  <div
    ref={ref}
    className={cn(
      "overflow-hidden relative",
      // Position styles
      position === 'top' && "w-full rounded-t-lg",
      position === 'bottom' && "w-full rounded-b-lg",
      position === 'left' && "h-full rounded-l-lg",
      position === 'right' && "h-full rounded-r-lg",
      position === 'background' && "absolute inset-0 w-full h-full z-0",
      // Aspect ratio classes
      aspectRatio === 'square' && "aspect-square",
      aspectRatio === 'video' && "aspect-video",
      aspectRatio === '4/3' && "aspect-[4/3]",
      // Gradient overlay option for images
      gradient && position === 'background' && "after:absolute after:inset-0 after:bg-gradient-to-t after:from-card/80 after:to-transparent after:z-10",
      className
    )}
    {...props}
  />
))
CardImage.displayName = "CardImage"

const CardValue = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    size?: 'sm' | 'md' | 'lg' | 'xl';
    status?: 'default' | 'success' | 'warning' | 'danger' | 'neutral';
    trend?: 'up' | 'down' | 'neutral' | null;
  }
>(({ 
  className, 
  size = 'md',
  status = 'default',
  trend = null,
  ...props
}, ref) => (
  <div
    ref={ref}
    className={cn(
      "font-medium relative z-10",
      // Size classes
      size === 'sm' && "text-xl",
      size === 'md' && "text-2xl",
      size === 'lg' && "text-3xl",
      size === 'xl' && "text-4xl",
      // Status colors
      status === 'default' && "text-foreground",
      status === 'success' && "text-success",
      status === 'warning' && "text-warning",
      status === 'danger' && "text-destructive",
      status === 'neutral' && "text-muted-foreground",
      // Optional add trend classes
      trend === 'up' && "flex items-center",
      trend === 'down' && "flex items-center",
      trend === 'neutral' && "flex items-center",
      className
    )}
    {...props}
  />
))
CardValue.displayName = "CardValue"

export { 
  Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent,
  CardIcon, CardGradient, CardImage, CardValue
}
