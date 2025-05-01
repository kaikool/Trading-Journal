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
        {isPrimaryLoading ? (
          <span className="flex items-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading...
          </span>
        ) : (
          <>
            {primaryIcon}
            {primaryLabel}
          </>
        )}
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
        {isLoading ? (
          <span className="flex items-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading...
          </span>
        ) : (
          <>
            {confirmIcon}
            {confirmLabel}
          </>
        )}
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
          <span className="flex items-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Saving...
          </span>
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