import React, { Suspense, lazy } from 'react';
import { BookCopy, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useDataCache } from "@/contexts/DataCacheContext";
import { LoadingFallback } from "@/components/dynamic/LoadingFallback";
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

// Lazy load the component for better performance
const StrategiesManagement = lazy(() => 
  import("@/components/settings/StrategiesManagement").then(mod => ({ default: mod.StrategiesManagement }))
);

export default function StrategiesPage() {
  const { toast } = useToast();
  const { userData, isLoading } = useDataCache();
  const hasStrategies = userData?.strategies && userData.strategies.length > 0;

  return (
    <div className="container max-w-screen-lg mx-auto px-4 py-6 space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold flex items-center">
            <BookCopy className="mr-2 h-6 w-6" />
            Trading Strategies
          </h1>
          <p className="text-muted-foreground mt-1">
            Create and manage your trading strategies
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Strategy Management</CardTitle>
          <CardDescription>
            Define clear rules and conditions for your trading
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="max-h-[500px] overflow-y-auto pr-4">
            <Suspense fallback={<LoadingFallback />}>
              <StrategiesManagement />
            </Suspense>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}