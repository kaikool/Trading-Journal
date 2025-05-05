import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

/**
 * Enhanced Button Component System
 * 
 * Design principles:
 * - Follows 4px grid system for sizing and padding
 * - Consistent visual hierarchy of states and variants
 * - Improved accessibility with focus states
 * - Predictable sizing across different contexts
 * - Clear semantic variants for different purposes
 * - Enhanced interactive feedback on all states
 * 
 * @version 2.0.0
 */

const buttonVariants = cva(
  // Base button styling
  [
    "inline-flex items-center justify-center gap-2",
    "whitespace-nowrap font-medium",
    "select-none touch-manipulation",
    "transition-all",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
    "disabled:opacity-50 disabled:pointer-events-none",
    "[&_svg]:shrink-0 [&_svg]:pointer-events-none",
  ].join(" "),
  {
    variants: {
      // Visual variants
      variant: {
        // Primary action button
        default: [
          "bg-primary text-primary-foreground",
          "hover:bg-primary/90 active:bg-primary/95",
          "shadow-sm"
        ].join(" "),
        
        // Critical/warning action
        destructive: [
          "bg-destructive text-destructive-foreground",
          "hover:bg-destructive/90 active:bg-destructive/95",
          "shadow-sm"
        ].join(" "),
        
        // Success action
        success: [
          "bg-success text-success-foreground",
          "hover:bg-success/90 active:bg-success/95",
          "shadow-sm"
        ].join(" "),
        
        // Less visually dominant action
        secondary: [
          "bg-secondary text-secondary-foreground",
          "hover:bg-secondary/80 active:bg-secondary/90",
          "shadow-xs"
        ].join(" "),
        
        // Bordered appearance
        outline: [
          "border border-input bg-transparent",
          "hover:bg-accent/50 hover:text-accent-foreground",
          "active:bg-accent/70"
        ].join(" "),
        
        // Subtle button with no background
        ghost: [
          "bg-transparent hover:bg-accent/50",
          "hover:text-accent-foreground active:bg-accent/70"
        ].join(" "),
        
        // Text-only button
        link: [
          "text-primary bg-transparent underline-offset-4",
          "hover:underline hover:bg-transparent"
        ].join(" "),
        
        // Soft variant with low contrast background
        soft: [
          "bg-primary/10 text-primary-foreground/90",
          "hover:bg-primary/20 active:bg-primary/30",
        ].join(" "),
      },
      
      // Size variants
      size: {
        // Standard button - multiples of 4px
        default: "h-10 px-4 py-2 text-sm rounded-md",
        
        // Small button - compact
        sm: "h-8 px-3 py-1.5 text-xs rounded-md [&_svg]:size-3.5",
        
        // Medium (renamed from default)
        md: "h-10 px-4 py-2 text-sm rounded-md [&_svg]:size-4",
        
        // Large button
        lg: "h-12 px-6 py-3 text-base rounded-md [&_svg]:size-5",
        
        // Extra large button
        xl: "h-14 px-8 py-4 text-lg rounded-lg [&_svg]:size-6",
        
        // Icon only - equal width & height
        icon: "size-10 rounded-md p-2 [&_svg]:size-5",
        
        // Small icon
        "icon-sm": "size-8 rounded-md p-1.5 [&_svg]:size-4",
        
        // Large icon
        "icon-lg": "size-12 rounded-md p-3 [&_svg]:size-6",
      },
      
      // Roundness variants
      roundness: {
        // Default rounded corners
        default: "",
        
        // Square corners
        square: "rounded-none",
        
        // Slightly rounded
        rounded: "rounded-md",
        
        // Very rounded 
        pill: "rounded-full",
      },
      
      // Elevation/shadow variants
      elevation: {
        // No shadow
        none: "shadow-none",
        
        // Subtle shadow
        low: "shadow-sm",
        
        // Medium shadow
        medium: "shadow-md",
        
        // Strong shadow 
        high: "shadow-lg",
      },
      
      // Width variants
      width: {
        // Auto width
        auto: "w-auto",
        
        // Full width of container
        full: "w-full",
      },
      
      // Animation speed
      animation: {
        // No animation
        none: "transition-none",
        
        // Fast animation
        fast: "duration-150",
        
        // Standard animation
        default: "duration-250",
        
        // Slow animation
        slow: "duration-350",
      },
    },
    
    // Default button appearance
    defaultVariants: {
      variant: "default",
      size: "default",
      roundness: "default",
      elevation: "none",
      width: "auto",
      animation: "default",
    },
    
    // Automatic compound variants based on combinations
    compoundVariants: [
      // Icon buttons should be squarer regardless of size
      {
        size: ["icon", "icon-sm", "icon-lg"],
        class: "px-0 py-0 flex items-center justify-center",
      },
      
      // Link buttons should have no elevation
      {
        variant: "link",
        class: "shadow-none hover:shadow-none active:shadow-none",
      },
      
      // Ghost buttons should have no elevation
      {
        variant: "ghost",
        class: "shadow-none hover:shadow-none",
      },
    ],
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /**
   * Use this prop with Radix UI's Slot component
   * Allows rendering as a different element
   * while maintaining button functionality
   */
  asChild?: boolean;
  
  /**
   * Optional loading state
   * Displays a spinner and disables the button when true
   */
  isLoading?: boolean;
  
  /**
   * Icon to show before button text
   */
  leftIcon?: React.ReactNode;
  
  /**
   * Icon to show after button text
   */
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    roundness,
    elevation,
    width,
    animation,
    asChild = false,
    isLoading = false,
    leftIcon,
    rightIcon,
    children,
    disabled,
    ...props 
  }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    // Additional props for loading state
    const isDisabled = disabled || isLoading
    
    // Create final className based on all props
    const buttonClassName = buttonVariants({ 
      variant, 
      size, 
      roundness,
      elevation,
      width,
      animation,
      className 
    })
    
    return (
      <Comp
        className={buttonClassName}
        ref={ref}
        disabled={isDisabled}
        {...props}
      >
        {isLoading && (
          <span className="animate-spin mr-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          </span>
        )}
        
        {!isLoading && leftIcon && <span className="inline-flex">{leftIcon}</span>}
        
        {children && <span>{children}</span>}
        
        {!isLoading && rightIcon && <span className="inline-flex">{rightIcon}</span>}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
