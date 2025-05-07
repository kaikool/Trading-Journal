import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useMemoWithPerf } from "@/lib/performance";
import { TradingStrategy, StrategyCondition } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { auth, getStrategies, addStrategy, updateStrategy, deleteStrategy } from "@/lib/firebase";
import { Timestamp } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import {
  StrategyConditionForm,
  StrategyConditionItem,
  StrategyConditionList,
  createNewCondition
} from "./StrategyConditionInput";
import { DialogHeaderFooterLayout } from "@/components/ui/dialog";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Trash2, 
  Plus, 
  Edit, 
  Save, 
  Check,
  X,
  AlertCircle,
  Loader2,
  BookCopy,
  Bookmark,
  TimerIcon,
  ListChecks,
  ArrowDown,
  ArrowUp,
  DoorOpen,
  LogOut,
  Activity,
  LineChart,
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";

// Common timeframes for forex
const COMMON_TIMEFRAMES = ["M1", "M5", "M15", "M30", "H1", "H4", "D1", "W1", "MN"];

// Common indicators for forex
const COMMON_INDICATORS = [
  "EMA", "SMA", "MACD", "RSI", "Bollinger Bands", "Stochastic", 
  "ADX", "Ichimoku", "Support/Resistance", "Trend Line", "Fibonacci", 
  "Pivot Points", "Price Action", "Candlestick Pattern", "Volume", "ATR"
];

// Common expected values
const COMMON_EXPECTED_VALUES = [
  "Uptrend", "Downtrend", "Sideways", "Above Level", "Below Level", 
  "Cross Up", "Cross Down", "Breakout", "Pullback", "Divergence",
  "Overbought", "Oversold", "High Volume", "Low Volume", "Confluence"
];

// Helpers for handling StrategyCondition arrays
// Using createNewCondition imported from StrategyConditionInput.tsx

const addConditionToArray = (array: StrategyCondition[], condition: StrategyCondition): StrategyCondition[] => {
  if (!condition.label.trim()) return array;
  
  // Đơn giản hóa tối đa, không logging
  return [
    ...array, 
    {
      id: condition.id,
      label: condition.label.trim(),
      order: array.length,
      indicator: condition.indicator,
      timeframe: condition.timeframe,
      expectedValue: condition.expectedValue,
      description: condition.description
    }
  ];
};

const updateConditionInArray = (array: StrategyCondition[], id: string, updates: Partial<StrategyCondition>): StrategyCondition[] => {
  // Đơn giản hóa, tạo mảng mới cho mỗi phần tử
  return array.map(condition => {
    if (condition.id === id) {
      // Tạo đối tượng mới hoàn toàn
      return {
        id: condition.id,
        label: updates.label !== undefined ? updates.label : condition.label,
        order: updates.order !== undefined ? updates.order : condition.order,
        indicator: updates.indicator !== undefined ? updates.indicator : condition.indicator,
        timeframe: updates.timeframe !== undefined ? updates.timeframe : condition.timeframe,
        expectedValue: updates.expectedValue !== undefined ? updates.expectedValue : condition.expectedValue,
        description: updates.description !== undefined ? updates.description : condition.description
      };
    }
    // Trả về bản sao của condition nếu không phải là id đang cập nhật
    return {...condition};
  });
};

const removeConditionFromArray = (array: StrategyCondition[], id: string): StrategyCondition[] => {
  // Lọc đơn giản, tạo mảng mới
  const newArray = array.filter(condition => condition.id !== id);
  
  // Cập nhật lại thứ tự (order) cho mỗi phần tử
  return newArray.map((condition, index) => ({
    ...condition,
    order: index
  }));
};

// Helper to add item to array
const addItemToArray = <T,>(array: T[], item: T): T[] => {
  return [...array, item];
};

// Helper to update item in array
const updateItemInArray = <T,>(array: T[], index: number, newValue: T): T[] => {
  return array.map((item, i) => (i === index ? newValue : item));
};

