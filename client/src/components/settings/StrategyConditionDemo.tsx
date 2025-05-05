import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StrategyCondition } from "@/types";
import {
  StrategyConditionList,
  StrategyConditionForm,
  createNewCondition,
} from "@/components/settings/StrategyConditionInput";
import { ListChecks, DoorOpen, LogOut, Plus } from "lucide-react";

/**
 * Demo component for StrategyConditionInput
 * This component is used for development and testing purposes
 */
export function StrategyConditionDemo() {
  // Sample conditions
  const [rules, setRules] = useState<StrategyCondition[]>([
    {
      id: "rule1",
      label: "Only trade during London and New York sessions",
      order: 0,
      timeframe: "H1",
      description: "Trade only during high liquidity periods when price movement is more predictable"
    },
    {
      id: "rule2",
      label: "No trading on Sundays or major holidays",
      order: 1,
      description: "Avoid trading during periods of low liquidity"
    }
  ]);
  
  const [entryConditions, setEntryConditions] = useState<StrategyCondition[]>([
    {
      id: "entry1",
      label: "EMA 50 is sloping upward",
      order: 0,
      indicator: "EMA",
      timeframe: "H4",
      expectedValue: "Uptrend",
      description: "Confirms the broader market trend is bullish"
    },
    {
      id: "entry2",
      label: "Price pullback to EMA 20",
      order: 1,
      indicator: "EMA",
      timeframe: "H1",
      expectedValue: "Pullback",
      description: "Wait for price to retrace to the moving average before entering"
    },
    {
      id: "entry3",
      label: "RSI above 50 on H1",
      order: 2,
      indicator: "RSI",
      timeframe: "H1",
      expectedValue: "Above Level",
      description: "Confirms bullish momentum"
    }
  ]);
  
  const [exitConditions, setExitConditions] = useState<StrategyCondition[]>([
    {
      id: "exit1",
      label: "Take profit at 2:1 risk-reward ratio",
      order: 0,
      description: "Set take profit at twice the distance of stop loss"
    },
    {
      id: "exit2",
      label: "RSI reaches overbought (70+)",
      order: 1,
      indicator: "RSI",
      timeframe: "H1",
      expectedValue: "Overbought",
      description: "Exit when momentum is slowing down"
    }
  ]);
  
  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  
  // Handlers for rules
  const handleAddRule = (rule: StrategyCondition) => {
    setRules([...rules, rule]);
  };
  
  const handleUpdateRule = (id: string, updates: Partial<StrategyCondition>) => {
    setRules(
      rules.map(rule => (rule.id === id ? { ...rule, ...updates } : rule))
    );
  };
  
  const handleDeleteRule = (id: string) => {
    setRules(rules.filter(rule => rule.id !== id));
  };
  
  // Handlers for entry conditions
  const handleAddEntryCondition = (condition: StrategyCondition) => {
    setEntryConditions([...entryConditions, condition]);
  };
  
  const handleUpdateEntryCondition = (id: string, updates: Partial<StrategyCondition>) => {
    setEntryConditions(
      entryConditions.map(condition => (condition.id === id ? { ...condition, ...updates } : condition))
    );
  };
  
  const handleDeleteEntryCondition = (id: string) => {
    setEntryConditions(entryConditions.filter(condition => condition.id !== id));
  };
  
  // Handlers for exit conditions
  const handleAddExitCondition = (condition: StrategyCondition) => {
    setExitConditions([...exitConditions, condition]);
  };
  
  const handleUpdateExitCondition = (id: string, updates: Partial<StrategyCondition>) => {
    setExitConditions(
      exitConditions.map(condition => (condition.id === id ? { ...condition, ...updates } : condition))
    );
  };
  
  const handleDeleteExitCondition = (id: string) => {
    setExitConditions(exitConditions.filter(condition => condition.id !== id));
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Strategy Conditions Demo</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? "View Mode" : "Edit Mode"}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="rules">Rules</TabsTrigger>
              <TabsTrigger value="entry">Entry Conditions</TabsTrigger>
              <TabsTrigger value="exit">Exit Conditions</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="space-y-6">
              {/* Rules */}
              <div className="space-y-3">
                <StrategyConditionList
                  title="Trading Rules"
                  icon={<ListChecks className="h-4 w-4 mr-1" />}
                  emptyMessage="No trading rules defined yet. Click 'Add' to create one."
                  conditions={rules}
                  onAdd={handleAddRule}
                  onUpdate={handleUpdateRule}
                  onDelete={handleDeleteRule}
                />
              </div>
              
              {/* Entry Conditions */}
              <div className="space-y-3">
                <StrategyConditionList
                  title="Entry Conditions"
                  icon={<DoorOpen className="h-4 w-4 mr-1" />}
                  emptyMessage="No entry conditions defined yet. Click 'Add' to create one."
                  conditions={entryConditions}
                  onAdd={handleAddEntryCondition}
                  onUpdate={handleUpdateEntryCondition}
                  onDelete={handleDeleteEntryCondition}
                />
              </div>
              
              {/* Exit Conditions */}
              <div className="space-y-3">
                <StrategyConditionList
                  title="Exit Conditions"
                  icon={<LogOut className="h-4 w-4 mr-1" />}
                  emptyMessage="No exit conditions defined yet. Click 'Add' to create one."
                  conditions={exitConditions}
                  onAdd={handleAddExitCondition}
                  onUpdate={handleUpdateExitCondition}
                  onDelete={handleDeleteExitCondition}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="rules" className="space-y-3">
              <StrategyConditionList
                title="Trading Rules"
                icon={<ListChecks className="h-4 w-4 mr-1" />}
                emptyMessage="No trading rules defined yet. Click 'Add' to create one."
                conditions={rules}
                onAdd={handleAddRule}
                onUpdate={handleUpdateRule}
                onDelete={handleDeleteRule}
              />
            </TabsContent>
            
            <TabsContent value="entry" className="space-y-3">
              <StrategyConditionList
                title="Entry Conditions"
                icon={<DoorOpen className="h-4 w-4 mr-1" />}
                emptyMessage="No entry conditions defined yet. Click 'Add' to create one."
                conditions={entryConditions}
                onAdd={handleAddEntryCondition}
                onUpdate={handleUpdateEntryCondition}
                onDelete={handleDeleteEntryCondition}
              />
            </TabsContent>
            
            <TabsContent value="exit" className="space-y-3">
              <StrategyConditionList
                title="Exit Conditions"
                icon={<LogOut className="h-4 w-4 mr-1" />}
                emptyMessage="No exit conditions defined yet. Click 'Add' to create one."
                conditions={exitConditions}
                onAdd={handleAddExitCondition}
                onUpdate={handleUpdateExitCondition}
                onDelete={handleDeleteExitCondition}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}