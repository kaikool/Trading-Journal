import { lazy, Suspense } from "react";
import { LoadingFallback } from "@/components/dynamic/LoadingFallback";
import { useDataCache } from "@/contexts/DataCacheContext";
import { Icons } from "@/components/icons/icons";

// Lazy load the component
const StrategiesManagement = lazy(() => 
  import("@/components/settings/StrategiesManagement").then(mod => ({ default: mod.StrategiesManagement }))
);

export default function StrategiesPage() {
  const { userData, isLoading } = useDataCache();
  
  // Empty state component
  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center h-[400px] text-center">
      <Icons.nav.strategies className="h-16 w-16 text-muted-foreground/20 mb-4" />
      <h3 className="text-lg font-semibold mb-2">No Strategies Created Yet</h3>
      <p className="text-muted-foreground max-w-md mb-4">
        Create your first trading strategy to define your trading rules.
      </p>
    </div>
  );
  
  return (
    <div className="max-w-7xl mx-auto px-0 sm:px-6 lg:px-8 space-y-6">
      {/* Main content */}
      {isLoading ? (
        <LoadingFallback height={400} simple showSpinner={true} />
      ) : (
        <div className="space-y-8">
          <Suspense fallback={<LoadingFallback height={400} showSpinner={true} />}>
            <StrategiesManagement />
          </Suspense>
        </div>
      )}
    </div>
  );
}