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
  createNewCondition as createNewStrategyCondition
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
  console.log("[DEBUG] Adding condition to array:", { condition, currentArray: array });
  return [...array, { ...condition, label: condition.label.trim() }];
};

const updateConditionInArray = (array: StrategyCondition[], id: string, updates: Partial<StrategyCondition>): StrategyCondition[] => {
  return array.map(condition => 
    condition.id === id ? { ...condition, ...updates } : condition
  );
};

const removeConditionFromArray = (array: StrategyCondition[], id: string): StrategyCondition[] => {
  return array.filter(condition => condition.id !== id);
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
    return value as StrategyCondition;
  }
  
  // Create a new condition with default values
  const id = typeof value === 'object' && value.id ? value.id : uuidv4();
  const label = typeof value === 'string' ? value : 
                typeof value === 'object' && value.label ? value.label : 
                String(value || '');
  
  return {
    id,
    label,
    order: 0
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
            <div className="space-y-4">
              <div className="flex items-center mb-1">
                <ListChecks className="h-4 w-4 mr-2" />
                <h4 className="font-medium">Trading Rules</h4>
              </div>
              <StrategyConditionList
                title=""
                emptyMessage="No rules defined yet. Click 'Add' to create one."
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
                icon={<LineChart className="h-4 w-4" />}
              />
            </div>
              
            {/* Entry Conditions */}
            <div className="space-y-4 mt-5">
              <div className="flex items-center mb-1">
                <DoorOpen className="h-4 w-4 mr-2" />
                <h4 className="font-medium">Entry Conditions</h4>
              </div>
              <StrategyConditionList
                title=""
                emptyMessage="No entry conditions defined yet. Click 'Add' to create one."
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
                icon={<DoorOpen className="h-4 w-4" />}
              />
            </div>
              
            {/* Exit Conditions */}
            <div className="space-y-4 mt-5">
              <div className="flex items-center mb-1">
                <LogOut className="h-4 w-4 mr-2" />
                <h4 className="font-medium">Exit Conditions</h4>
              </div>
              <StrategyConditionList
                title=""
                emptyMessage="No exit conditions defined yet. Click 'Add' to create one."
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
                icon={<LogOut className="h-4 w-4" />}
              />
            </div>
            
            <div className="pt-1">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`isDefault-${strategy.id}`}
                  checked={strategy.isDefault || false}
                  onCheckedChange={(checked) => handleFieldChange('isDefault', checked === true)}
                />
                <Label htmlFor={`isDefault-${strategy.id}`} className="text-sm font-medium cursor-pointer">
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

            <div className="flex justify-between space-x-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  resetFormFields();
                  onEdit();
                }}
                className="h-8 text-sm px-3"
              >
                <X className="h-3.5 w-3.5 mr-1.5" />
                Cancel
              </Button>
              <Button 
                onClick={() => onUpdate(strategy)} 
                disabled={isSaving}
                className="h-8 text-sm px-3"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-1.5 h-3.5 w-3.5" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Description</h4>
              <p className="mt-1">{strategy.description}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {strategy.rules && strategy.rules.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center">
                    <ListChecks className="h-4 w-4 mr-1" />
                    Rules
                  </h4>
                  <ul className="space-y-1 pl-1">
                    {strategy.rules.map((rule, index) => (
                      <li key={index} className="text-sm flex items-start">
                        <span className="inline-block h-5 mr-2 text-muted-foreground">•</span>
                        {rule.label}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {strategy.entryConditions && strategy.entryConditions.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center">
                    <DoorOpen className="h-4 w-4 mr-1" />
                    Entry Conditions
                  </h4>
                  <ul className="space-y-1 pl-1">
                    {strategy.entryConditions.map((condition, index) => (
                      <li key={index} className="text-sm flex items-start">
                        <span className="inline-block h-5 mr-2 text-success">✓</span>
                        {condition.label}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-1.5">
              <div className="flex space-x-2">
                {!strategy.isDefault && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onSetAsDefault}
                    className="h-7 text-xs px-2"
                  >
                    <Bookmark className="h-3.5 w-3.5 mr-1.5" />
                    Set as Default
                  </Button>
                )}
              </div>
              
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs px-2"
                  onClick={onDelete}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                  Delete
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  className="h-7 text-xs px-2"
                  onClick={() => {
                    resetFormFields();
                    onEdit();
                  }}
                >
                  <Edit className="h-3.5 w-3.5 mr-1.5" />
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

// Memoized component to render the list of strategies
const StrategiesListRenderer = React.memo(function StrategiesListRenderer({
  strategies,
  editMode,
  isSaving,
  onSetEditMode,
  onUpdateStrategy,
  onDeleteStrategy,
  onSetDefaultStrategy,
  // Form state variables
  newRule,
  newEntryCondition,
  newExitCondition,
  newTimeframe,
  setNewRule,
  setNewEntryCondition,
  setNewExitCondition,
  setNewTimeframe
}: {
  strategies: TradingStrategy[];
  editMode: string | null;
  isSaving: boolean;
  onSetEditMode: (id: string | null) => void;
  onUpdateStrategy: (strategy: TradingStrategy) => void;
  onDeleteStrategy: (id: string, name: string) => void;
  onSetDefaultStrategy: (strategy: TradingStrategy) => void;
  // Form state variables
  newRule: string;
  newEntryCondition: string;
  newExitCondition: string;
  newTimeframe: string;
  setNewRule: (value: string) => void;
  setNewEntryCondition: (value: string) => void;
  setNewExitCondition: (value: string) => void;
  setNewTimeframe: (value: string) => void;
}) {
  const resetFormFields = useCallback(() => {
    setNewRule("");
    setNewEntryCondition("");
    setNewExitCondition("");
    setNewTimeframe("");
  }, [setNewRule, setNewEntryCondition, setNewExitCondition, setNewTimeframe]);

  return (
    <Accordion type="single" collapsible className="space-y-2">
      {strategies.map((strategy) => (
        <StrategyItem
          key={strategy.id}
          strategy={strategy}
          isEditMode={editMode === strategy.id}
          isSaving={isSaving}
          onEdit={() => onSetEditMode(strategy.id)}
          onUpdate={onUpdateStrategy}
          onDelete={() => {
            if (confirm(`Are you sure you want to delete "${strategy.name}" strategy?`)) {
              onDeleteStrategy(strategy.id, strategy.name);
            }
          }}
          onSetAsDefault={() => onSetDefaultStrategy(strategy)}
          newRule={newRule}
          newEntryCondition={newEntryCondition}
          newExitCondition={newExitCondition}
          newTimeframe={newTimeframe}
          resetFormFields={resetFormFields}
        />
      ))}
    </Accordion>
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
  
  interface RuleWithCheck {
    rule: StrategyCondition;
    check: ConditionCheck;
  }
  
  interface ConditionWithCheck {
    condition: StrategyCondition;
    check: ConditionCheck;
  }
  
  // Memoized array processing functions
  const handleAddRule = useCallback((rules: StrategyCondition[], newRule: StrategyCondition): StrategyCondition[] => {
    if (!newRule.label.trim()) return rules;
    return [...rules, newRule];
  }, []);
  
  const handleRemoveRule = useCallback((rules: StrategyCondition[], id: string): StrategyCondition[] => {
    return rules.filter(rule => rule.id !== id);
  }, []);
  
  const handleUpdateRule = useCallback((rules: StrategyCondition[], id: string, updates: Partial<StrategyCondition>): StrategyCondition[] => {
    return rules.map(rule => rule.id === id ? { ...rule, ...updates } : rule);
  }, []);
  
  // Memoized filter functions
  const filterRulesCompliance = useMemo(() => {
    return (rules: StrategyCondition[], checks: ConditionCheck[]): RuleWithCheck[] => {
      if (!rules || !checks) return [];
      return rules.map(rule => ({
        rule,
        check: checks.find(c => c.conditionId === rule.id) || {
          conditionId: rule.id,
          checked: false,
          passed: false
        }
      }));
    };
  }, []);
  
  const filterEntryCompliance = useMemo(() => {
    return (conditions: StrategyCondition[], checks: ConditionCheck[]): ConditionWithCheck[] => {
      if (!conditions || !checks) return [];
      return conditions.map(condition => ({
        condition,
        check: checks.find(c => c.conditionId === condition.id) || {
          conditionId: condition.id,
          checked: false,
          passed: false
        }
      }));
    };
  }, []);
  const [strategies, setStrategies] = useState<TradingStrategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editMode, setEditMode] = useState<string | null>(null);
  const { toast } = useToast();
  
  // New strategy form state
  const [newStrategy, setNewStrategy] = useState<Partial<TradingStrategy>>({
    name: "",
    description: "",
    rules: [] as StrategyCondition[],
    entryConditions: [] as StrategyCondition[],
    exitConditions: [] as StrategyCondition[],
    timeframes: [],
    rulesText: [],
    entryConditionsText: [],
    exitConditionsText: [],
    riskRewardRatio: 2,
    isDefault: false,
    notes: "",
  });
  
  // Temporary form fields
  const [newRule, setNewRule] = useState("");
  const [newEntryCondition, setNewEntryCondition] = useState("");
  const [newExitCondition, setNewExitCondition] = useState("");
  const [newTimeframe, setNewTimeframe] = useState("");
  
  // Load strategies on component mount
  useEffect(() => {
    const loadStrategies = async () => {
      try {
        if (!auth.currentUser) {
          setLoading(false);
          return;
        }
        
        const userId = auth.currentUser.uid;
        const userStrategies = await getStrategies(userId) as TradingStrategy[];
        
        // Check for multiple default strategies and fix if needed
        const defaultStrategies = userStrategies.filter(s => s.isDefault === true);
        
        if (defaultStrategies.length > 1) {
          console.log(`Found ${defaultStrategies.length} default strategies, fixing...`);
          const fixedStrategies = await fixMultipleDefaultStrategies(userStrategies);
          setStrategies(fixedStrategies);
        } else {
          setStrategies(userStrategies);
        }
      } catch (error) {
        console.error("Error loading strategies:", error);
        toast({
          title: "Error loading strategies",
          description: "Could not load your strategies. Please try again.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadStrategies();
  }, [toast]);

  // Handle creating a new strategy
  const handleCreateStrategy = async () => {
    try {
      if (!newStrategy.name?.trim()) {
        toast({
          title: "Strategy name is required",
          description: "Please provide a name for your strategy.",
          variant: "destructive"
        });
        return;
      }
      
      setIsCreating(true);
      
      if (!auth.currentUser) {
        toast({
          title: "Authentication error",
          description: "You must be logged in to create a strategy",
          variant: "destructive"
        });
        return;
      }
      
      const userId = auth.currentUser.uid;
      
      // If this is the first strategy, set it as default
      if (strategies.length === 0) {
        newStrategy.isDefault = true;
      }
      
      // If strategy is marked as default, unmark all other strategies
      if (newStrategy.isDefault) {
        const defaultOtherStrategies = strategies.filter(s => s.isDefault);
        
        // Update all other default strategies to non-default in parallel
        if (defaultOtherStrategies.length > 0) {
          const updatePromises = defaultOtherStrategies.map(otherStrategy => 
            updateStrategy(userId, otherStrategy.id, {
              ...otherStrategy,
              isDefault: false,
              updatedAt: Timestamp.now()
            })
          );
          await Promise.all(updatePromises);
        }
      }
      
      // Prepare strategy for saving
      const strategyData: TradingStrategy = {
        id: uuidv4(),
        userId: userId,
        name: newStrategy.name?.trim() || "Untitled Strategy",
        description: newStrategy.description || "",
        rules: newStrategy.rules as StrategyCondition[] || [],
        entryConditions: newStrategy.entryConditions as StrategyCondition[] || [],
        exitConditions: newStrategy.exitConditions as StrategyCondition[] || [],
        timeframes: newStrategy.timeframes || [],
        rulesText: (newStrategy.rules as StrategyCondition[])?.map(r => r.label) || [],
        entryConditionsText: (newStrategy.entryConditions as StrategyCondition[])?.map(c => c.label) || [],
        exitConditionsText: (newStrategy.exitConditions as StrategyCondition[])?.map(c => c.label) || [],
        riskRewardRatio: newStrategy.riskRewardRatio || 2,
        isDefault: newStrategy.isDefault || false,
        notes: newStrategy.notes || "",
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
      
      // Add strategy to database
      await addStrategy(userId, strategyData);
      
      // Add to local state
      setStrategies(prev => [...prev, strategyData]);
      
      // Reset form and close dialog
      setNewStrategy({
        name: "",
        description: "",
        rules: [] as StrategyCondition[],
        entryConditions: [] as StrategyCondition[],
        exitConditions: [] as StrategyCondition[],
        timeframes: [],
        rulesText: [],
        entryConditionsText: [],
        exitConditionsText: [],
        riskRewardRatio: 2,
        isDefault: false,
        notes: "",
      });
      
      setIsDialogOpen(false);
      
      toast({
        title: "Strategy created",
        description: `${strategyData.name} has been created successfully`,
        variant: "default"
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
  };
  
  // Memoized callback for handling strategy field changes
  const handleStrategyFieldChange = useCallback((strategyId: string, fieldName: string, value: any) => {
    setStrategies(prev => 
      prev.map(s => s.id === strategyId 
        ? { ...s, [fieldName]: value } 
        : s
      )
    );
  }, []);
  
  const handleUpdateStrategy = async (strategy: TradingStrategy) => {
    try {
      setIsSaving(true);
      
      if (!auth.currentUser) {
        toast({
          title: "Authentication error",
          description: "You must be logged in to update a strategy",
          variant: "destructive"
        });
        return;
      }
      
      const userId = auth.currentUser.uid;
      
      // If the strategy being updated is default, unmark all other strategies
      if (strategy.isDefault) {
        // Get ALL other strategies (including ones not loaded into state)
        const allStrategies = await getStrategies(userId) as TradingStrategy[];
        const defaultOtherStrategies = allStrategies.filter(s => s.id !== strategy.id && s.isDefault);
        
        // Update all other default strategies to non-default in parallel
        if (defaultOtherStrategies.length > 0) {
          const updatePromises = defaultOtherStrategies.map(otherStrategy => 
            updateStrategy(userId, otherStrategy.id, {
              ...otherStrategy,
              isDefault: false,
              updatedAt: Timestamp.now()
            })
          );
          await Promise.all(updatePromises);
        }
      }
      
      // Create rulesText, entryConditionsText, exitConditionsText arrays from the condition objects
      const rulesText = (strategy.rules || []).map(rule => rule.label).filter(Boolean);
      const entryConditionsText = (strategy.entryConditions || []).map(condition => condition.label).filter(Boolean);
      const exitConditionsText = (strategy.exitConditions || []).map(condition => condition.label).filter(Boolean);
      
      console.log("[DEBUG] Updating strategy with conditions:", {
        rules: strategy.rules || [],
        entryConditions: strategy.entryConditions || [],
        exitConditions: strategy.exitConditions || []
      });
      
      // Ensure all strategy conditions are properly formatted before saving
      const formattedStrategy = {
        ...strategy,
        rules: strategy.rules?.map(rule => ensureConditionFormat(rule)) || [],
        entryConditions: strategy.entryConditions?.map(condition => ensureConditionFormat(condition)) || [],
        exitConditions: strategy.exitConditions?.map(condition => ensureConditionFormat(condition)) || [],
        rulesText,
        entryConditionsText,
        exitConditionsText,
        updatedAt: Timestamp.now()
      };
      
      // Update current strategy with properly formatted data
      await updateStrategy(userId, strategy.id, formattedStrategy);
      
      // Reload strategy list from database to ensure state matches database
      const updatedStrategies = await getStrategies(userId) as TradingStrategy[];
      setStrategies(updatedStrategies);
      
      // Check to ensure only one default strategy exists
      const defaultStrategiesAfterUpdate = updatedStrategies.filter(s => s.isDefault === true);
      if (defaultStrategiesAfterUpdate.length > 1) {
        console.log(`WARNING: There are still ${defaultStrategiesAfterUpdate.length} default strategies after update!`);
        
        // Automatic repair
        const fixedStrategies = await fixMultipleDefaultStrategies(updatedStrategies);
        setStrategies(fixedStrategies);
      }
      
      toast({
        title: "Strategy updated",
        description: `${strategy.name} has been updated successfully`,
        variant: "default"
      });
      
      setEditMode(null);
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
  };
  
  // Handle deleting a strategy
  const handleDeleteStrategy = async (strategyId: string, strategyName: string) => {
    try {
      if (!auth.currentUser) {
        toast({
          title: "Authentication error",
          description: "You must be logged in to delete a strategy",
          variant: "destructive"
        });
        return;
      }
      
      const userId = auth.currentUser.uid;
      
      await deleteStrategy(userId, strategyId);
      
      setStrategies(prev => prev.filter(s => s.id !== strategyId));
      
      toast({
        title: "Strategy deleted",
        description: `${strategyName} has been deleted successfully`,
        variant: "default"
      });
    } catch (error) {
      console.error("Error deleting strategy:", error);
      toast({
        title: "Error deleting strategy",
        description: "Could not delete your strategy. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Memoized handler for updating strategy when in edit mode
  const handleEditField = useCallback((strategyId: string, fieldName: string, value: any) => {
    handleStrategyFieldChange(strategyId, fieldName, value);
  }, [handleStrategyFieldChange]);
  
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
      <StrategiesListRenderer
        strategies={strategies}
        editMode={editMode}
        isSaving={isSaving}
        onSetEditMode={setEditMode}
        onUpdateStrategy={handleUpdateStrategy}
        onDeleteStrategy={handleDeleteStrategy}
        onSetDefaultStrategy={(strategy) => {
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
            if (!auth.currentUser) return;
            const userId = auth.currentUser.uid;
            
            Promise.all([
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
            ])
            .then(() => {
              toast({
                title: "Default strategy updated",
                description: `${strategy.name} is now your default strategy`,
              });
            })
            .catch((error) => {
              console.error("Error setting default strategy:", error);
              toast({
                title: "Error",
                description: "Could not set default strategy. Please try again.",
                variant: "destructive"
              });
            })
            .finally(() => {
              setIsSaving(false);
            });
          } catch (error) {
            console.error("Error setting default strategy:", error);
            toast({
              title: "Error",
              description: "Could not set default strategy. Please try again.",
              variant: "destructive"
            });
            setIsSaving(false);
          }
        }}
        newRule={newRule}
        newEntryCondition={newEntryCondition}
        newExitCondition={newExitCondition}
        newTimeframe={newTimeframe}
        setNewRule={setNewRule}
        setNewEntryCondition={setNewEntryCondition}
        setNewExitCondition={setNewExitCondition}
        setNewTimeframe={setNewTimeframe}
      />
    );
  }, [strategies, editMode, isSaving, handleUpdateStrategy, handleDeleteStrategy, 
      newRule, newEntryCondition, newExitCondition, newTimeframe,
      setNewRule, setNewEntryCondition, setNewExitCondition, setNewTimeframe, toast, setIsSaving]);
  
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
          <p className="text-sm text-muted-foreground">
            Manage your trading strategies and rules
          </p>
        </div>
        
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
                  onChange={(e) => setNewStrategy({...newStrategy, name: e.target.value})}
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
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewStrategy({...newStrategy, description: e.target.value})}
                  className="min-h-[60px] text-sm"
                />
              </div>
              
              {/* Trading Rules */}
              <div className="space-y-4 mt-6">
                <div className="flex items-center mb-1">
                  <ListChecks className="h-4 w-4 mr-2" />
                  <h4 className="font-medium">Trading Rules</h4>
                </div>
                <StrategyConditionList
                  title=""
                  emptyMessage="No rules defined yet. Click 'Add' to create one."
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
                  icon={<LineChart className="h-4 w-4" />}
                />
              </div>
              
              {/* Entry Conditions */}
              <div className="space-y-4 mt-8">
                <div className="flex items-center mb-1">
                  <DoorOpen className="h-4 w-4 mr-2" />
                  <h4 className="font-medium">Entry Conditions</h4>
                </div>
                <StrategyConditionList
                  title=""
                  emptyMessage="No entry conditions defined yet. Click 'Add' to create one."
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
                  icon={<DoorOpen className="h-4 w-4" />}
                />
              </div>
              
              {/* Exit Conditions */}
              <div className="space-y-4 mt-8">
                <div className="flex items-center mb-1">
                  <LogOut className="h-4 w-4 mr-2" />
                  <h4 className="font-medium">Exit Conditions</h4>
                </div>
                <StrategyConditionList
                  title=""
                  emptyMessage="No exit conditions defined yet. Click 'Add' to create one."
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
                  icon={<LogOut className="h-4 w-4" />}
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
