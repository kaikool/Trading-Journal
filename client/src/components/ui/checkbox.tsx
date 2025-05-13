import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Icons } from "@/components/icons/icons"
import { useCallback } from "react"

import { cn } from "@/lib/utils"

// Tạo một div bọc ngoài để ngăn chặn lan truyền sự kiện từ Accordion
const CheckboxContainer = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, onClick, ...props }, ref) => {
  // Chặn sự kiện lan truyền để Accordion không bắt được
  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (onClick) {
      onClick(e);
    }
  }, [onClick]);

  return (
    <div 
      ref={ref} 
      className={className} 
      onClick={handleClick}
      onMouseDown={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      onFocus={(e) => e.stopPropagation()}
      {...props}
    />
  );
});

CheckboxContainer.displayName = "CheckboxContainer";

// Cải tiến Checkbox component để tránh lỗi flushSync
const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, onCheckedChange, ...props }, ref) => {
  // Tạo handler riêng để tránh flushSync trong lifecycle method
  // Sử dụng setTimeout để đưa event handling ra khỏi lifecycle method
  const handleCheckedChange = useCallback(
    (checked: boolean | "indeterminate") => {
      if (onCheckedChange) {
        // Không sử dụng flushSync trong lifecycle method - defer execution
        setTimeout(() => {
          onCheckedChange(checked);
        }, 0);
      }
    },
    [onCheckedChange]
  );

  // Bọc checkbox vào trong container để chặn lan truyền sự kiện
  return (
    <CheckboxContainer>
      <CheckboxPrimitive.Root
        ref={ref}
        className={cn(
          "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
          className
        )}
        onCheckedChange={handleCheckedChange}
        {...props}
      >
        <CheckboxPrimitive.Indicator
          className={cn("flex items-center justify-center text-current")}
        >
          <Icons.ui.check className="h-4 w-4" />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
    </CheckboxContainer>
  );
});
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
