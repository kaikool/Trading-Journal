import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"

/**
 * Enhanced Dialog Component System
 * 
 * Design principles:
 * - Follows 4px grid system for spacing and padding
 * - Adapts to different screen sizes with fluid sizing
 * - Provides consistent visual appearance across variants
 * - Improves focus and keyboard accessibility
 * - Supports different use cases with multiple layout options
 * - Optimized for mobile and desktop views
 * 
 * @version 2.0.0
 */

// =======================
// Dialog Variant System
// =======================

// Define size system using CSS variables and the 4px grid
const dialogContentVariants = cva(
  // Base styles for all dialog content
  [
    "fixed left-[50%] top-[50%] z-50 grid w-full",
    "translate-x-[-50%] translate-y-[-50%]",
    "border rounded-lg shadow-lg bg-background",
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
    "transition-all duration-200",
    
    // Animation states
    "data-[state=open]:animate-in data-[state=closed]:animate-out",
    "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
    "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
    "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]",
    "data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
  ].join(" "),
  {
    variants: {
      // Dialog size/type variants
      variant: {
        // Standard dialog for most use cases
        standard: [
          "max-w-[95vw] w-full sm:max-w-[90vw] md:max-w-[560px]",
          "max-h-[85dvh] sm:max-h-[85vh] overflow-y-auto",
          "gap-4",
        ].join(" "),
        
        // Chart dialog for data visualization
        chart: [
          "max-w-[95vw] w-full sm:max-w-[90vw] md:max-w-[78vw] lg:max-w-[70vw]",
          "overflow-hidden min-h-[400px] flex flex-col",
          "p-0",
        ].join(" "),
        
        // Form dialog for data entry
        form: [
          "max-w-[95vw] w-full sm:max-w-[85vw] md:max-w-[520px]",
          "max-h-[85dvh] sm:max-h-[85vh] overflow-y-auto",
          "gap-4",
        ].join(" "),
        
        // Compact dialog for confirmations/alerts
        compact: [
          "max-w-[95vw] w-full sm:max-w-[400px]",
          "max-h-[85dvh] sm:max-h-[85vh] overflow-y-auto",
          "gap-3",
        ].join(" "),
        
        // Large dialog for complex content
        large: [
          "max-w-[95vw] w-full sm:max-w-[90vw] md:max-w-[720px] lg:max-w-[800px]",
          "max-h-[85dvh] sm:max-h-[85vh] overflow-y-auto",
          "gap-4",
        ].join(" "),
        
        // Full-screen dialog for immersive experiences
        fullscreen: [
          "max-w-[100vw] w-full h-[100dvh] sm:h-[100vh]",
          "rounded-none border-0",
          "gap-4",
        ].join(" "),
      },
      
      // Padding density variants
      padding: {
        // Default padding following 4px grid
        default: "p-4 sm:p-5",
        
        // Compact padding for tighter layouts
        compact: "p-3 sm:p-4",
        
        // Extra padding for spacious layouts
        large: "p-5 sm:p-6",
        
        // No padding (useful for image/chart dialogs)
        none: "p-0",
      },
      
      // Dialog position variants
      position: {
        // Centered in viewport (default)
        center: "",
        
        // Top of viewport
        top: "top-[5%] translate-y-0 data-[state=closed]:slide-out-to-top-0 data-[state=open]:slide-in-from-top-0",
        
        // Bottom of viewport
        bottom: "top-auto bottom-0 translate-y-0 rounded-b-none data-[state=closed]:slide-out-to-bottom-0 data-[state=open]:slide-in-from-bottom-0",
      },
      
      // Close button variants
      closeButton: {
        // Show close button (default)
        visible: "",
        
        // Hide close button
        hidden: "[&_.dialog-close]:hidden",
      },
    },
    
    // Default variant settings
    defaultVariants: {
      variant: "standard",
      padding: "default",
      position: "center",
      closeButton: "visible",
    },
    
    // Compound variants for special combinations
    compoundVariants: [
      // Chart dialog with no padding
      {
        variant: "chart",
        padding: "default",
        class: "p-0",
      },
      // Fullscreen dialog with bottom positioning
      {
        variant: "fullscreen",
        position: "center",
        class: "translate-y-0 top-0 left-0 h-screen w-screen translate-x-0",
      },
    ],
  }
);

// Enhanced overlay variants
const dialogOverlayVariants = cva(
  "fixed inset-0 z-50 transition-all", 
  {
    variants: {
      // Background style
      backdrop: {
        // Standard dark overlay (default)
        default: "bg-black/80",
        
        // Blurred backdrop
        blur: "bg-black/60 backdrop-blur-sm",
        
        // Transparent backdrop
        transparent: "bg-transparent",
        
        // Solid backdrop
        solid: "bg-black/90",
      },
      
      // Animation variants
      animation: {
        // Default fade animation
        fade: "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        
        // No animation
        none: "",
      },
    },
    defaultVariants: {
      backdrop: "default",
      animation: "fade",
    },
  }
);

// =======================
// Dialog Components
// =======================

const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

