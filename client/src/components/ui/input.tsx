import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    // Tham chiếu tới input element
    const inputRef = React.useRef<HTMLInputElement>(null);
    
    // Kết hợp ref từ forwardRef và local ref
    React.useImperativeHandle(ref, () => inputRef.current!);
    
    // Xử lý khi input được focus
    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      // Đảm bảo scroll input vào view khi focus
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'center'
          });
        }
      }, 100);
      
      // Gọi handler focus gốc nếu đã được định nghĩa
      if (props.onFocus) {
        props.onFocus(e);
      }
    };

    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
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

export { Input }
