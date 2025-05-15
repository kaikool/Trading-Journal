import { lazy, Suspense } from "react";
import { LoadingFallback } from "@/components/dynamic/LoadingFallback";
import { useDataCache } from "@/contexts/DataCacheContext";
import { Icons } from "@/components/icons/icons";

// Lazy load the component
const StrategiesManagement = lazy(() => 
  import("@/components/settings/StrategiesManagement").then(mod => ({ default: mod.StrategiesManagement }))
);

export default function StrategiesPage() {
  const { isLoading } = useDataCache(); // Removed unused: userData
  
  // Empty state component đã được xóa vì không sử dụng
  
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