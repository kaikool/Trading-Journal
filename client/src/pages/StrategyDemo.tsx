import { StrategyConditionDemo } from "@/components/settings/StrategyConditionDemo";

/**
 * Simple page to test the StrategyConditionDemo component
 */
export default function StrategyDemoPage() {
  return (
    <div className="container max-w-7xl mx-auto py-6 md:py-10 px-4 sm:px-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Strategy Condition Demo
          </h1>
          <p className="text-muted-foreground mt-0.5 text-sm sm:text-base">
            This page demonstrates the strategy condition components with responsive design
          </p>
        </div>
      </div>
      
      <StrategyConditionDemo />
    </div>
  );
}