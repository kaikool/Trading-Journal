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
      "relative flex w-full touch-none select-none items-center",
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
    {/* Thêm div container để đảm bảo không bị overflow cắt thumb */}
    <div className="relative h-12 w-full py-4">
      <SliderPrimitive.Track className="absolute top-1/2 left-0 -translate-y-1/2 h-2 w-full rounded-full bg-secondary/50 border border-secondary/80 overflow-hidden">
        <SliderPrimitive.Range className="absolute h-full bg-primary" />
      </SliderPrimitive.Track>
      
      {props.value?.map((_, i) => (
        <SliderPrimitive.Thumb 
          key={i}
          className="block h-5 w-5 rounded-full border-2 border-white bg-primary shadow-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-grab active:cursor-grabbing"
        />
      ))}
    </div>
  </SliderPrimitive.Root>
))
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
