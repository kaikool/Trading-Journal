import * as React from "react"
import { useEffect } from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { Icons } from "@/components/icons/icons"
import { useDialog } from "@/contexts/DialogContext"

import { cn } from "@/lib/utils"

// =======================
// Dialog Variant System
// =======================

// Các thuộc tính chung cho dialog
const dialogBase = "rounded-lg border shadow-lg bg-background";
const maxHeightClasses = "max-h-[85dvh] sm:max-h-[85vh]"; // Sử dụng cả dvh và vh
const overflowClasses = "overflow-y-auto";

// Sử dụng CSS variables để tuân thủ quy tắc spacing của ứng dụng
const dialogVariants = {
  /**
   * Standard Dialog - Kích thước tiêu chuẩn cho dialog thông thường
   * Sử dụng cho hầu hết các dialog trong ứng dụng
   */
  standard: `${dialogBase} max-w-[95vw] w-full sm:max-w-[90vw] md:max-w-[560px] ${maxHeightClasses} ${overflowClasses} p-3 sm:p-4`,
  
  /**
   * Chart Dialog - Kích thước tối ưu cho dialog hiển thị biểu đồ
   * Rộng hơn để hiển thị tốt hơn cho nội dung đồ họa
   * Đã tối ưu lại kích thước để hiển thị ảnh lớn hơn
   */
  chart: `${dialogBase} p-0 max-w-[98vw] w-full sm:max-w-[96vw] md:max-w-[85vw] lg:max-w-[80vw] xl:max-w-[75vw] overflow-hidden min-h-[400px] flex flex-col`,
  
  /**
   * Form Dialog - Cho phép dialog chứa form thu thập dữ liệu từ người dùng
   * Kích thước trung bình và có padding phù hợp
   */
  form: `${dialogBase} max-w-[95vw] w-full sm:max-w-[85vw] md:max-w-[520px] ${maxHeightClasses} ${overflowClasses} p-4 sm:p-5`,
  
  /**
   * Compact Dialog - Cho các thông báo hoặc xác nhận nhỏ gọn
   * Kích thước nhỏ và có padding giảm thiểu
   */
  compact: `${dialogBase} max-w-[95vw] w-full sm:max-w-[400px] ${maxHeightClasses} ${overflowClasses} p-3 sm:p-4`,
  
  /**
   * Large Dialog - Cho nội dung phức tạp hoặc dữ liệu lớn
   * Kích thước lớn nhất trong hệ thống
   */
  large: `${dialogBase} max-w-[95vw] w-full sm:max-w-[90vw] md:max-w-[720px] lg:max-w-[800px] ${maxHeightClasses} ${overflowClasses} p-4 sm:p-5`
};

/**
 * Hook để lấy class cho dialog dựa trên variant và className bổ sung
 * 
 * @param variant Biến thể của dialog (standard, chart, form, compact, large)
 * @param className CSS class bổ sung nếu cần
 * @returns Chuỗi class đã được gộp
 */
function useDialogVariant(
  variant: keyof typeof dialogVariants = "standard",
  className?: string
): string {
  return cn(dialogVariants[variant], className);
}

// =======================
// Dialog Components
// =======================

const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    variant?: keyof typeof dialogVariants
  }
>(({ className, children, variant = "standard", ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full translate-x-[-50%] translate-y-[-50%] gap-4 duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
        // Áp dụng variant styles
        dialogVariants[variant],
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
        <Icons.ui.close className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

/**
 * Header Footer Layout - Layout dialog tiêu chuẩn với header và footer cố định
 */
function DialogHeaderFooterLayout({
  children,
  headerContent,
  footerContent,
  headerClassName,
  footerClassName,
  bodyClassName,
}: {
  children: React.ReactNode,
  headerContent?: React.ReactNode,
  footerContent?: React.ReactNode,
  headerClassName?: string,
  footerClassName?: string,
  bodyClassName?: string,
}) {
  return (
    <>
      {headerContent && (
        <div className={cn(
          "sticky top-0 bg-background py-3 border-b -mt-3 sm:-mt-4 mb-4 px-0 sm:px-0",
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
          "sticky bottom-0 bg-background py-3 border-t -mb-3 sm:-mb-4 mt-4 px-0 sm:px-0",
          footerClassName
        )}>
          {footerContent}
        </div>
      )}
    </>
  );
}

/**
 * DialogWithContext - Dialog component that automatically integrates with DialogContext
 * for better scroll behavior management
 */
interface DialogWithContextProps extends React.ComponentProps<typeof Dialog> {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const DialogWithContext: React.FC<DialogWithContextProps> = ({
  isOpen,
  onOpenChange,
  children,
  ...props
}) => {
  const { openDialog, closeDialog } = useDialog();
  
  // Notify DialogContext when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      openDialog();
      // Thêm dispatch để đảm bảo mọi component đều biết dialog đã mở
      document.dispatchEvent(new CustomEvent('dialog:open'));
    } 
  }, [isOpen, openDialog]);
  
  // Xử lý callback onOpenChange
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      closeDialog();
      document.dispatchEvent(new CustomEvent('dialog:close'));
    }
    onOpenChange(open);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange} {...props}>
      {children}
    </Dialog>
  );
};

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
  useDialogVariant,
  DialogWithContext,
}