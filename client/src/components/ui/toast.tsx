import * as React from "react"
import * as ToastPrimitives from "@radix-ui/react-toast"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const ToastProvider = ToastPrimitives.Provider

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      // Desktop (md+): Top-right, Mobile: Bottom (full width) respecting safe areas
      "fixed z-[100] flex max-h-screen flex-col-reverse gap-2 p-4",
      // Mobile: Bottom position, full width
      "bottom-0 left-0 right-0 w-full pwa-bottom-inset",
      // Tablet+: Top-right position, limited width
      "md:top-4 md:bottom-auto md:right-4 md:left-auto md:w-auto md:max-w-[420px] md:flex-col-reverse",
      className
    )}
    {...props}
  />
))
ToastViewport.displayName = ToastPrimitives.Viewport.displayName

const toastVariants = cva(
  "group pointer-events-auto relative overflow-hidden transition-all w-full flex flex-row items-start gap-3 data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[swipe=cancel]:translate-x-0 data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-bottom-full data-[state=open]:slide-in-from-bottom-full md:data-[state=closed]:slide-out-to-right-full md:data-[state=open]:slide-in-from-right-full backdrop-blur-sm bg-opacity-95 dark:bg-opacity-90 p-4 rounded-2xl shadow-lg border data-[state=open]:duration-300 data-[state=closed]:duration-200 active:scale-[0.99] transition-transform",
  {
    variants: {
      variant: {
        default: "bg-background/95 text-foreground border-border/40 dark:bg-background/80 dark:border-border/30 shadow-lg shadow-black/5 dark:shadow-black/20",
        destructive: "destructive group border-destructive/30 bg-destructive/95 text-destructive-foreground dark:bg-destructive/80 dark:border-destructive/40 shadow-lg shadow-destructive/10",
        info: "border-blue-200/70 bg-blue-50/95 text-blue-800 dark:bg-blue-900/80 dark:text-blue-200 dark:border-blue-900/50 shadow-lg shadow-blue-900/5",
        success: "border-green-200/70 bg-green-50/95 text-green-800 dark:bg-green-900/80 dark:text-green-200 dark:border-green-900/50 shadow-lg shadow-green-900/5",
        warning: "border-amber-200/70 bg-amber-50/95 text-amber-800 dark:bg-amber-900/80 dark:text-amber-200 dark:border-amber-900/50 shadow-lg shadow-amber-900/5",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => {
  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      {...props}
    />
  )
})
Toast.displayName = ToastPrimitives.Root.displayName

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "inline-flex h-9 shrink-0 items-center justify-center rounded-lg px-3.5 text-sm font-medium",
      "bg-primary/10 dark:bg-primary/20 text-primary hover:bg-primary/20 dark:hover:bg-primary/30",
      "transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      "disabled:pointer-events-none disabled:opacity-50",
      // Extra styling for different toast variants
      "group-[.destructive]:bg-destructive/10 group-[.destructive]:text-destructive group-[.destructive]:hover:bg-destructive/20",
      "group-[.info]:bg-blue-500/10 group-[.info]:text-blue-600 dark:group-[.info]:text-blue-400 group-[.info]:hover:bg-blue-500/20",
      "group-[.success]:bg-green-500/10 group-[.success]:text-green-600 dark:group-[.success]:text-green-400 group-[.success]:hover:bg-green-500/20",
      "group-[.warning]:bg-amber-500/10 group-[.warning]:text-amber-600 dark:group-[.warning]:text-amber-400 group-[.warning]:hover:bg-amber-500/20",
      // Mobile touch improvements
      "active:scale-[0.98] touch-manipulation",
      className
    )}
    {...props}
  />
))
ToastAction.displayName = ToastPrimitives.Action.displayName

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "absolute right-3 top-3 rounded-full p-1.5 bg-background/80 dark:bg-background/30 text-foreground/60 opacity-70 backdrop-blur-sm",
      "transition-all hover:bg-background hover:opacity-100 hover:text-foreground",
      "focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring/30 group-hover:opacity-100",
      "group-[.destructive]:text-red-100/60 group-[.destructive]:hover:text-red-50",
      "group-[.info]:text-blue-800/60 group-[.info]:dark:text-blue-100/60",
      "group-[.success]:text-green-800/60 group-[.success]:dark:text-green-100/60",
      "group-[.warning]:text-amber-800/60 group-[.warning]:dark:text-amber-100/60",
      // For proper touch targets on mobile
      "touch-manipulation active:scale-95",
      className
    )}
    toast-close=""
    {...props}
  >
    <X className="h-3.5 w-3.5" />
  </ToastPrimitives.Close>
))
ToastClose.displayName = ToastPrimitives.Close.displayName

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn("text-sm font-semibold leading-tight tracking-tight mb-0.5", className)}
    {...props}
  />
))
ToastTitle.displayName = ToastPrimitives.Title.displayName

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn("text-sm opacity-90 leading-normal break-words", className)}
    {...props}
  />
))
ToastDescription.displayName = ToastPrimitives.Description.displayName

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>

type ToastActionElement = React.ReactElement<typeof ToastAction>

export type ToastVariant = "default" | "destructive" | "info" | "success" | "warning";

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
}
