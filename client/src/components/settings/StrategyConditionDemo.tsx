import { useState } from "react";
import { StrategyCondition } from "@/types";
import { StrategyConditionList, createNewCondition } from "./StrategyConditionInput";
import { BookOpen } from "lucide-react";

/**
 * Demo component to display StrategyConditionList examples 
 */
export function StrategyConditionDemo() {
  const [conditions, setConditions] = useState<StrategyCondition[]>([
    {
      id: "demo-condition-1",
      label: "EMA 50 trending upward",
      indicator: "EMA",
      timeframe: "H4",
      expectedValue: "Uptrend",
      description: "50-period Exponential Moving Average must be in clear uptrend",
      order: 0
    },
    {
      id: "demo-condition-2", 
      label: "Price above 200 SMA",
      indicator: "SMA",
      timeframe: "H4", 
      expectedValue: "Above Level",
      description: "Price must be trading above the 200-period Simple Moving Average",
      order: 1
    }
  ]);
  
  const handleAddCondition = (newCondition: StrategyCondition) => {
    setConditions([...conditions, newCondition]);
  };
  
  const handleUpdateCondition = (id: string, updates: Partial<StrategyCondition>) => {
    setConditions(
      conditions.map(condition => 
        condition.id === id 
          ? { ...condition, ...updates } 
          : condition
      )
    );
  };
  
  const handleDeleteCondition = (id: string) => {
    setConditions(conditions.filter(condition => condition.id !== id));
  };
  
  return (
    <div className="p-6 bg-background border rounded-lg">
      <h2 className="text-xl font-semibold mb-4">Strategy Condition Examples</h2>
      
      <div className="grid gap-6">
        <div className="p-4 border rounded-lg bg-card">
          <h3 className="text-lg font-semibold mb-3">Entry Conditions</h3>
          
          <StrategyConditionList
            title="Entry Conditions"
            emptyMessage="No entry conditions defined yet. Click 'Add' to create one."
            conditions={conditions}
            onAdd={handleAddCondition}
            onUpdate={handleUpdateCondition}
            onDelete={handleDeleteCondition}
            icon={<BookOpen className="h-4 w-4" />}
          />
        </div>
        
        <div className="p-4 border rounded-lg bg-card">
          <h3 className="text-lg font-semibold mb-3">Empty Condition List Example</h3>
          
          <StrategyConditionList
            title="Exit Conditions"
            emptyMessage="No exit conditions defined yet. Click 'Add' to create one."
            conditions={[]}
            onAdd={(condition) => console.log("Added exit condition", condition)}
            onUpdate={(id, updates) => console.log("Updated exit condition", id, updates)}
            onDelete={(id) => console.log("Deleted exit condition", id)}
            icon={<BookOpen className="h-4 w-4" />}
          />
        </div>
      </div>
    </div>
  );
}