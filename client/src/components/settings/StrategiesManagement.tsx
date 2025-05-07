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
            
            {/* Action buttons */}
            <div className="pt-2 flex justify-end space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  onEdit(); // Exit edit mode
                  resetFormFields(); // Clear any temporary form state
                }}
                className="h-8"
              >
                <X className="h-3.5 w-3.5 mr-1.5" />
                Cancel
              </Button>
              <Button 
                size="sm"
                className="h-8"
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
            {/* Description */}
            {strategy.description && (
              <div className="text-sm text-muted-foreground">
                {strategy.description}
              </div>
            )}
            
            {/* Timeframes Badge List - Only show if there are timeframes */}
            {(strategy.timeframes || []).length > 0 && (
              <div className="space-y-1.5">
                <h4 className="text-xs font-medium flex items-center">
                  <Clock className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                  Timeframes
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {(strategy.timeframes || []).sort().map(tf => (
                    <Badge 
                      key={tf} 
                      variant="secondary"
                      className="px-1.5 py-0 text-xs h-5"
                    >
                      {tf}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {/* Trading Rules */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-medium flex items-center">
                <ListChecks className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                Trading Rules {strategy.rules && strategy.rules.length > 0 && (
                  <span className="text-[11px] ml-1.5 text-muted-foreground">
                    ({strategy.rules.length})
                  </span>
                )}
              </h4>
              {(!strategy.rules || strategy.rules.length === 0) ? (
                <div className="text-xs text-muted-foreground py-1">
                  No trading rules defined
                </div>
              ) : (
                <div className="space-y-0.5">
                  {strategy.rules.map((rule, index) => (
                    <div key={rule.id} className="pl-1 py-0.5 text-sm flex items-center">
                      <span className="flex-shrink-0 h-1.5 w-1.5 rounded-full bg-primary/70 mr-2"></span>
                      <span>{rule.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Entry Conditions */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-medium flex items-center">
                <DoorOpen className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                Entry Conditions {strategy.entryConditions && strategy.entryConditions.length > 0 && (
                  <span className="text-[11px] ml-1.5 text-muted-foreground">
                    ({strategy.entryConditions.length})
                  </span>
                )}
              </h4>
              {(!strategy.entryConditions || strategy.entryConditions.length === 0) ? (
                <div className="text-xs text-muted-foreground py-1">
                  No entry conditions defined
                </div>
              ) : (
                <div className="space-y-0.5">
                  {strategy.entryConditions.map((condition, index) => (
                    <div key={condition.id} className="pl-1 py-0.5 text-sm flex items-center">
                      <span className="flex-shrink-0 h-1.5 w-1.5 rounded-full bg-blue-500/70 mr-2"></span>
                      <span>{condition.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Exit Conditions */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-medium flex items-center">
                <LogOut className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                Exit Conditions {strategy.exitConditions && strategy.exitConditions.length > 0 && (
                  <span className="text-[11px] ml-1.5 text-muted-foreground">
                    ({strategy.exitConditions.length})
                  </span>
                )}
              </h4>
              {(!strategy.exitConditions || strategy.exitConditions.length === 0) ? (
                <div className="text-xs text-muted-foreground py-1">
                  No exit conditions defined
                </div>
              ) : (
                <div className="space-y-0.5">
                  {strategy.exitConditions.map((condition, index) => (
                    <div key={condition.id} className="pl-1 py-0.5 text-sm flex items-center">
                      <span className="flex-shrink-0 h-1.5 w-1.5 rounded-full bg-red-500/70 mr-2"></span>
                      <span>{condition.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Action buttons */}
            <div className="pt-1.5 flex justify-between">
              <div>
                {/* Only show "Set as default" button if not already default */}
                {!strategy.isDefault && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={onSetAsDefault}
                    className="h-8 text-xs"
                    disabled={isSaving}
                  >
                    <Bookmark className="h-3.5 w-3.5 mr-1.5 opacity-70" />
                    Set as Default
                  </Button>
                )}
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={onDelete}
                  className="h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20"
                  disabled={isSaving}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1.5 opacity-70" />
                  Delete
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={onEdit}
                  className="h-8 text-xs"
                  disabled={isSaving}
                >
                  <Edit className="h-3.5 w-3.5 mr-1.5 opacity-70" />
                  Edit
                </Button>
              </div>
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
  
  // State for dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // State for managing ephemeral values - avoid uncontrolled inputs
  const [newRule, setNewRule] = useState("");
  const [newEntryCondition, setNewEntryCondition] = useState("");
  const [newExitCondition, setNewExitCondition] = useState("");
  const [newTimeframe, setNewTimeframe] = useState("");
  
  // Initialize the toast hook
  const toast = useToast().toast;
  
  // Reset all form fields
  const resetFormFields = useCallback(() => {
    setNewRule("");
    setNewEntryCondition("");
    setNewExitCondition("");
    setNewTimeframe("");
  }, [setNewRule, setNewEntryCondition, setNewExitCondition, setNewTimeframe]);
  
  // State for a new strategy
  const [newStrategy, setNewStrategy] = useState<Omit<TradingStrategy, 'userId' | 'timeframes' | 'createdAt' | 'updatedAt'> & { timeframes?: string[] }>({
    id: uuidv4(),
    name: "",
    description: "",
    rules: [],
    entryConditions: [],
    exitConditions: [],
    timeframes: [],
    isDefault: false,
  });
  
  // Load strategies from Firebase
  useEffect(() => {
    let isMounted = true;
    
    const loadStrategies = async () => {
      if (!auth.currentUser) return;
      
      try {
        const userId = auth.currentUser.uid;
        const strategiesData = await getStrategies(userId);
        
        // Fix multiple default strategies if needed
        const correctedStrategies = await fixMultipleDefaultStrategies(strategiesData);
        
        if (isMounted) {
          setStrategies(correctedStrategies);
          setLoading(false);
        }
      } catch (error) {
        console.error("Error loading strategies:", error);
        if (isMounted) {
          setLoading(false);
          toast({
            title: "Error loading strategies",
            description: "Could not load your trading strategies. Please try refreshing the page.",
            variant: "destructive"
          });
        }
      }
    };
    
    loadStrategies();
    
    return () => {
      isMounted = false;
    };
  }, [toast]);
  
  // Handler for updating fields of a strategy in edit mode
  const handleStrategyFieldChange = useCallback((strategyId: string, fieldName: string, value: any) => {
    // Đơn giản hóa tối đa: Cập nhật trực tiếp vào state với giá trị mới
    // Không xử lý đặc biệt, chỉ áp dụng giá trị mới vào đối tượng
    setStrategies(prevStrategies => 
      prevStrategies.map(strategy => 
        strategy.id === strategyId 
          ? { ...strategy, [fieldName]: value }
          : strategy
      )
    );
  }, []);
  
  // Handler for updating a strategy
  const handleUpdateStrategy = useCallback(async (strategy: TradingStrategy) => {
    if (!auth.currentUser) return;
    
    setIsSaving(true);
    
    try {
      const userId = auth.currentUser.uid;
      
      // First, check if this strategy is being set as default
      if (strategy.isDefault) {
        // Update all other strategies to be non-default
        const updates = strategies
          .filter(s => s.id !== strategy.id && s.isDefault)
          .map(s => updateStrategy(userId, s.id, {
            ...s,
            isDefault: false,
            updatedAt: Timestamp.now()
          }));
        
        // Wait for all updates to complete
        if (updates.length > 0) {
          await Promise.all(updates);
        }
      }
      
      // Now update this strategy
      const updatedStrategy = {
        ...strategy,
        updatedAt: Timestamp.now()
      };
      
      await updateStrategy(userId, strategy.id, updatedStrategy);
      
      // Exit edit mode
      setEditMode(null);
      
      // Reset form fields
      resetFormFields();
      
      toast({
        title: "Strategy updated",
        description: `${strategy.name} has been updated successfully`,
      });
    } catch (error) {
      console.error("Error updating strategy:", error);
      toast({
        title: "Error updating strategy",
        description: "Could not update your strategy. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  }, [strategies, toast, resetFormFields]);
  
  // Handler for deleting a strategy
  const handleDeleteStrategy = useCallback(async (id: string, name: string) => {
    if (!auth.currentUser) return;
    
    setIsSaving(true);
    
    try {
      const userId = auth.currentUser.uid;
      
      await deleteStrategy(userId, id);
      
      setStrategies(prevStrategies => 
        prevStrategies.filter(strategy => strategy.id !== id)  
      );
      
      toast({
        title: "Strategy deleted",
        description: `${name} has been deleted`,
      });
    } catch (error) {
      console.error("Error deleting strategy:", error);
      toast({
        title: "Error deleting strategy",
        description: "Could not delete your strategy. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  }, [toast]);
  
  // Handler for setting a strategy as default
  const handleSetDefaultStrategy = useCallback(async (strategy: TradingStrategy) => {
    if (!auth.currentUser) return;
    
    try {
      setIsSaving(true);
      
      // Update all other strategies to be non-default
      const updatedStrategies = strategies.map(s => {
        if (s.id === strategy.id) {
          return { ...s, isDefault: true };
        }
        return { ...s, isDefault: false };
      });
      
      setStrategies(updatedStrategies);
      
      // Update in database
      const userId = auth.currentUser.uid;
      
      // Run updates in parallel
      await Promise.all([
        // Set this strategy as default
        updateStrategy(userId, strategy.id, {
          ...strategy,
          isDefault: true,
          updatedAt: Timestamp.now()
        }),
        // Make all other strategies non-default
        ...strategies
          .filter(s => s.id !== strategy.id && s.isDefault)
          .map(s => updateStrategy(userId, s.id, {
            ...s,
            isDefault: false,
            updatedAt: Timestamp.now()
          }))
      ]);
      
      toast({
        title: "Default strategy updated",
        description: `${strategy.name} is now your default strategy`,
      });
    } catch (error) {
      console.error("Error setting default strategy:", error);
      toast({
        title: "Error",
        description: "Could not set default strategy. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  }, [strategies, toast]);
  
  // Handler for creating a new strategy
  const handleCreateStrategy = useCallback(async () => {
    if (!auth.currentUser || !newStrategy.name.trim()) return;
    
    setIsCreating(true);
    
    try {
      const userId = auth.currentUser.uid;
      
      // If this will be the default strategy, update all others first
      if (newStrategy.isDefault && strategies.some(s => s.isDefault)) {
        const updates = strategies
          .filter(s => s.isDefault)
          .map(s => updateStrategy(userId, s.id, {
            ...s,
            isDefault: false,
            updatedAt: Timestamp.now()
          }));
        
        // Wait for all updates to complete
        if (updates.length > 0) {
          await Promise.all(updates);
        }
      }
      
      // Now add the new strategy
      const strategyWithTimestamps = {
        ...newStrategy,
        userId,
        timeframes: newStrategy.timeframes || [],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
      
      const newStrategyId = await addStrategy(userId, strategyWithTimestamps);
      
      // Add to local state with the new ID
      const newStrategyDocId = typeof newStrategyId === 'object' && newStrategyId ? 
        (newStrategyId.id || '') : 
        (typeof newStrategyId === 'string' ? newStrategyId : '');
      
      setStrategies(prevStrategies => [
        ...prevStrategies,
        { 
          ...strategyWithTimestamps, 
          id: newStrategyDocId
        } as TradingStrategy
      ]);
      
      // Reset form
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
      
      // Close dialog
      setIsDialogOpen(false);
      
      toast({
        title: "Strategy created",
        description: `${newStrategy.name} has been created successfully`,
      });
    } catch (error) {
      console.error("Error creating strategy:", error);
      toast({
        title: "Error creating strategy",
        description: "Could not create your strategy. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  }, [newStrategy, strategies, toast]);
  
  // Memoized strategy list renderer function
  const renderStrategyList = useMemoWithPerf(() => {
    if (strategies.length === 0) {
      return (
        <Card className="p-8">
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <BookCopy className="h-12 w-12 mb-4 text-muted-foreground" />
            <h3 className="font-medium text-xl">No strategies yet</h3>
            <p className="text-muted-foreground max-w-md mt-1 mb-4">
              Create your first trading strategy to improve consistency and track performance
            </p>
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="flex items-center space-x-2"
            >
              <Plus size={16} />
              <span>Create Your First Strategy</span>
            </Button>
          </div>
        </Card>
      );
    }
    
    return (
      <Accordion type="single" collapsible className="space-y-2">
        {strategies.map((strategy) => {
          // Handler function for each strategy's field changes 
          // Đơn giản hóa tối đa: chỉ là hàm trung gian gọi hàm khác
          const handleEditFieldChange = (fieldName: string, value: any) => {
            handleStrategyFieldChange(strategy.id, fieldName, value);
          };
          
          return (
            <StrategyItem
              key={strategy.id}
              strategy={strategy}
              isEditMode={editMode === strategy.id}
              isSaving={isSaving}
              onEdit={() => setEditMode(editMode === strategy.id ? null : strategy.id)}
              onUpdate={handleUpdateStrategy}
              onDelete={() => {
                if (confirm(`Are you sure you want to delete "${strategy.name}" strategy?`)) {
                  handleDeleteStrategy(strategy.id, strategy.name);
                }
              }}
              onSetAsDefault={() => handleSetDefaultStrategy(strategy)}
              onEditFieldChange={handleEditFieldChange}
              newRule={newRule}
              newEntryCondition={newEntryCondition}
              newExitCondition={newExitCondition}
              newTimeframe={newTimeframe}
              resetFormFields={resetFormFields}
            />
          );
        })}
      </Accordion>
    );
  }, [strategies, editMode, isSaving, handleUpdateStrategy, handleDeleteStrategy, 
      handleStrategyFieldChange, handleSetDefaultStrategy, newRule, newEntryCondition, 
      newExitCondition, newTimeframe, resetFormFields, setEditMode]);
  
  // Render loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
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
