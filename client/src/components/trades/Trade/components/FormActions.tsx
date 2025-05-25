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
    <div className="flex justify-between items-center w-full">
      <div className="flex items-center gap-2">
        {!isEditMode && hasDraft && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearDraft}
            disabled={isFormSubmitting}
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <Icons.general.trash className="h-4 w-4 mr-1.5" />
            Clear Draft
          </Button>
        )}
      </div>
      
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCancel}
          disabled={isFormSubmitting}
        >
          Cancel
        </Button>
        
        <Button
          type="submit"
          disabled={isFormSubmitting}
          size="sm"
          className="min-w-[100px] font-medium"
        >
          {isFormSubmitting ? (
            <>
              <span className="mr-2 h-4 w-4 bg-background/80 rounded animate-pulse"></span>
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
    </div>
  );
}