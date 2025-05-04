import { cn } from "@/lib/utils";

/**
 * Các biến thể tiêu chuẩn cho Dialog trong ứng dụng
 * 
 * Được sử dụng để đảm bảo tính nhất quán giữa các dialog khác nhau.
 * Tất cả các biến thể đều kế thừa các thuộc tính cơ bản như border-radius, shadow.
 */

// Các thuộc tính chung cho dialog
const dialogBase = "rounded-lg border shadow-lg bg-background";

export const dialogVariants = {
  /**
   * Standard Dialog - Kích thước tiêu chuẩn cho dialog thông thường
   * Sử dụng cho hầu hết các dialog trong ứng dụng
   */
  standard: `${dialogBase} max-w-[95vw] w-full sm:max-w-[90vw] md:max-w-[560px] max-h-[85vh] overflow-y-auto p-3 sm:p-4`,
  
  /**
   * Chart Dialog - Kích thước tối ưu cho dialog hiển thị biểu đồ
   * Rộng hơn để hiển thị tốt hơn cho nội dung đồ họa
   */
  chart: `${dialogBase} p-0 chart-dialog`,
  
  /**
   * Form Dialog - Cho phép dialog chứa form thu thập dữ liệu từ người dùng
   * Kích thước trung bình và có padding phù hợp
   */
  form: `${dialogBase} max-w-[95vw] w-full sm:max-w-[85vw] md:max-w-[520px] max-h-[85vh] overflow-y-auto p-4 sm:p-5`,
  
  /**
   * Compact Dialog - Cho các thông báo hoặc xác nhận nhỏ gọn
   * Kích thước nhỏ và có padding giảm thiểu
   */
  compact: `${dialogBase} max-w-[95vw] w-full sm:max-w-[400px] max-h-[85vh] overflow-y-auto p-3 sm:p-4`,
  
  /**
   * Large Dialog - Cho nội dung phức tạp hoặc dữ liệu lớn
   * Kích thước lớn nhất trong hệ thống
   */
  large: `${dialogBase} max-w-[95vw] w-full sm:max-w-[90vw] md:max-w-[720px] lg:max-w-[800px] max-h-[90vh] overflow-y-auto p-4 sm:p-5`
};

/**
 * Hook để lấy class cho dialog dựa trên variant và className bổ sung
 * 
 * @param variant Biến thể của dialog (standard, chart, form, compact, large)
 * @param className CSS class bổ sung nếu cần
 * @returns Chuỗi class đã được gộp
 */
export function useDialogVariant(
  variant: keyof typeof dialogVariants = "standard",
  className?: string
): string {
  return cn(dialogVariants[variant], className);
}

/**
 * Header Footer Layout - Layout dialog tiêu chuẩn với header và footer cố định
 */
export function DialogHeaderFooterLayout({
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