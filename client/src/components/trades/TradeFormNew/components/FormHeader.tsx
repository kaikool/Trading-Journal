import React from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Icons } from '@/components/icons/icons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface FormHeaderProps {
  isEditMode: boolean;
  hasDraft: boolean;
  showDraftNotice: boolean;
  isDraftLoading: boolean;
  setShowDraftNotice: (show: boolean) => void;
  loadDraft: () => void;
  clearDraft: () => void;
}

export function FormHeader({
  isEditMode,
  hasDraft,
  showDraftNotice,
  isDraftLoading,
  setShowDraftNotice,
  loadDraft,
  clearDraft
}: FormHeaderProps) {
  // Don't show anything in edit mode
  if (isEditMode) {
    return null;
  }
  
  // Show draft notice if available
  if (hasDraft && showDraftNotice) {
    return (
      <Alert className="mb-6">
        <div className="flex items-center gap-2">
          <Icons.ui.fileText className="h-4 w-4 text-primary" />
          <AlertTitle className="font-medium">Unsaved draft available</AlertTitle>
        </div>
        <AlertDescription className="mt-2 text-sm">
          You have an unsaved trade draft. Would you like to continue where you left off?
        </AlertDescription>
        <div className="mt-4 flex items-center gap-3">
          <Button
            size="sm"
            variant="outline"
            className="flex items-center gap-1.5"
            onClick={() => {
              loadDraft();
              setShowDraftNotice(false);
            }}
            disabled={isDraftLoading}
          >
            {isDraftLoading ? (
              <Icons.ui.spinner className="h-3 w-3 animate-spin" />
            ) : (
              <Icons.ui.check className="h-3 w-3" />
            )}
            <span>Load Draft</span>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="flex items-center gap-1.5 text-muted-foreground"
            onClick={() => {
              clearDraft();
              setShowDraftNotice(false);
            }}
          >
            <Icons.ui.x className="h-3 w-3" />
            <span>Discard</span>
          </Button>
        </div>
      </Alert>
    );
  }
  
  // Display badge if draft exists but notice is hidden
  if (hasDraft && !showDraftNotice) {
    return (
      <div className="mb-6">
        <Badge
          variant="outline"
          className="px-3 py-1 cursor-pointer flex items-center gap-1.5 hover:bg-primary/5 transition-colors"
          onClick={() => setShowDraftNotice(true)}
        >
          <Icons.ui.fileText className="h-3 w-3 text-primary" />
          <span>Draft available</span>
        </Badge>
      </div>
    );
  }
  
  return null;
}