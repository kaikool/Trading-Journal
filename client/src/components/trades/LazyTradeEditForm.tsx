import React from 'react';
import { Trade } from '@/types';
import { lazy, Suspense } from 'react';
import { Icons } from '@/components/icons/icons';
import { Button } from "@/components/ui/button";

// Lazy load the main form component
const TradeFormNew = lazy(() => import('./TradeFormNew'));

interface LazyTradeEditFormProps {
  trade: Trade;
  userId: string;
  onSubmitting: (isSubmitting: boolean) => void;
  onSuccess: () => void;
  onError: (error: unknown) => void;
  onCancel: () => void;
}

/**
 * LazyTradeEditForm Component
 * 
 * A wrapper component that lazy-loads the trade edit form.
 * This helps to improve initial page load performance.
 */
export function LazyTradeEditForm({
  trade,
  userId,
  onSubmitting,
  onSuccess,
  onError,
  onCancel
}: LazyTradeEditFormProps) {
  if (!trade) {
    return (
      <div className="p-4 text-center">
        <p className="text-muted-foreground">No trade data available</p>
      </div>
    );
  }

  return (
    <div className="p-0 mb-6">
      <TradeFormNew
        mode="edit"
        userId={userId}
        initialValues={trade}
        onSubmitting={onSubmitting}
        onSuccess={onSuccess}
        onError={onError}
      />
    </div>
  );
}

export default LazyTradeEditForm;