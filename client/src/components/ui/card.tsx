import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Redesigned Card Component System
 * 
 * An elegant, modern card system optimized for financial applications with:
 * - Consistent and subtle elevation using shadows instead of heavy borders
 * - Appropriate background contrast against the page (never pure white)
 * - Responsive sizing with rem/em units 
 * - Proper information hierarchy for financial data display
 * - Support for different density layouts (compact, default, relaxed)
 */

type CardVariant = 'default' | 'outline' | 'elevated' | 'subtle' | 'filled';
type CardDensity = 'compact' | 'default' | 'relaxed';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  variant?: CardVariant;
  density?: CardDensity;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, hover = true, variant = 'default', density = 'default', ...props }, ref) => {
    // Map density to appropriate padding classes
    const densityClasses = {
      compact: "p-3 sm:p-4",
      default: "p-4 sm:p-5",
      relaxed: "p-5 sm:p-6"
    };
    
    return (
      <div
        ref={ref}
        className={cn(
          // Base styling - consistent border radius and text color
          "rounded-lg text-card-foreground",
          
          // Background colors by variant - never use pure white/black
          variant === 'default' && "bg-card/95",
          variant === 'outline' && "bg-background/50", 
          variant === 'elevated' && "bg-card",
          variant === 'subtle' && "bg-muted/30 dark:bg-muted/10",
          variant === 'filled' && "bg-secondary/20 dark:bg-secondary/10",
          
          // Border and shadow styling by variant - subtle but visible
          variant === 'default' && "border border-border/20 shadow-sm",
          variant === 'outline' && "border border-border/30", 
          variant === 'elevated' && "border-0 shadow-md",
          variant === 'subtle' && "border border-border/10 shadow-sm",
          variant === 'filled' && "border border-border/10",
          
          // Hover effect - subtle elevation change
          hover && "transition-all duration-200 ease-in-out",
          hover && variant !== 'elevated' && "hover:shadow-md",
          hover && variant === 'elevated' && "hover:shadow-lg",
          
          // Density-based padding
          densityClasses[density],
          
          // User-provided classes override defaults
          className
        )}
        {...props}
      />
    );
  }
);
Card.displayName = "Card";

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  density?: CardDensity;
}

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, density = 'default', ...props }, ref) => {
    // Calculate padding based on density
    const paddingClasses = {
      compact: "px-0 pt-0 pb-2",
      default: "px-0 pt-0 pb-3", 
      relaxed: "px-0 pt-0 pb-4"
    };
    
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col space-y-1.5",
          paddingClasses[density],
          className
        )}
        {...props}
      />
    );
  }
);
CardHeader.displayName = "CardHeader";

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  size?: 'sm' | 'md' | 'lg';
}

const CardTitle = React.forwardRef<HTMLParagraphElement, CardTitleProps>(
  ({ className, size = 'md', ...props }, ref) => {
    // Size variants for the title
    const sizeClasses = {
      sm: "text-base font-medium",
      md: "text-lg font-semibold", 
      lg: "text-xl font-semibold"
    };
    
    return (
      <h3
        ref={ref}
        className={cn(
          "leading-tight tracking-tight",
          sizeClasses[size],
          className
        )}
        {...props}
      />
    );
  }
);
CardTitle.displayName = "CardTitle";

interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  size?: 'sm' | 'md';
}

const CardDescription = React.forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, size = 'md', ...props }, ref) => {
    const sizeClasses = {
      sm: "text-xs",
      md: "text-sm"
    };
    
    return (
      <p
        ref={ref}
        className={cn(
          "text-muted-foreground",
          sizeClasses[size],
          className
        )}
        {...props}
      />
    );
  }
);
CardDescription.displayName = "CardDescription";

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  density?: CardDensity;
}

const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, density = 'default', ...props }, ref) => {
    const paddingClasses = {
      compact: "px-0 py-2",
      default: "px-0 py-3",
      relaxed: "px-0 py-4"
    };
    
    return (
      <div 
        ref={ref} 
        className={cn(
          paddingClasses[density],
          className
        )} 
        {...props} 
      />
    );
  }
);
CardContent.displayName = "CardContent";

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  density?: CardDensity;
}

const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, density = 'default', ...props }, ref) => {
    const paddingClasses = {
      compact: "px-0 pt-2 pb-0",
      default: "px-0 pt-3 pb-0", 
      relaxed: "px-0 pt-4 pb-0"
    };
    
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center",
          paddingClasses[density],
          className
        )}
        {...props}
      />
    );
  }
);
CardFooter.displayName = "CardFooter";

export { 
  Card, 
  CardHeader, 
  CardFooter, 
  CardTitle, 
  CardDescription, 
  CardContent,
  // Export types for reuse
  type CardVariant,
  type CardDensity,
  type CardProps
}