// Helper to remove item from array by index
const removeItemFromArray = <T,>(array: T[], index: number): T[] => {
  return [...array.slice(0, index), ...array.slice(index + 1)];
};

// Helper to ensure a value is a properly formatted StrategyCondition
const ensureConditionFormat = (value: any): StrategyCondition => {
  // If it's already a StrategyCondition, return as is
  if (value && typeof value === 'object' && value.id && value.label) {
    // Ensure it has all required properties with correct types
    return {
      id: value.id,
      label: value.label,
      order: value.order || 0,
      indicator: value.indicator, 
      timeframe: value.timeframe,
      expectedValue: value.expectedValue,
      description: value.description
    };
  }
  
  // Create a new condition with default values
  const id = typeof value === 'object' && value.id ? value.id : uuidv4();
  const label = typeof value === 'string' ? value : 
                typeof value === 'object' && value.label ? value.label : 
                String(value || '');
  
  return {
    id,
    label,
    order: 0,
    indicator: undefined,
    timeframe: undefined,
    expectedValue: undefined,
    description: undefined
  };
};

// Helper to fix situations where multiple strategies are marked as default
const fixMultipleDefaultStrategies = async (strategies: TradingStrategy[]): Promise<TradingStrategy[]> => {
  const defaultStrategies = strategies.filter(s => s.isDefault === true);
  
  if (defaultStrategies.length <= 1) {
    return strategies; // Nothing to fix
  }
  
  console.log(`Found ${defaultStrategies.length} default strategies, fixing...`);
  
  // Choose the most recently updated strategy as the default
  let mostRecentDefault = defaultStrategies[0];
  
  for (const strategy of defaultStrategies) {
    if (strategy.updatedAt?.toMillis && mostRecentDefault.updatedAt?.toMillis && 
        strategy.updatedAt.toMillis() > mostRecentDefault.updatedAt.toMillis()) {
      mostRecentDefault = strategy;
    }
  }
  
  // Update in database
  if (!auth.currentUser) return strategies;
  
  const userId = auth.currentUser.uid;
  
  // Keep the most recent as default, mark others as non-default
  for (const strategy of defaultStrategies) {
    if (strategy.id !== mostRecentDefault.id) {
      try {
        await updateStrategy(userId, strategy.id, {
          ...strategy,
          isDefault: false,
          updatedAt: Timestamp.now()
        });
      } catch (error) {
        console.error(`Error updating strategy ${strategy.id}:`, error);
      }
    }
  }
  
  // Return corrected strategies
  return strategies.map(s => {
    if (s.id === mostRecentDefault.id) {
      return { ...s, isDefault: true };
    }
    return { ...s, isDefault: false };
  });
};

