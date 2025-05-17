import { lazy, Suspense } from "react";

import { useUserDataQuery } from "@/hooks/use-user-data-query";
import { Icons } from "@/components/icons/icons";

// Lazy load the component
const StrategiesManagement = lazy(() => 
  import("@/components/settings/StrategiesManagement").then(mod => ({ default: mod.StrategiesManagement }))
);

export default function StrategiesPage() {
  const { isLoading } = useUserDataQuery();
  
  // Empty state component đã được xóa vì không sử dụng
  
  return (
    <div className="max-w-7xl mx-auto px-0 sm:px-6 lg:px-8 space-y-6">
      {/* Main content */}
      {isLoading ? (
        <div className="h-[400px] bg-background/5 rounded-md"></div>
      ) : (
        <div className="space-y-8">
          <Suspense fallback={<div className="h-[400px] bg-background/5 rounded-md"></div>}>
            <StrategiesManagement />
          </Suspense>
        </div>
      )}
    </div>
  );
}