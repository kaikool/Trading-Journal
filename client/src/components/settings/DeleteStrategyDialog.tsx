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
import { TradingStrategy } from "@/types";

interface DeleteStrategyDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  strategy: TradingStrategy | null;
  onConfirm: (strategy: TradingStrategy) => void;
}

export function DeleteStrategyDialog({
  isOpen,
  onOpenChange,
  strategy,
  onConfirm,
}: DeleteStrategyDialogProps) {
  const handleConfirm = React.useCallback(() => {
    if (strategy) {
      onConfirm(strategy);
    }
    onOpenChange(false);
  }, [strategy, onConfirm, onOpenChange]);

  if (!strategy) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent className="safe-area-p">
        <AlertDialogHeader>
          <AlertDialogTitle>Xác nhận xóa chiến lược</AlertDialogTitle>
          <AlertDialogDescription>
            Bạn có chắc chắn muốn xóa chiến lược <strong>{strategy.name}</strong> không?
            {strategy.isDefault && (
              <div className="mt-2 text-destructive">
                <strong>Lưu ý:</strong> Đây là chiến lược mặc định. Việc xóa nó có thể ảnh hưởng đến các giao dịch mới.
              </div>
            )}
            Dữ liệu đã xóa không thể khôi phục lại được.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => onOpenChange(false)}>
            Hủy
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirm}
            className="bg-destructive hover:bg-destructive/90"
          >
            Xóa
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default DeleteStrategyDialog;