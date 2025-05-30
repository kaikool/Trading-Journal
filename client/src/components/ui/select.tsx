import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { Icons } from "@/components/icons/icons"

import { cn } from "@/lib/utils"

const Select = SelectPrimitive.Root

const SelectGroup = SelectPrimitive.Group

const SelectValue = SelectPrimitive.Value

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 overflow-hidden",
      className
    )}
    {...props}
  >
    <div className="flex-1 overflow-hidden whitespace-nowrap text-ellipsis">
      {children}
    </div>
    <SelectPrimitive.Icon asChild>
      <Icons.ui.chevronDown className="h-4 w-4 opacity-50 ml-1 flex-shrink-0" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
))
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <Icons.ui.chevronUp className="h-4 w-4" />
  </SelectPrimitive.ScrollUpButton>
))
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName

const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <Icons.ui.chevronDown className="h-4 w-4" />
  </SelectPrimitive.ScrollDownButton>
))
SelectScrollDownButton.displayName =
  SelectPrimitive.ScrollDownButton.displayName

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => {
  // Lưu vị trí cuộn hiện tại khi mở select
  const scrollPosRef = React.useRef<number>(0);
  
  // Bắt sự kiện trước khi hiển thị để lưu vị trí cuộn
  React.useEffect(() => {
    // Chỉ thực hiện ở client-side
    if (typeof window === 'undefined') return;
    
    // Lưu vị trí scroll hiện tại khi component mount
    scrollPosRef.current = window.scrollY;
    
    // Thêm vào body class để ngăn scroll behavior
    document.body.classList.add('select-open');
    
    // Cleanup function - chạy khi unmount
    return () => {
      document.body.classList.remove('select-open');
      
      // Khôi phục vị trí cuộn khi đóng select, nếu cần thiết
      if (Math.abs(window.scrollY - scrollPosRef.current) > 5) {
        window.scrollTo(0, scrollPosRef.current);
      }
    };
  }, []);
  
  // Thêm style vào document.head nếu chưa có
  React.useEffect(() => {
    if (typeof document === 'undefined') return;
    
    if (!document.getElementById('select-noscroll-style')) {
      const style = document.createElement('style');
      style.id = 'select-noscroll-style';
      style.textContent = `
        body.select-open {
          scroll-behavior: auto !important;
          overflow-anchor: none !important;
          overflow-y: scroll !important;
        }
        
        /* Ngăn chặn scroll reset khi mở select */
        [data-radix-select-content],
        [data-radix-select-viewport],
        [data-radix-select-item][data-highlighted],
        [data-radix-select-item][aria-selected="true"] {
          scroll-margin: 0 !important;
          scroll-padding: 0 !important;
          scroll-snap-margin: 0 !important;
          scroll-snap-padding: 0 !important;
          scrollbar-gutter: stable !important;
        }
        
        /* Ngăn chặn focus gây cuộn trang */
        [data-radix-select-content] *:focus {
          outline: none !important;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);
  
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        ref={ref}
        className={cn(
          "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          position === "popper" &&
            "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
          className
        )}
        position={position}
        onCloseAutoFocus={(event) => {
          // Ngăn chặn focus tự động cuộn
          event.preventDefault();
          
          // Gọi handler gốc nếu có
          if (props.onCloseAutoFocus) {
            props.onCloseAutoFocus(event);
          }
        }}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          className={cn(
            "p-1",
            position === "popper" &&
              "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
})
SelectContent.displayName = SelectPrimitive.Content.displayName

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn("py-1.5 pl-8 pr-2 text-sm font-semibold", className)}
    {...props}
  />
))
SelectLabel.displayName = SelectPrimitive.Label.displayName

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => {
  // Use callback ref để có thể can thiệp vào element khi nó được render
  const handleRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      // Forward ref to original ref
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
      
      // Nếu element tồn tại, vô hiệu hóa khả năng scroll của nó
      if (node) {
        // Chỉ áp dụng cho item được highlight hoặc được chọn
        if (node.hasAttribute('data-highlighted') || node.getAttribute('aria-selected') === 'true') {
          // Monkey patch scrollIntoView của element này
          const originalScrollIntoView = node.scrollIntoView;
          node.scrollIntoView = function() {
            // Không làm gì - chặn hoàn toàn hành vi cuộn
            console.debug('[SelectItem] Blocked scrollIntoView');
            return;
          };
        }
      }
    },
    [ref]
  );
  
  return (
    <SelectPrimitive.Item
      ref={handleRef}
      className={cn(
        "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        // Thêm class scroll-noop để chỉ định không sử dụng scroll behaviors mặc định
        "scroll-noop",
        className
      )}
      // Vô hiệu hóa khả năng tự focus và cuộn
      onFocus={(e) => {
        // Ngăn chặn focus gây cuộn trang
        e.preventDefault();
        e.currentTarget.blur();
        
        // Xử lý callback focus ban đầu nếu có
        if (props.onFocus) {
          props.onFocus(e);
        }
      }}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <Icons.ui.check className="h-4 w-4" />
        </SelectPrimitive.ItemIndicator>
      </span>

      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
})
SelectItem.displayName = SelectPrimitive.Item.displayName

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
))
SelectSeparator.displayName = SelectPrimitive.Separator.displayName

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
}
