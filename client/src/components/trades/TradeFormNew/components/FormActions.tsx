import React from 'react';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons/icons';

interface FormActionsProps {
  isEditMode: boolean;
  isFormSubmitting: boolean;
  hasDraft: boolean;
  onCancel?: () => void;
  clearDraft: () => void;
}

export function FormActions({
  isEditMode,
  isFormSubmitting,
  hasDraft,
  onCancel,
  clearDraft
}: FormActionsProps) {
  return (
    <div className="flex justify-end gap-3 items-center pt-4 mt-6 mb-8 px-4 border-t border-border/50 overflow-hidden">
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        disabled={isFormSubmitting}
      >
        Cancel
      </Button>
      
      {!isEditMode && hasDraft && (
        <Button
          type="button"
          variant="outline"
          className="flex items-center gap-1.5"
          onClick={clearDraft}
          disabled={isFormSubmitting}
        >
          <Icons.ui.trash className="h-3.5 w-3.5 text-muted-foreground" />
          <span>Clear Draft</span>
        </Button>
      )}
      
      <Button
        type="submit"
        disabled={isFormSubmitting}
        className="min-w-[100px]"
      >
        {isFormSubmitting ? (
          <>
            <Icons.ui.spinner className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Icons.ui.save className="mr-2 h-4 w-4" />
            {isEditMode ? 'Update Trade' : 'Save Trade'}
          </>
        )}
      </Button>
    </div>
  );
}