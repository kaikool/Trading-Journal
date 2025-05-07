import React, { useState } from 'react';
import { 
  Plus, Loader2, BookCopy, AlertCircle
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useUserData } from '@/hooks/use-user-data';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { StrategiesManagement } from '@/components/settings/StrategiesManagement';

export function StrategyList() {
  const { userData, isLoading } = useUserData();
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // Check if user has strategies
  const hasStrategies = userData?.strategies && userData.strategies.length > 0;
  
  return (
    <div className="space-y-4">
      {/* Empty state */}
      {!hasStrategies && (
        <Alert className="mt-4 bg-muted/50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You haven't created any strategies yet. Get started by creating your first trading strategy.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Simply use the existing StrategiesManagement component for now */}
      <StrategiesManagement />
    </div>
  );
}