// Enhanced overlay with variants
interface DialogOverlayProps extends 
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>,
  VariantProps<typeof dialogOverlayVariants> {}

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  DialogOverlayProps
>(({ className, backdrop, animation, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      dialogOverlayVariants({ backdrop, animation }),
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

// Enhanced content with variants
interface DialogContentProps extends 
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>,
  VariantProps<typeof dialogContentVariants> {
  /**
   * Optional backdrop customization
   */
  backdrop?: VariantProps<typeof dialogOverlayVariants>["backdrop"];
  
  /**
   * Optional animation customization for overlay
   */
  overlayAnimation?: VariantProps<typeof dialogOverlayVariants>["animation"];
  
  /**
   * Custom close button icon
   */
  closeIcon?: React.ReactNode;
}

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(({ 
  className, 
  children, 
  variant, 
  padding,
  position,
  closeButton,
  backdrop = "default",
  overlayAnimation = "fade",
  closeIcon = <X className="h-4 w-4" />,
  ...props 
}, ref) => (
  <DialogPortal>
    <DialogOverlay backdrop={backdrop} animation={overlayAnimation} />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        dialogContentVariants({ 
          variant, 
          padding,
          position,
          closeButton,
        }),
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="dialog-close absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
        {closeIcon}
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

interface DialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Alignment of header content
   */
  align?: 'center' | 'left' | 'right';
  
  /**
   * Optional spacing between header elements
   */
  spacing?: 'default' | 'compact' | 'loose';
  
  /**
   * Optional sticky positioning
   */
  sticky?: boolean;
}

const DialogHeader = ({
  className,
  align = 'left',
  spacing = 'default',
  sticky = false,
  ...props
}: DialogHeaderProps) => (
  <div
    className={cn(
      "flex flex-col",
      // Alignment options
      align === 'center' && "text-center items-center",
      align === 'left' && "text-left items-start",
      align === 'right' && "text-right items-end",
      
      // Spacing options
      spacing === 'default' && "space-y-1.5",
      spacing === 'compact' && "space-y-1",
      spacing === 'loose' && "space-y-2.5",
      
      // Sticky positioning
      sticky && "sticky top-0 bg-background py-3 border-b z-10",
      
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

interface DialogFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Layout direction for buttons
   */
  direction?: 'row' | 'column-reverse';
  
  /**
   * Button alignment
   */
  align?: 'center' | 'end' | 'start' | 'between';
  
  /**
   * Optional sticky positioning
   */
  sticky?: boolean;
}

const DialogFooter = ({
  className,
  direction = 'row',
  align = 'end',
  sticky = false,
  ...props
}: DialogFooterProps) => (
  <div
    className={cn(
      // Base styles
      "flex gap-2",
      
      // Direction options with responsive behavior
      direction === 'row' && "flex-col-reverse sm:flex-row",
      direction === 'column-reverse' && "flex-col-reverse",
      
      // Alignment options
      align === 'center' && "sm:justify-center",
      align === 'end' && "sm:justify-end",
      align === 'start' && "sm:justify-start",
      align === 'between' && "sm:justify-between",
      
      // Sticky positioning
      sticky && "sticky bottom-0 bg-background py-3 border-t z-10",
      
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

interface DialogTitleProps extends 
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title> {
  /**
   * Title size
   */
  size?: 'sm' | 'default' | 'lg';
}

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  DialogTitleProps
>(({ className, size = 'default', ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "font-semibold leading-tight tracking-tight",
      // Size options based on design system
      size === 'sm' && "text-base",
      size === 'default' && "text-lg",
      size === 'lg' && "text-xl",
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

interface DialogDescriptionProps extends 
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description> {
  /**
   * Description size variant
   */
  size?: 'sm' | 'default';
}

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  DialogDescriptionProps
>(({ className, size = 'default', ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn(
      "text-muted-foreground",
      // Size options
      size === 'sm' && "text-xs",
      size === 'default' && "text-sm",
      className
    )}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

/**
 * Standardized layout pattern with fixed header/footer
 */
interface DialogHeaderFooterLayoutProps {
  /**
   * Main content
   */
  children: React.ReactNode;
  
  /**
   * Optional header content
   */
  headerContent?: React.ReactNode;
  
  /**
   * Optional footer content
   */
  footerContent?: React.ReactNode;
  
  /**
   * Additional header classes
   */
  headerClassName?: string;
  
  /**
   * Additional footer classes
   */
  footerClassName?: string;
  
  /**
   * Additional body classes
   */
  bodyClassName?: string;
  
  /**
   * Spacing between sections
   */
  spacing?: 'default' | 'compact' | 'none';
}

function DialogHeaderFooterLayout({
  children,
  headerContent,
  footerContent,
  headerClassName,
  footerClassName,
  bodyClassName,
  spacing = 'default',
}: DialogHeaderFooterLayoutProps) {
  // Calculate offset classes based on padding
  const spacingClasses = {
    default: {
      headerBottom: "mb-4",
      footerTop: "mt-4",
      headerOffset: "-mt-4",
      footerOffset: "-mb-4",
    },
    compact: {
      headerBottom: "mb-2",
      footerTop: "mt-2",
      headerOffset: "-mt-3",
      footerOffset: "-mb-3",
    },
    none: {
      headerBottom: "",
      footerTop: "",
      headerOffset: "",
      footerOffset: "",
    },
  };
  
  return (
    <>
      {headerContent && (
        <div className={cn(
          "sticky top-0 bg-background py-3 border-b z-10",
          spacingClasses[spacing].headerOffset,
          spacingClasses[spacing].headerBottom,
          "px-0 sm:px-0",
          headerClassName
        )}>
          {headerContent}
        </div>
      )}
      
      <div className={cn("flex-1", bodyClassName)}>
        {children}
      </div>
      
      {footerContent && (
        <div className={cn(
          "sticky bottom-0 bg-background py-3 border-t z-10",
          spacingClasses[spacing].footerOffset,
          spacingClasses[spacing].footerTop,
          "px-0 sm:px-0",
          footerClassName
        )}>
          {footerContent}
        </div>
      )}
    </>
  );
}

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogHeaderFooterLayout,
  // Export variants for direct use when needed
  dialogContentVariants,
  dialogOverlayVariants,
}