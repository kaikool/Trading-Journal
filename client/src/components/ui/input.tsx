import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority" 
import { cn } from "@/lib/utils"

/**
 * Enhanced Input Component
 * 
 * Design principles:
 * - Follows 4px grid system for sizing and padding
 * - Consistent visual hierarchy of states and variants
 * - Improved accessibility with focus states
 * - Predictable sizing across different contexts
 * - Mobile optimization with auto-scroll on focus
 * - Support for different appearance variations
 * 
 * @version 2.0.0
 */

// Define input style variants with CVA
const inputVariants = cva(
  // Base styling
  [
    "flex w-full border border-input bg-background",
    "text-sm text-foreground placeholder:text-muted-foreground",
    "transition-all duration-200",
    "focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30",
    "disabled:cursor-not-allowed disabled:opacity-50",
    "file:border-0 file:bg-transparent file:text-sm file:font-medium",
  ].join(" "),
  {
    variants: {
      // Size variants
      inputSize: {
        // Standard size
        default: "h-10 px-3 py-2 rounded-md",
        
        // Small size
        sm: "h-8 px-2 py-1 text-xs rounded-md",
        
        // Large size
        lg: "h-12 px-4 py-3 text-base rounded-md",
        
        // Extra large size
        xl: "h-14 px-5 py-4 text-lg rounded-lg",
      },
      
      // Appearance variants
      variant: {
        // Standard appearance
        default: "border-input bg-background",
        
        // Filled appearance
        filled: "border-transparent bg-secondary/50 hover:bg-secondary/80 focus-visible:bg-background",
        
        // Flushed (borderless with bottom border only)
        flushed: "border-0 border-b rounded-none px-0 focus-visible:ring-0",
        
        // Bordered with stronger border
        bordered: "border-2 border-input",
      },
      
      // Width variants
      inputWidth: {
        // Full width (default)
        full: "w-full",
        
        // Auto width based on content
        auto: "w-auto",
      },
      
      // Roundness variants
      roundness: {
        // Default rounded corners
        default: "",
        
        // No rounded corners
        none: "rounded-none",
        
        // More rounded corners
        full: "rounded-full",
      },
    },
    defaultVariants: {
      inputSize: "default",
      variant: "default",
      inputWidth: "full",
      roundness: "default",
    },
  }
)

// Type for our enhanced input props, ensuring no conflict with HTML attributes
export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'width'> {
  /**
   * Size variant for the input
   * @default 'default'
   */
  inputSize?: VariantProps<typeof inputVariants>["inputSize"];
  
  /**
   * Visual appearance variant
   * @default 'default'
   */
  variant?: VariantProps<typeof inputVariants>["variant"];
  
  /**
   * Width behavior
   * @default 'full'
   */
  inputWidth?: VariantProps<typeof inputVariants>["inputWidth"];
  
  /**
   * Corner roundness
   * @default 'default'
   */
  roundness?: VariantProps<typeof inputVariants>["roundness"];
  
  /**
   * Error state
   * Applies error styling to input when true
   */
  error?: boolean;
  
  /**
   * Left icon or element
   */
  leftElement?: React.ReactNode;
  
  /**
   * Right icon or element
   */
  rightElement?: React.ReactNode;
  
  /**
   * Auto-scroll to input when focused
   * Useful for mobile forms
   * @default true
   */
  autoScrollOnFocus?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    type, 
    inputSize = "default",
    variant = "default",
    inputWidth = "full",
    roundness = "default",
    error = false,
    leftElement,
    rightElement,
    autoScrollOnFocus = true,
    ...props 
  }, ref) => {
    // Local reference to input element
    const inputRef = React.useRef<HTMLInputElement>(null);
    
    // Combine forwarded ref with local ref
    React.useImperativeHandle(ref, () => inputRef.current!);
    
    // Handle input focus
    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      // Ensure input scrolls into view when focused (for mobile)
      if (autoScrollOnFocus) {
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center',
              inline: 'center'
            });
          }
        }, 100);
      }
      
      // Call original focus handler if defined
      if (props.onFocus) {
        props.onFocus(e);
      }
    };

    // If we have left/right elements, create a wrapper
    if (leftElement || rightElement) {
      return (
        <div className="relative flex items-center w-full">
          {leftElement && (
            <div className="absolute left-3 flex items-center justify-center pointer-events-none text-muted-foreground">
              {leftElement}
            </div>
          )}
          
          <input
            type={type}
            className={cn(
              inputVariants({ 
                inputSize, 
                variant, 
                inputWidth, 
                roundness 
              }),
              leftElement && "pl-10",
              rightElement && "pr-10",
              error && "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/30",
              className
            )}
            ref={inputRef}
            onFocus={handleFocus}
            {...props}
          />
          
          {rightElement && (
            <div className="absolute right-3 flex items-center justify-center">
              {rightElement}
            </div>
          )}
        </div>
      )
    }

    // Without left/right elements, render standard input
    return (
      <input
        type={type}
        className={cn(
          inputVariants({ 
            inputSize, 
            variant, 
            inputWidth, 
            roundness 
          }),
          error && "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/30",
          className
        )}
        ref={inputRef}
        onFocus={handleFocus}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input, inputVariants }
