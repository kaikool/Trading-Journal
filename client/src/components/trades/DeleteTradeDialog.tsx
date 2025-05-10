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
import { Trade } from "@/types";

interface DeleteTradeDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  trade: Trade | null;
  onConfirm: (tradeId: string) => void;
}

export function DeleteTradeDialog({
  isOpen,
  onOpenChange,
  trade,
  onConfirm,
}: DeleteTradeDialogProps) {
  const handleConfirm = React.useCallback(() => {
    if (trade?.id) {
      onConfirm(trade.id);
    }
    onOpenChange(false);
  }, [trade, onConfirm, onOpenChange]);

  if (!trade) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent className="safe-area-p">
        <AlertDialogHeader>
          <AlertDialogTitle>Xác nhận xóa giao dịch</AlertDialogTitle>
          <AlertDialogDescription>
            Bạn có chắc chắn muốn xóa giao dịch <strong>{trade.pair} {trade.direction}</strong> này không?
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

export default DeleteTradeDialog;