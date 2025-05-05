import * as React from "react"

import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    hover?: boolean;
    variant?: 'default' | 'outline' | 'elevated' | 'gradient' | 'accent' | 'status';
    status?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  }
>(({ className, hover = true, variant = 'default', status = 'neutral', ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg text-card-foreground relative overflow-hidden",
      // Enhanced base styling to avoid pure white backgrounds
      "bg-gradient-to-br from-card/90 to-card",
      
      // Enhanced Variant styles with gradient backgrounds
      variant === 'default' && "border-border/30 border shadow-[var(--shadow-card)] bg-gradient-to-br from-card/95 to-card",
      variant === 'outline' && "border-border/40 border bg-gradient-to-br from-card/95 to-card/90",
      variant === 'elevated' && "border-0 shadow-[var(--shadow-md)] bg-gradient-to-br from-card/90 to-card",
      variant === 'gradient' && "border-0 shadow-[var(--shadow-md)] bg-gradient-to-br from-primary/10 to-primary/5",
      variant === 'accent' && "border-primary/20 border shadow-[var(--shadow-sm)] bg-gradient-to-br from-primary/10 to-primary/5",
      variant === 'status' && [
        "border shadow-[var(--shadow-sm)]",
        status === 'success' && "bg-gradient-to-br from-success/10 to-success/5 border-success/20",
        status === 'warning' && "bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20",
        status === 'error' && "bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/20",
        status === 'info' && "bg-gradient-to-br from-info/10 to-info/5 border-info/20",
        status === 'neutral' && "bg-gradient-to-br from-card/95 to-card/90 border-border/30",
      ],
      
      // Hover effects
      hover && "transition-all duration-200 hover:shadow-[var(--shadow-card-hover)]",
      
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    withBorder?: boolean;
    withBackground?: boolean;
  }
>(({ className, withBorder = false, withBackground = false, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col space-y-1.5 p-6",
      withBorder && "border-b border-border/20 pb-4",
      withBackground && "bg-muted/30",
      className
    )}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement> & {
    withIcon?: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl';
  }
>(({ className, withIcon, size = 'md', ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "font-semibold leading-normal tracking-normal flex items-center",
      size === 'sm' && "text-base",
      size === 'md' && "text-xl",
      size === 'lg' && "text-2xl",
      size === 'xl' && "text-3xl",
      className
    )}
    {...props}
  >
    {withIcon && <span className="mr-2 text-primary flex-shrink-0">{withIcon}</span>}
    <span>{props.children}</span>
  </h3>
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement> & {
    withIcon?: React.ReactNode;
    highlight?: boolean;
    size?: 'xs' | 'sm' | 'md';
  }
>(({ className, withIcon, highlight = false, size = 'sm', ...props }, ref) => (
  <p
    ref={ref}
    className={cn(
      "text-muted-foreground flex items-center",
      size === 'xs' && "text-xs",
      size === 'sm' && "text-sm",
      size === 'md' && "text-base",
      highlight && "text-primary",
      className
    )}
    {...props}
  >
    {withIcon && <span className="mr-1.5 flex-shrink-0 opacity-80">{withIcon}</span>}
    <span>{props.children}</span>
  </p>
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    withPadding?: boolean | 'sm' | 'md' | 'lg';
    withBackground?: boolean;
  }
>(({ className, withPadding = true, withBackground = false, ...props }, ref) => (
  <div 
    ref={ref} 
    className={cn(
      withPadding === true && "p-6 pt-0",
      withPadding === 'sm' && "px-4 py-3 pt-0", 
      withPadding === 'md' && "px-5 py-4 pt-0",
      withPadding === 'lg' && "px-6 py-5 pt-0",
      withPadding === false && "pt-0",
      withBackground && "bg-muted/20 mt-2 rounded-md",
      className
    )} 
    {...props} 
  />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    withBorder?: boolean;
    withBackground?: boolean;
  }
>(({ className, withBorder = false, withBackground = false, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center p-6 pt-0",
      withBorder && "border-t border-border/20 mt-4 pt-4",
      withBackground && "bg-muted/20 rounded-b-md",
      className
    )}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
