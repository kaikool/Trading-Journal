import { lazy, Suspense } from "react";
import { AppSkeleton, SkeletonLevel } from "@/components/ui/app-skeleton";
import { useUserDataQuery } from "@/hooks/use-user-data-query";
import { Icons } from "@/components/icons/icons";

// Lazy load the component
const StrategiesManagement = lazy(() => 
  import("@/components/settings/StrategiesManagement").then(mod => ({ default: mod.StrategiesManagement }))
);

export default function StrategiesPage() {
  const { isLoading } = useUserDataQuery(); // Removed unused: userData
  
  // Empty state component đã được xóa vì không sử dụng
  
  return (
    <div className="max-w-7xl mx-auto px-0 sm:px-6 lg:px-8 space-y-6">
      {/* Main content */}
      {isLoading ? (
        <AppSkeleton level={SkeletonLevel.PAGE} height={400} />
      ) : (
        <div className="space-y-8">
          <Suspense fallback={<AppSkeleton level={SkeletonLevel.CARD} height={400} />}>
            <StrategiesManagement />
          </Suspense>
        </div>
      )}
    </div>
  );
}