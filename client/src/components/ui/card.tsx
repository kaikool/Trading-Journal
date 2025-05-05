import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Modernized Card Component System
 * 
 * Design principles:
 * - Follows 4px grid spacing system
 * - Uses rem units instead of pixels 
 * - Maintains consistent elevation model
 * - Clear visual hierarchy for information
 * - Consistent spacing between elements
 * - Multiple variants for different contexts
 * 
 * @version 2.0.0
 */

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Enable hover effect that increases elevation
   * @default true
   */
  hover?: boolean;
  
  /**
   * Card visual styles:
   * - default: Standard card with subtle border and shadow
   * - outline: Border only, no shadow
   * - elevated: Stronger shadow with no border
   * - flat: No border or shadow
   * @default 'default'
   */
  variant?: 'default' | 'outline' | 'elevated' | 'flat';
  
  /**
   * Padding density:
   * - default: Standard padding (1rem/16px)
   * - compact: Reduced padding (0.75rem/12px)
   * - tight: Minimal padding (0.5rem/8px)
   * @default 'default'
   */
  padding?: 'default' | 'compact' | 'tight';
  
  /**
   * Animation speed for hover effects:
   * - fast: 150ms
   * - standard: 250ms
   * - slow: 350ms
   * @default 'standard' 
   */
  transitionSpeed?: 'fast' | 'standard' | 'slow';
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ 
    className, 
    hover = true, 
    variant = 'default',
    padding = 'default',
    transitionSpeed = 'standard',
    ...props 
  }, ref) => (
    <div
      ref={ref}
      className={cn(
        // Base card styling
        "rounded-lg bg-card text-card-foreground overflow-hidden",
        
        // Border radius using design system variable
        "rounded-[var(--radius)]",
        
        // Variant styling
        variant === 'default' && "border border-border/30 shadow-card",
        variant === 'outline' && "border border-border/40",
        variant === 'elevated' && "border-0 shadow-md",
        variant === 'flat' && "border-0",
        
        // Hover effect
        hover && variant !== 'flat' && "motion-standard hover:shadow-card-hover", 
        
        // Transition speed variations
        transitionSpeed === 'fast' && "duration-[var(--transition-fast)]",
        transitionSpeed === 'standard' && "duration-[var(--transition-standard)]",
        transitionSpeed === 'slow' && "duration-[var(--transition-slow)]",
        
        className
      )}
      {...props}
    />
  )
)
Card.displayName = "Card"

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Padding density to match Card's padding prop
   * @default 'default'
   */
  padding?: 'default' | 'compact' | 'tight';
}

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, padding = 'default', ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex flex-col space-y-1.5",
        padding === 'default' && "p-4", // 16px - standard spacing
        padding === 'compact' && "p-3", // 12px - reduced
        padding === 'tight' && "p-2",   // 8px - minimal
        className
      )}
      {...props}
    />
  )
)
CardHeader.displayName = "CardHeader"

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  /**
   * The heading level to use (h1-h6)
   * @default 'h3'
   */
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  
  /**
   * Typography size variant
   * @default 'default'
   */
  size?: 'sm' | 'default' | 'lg';
}

const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, as: Comp = 'h3', size = 'default', ...props }, ref) => {
    const Element = Comp as any
    
    return (
      <Element
        ref={ref}
        className={cn(
          // Base styling
          "font-semibold leading-tight",
          
          // Size variations
          size === 'sm' && "text-lg", // 18px
          size === 'default' && "text-xl", // 20px - default for cards
          size === 'lg' && "text-2xl", // 24px
          
          className
        )}
        {...props}
      />
    )
  }
)
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground leading-normal", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Padding density to match Card's padding prop
   * @default 'default'
   */
  padding?: 'default' | 'compact' | 'tight';
  
  /**
   * Add padding to the top when used after CardHeader
   * @default true
   */
  removeTopPadding?: boolean;
}

const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, padding = 'default', removeTopPadding = true, ...props }, ref) => (
    <div 
      ref={ref} 
      className={cn(
        padding === 'default' && removeTopPadding ? "px-4 pb-4 pt-0" : "p-4", // 16px
        padding === 'compact' && removeTopPadding ? "px-3 pb-3 pt-0" : "p-3", // 12px
        padding === 'tight' && removeTopPadding ? "px-2 pb-2 pt-0" : "p-2",   // 8px
        className
      )} 
      {...props} 
    />
  )
)
CardContent.displayName = "CardContent"

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Padding density to match Card's padding prop
   * @default 'default'
   */
  padding?: 'default' | 'compact' | 'tight';
}

const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, padding = 'default', ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex items-center",
        padding === 'default' && "px-4 pb-4", // 16px
        padding === 'compact' && "px-3 pb-3", // 12px
        padding === 'tight' && "px-2 pb-2",   // 8px
        className
      )}
      {...props}
    />
  )
)
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
