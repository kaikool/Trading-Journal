import { lazy, Suspense } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUserDataQuery } from "@/hooks/use-user-data-query";
import { Icons } from "@/components/icons/icons";

// Lazy load the components
const StrategiesManagement = lazy(() => 
  import("@/components/settings/StrategiesManagement").then(mod => ({ default: mod.StrategiesManagement }))
);

const AIAnalysisTab = lazy(() => 
  import("@/components/analytics/AIAnalysisTab")
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
          Quản lý và phân tích chiến lược giao dịch của bạn
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="management" className="w-full">
        <div className="overflow-x-auto mb-4 sm:mb-6 touch-pan-x">
          <div className="min-w-max mx-auto px-1">
            <TabsList className="w-fit sm:w-auto flex flex-nowrap h-auto justify-start p-1 space-x-1 rounded-xl bg-muted/80">
              <TabsTrigger 
                value="management" 
                className="flex items-center justify-center h-9 px-2 sm:px-4 gap-1.5 data-[state=active]:bg-primary/10 rounded-md transition-all"
              >
                <Icons.trade.bookCopy className="h-4 w-4 flex-shrink-0" />
                <span className="inline whitespace-nowrap text-xs sm:text-sm font-medium">Quản lý</span>
              </TabsTrigger>
              <TabsTrigger 
                value="ai-analysis" 
                className="flex items-center justify-center h-9 px-2 sm:px-4 gap-1.5 data-[state=active]:bg-primary/10 rounded-md transition-all"
              >
                <Icons.analytics.brain className="h-4 w-4 flex-shrink-0" />
                <span className="inline whitespace-nowrap text-xs sm:text-sm font-medium">Phân tích AI</span>
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        {/* Tab Contents */}
        <TabsContent value="management" className="mt-0">
          <Suspense fallback={<div className="h-[400px] bg-background/5 rounded-md"></div>}>
            <StrategiesManagement />
          </Suspense>
        </TabsContent>

        <TabsContent value="ai-analysis" className="mt-0">
          <Suspense fallback={<div className="h-[400px] bg-background/5 rounded-md"></div>}>
            <AIAnalysisTab data={{}} />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}