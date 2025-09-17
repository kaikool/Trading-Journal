import { lazy, Suspense } from "react";
import { useUserDataQuery } from "@/hooks/use-user-data-query";

// Lazy load the components
const StrategiesManagement = lazy(() => 
  import("@/components/strategies/StrategiesManagement").then(mod => ({ default: mod.StrategiesManagement }))
);

export default function StrategiesPage() {
  const { isLoading } = useUserDataQuery();
  
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-0 sm:px-6 lg:px-8 space-y-6">
        <div className="h-[400px] bg-background/5 rounded-md"></div>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto px-0 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-primary/90 via-primary to-primary/80 bg-clip-text text-transparent">
          Trading Strategies
        </h2>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          Manage your trading strategies
        </p>
      </div>

      {/* Content */}
      <Suspense fallback={<div className="h-[400px] bg-background/5 rounded-md"></div>}>
        <StrategiesManagement />
      </Suspense>
    </div>
  );
}
