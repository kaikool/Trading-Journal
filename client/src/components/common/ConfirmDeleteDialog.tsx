import * as React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ConfirmDeleteDialogProps {
  /**
   * Trạng thái mở của dialog
   */
  isOpen: boolean;
  
  /**
   * Callback khi trạng thái mở của dialog thay đổi
   */
  onOpenChange: (open: boolean) => void;
  
  /**
   * ID hoặc dữ liệu của item cần xóa, sẽ được truyền lại qua onConfirm
   */
  itemToDelete: any;
  
  /**
   * Callback khi người dùng xác nhận xóa
   */
  onConfirm: (item: any) => void;
  
  /**
   * Tiêu đề của dialog
   */
  title?: string;
  
  /**
   * Mô tả chi tiết được hiển thị trong dialog
   */
  description?: React.ReactNode;
  
  /**
   * Nhãn của nút hủy
   */
  cancelText?: string;
  
  /**
   * Nhãn của nút xác nhận xóa
   */
  confirmText?: string;
  
  /**
   * CSS class để override cho nút xác nhận nếu cần
   */
  confirmButtonClass?: string;
}

/**
 * Component dialog xác nhận xóa đa năng có thể dùng cho mọi loại xóa trong ứng dụng:
 * - Xóa giao dịch (trade)
 * - Xóa mục tiêu (goal)
 * - Xóa chiến lược (strategy)
 * - Và nhiều loại khác
 * 
 * Component này sử dụng AlertDialog từ shadcn/ui và có thể được tùy chỉnh dễ dàng
 * thông qua các props.
 */
export function ConfirmDeleteDialog({
  isOpen,
  onOpenChange,
  itemToDelete,
  onConfirm,
  title = "Xác nhận xóa",
  description = "Bạn có chắc chắn muốn xóa mục này không? Dữ liệu đã xóa không thể khôi phục lại được.",
  cancelText = "Hủy",
  confirmText = "Xóa",
  confirmButtonClass = "bg-destructive hover:bg-destructive/90",
}: ConfirmDeleteDialogProps) {
  const handleConfirm = React.useCallback(() => {
    if (itemToDelete !== undefined) {
      onConfirm(itemToDelete);
    }
    onOpenChange(false);
  }, [itemToDelete, onConfirm, onOpenChange]);

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent className="safe-area-p">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => onOpenChange(false)}>
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirm}
            className={confirmButtonClass}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default ConfirmDeleteDialog;