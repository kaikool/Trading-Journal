import { lazy, Suspense } from "react";
import { LoadingFallback } from "@/components/dynamic/LoadingFallback";
import { BookCopy } from "lucide-react";
import { useDataCache } from "@/contexts/DataCacheContext";

// Lazy load the component
const StrategiesManagement = lazy(() => 
  import("@/components/settings/StrategiesManagement").then(mod => ({ default: mod.StrategiesManagement }))
);

export default function StrategiesPage() {
  const { userData, isLoading } = useDataCache();
  
  // Empty state component
  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center h-[400px] text-center">
      <BookCopy className="h-16 w-16 text-muted-foreground/20 mb-4" />
      <h3 className="text-lg font-semibold mb-2">No Strategies Created Yet</h3>
      <p className="text-muted-foreground max-w-md mb-4">
        Create your first trading strategy to define your trading rules.
      </p>
    </div>
  );
  
  return (
    <div className="max-w-7xl mx-auto px-0 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col mb-6">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-primary/90 via-primary to-primary/80 bg-clip-text text-transparent">
          Trading Strategies
        </h1>
      </div>
      
      {/* Main content */}
      {isLoading ? (
        <LoadingFallback height={400} simple />
      ) : (
        <div className="space-y-8">
          <Suspense fallback={<LoadingFallback height={400} />}>
            <StrategiesManagement />
          </Suspense>
        </div>
      )}
    </div>
  );
}