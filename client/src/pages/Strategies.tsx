import { lazy, Suspense } from "react";
import { LoadingFallback } from "@/components/dynamic/LoadingFallback";
import { PageHeader } from "@/components/layout/PageHeader";
import { BookOpen } from "lucide-react";

// Lazy load the component
const StrategiesManagement = lazy(() => 
  import("@/components/settings/StrategiesManagement").then(mod => ({ default: mod.StrategiesManagement }))
);

export default function StrategiesPage() {
  return (
    <div className="container py-6 max-w-6xl">
      <PageHeader
        title="Trading Strategies"
        description="Manage your trading strategies and analyze their performance"
        icon={<BookOpen className="h-6 w-6" />}
      />
      
      <div className="mt-8 space-y-8">
        <Suspense fallback={<LoadingFallback height={400} />}>
          <StrategiesManagement />
        </Suspense>
      </div>
    </div>
  );
}