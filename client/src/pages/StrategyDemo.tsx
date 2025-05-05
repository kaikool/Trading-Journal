import { StrategyConditionDemo } from "@/components/settings/StrategyConditionDemo";

/**
 * Simple page to test the StrategyConditionDemo component
 */
export default function StrategyDemoPage() {
  return (
    <div className="container max-w-7xl mx-auto py-6 md:py-10 px-4 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          Strategy Condition Demo
        </h1>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          This page demonstrates the strategy condition components with responsive design
        </p>
      </div>
      
      <StrategyConditionDemo />
    </div>
  );
}