import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center py-4", // Thêm padding để đảm bảo không bị cắt thumb
      className
    )}
    onTouchMove={(e) => {
      // Prevent page scrolling while interacting with slider
      e.stopPropagation();
    }}
    onWheel={(e) => {
      // Prevent page scrolling with mouse wheel when hovering the slider
      e.preventDefault();
    }}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary/50 border border-secondary/80">
      <SliderPrimitive.Range className="absolute h-full bg-primary" />
    </SliderPrimitive.Track>
    {props.value?.map((_, i) => (
      <SliderPrimitive.Thumb 
        key={i}
        className="block h-5 w-5 rounded-full border-2 border-white bg-primary shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-grab active:cursor-grabbing" 
      />
    ))}
  </SliderPrimitive.Root>
))
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
