import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"
import { useCallback } from "react"

import { cn } from "@/lib/utils"

// Cải tiến Switch component để tránh lỗi flushSync
const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, onCheckedChange, ...props }, ref) => {
  // Tạo handler riêng để tránh flushSync trong lifecycle method
  // Sử dụng setTimeout để đưa event handling ra khỏi lifecycle method
  const handleCheckedChange = useCallback(
    (checked: boolean) => {
      if (onCheckedChange) {
        // Không sử dụng flushSync trong lifecycle method - defer execution
        setTimeout(() => {
          onCheckedChange(checked);
        }, 0);
      }
    },
    [onCheckedChange]
  );

  return (
    <SwitchPrimitives.Root
      className={cn(
        "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
        className
      )}
      onCheckedChange={handleCheckedChange}
      {...props}
      ref={ref}
    >
      <SwitchPrimitives.Thumb
        className={cn(
          "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0"
        )}
      />
    </SwitchPrimitives.Root>
  );
});
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