// A memoized component for strategy items in the accordion
const StrategyItem = React.memo(function StrategyItem({
  strategy,
  isEditMode,
  onEdit,
  onUpdate,
  onDelete,
  onSetAsDefault,
  isSaving,
  // New expanded props to avoid closure issues
  editFieldValues,
  onEditFieldChange,
  newRule,
  newEntryCondition,
  newExitCondition,
  newTimeframe,
  resetFormFields
}: {
  strategy: TradingStrategy;
  isEditMode: boolean;
  onEdit: () => void;
  onUpdate: (strategy: TradingStrategy) => void;
  onDelete: () => void;
  onSetAsDefault: () => void;
  isSaving: boolean;
  editFieldValues?: Record<string, any>;
  onEditFieldChange?: (fieldName: string, value: any) => void;
  newRule: string;
  newEntryCondition: string;
  newExitCondition: string;
  newTimeframe: string;
  resetFormFields: () => void;
}) {
  // Memoized handler for updating fields in edit mode
  const handleFieldChange = useCallback((fieldName: string, value: any) => {
    if (onEditFieldChange) {
      onEditFieldChange(fieldName, value);
    }
  }, [onEditFieldChange]);

  return (
    <AccordionItem
      value={strategy.id}
      className={cn(
        "border rounded-lg overflow-hidden",
        strategy.isDefault ? "border-primary/20 bg-primary/5" : ""
      )}
    >
      <AccordionTrigger className="px-3 py-1.5 hover:bg-muted/50 h-9">
        <div className="flex items-center text-left space-x-2">
          <span className="font-medium text-sm">{strategy.name}</span>
          {strategy.isDefault && (
            <Badge variant="outline" className="font-normal text-xs h-5 px-1.5">
              Default
            </Badge>
          )}
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-3 pb-3 pt-1.5">
        {isEditMode ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={`name-${strategy.id}`}>Strategy Name</Label>
              <Input
                id={`name-${strategy.id}`}
                value={strategy.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor={`description-${strategy.id}`}>Description</Label>
              <Textarea
                id={`description-${strategy.id}`}
                value={strategy.description}
                onChange={(e) => handleFieldChange('description', e.target.value)}
              />
            </div>
            
            {/* Trading Rules */}
            <div className="space-y-1.5 mb-2">
              <StrategyConditionList
                title="Trading Rules"
                icon={<ListChecks className="h-4 w-4 mr-1" />}
                emptyMessage="No rules defined yet. Add your first trading rule."
                conditions={strategy.rules || []}
                onAdd={(condition) => handleFieldChange('rules', 
                  addConditionToArray(strategy.rules || [], condition)
                )}
                onUpdate={(id, updates) => {
                  const updatedRules = updateConditionInArray(strategy.rules || [], id, updates);
                  handleFieldChange('rules', updatedRules);
                }}
                onDelete={(id) => {
                  handleFieldChange('rules', 
                    removeConditionFromArray(strategy.rules || [], id)
                  );
                }}
              />
            </div>
              
            {/* Entry Conditions */}
            <div className="space-y-1.5 mb-2">
              <StrategyConditionList
                title="Entry Conditions"
                icon={<DoorOpen className="h-4 w-4 mr-1" />}
                emptyMessage="No entry conditions defined yet. Add your first entry condition."
                conditions={strategy.entryConditions || []}
                onAdd={(condition) => handleFieldChange('entryConditions', 
                  addConditionToArray(strategy.entryConditions || [], condition)
                )}
                onUpdate={(id, updates) => {
                  const updatedConditions = updateConditionInArray(strategy.entryConditions || [], id, updates);
                  handleFieldChange('entryConditions', updatedConditions);
                }}
                onDelete={(id) => {
                  handleFieldChange('entryConditions', 
                    removeConditionFromArray(strategy.entryConditions || [], id)
                  );
                }}
              />
            </div>
            
            {/* Exit Conditions */}
            <div className="space-y-1.5 mb-2">
              <StrategyConditionList
                title="Exit Conditions"
                icon={<LogOut className="h-4 w-4 mr-1" />}
                emptyMessage="No exit conditions defined yet. Add your first exit condition."
                conditions={strategy.exitConditions || []}
                onAdd={(condition) => handleFieldChange('exitConditions', 
                  addConditionToArray(strategy.exitConditions || [], condition)
                )}
                onUpdate={(id, updates) => {
                  const updatedConditions = updateConditionInArray(strategy.exitConditions || [], id, updates);
                  handleFieldChange('exitConditions', updatedConditions);
                }}
                onDelete={(id) => {
                  handleFieldChange('exitConditions', 
                    removeConditionFromArray(strategy.exitConditions || [], id)
                  );
                }}
              />
            </div>
            
            {/* Timeframes */}
            <div className="space-y-1.5 mt-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  Timeframes
                </h4>
                <div className="flex items-center space-x-2">
                  <Select 
                    value={newTimeframe}
                    onValueChange={(value) => {
                      if (value && !strategy.timeframes?.includes(value)) {
                        handleFieldChange('timeframes', 
                          [...(strategy.timeframes || []), value]
                        );
                      }
                    }}
                  >
                    <SelectTrigger className="h-6 w-24 text-xs">
                      <SelectValue placeholder="Add..." />
                    </SelectTrigger>
                    <SelectContent>
                      {COMMON_TIMEFRAMES.filter(tf => 
                        !strategy.timeframes?.includes(tf)
                      ).map(tf => (
                        <SelectItem key={tf} value={tf}>{tf}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {(strategy.timeframes || []).length === 0 ? (
                  <div className="text-xs text-muted-foreground py-1">
                    No timeframes selected
                  </div>
                ) : (
                  (strategy.timeframes || []).sort().map(tf => (
                    <Badge 
                      key={tf} 
                      variant="secondary"
                      className="px-1.5 py-0 text-xs h-6 flex items-center gap-1.5 hover:bg-secondary/70"
                    >
                      {tf}
                      <X 
                        className="h-3 w-3 cursor-pointer hover:text-destructive"
                        onClick={() => {
                          handleFieldChange('timeframes', 
                            (strategy.timeframes || []).filter(t => t !== tf)
                          );
                        }}
                      />
                    </Badge>
                  ))
                )}
              </div>
            </div>
            
            {/* Default Strategy Toggle */}
            <div className="flex items-center space-x-2 mt-4">
              <Checkbox
                id={`isDefault-${strategy.id}`}
                checked={strategy.isDefault || false}
                onCheckedChange={(checked) => handleFieldChange('isDefault', checked === true)}
              />
              <Label 
                htmlFor={`isDefault-${strategy.id}`} 
                className="text-sm font-medium cursor-pointer"
              >
                <div className="flex items-center">
                  <Bookmark className="h-3.5 w-3.5 mr-1.5" />
                  Set as default strategy
                </div>
              </Label>
            </div>
            
            {/* Actions */}
            <div className="flex justify-end space-x-2 pt-3 border-t mt-4">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 px-3"
                onClick={() => {
                  resetFormFields();
                  onEdit();
                }}
              >
                Cancel
              </Button>
              <Button 
                variant="default" 
                size="sm" 
                className="h-8 px-3"
                onClick={() => onUpdate(strategy)}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-1.5 h-3.5 w-3.5" />
                    Save
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Display description if available */}
            {strategy.description && (
              <div className="mb-4">
                <p className="text-sm text-muted-foreground">
                  {strategy.description}
                </p>
              </div>
            )}
            
            {/* Trading Rules */}
            {(strategy.rules && strategy.rules.length > 0) && (
              <div className="mb-5">
                <h4 className="font-medium text-sm flex items-center mb-2">
                  <ListChecks className="h-4 w-4 mr-1.5" />
                  Trading Rules
                </h4>
                <ul className="pl-5 space-y-1">
                  {(strategy.rules || []).map(rule => (
                    <li key={rule.id} className="text-sm list-disc">
                      {rule.label}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Entry Conditions */}
            {(strategy.entryConditions && strategy.entryConditions.length > 0) && (
              <div className="mb-5">
                <h4 className="font-medium text-sm flex items-center mb-2">
                  <DoorOpen className="h-4 w-4 mr-1.5" />
                  Entry Conditions
                </h4>
                <ul className="pl-5 space-y-1">
                  {(strategy.entryConditions || []).map(condition => (
                    <li key={condition.id} className="text-sm list-disc">
                      {condition.label}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Exit Conditions */}
            {(strategy.exitConditions && strategy.exitConditions.length > 0) && (
              <div className="mb-5">
                <h4 className="font-medium text-sm flex items-center mb-2">
                  <LogOut className="h-4 w-4 mr-1.5" />
                  Exit Conditions
                </h4>
                <ul className="pl-5 space-y-1">
                  {(strategy.exitConditions || []).map(condition => (
                    <li key={condition.id} className="text-sm list-disc">
                      {condition.label}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Timeframes */}
            {(strategy.timeframes && strategy.timeframes.length > 0) && (
              <div className="mb-3">
                <h4 className="font-medium text-sm flex items-center mb-1.5">
                  <Clock className="h-4 w-4 mr-1.5" />
                  Timeframes
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {(strategy.timeframes || []).sort().map(tf => (
                    <Badge key={tf} variant="secondary" className="text-xs">
                      {tf}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {/* Actions */}
            <div className="flex justify-end space-x-2 pt-3 border-t">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={onDelete}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Delete
              </Button>
              {!strategy.isDefault && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={onSetAsDefault}
                >
                  <Bookmark className="h-3.5 w-3.5 mr-1" />
                  Set Default
                </Button>
              )}
              <Button
                variant="secondary"
                size="sm"
                className="h-7 text-xs"
                onClick={onEdit}
              >
                <Edit className="h-3.5 w-3.5 mr-1" />
                Edit
              </Button>
            </div>
          </div>
        )}
      </AccordionContent>
    </AccordionItem>
  );
});

export function StrategiesManagement() {
  // Define local interfaces for rule and condition checks
  interface ConditionCheck {
    conditionId: string;
    checked: boolean;
    passed: boolean;
    notes?: string;
  }
  
  // State for the list of strategies
  const [strategies, setStrategies] = useState<TradingStrategy[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State for editing a strategy
  const [editMode, setEditMode] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  // Get current user ID
  const userId = auth.currentUser?.uid;
  
  // State for new strategy form
  const [newStrategy, setNewStrategy] = useState<TradingStrategy>({
    id: uuidv4(),
    name: "",
    description: "",
    rules: [],
    entryConditions: [],
    exitConditions: [],
    timeframes: [],
    isDefault: false,
  });
  
  // Popup dialog for new strategy
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Helper state for form fields
  const [newRule, setNewRule] = useState("");
  const [newEntryCondition, setNewEntryCondition] = useState("");
  const [newExitCondition, setNewExitCondition] = useState("");
  const [newTimeframe, setNewTimeframe] = useState("");
  
  // Toast notifications
  const { toast } = useToast();
  
  // useEffect hook for loading strategies
  useEffect(() => {
    let isMounted = true;
    
    async function loadStrategies() {
      if (!userId) {
        setLoading(false);
        return;
      }
      
      try {
        const strategies = await getStrategies(userId);
        
        if (isMounted) {
          // Fix any issues with multiple default strategies
          const fixedStrategies = await fixMultipleDefaultStrategies(strategies);
          setStrategies(fixedStrategies);
          setLoading(false);
        }
      } catch (error) {
        console.error("Error loading strategies:", error);
        if (isMounted) {
          toast({
            title: "Error loading strategies",
            description: "There was a problem loading your trading strategies. Please try again.",
            variant: "destructive",
          });
          setLoading(false);
        }
      }
    }
    
    loadStrategies();
    
    // Cleanup
    return () => {
      isMounted = false;
    };
  }, [userId, toast]);
  
  // Function to handle editing a strategy
  const handleEditStrategy = (strategyId: string) => {
    if (editMode === strategyId) {
      setEditMode(null);
    } else {
      setEditMode(strategyId);
    }
  };
  
  // Reset form fields
  const resetFormFields = () => {
    setNewRule("");
    setNewEntryCondition("");
    setNewExitCondition("");
    setNewTimeframe("");
  };
  
  // Function to update a strategy
  const handleUpdateStrategy = async (strategy: TradingStrategy) => {
    if (!userId) return;
    
    setIsSaving(true);
    
    try {
      // Check if this strategy is being set as default
      if (strategy.isDefault) {
        // Update all other strategies to not be default
        for (const s of strategies) {
          if (s.id !== strategy.id && s.isDefault) {
            await updateStrategy(userId, s.id, {
              ...s,
              isDefault: false,
            });
          }
        }
      }
      
      // Update strategy with timestamp
      await updateStrategy(userId, strategy.id, {
        ...strategy,
        updatedAt: Timestamp.now(),
      });
      
      // Optimistic update in UI
      setStrategies(prev => 
        prev.map(s => {
          if (s.id === strategy.id) {
            return { ...strategy, updatedAt: Timestamp.now() };
          }
          // If this strategy is now default, make sure others are not
          if (strategy.isDefault && s.isDefault && s.id !== strategy.id) {
            return { ...s, isDefault: false };
          }
          return s;
        })
      );
      
      // Close edit mode
      setEditMode(null);
      
      toast({
        title: "Strategy updated",
        description: "Your trading strategy has been updated successfully.",
      });
    } catch (error) {
      console.error("Error updating strategy:", error);
      toast({
        title: "Error updating strategy",
        description: "There was a problem updating your strategy. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Function to delete a strategy
  const handleDeleteStrategy = async (strategyId: string) => {
    if (!userId) return;
    
    const confirmed = window.confirm(
      "Are you sure you want to delete this strategy? This action cannot be undone."
    );
    
    if (!confirmed) return;
    
    try {
      await deleteStrategy(userId, strategyId);
      
      // Remove from local state
      setStrategies(prev => prev.filter(s => s.id !== strategyId));
      
      toast({
        title: "Strategy deleted",
        description: "Your trading strategy has been deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting strategy:", error);
      toast({
        title: "Error deleting strategy",
        description: "There was a problem deleting your strategy. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Function to set a strategy as default
  const handleSetAsDefault = async (strategyId: string) => {
    if (!userId) return;
    
    try {
      // Update all strategies, setting only the selected one as default
      const strategiesUpdates = strategies.map(s => {
        const isNowDefault = s.id === strategyId;
        
        // If the strategy status is changing, update in database
        if (s.isDefault !== isNowDefault) {
          updateStrategy(userId, s.id, {
            ...s,
            isDefault: isNowDefault,
          }).catch(console.error);
        }
        
        // Return updated strategy for local state
        return {
          ...s,
          isDefault: isNowDefault
        };
      });
      
      // Update local state
      setStrategies(strategiesUpdates);
      
      toast({
        title: "Default strategy set",
        description: "Your default trading strategy has been updated.",
      });
    } catch (error) {
      console.error("Error setting default strategy:", error);
      toast({
        title: "Error setting default strategy",
        description: "There was a problem updating your default strategy. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Function to create a new strategy
  const handleCreateStrategy = async () => {
    if (!userId) return;
    
    // Validate required fields
    if (!newStrategy.name.trim()) {
      toast({
        title: "Missing required fields",
        description: "Please provide a name for your trading strategy.",
        variant: "destructive",
      });
      return;
    }
    
    setIsCreating(true);
    
    try {
      // Check if this strategy is being set as default
      const existingDefault = strategies.find(s => s.isDefault);
      
      if (newStrategy.isDefault && existingDefault) {
        // Update existing default strategy
        await updateStrategy(userId, existingDefault.id, {
          ...existingDefault,
          isDefault: false,
        });
      }
      
      // Add new strategy to database
      const strategyId = await addStrategy(userId, {
        ...newStrategy,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      
      // Add to local state
      const createdStrategy = {
        ...newStrategy,
        id: strategyId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      
      // Update other strategies if this is default
      if (newStrategy.isDefault) {
        setStrategies(prev => 
          prev.map(s => ({
            ...s,
            isDefault: false
          })).concat([createdStrategy])
        );
      } else {
        setStrategies(prev => [...prev, createdStrategy]);
      }
      
      // Reset form and close dialog
      setNewStrategy({
        id: uuidv4(),
        name: "",
        description: "",
        rules: [],
        entryConditions: [],
        exitConditions: [],
        timeframes: [],
        isDefault: false,
      });
      resetFormFields();
      setIsDialogOpen(false);
      
      toast({
        title: "Strategy created",
        description: "Your new trading strategy has been created successfully.",
      });
    } catch (error) {
      console.error("Error creating strategy:", error);
      toast({
        title: "Error creating strategy",
        description: "There was a problem creating your strategy. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };
  
  // Function to handle editing a field of the strategy being edited
  const handleEditFieldChange = (strategyId: string, fieldName: string, value: any) => {
    setStrategies(prev =>
      prev.map(s => {
        if (s.id === strategyId) {
          return { ...s, [fieldName]: value };
        }
        return s;
      })
    );
  };
  
  // Render strategies list - optimized with useMemo
  const renderStrategyList = useMemoWithPerf(() => {
    if (strategies.length === 0) {
      return (
        <div className="text-center py-6 border rounded-lg bg-background">
          <div className="flex flex-col items-center justify-center space-y-3">
            <BookCopy className="h-10 w-10 text-muted-foreground/40" />
            <div className="space-y-1">
              <h3 className="text-lg font-medium">No strategies yet</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Create your first trading strategy to organize your trading approach.
              </p>
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <Accordion
        type="multiple"
        defaultValue={strategies.length === 1 ? [strategies[0].id] : []}
        className="space-y-3"
      >
        {strategies.map(strategy => (
          <StrategyItem
            key={strategy.id}
            strategy={strategy}
            isEditMode={editMode === strategy.id}
            onEdit={() => handleEditStrategy(strategy.id)}
            onUpdate={handleUpdateStrategy}
            onDelete={() => handleDeleteStrategy(strategy.id)}
            onSetAsDefault={() => handleSetAsDefault(strategy.id)}
            isSaving={isSaving}
            onEditFieldChange={(fieldName, value) => 
              handleEditFieldChange(strategy.id, fieldName, value)
            }
            newRule={newRule}
            newEntryCondition={newEntryCondition}
            newExitCondition={newExitCondition}
            newTimeframe={newTimeframe}
            resetFormFields={resetFormFields}
          />
        ))}
      </Accordion>
    );
  }, [strategies, editMode, isSaving, newRule, newEntryCondition, newExitCondition, newTimeframe]);
  
  // Show loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-medium">Trading Strategies</h3>
        </div>
      </div>
      
      {/* Render strategies list using memoized function */}
      {renderStrategyList}
      
      {/* Add New Strategy Button at the bottom */}
      <div className="flex justify-center mt-6">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Strategy
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] md:max-w-[800px] lg:max-w-[900px] overflow-y-auto max-h-[85vh]" variant="form">
            <DialogHeader className="mb-2">
              <DialogTitle className="text-lg font-semibold">Create new trading strategy</DialogTitle>
              <DialogDescription className="text-sm">
                Define a new trading strategy with clear rules and conditions
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-3 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-sm font-medium">Strategy Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Breakout Trading"
                  value={newStrategy.name}
                  onChange={(e) => {
                    // Tạo bản sao mới để tránh tham chiếu đối tượng gốc
                    const value = e.target.value;
                    setNewStrategy({...newStrategy, name: value});
                  }}
                  className="h-9"
                />
              </div>
              
              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your trading strategy..."
                  rows={2}
                  value={newStrategy.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                    const value = e.target.value;
                    setNewStrategy({...newStrategy, description: value});
                  }}
                  className="min-h-[60px] text-sm"
                />
              </div>
              
              {/* Trading Rules */}
              <div className="mt-6">
                <StrategyConditionList
                  title="Trading Rules"
                  icon={<ListChecks className="h-4 w-4 mr-1" />}
                  emptyMessage="No rules defined yet. Click 'Add' to create your first trading rule."
                  conditions={newStrategy.rules || []}
                  onAdd={(condition) => setNewStrategy({
                    ...newStrategy,
                    rules: addConditionToArray(newStrategy.rules || [], condition)
                  })}
                  onUpdate={(id, updates) => {
                    const updatedRules = (newStrategy.rules || []).map(rule => 
                      rule.id === id ? { ...rule, ...updates } : rule
                    );
                    setNewStrategy({ ...newStrategy, rules: updatedRules });
                  }}
                  onDelete={(id) => {
                    setNewStrategy({
                      ...newStrategy,
                      rules: (newStrategy.rules || []).filter(rule => rule.id !== id)
                    });
                  }}
                />
              </div>
              
              {/* Entry Conditions */}
              <div className="mt-6">
                <StrategyConditionList
                  title="Entry Conditions"
                  icon={<DoorOpen className="h-4 w-4 mr-1" />}
                  emptyMessage="No entry conditions defined yet. Click 'Add' to create your first entry condition."
                  conditions={newStrategy.entryConditions || []}
                  onAdd={(condition) => setNewStrategy({
                    ...newStrategy,
                    entryConditions: addConditionToArray(newStrategy.entryConditions || [], condition)
                  })}
                  onUpdate={(id, updates) => {
                    const updatedConditions = (newStrategy.entryConditions || []).map(condition => 
                      condition.id === id ? { ...condition, ...updates } : condition
                    );
                    setNewStrategy({ ...newStrategy, entryConditions: updatedConditions });
                  }}
                  onDelete={(id) => {
                    setNewStrategy({
                      ...newStrategy,
                      entryConditions: (newStrategy.entryConditions || []).filter(condition => condition.id !== id)
                    });
                  }}
                />
              </div>
              
              {/* Exit Conditions */}
              <div className="mt-6">
                <StrategyConditionList
                  title="Exit Conditions"
                  icon={<LogOut className="h-4 w-4 mr-1" />}
                  emptyMessage="No exit conditions defined yet. Click 'Add' to create your first exit condition."
                  conditions={newStrategy.exitConditions || []}
                  onAdd={(condition) => setNewStrategy({
                    ...newStrategy,
                    exitConditions: addConditionToArray(newStrategy.exitConditions || [], condition)
                  })}
                  onUpdate={(id, updates) => {
                    const updatedConditions = (newStrategy.exitConditions || []).map(condition => 
                      condition.id === id ? { ...condition, ...updates } : condition
                    );
                    setNewStrategy({ ...newStrategy, exitConditions: updatedConditions });
                  }}
                  onDelete={(id) => {
                    setNewStrategy({
                      ...newStrategy,
                      exitConditions: (newStrategy.exitConditions || []).filter(condition => condition.id !== id)
                    });
                  }}
                />
              </div>
              
              <div className="pt-1">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isDefault"
                    checked={newStrategy.isDefault || false}
                    onCheckedChange={(checked) => setNewStrategy({...newStrategy, isDefault: checked === true})}
                  />
                  <Label htmlFor="isDefault" className="text-sm font-medium cursor-pointer">
                    <div className="flex items-center">
                      <Bookmark className="h-3.5 w-3.5 mr-1.5" />
                      Set as default strategy
                    </div>
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground mt-1 ml-6">
                  Default strategy will be pre-selected when creating a new trade
                </p>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 sticky bottom-0 bg-background py-3 border-t -mb-3 sm:-mb-4 mt-1 px-0 sm:px-0">
              <DialogClose asChild>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    // Reset new strategy form when canceling
                    setNewStrategy({
                      id: uuidv4(),
                      name: "",
                      description: "",
                      rules: [],
                      entryConditions: [],
                      exitConditions: [],
                      timeframes: [],
                      isDefault: false,
                    });
                  }}
                  className="h-8 text-sm"
                >
                  Cancel
                </Button>
              </DialogClose>
              <Button 
                onClick={handleCreateStrategy} 
                disabled={isCreating}
                className="h-8 text-sm"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    Create Strategy
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}