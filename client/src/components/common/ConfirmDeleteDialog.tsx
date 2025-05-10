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
   * Dialog open state
   */
  isOpen: boolean;
  
  /**
   * Callback when dialog open state changes
   */
  onOpenChange: (open: boolean) => void;
  
  /**
   * Item data or ID to be deleted, will be passed back via onConfirm
   */
  itemToDelete: any;
  
  /**
   * Callback when user confirms deletion
   */
  onConfirm: (item: any) => void;
  
  /**
   * Dialog title
   */
  title?: string;
  
  /**
   * Detailed description displayed in the dialog
   */
  description?: React.ReactNode;
  
  /**
   * Cancel button label
   */
  cancelText?: string;
  
  /**
   * Confirm button label
   */
  confirmText?: string;
  
  /**
   * CSS class to override the confirm button styling if needed
   */
  confirmButtonClass?: string;
}

/**
 * Universal confirmation dialog component that can be used for any deletion operation in the application:
 * - Deleting trades
 * - Deleting goals
 * - Deleting strategies
 * - And many other item types
 * 
 * This component uses AlertDialog from shadcn/ui and can be easily customized
 * through props.
 */
export function ConfirmDeleteDialog({
  isOpen,
  onOpenChange,
  itemToDelete,
  onConfirm,
  title = "Confirm Delete",
  description = "Are you sure you want to delete this item? This action cannot be undone.",
  cancelText = "Cancel",
  confirmText = "Delete",
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