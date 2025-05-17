import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ActionButtonsProps = {
  primaryLabel: string;
  onPrimaryAction: () => void;
  cancelLabel?: string;
  onCancel?: () => void;
  isPrimaryDestructive?: boolean;
  isPrimaryLoading?: boolean;
  isPrimaryDisabled?: boolean;
  isCancelDisabled?: boolean;
  primaryIcon?: React.ReactNode;
  cancelIcon?: React.ReactNode;
  className?: string;
  reverseOnMobile?: boolean;
};

/**
 * ActionButtons - Nhất quán vị trí và style của action buttons
 * 
 * Theo design system, các action buttons luôn:
 * - Cancel ở bên trái, Primary ở bên phải
 * - Trên mobile, có thể đảo chiều với prop reverseOnMobile
 */
export function ActionButtons({
  primaryLabel,
  onPrimaryAction,
  cancelLabel = "Cancel",
  onCancel,
  isPrimaryDestructive = false,
  isPrimaryLoading = false,
  isPrimaryDisabled = false,
  isCancelDisabled = false,
  primaryIcon,
  cancelIcon,
  className,
  reverseOnMobile = false,
}: ActionButtonsProps) {
  return (
    <div 
      className={cn(
        "flex items-center gap-3",
        reverseOnMobile ? "flex-col-reverse sm:flex-row" : "flex-row",
        "w-full sm:w-auto",
        onCancel ? "justify-between sm:justify-end" : "justify-end",
        className
      )}
    >
      {onCancel && (
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isCancelDisabled}
          className={cn(
            reverseOnMobile ? "w-full sm:w-auto" : "",
            "min-w-[100px]"
          )}
        >
          {cancelIcon}
          {cancelLabel}
        </Button>
      )}
      <Button
        type="button"
        variant={isPrimaryDestructive ? "destructive" : "default"}
        onClick={onPrimaryAction}
        disabled={isPrimaryDisabled || isPrimaryLoading}
        className={cn(
          reverseOnMobile ? "w-full sm:w-auto" : "",
          "min-w-[100px]"
        )}
      >
        <>
          {primaryIcon}
          {primaryLabel}
        </>
      </Button>
    </div>
  );
}

/**
 * DialogActions - Nhất quán vị trí và style của dialog action buttons
 */
export function DialogActions({
  confirmLabel,
  onConfirm,
  cancelLabel = "Cancel",
  onCancel,
  isDestructive = false,
  isLoading = false,
  isDisabled = false,
  confirmIcon,
  cancelIcon,
  className,
}: {
  confirmLabel: string;
  onConfirm: () => void;
  cancelLabel?: string;
  onCancel?: () => void;
  isDestructive?: boolean;
  isLoading?: boolean;
  isDisabled?: boolean;
  confirmIcon?: React.ReactNode;
  cancelIcon?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex justify-end gap-3 mt-4", className)}>
      {onCancel && (
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          {cancelIcon}
          {cancelLabel}
        </Button>
      )}
      <Button
        type="button"
        variant={isDestructive ? "destructive" : "default"}
        onClick={onConfirm}
        disabled={isDisabled || isLoading}
      >
        <>
          {confirmIcon}
          {confirmLabel}
        </>
      </Button>
    </div>
  );
}

/**
 * FormActions - Nhất quán vị trí và style của form action buttons
 */
export function FormActions({
  submitLabel,
  onCancel,
  cancelLabel = "Cancel",
  isSubmitting = false,
  isDisabled = false,
  className,
  submitIcon,
  cancelIcon,
}: {
  submitLabel: string;
  onCancel?: () => void;
  cancelLabel?: string;
  isSubmitting?: boolean;
  isDisabled?: boolean;
  className?: string;
  submitIcon?: React.ReactNode;
  cancelIcon?: React.ReactNode;
}) {
  return (
    <div className={cn("flex justify-end gap-3", className)}>
      {onCancel && (
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          {cancelIcon}
          {cancelLabel}
        </Button>
      )}
      <Button
        type="submit"
        disabled={isDisabled || isSubmitting}
      >
        {isSubmitting ? (
          <span>Please wait...</span>
        ) : (
          <>
            {submitIcon}
            {submitLabel}
          </>
        )}
      </Button>
    </div>
  );
}