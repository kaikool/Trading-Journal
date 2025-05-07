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
            <div className="flex justify-end gap-2 mt-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={resetFormFields}
              >
                <X className="h-3.5 w-3.5 mr-1.5" />
                Cancel
              </Button>
              <Button 
                size="sm" 
                onClick={() => onUpdate(strategy)}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5 mr-1.5" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {strategy.description && (
              <div>
                <h3 className="text-sm font-medium mb-1">Description</h3>
                <p className="text-sm text-muted-foreground">{strategy.description}</p>
              </div>
            )}
            
            {strategy.rules && strategy.rules.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-1.5 flex items-center">
                  <ListChecks className="h-4 w-4 mr-1.5" />
                  Trading Rules
                </h3>
                <ul className="space-y-1">
                  {strategy.rules.map((rule) => (
                    <li key={rule.id} className="text-sm flex items-baseline gap-1.5">
                      <span className="text-primary">•</span>
                      <span>{rule.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {strategy.entryConditions && strategy.entryConditions.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-1.5 flex items-center">
                  <DoorOpen className="h-4 w-4 mr-1.5" />
                  Entry Conditions
                </h3>
                <ul className="space-y-1">
                  {strategy.entryConditions.map((condition) => (
                    <li key={condition.id} className="text-sm flex items-baseline gap-1.5">
                      <span className="text-primary">•</span>
                      <span>{condition.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {strategy.exitConditions && strategy.exitConditions.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-1.5 flex items-center">
                  <LogOut className="h-4 w-4 mr-1.5" />
                  Exit Conditions
                </h3>
                <ul className="space-y-1">
                  {strategy.exitConditions.map((condition) => (
                    <li key={condition.id} className="text-sm flex items-baseline gap-1.5">
                      <span className="text-primary">•</span>
                      <span>{condition.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {strategy.timeframes && strategy.timeframes.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-1.5 flex items-center">
                  <Clock className="h-4 w-4 mr-1.5" />
                  Timeframes
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {strategy.timeframes.sort().map(tf => (
                    <Badge key={tf} variant="secondary" className="text-xs">
                      {tf}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex justify-end gap-2 pt-1">
              {!strategy.isDefault && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onSetAsDefault}
                  disabled={isSaving}
                >
                  <Bookmark className="h-3.5 w-3.5 mr-1.5" />
                  Set as Default
                </Button>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onEdit}
              >
                <Edit className="h-3.5 w-3.5 mr-1.5" />
                Edit
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={onDelete}
                disabled={isSaving}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                Delete
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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  // Alert messages
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // State for tracking which strategy is being edited
  const [editStrategyId, setEditStrategyId] = useState<string | null>(null);
  const [editedStrategy, setEditedStrategy] = useState<TradingStrategy | null>(null);
  
  // State for tracking new rule inputs
  const [newRule, setNewRule] = useState("");
  const [newEntryCondition, setNewEntryCondition] = useState("");
  const [newExitCondition, setNewExitCondition] = useState("");
  const [newTimeframe, setNewTimeframe] = useState("");
  
  // State for new strategy creation
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
  
  const { toast } = useToast();
  
  // Reset the form fields
  const resetFormFields = useCallback(() => {
    setEditStrategyId(null);
    setEditedStrategy(null);
    setNewRule("");
    setNewEntryCondition("");
    setNewExitCondition("");
    setNewTimeframe("");
  }, []);
  
  // Load strategies on component mount
  useEffect(() => {
    const loadStrategies = async () => {
      if (!auth.currentUser) return;
      
      try {
        setIsLoading(true);
        const userId = auth.currentUser.uid;
        const userStrategies = await getStrategies(userId);
        
        // Correct if multiple strategies are marked as default
        const correctedStrategies = await fixMultipleDefaultStrategies(userStrategies);
        
        setStrategies(correctedStrategies);
      } catch (error) {
        console.error("Error loading strategies:", error);
        toast({
          title: "Error loading strategies",
          description: "Please try again or reload the page.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadStrategies();
    
    // Set up auth state change listener
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        loadStrategies();
      } else {
        setStrategies([]);
      }
    });
    
    return () => unsubscribe();
  }, [toast]);
  
  // Handle setting a strategy as default
  const handleSetDefaultStrategy = useCallback(async (strategy: TradingStrategy) => {
    if (!auth.currentUser || isSaving) return;
    
    try {
      setIsSaving(true);
      const userId = auth.currentUser.uid;
      
      // First, make sure no other strategy is set as default
      const promises = strategies
        .filter(s => s.isDefault && s.id !== strategy.id)
        .map(s => updateStrategy(userId, s.id, { ...s, isDefault: false, updatedAt: Timestamp.now() }));
      
      // Then set this strategy as default
      promises.push(updateStrategy(userId, strategy.id, { 
        ...strategy, 
        isDefault: true,
        updatedAt: Timestamp.now()
      }));
      
      await Promise.all(promises);
      
      // Update local state
      setStrategies(prev => prev.map(s => 
        s.id === strategy.id ? { ...s, isDefault: true } : { ...s, isDefault: false }
      ));
      
      toast({
        title: "Strategy set as default",
        description: `"${strategy.name}" will now be used as default strategy.`,
      });
    } catch (error) {
      console.error("Error setting default strategy:", error);
      toast({
        title: "Error setting default strategy",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }, [strategies, isSaving, toast]);
  
  // Handle updating a strategy
  const handleUpdateStrategy = useCallback(async (strategy: TradingStrategy) => {
    if (!auth.currentUser || isSaving) return;
    
    try {
      setIsSaving(true);
      const userId = auth.currentUser.uid;
      
      // Update with current timestamp
      const updatedStrategy = {
        ...strategy,
        updatedAt: Timestamp.now()
      };
      
      // Special handling for default flag
      if (updatedStrategy.isDefault) {
        // Remove default flag from other strategies
        const promises = strategies
          .filter(s => s.isDefault && s.id !== strategy.id)
          .map(s => updateStrategy(userId, s.id, { ...s, isDefault: false, updatedAt: Timestamp.now() }));
        
        await Promise.all(promises);
      }
      
      // Update this strategy
      await updateStrategy(userId, strategy.id, updatedStrategy);
      
      // Update local state
      setStrategies(prev => {
        const newStrategies = prev.map(s => {
          if (s.id === strategy.id) {
            return updatedStrategy;
          }
          if (updatedStrategy.isDefault && s.isDefault) {
            return { ...s, isDefault: false };
          }
          return s;
        });
        return newStrategies;
      });
      
      // Clear edit mode
      resetFormFields();
      
      toast({
        title: "Strategy updated",
        description: `"${strategy.name}" has been updated successfully.`,
      });
    } catch (error) {
      console.error("Error updating strategy:", error);
      toast({
        title: "Error updating strategy",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }, [strategies, isSaving, resetFormFields, toast]);
  
  // Handle deleting a strategy
  const handleDeleteStrategy = useCallback(async (strategy: TradingStrategy) => {
    if (!auth.currentUser || isSaving) return;
    
    if (!window.confirm(`Are you sure you want to delete the strategy "${strategy.name}"?`)) {
      return;
    }
    
    try {
      setIsSaving(true);
      const userId = auth.currentUser.uid;
      
      await deleteStrategy(userId, strategy.id);
      
      // Update local state
      setStrategies(prev => prev.filter(s => s.id !== strategy.id));
      
      toast({
        title: "Strategy deleted",
        description: `"${strategy.name}" has been deleted.`,
      });
    } catch (error) {
      console.error("Error deleting strategy:", error);
      toast({
        title: "Error deleting strategy",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, toast]);
  
  // Handle creating a new strategy
  const handleCreateStrategy = useCallback(async () => {
    if (!auth.currentUser || isCreating) return;
    
    try {
      setIsCreating(true);
      
      // Validate required fields
      if (!newStrategy.name.trim()) {
        toast({
          title: "Missing information",
          description: "Please enter a strategy name",
          variant: "destructive",
        });
        return;
      }
      
      const userId = auth.currentUser.uid;
      
      // Add creation timestamp
      const strategyWithTimestamp = {
        ...newStrategy,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      
      // If this is set as default, need to update other strategies
      if (strategyWithTimestamp.isDefault) {
        const promises = strategies
          .filter(s => s.isDefault)
          .map(s => updateStrategy(userId, s.id, { ...s, isDefault: false, updatedAt: Timestamp.now() }));
        
        await Promise.all(promises);
      }
      
      // Create the new strategy
      const newStrategyId = await addStrategy(userId, strategyWithTimestamp);
      
      // Update the strategy with its new ID from Firestore
      const completeStrategy = {
        ...strategyWithTimestamp,
        id: newStrategyId
      };
      
      // Update local state
      setStrategies(prev => {
        const updatedStrategies = completeStrategy.isDefault
          ? prev.map(s => ({ ...s, isDefault: false }))
          : [...prev];
        
        return [...updatedStrategies, completeStrategy];
      });
      
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
      
      setIsDialogOpen(false);
      
      toast({
        title: "Strategy created",
        description: `"${completeStrategy.name}" has been created successfully.`,
      });
    } catch (error) {
      console.error("Error creating strategy:", error);
      toast({
        title: "Error creating strategy",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  }, [newStrategy, strategies, isCreating, toast]);
  
  // Memoized render function for strategy list
  const renderStrategyList = useMemo(() => {
    if (isLoading) {
      return (
        <div className="flex justify-center py-8">
          <div className="flex flex-col items-center">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">Loading strategies...</p>
          </div>
        </div>
      );
    }
    
    if (strategies.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <BookCopy className="h-12 w-12 text-muted-foreground/20 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Trading Strategies Yet</h3>
          <p className="text-muted-foreground max-w-md mb-6">
            Create your first trading strategy to define rules and conditions for your trades.
          </p>
        </div>
      );
    }
    
    return (
      <Accordion type="single" collapsible className="space-y-3">
        {strategies.map((strategy) => (
          <StrategyItem
            key={strategy.id}
            strategy={editStrategyId === strategy.id ? { ...strategy, ...editedStrategy } : strategy}
            isEditMode={editStrategyId === strategy.id}
            onEdit={() => {
              setEditStrategyId(strategy.id);
              setEditedStrategy({ ...strategy });
            }}
            onUpdate={handleUpdateStrategy}
            onDelete={() => handleDeleteStrategy(strategy)}
            onSetAsDefault={() => handleSetDefaultStrategy(strategy)}
            isSaving={isSaving}
            // Pass props to avoid issues with closures
            editFieldValues={editedStrategy || {}}
            onEditFieldChange={(fieldName, value) => {
              setEditedStrategy(prev => ({ ...prev, [fieldName]: value }));
            }}
            newRule={newRule}
            newEntryCondition={newEntryCondition}
            newExitCondition={newExitCondition}
            newTimeframe={newTimeframe}
            resetFormFields={resetFormFields}
          />
        ))}
      </Accordion>
    );
  }, [
    isLoading, 
    strategies, 
    editStrategyId, 
    editedStrategy,
    isSaving,
    newRule,
    newEntryCondition,
    newExitCondition,
    newTimeframe,
    handleUpdateStrategy,
    handleDeleteStrategy,
    handleSetDefaultStrategy,
    resetFormFields
  ]);
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end mb-4">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="default" size="sm">
              <Plus className="h-4 w-4 mr-1.5" />
              Add Strategy
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
      
      {/* Render strategies list using memoized function */}
      {renderStrategyList}
    </div>
  );
}