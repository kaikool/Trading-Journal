import { useState, useEffect } from "react";
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
import { useDialogVariant, DialogHeaderFooterLayout } from "@/components/ui/dialog-variants";

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
  return [...array, { ...condition, label: condition.label.trim() }];
};

const removeConditionFromArray = (array: StrategyCondition[], id: string): StrategyCondition[] => {
  return array.filter(condition => condition.id !== id);
};

const updateConditionInArray = (
  array: StrategyCondition[], 
  id: string, 
  updates: Partial<StrategyCondition>
): StrategyCondition[] => {
  return array.map(condition => 
    condition.id === id 
      ? { ...condition, ...updates } 
      : condition
  );
};

// Helpers for legacy string arrays (for backward compatibility)
const addItemToArray = (array: string[], item: string): string[] => {
  if (!item.trim()) return array;
  return [...array, item.trim()];
};

const removeItemFromArray = (array: string[], index: number): string[] => {
  return array.filter((_, i) => i !== index);
};

const updateItemInArray = (array: string[], index: number, newValue: string): string[] => {
  return array.map((item, i) => (i === index ? newValue : item));
};

// Helper to convert legacy rules to new StrategyCondition format
const convertLegacyRulesToConditions = (rules: string[]): StrategyCondition[] => {
  return rules.map((rule, index) => ({
    id: `rule-${uuidv4()}`,
    label: rule,
    order: index,
    timeframe: '',
    indicator: '',
    expectedValue: '',
    description: ''
  }));
};

// Helper to ensure we have valid StrategyCondition objects
const ensureConditionFormat = (value: any): StrategyCondition => {
  if (typeof value === 'string') {
    return {
      id: `condition-${uuidv4()}`,
      label: value,
      order: 0,
      timeframe: '',
      indicator: '',
      expectedValue: '',
      description: ''
    };
  }
  
  if (typeof value === 'object' && value !== null) {
    return {
      id: value.id || `condition-${uuidv4()}`,
      label: value.label || '',
      order: value.order || 0,
      timeframe: value.timeframe || '',
      indicator: value.indicator || '',
      expectedValue: value.expectedValue || '',
      description: value.description || ''
    };
  }
  
  // Default fallback
  return {
    id: `condition-${uuidv4()}`,
    label: '',
    order: 0,
    timeframe: '',
    indicator: '',
    expectedValue: '',
    description: ''
  };
};

export function StrategiesManagement() {
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
    riskRewardRatio: 2,
    notes: "",
    isDefault: false,
    // Old fields for backward compatibility
    rulesText: [],
    entryConditionsText: [],
    exitConditionsText: []
  });
  
  // Temporary inputs for arrays (old fields kept for compatibility)
  const [newRule, setNewRule] = useState("");
  const [newEntryCondition, setNewEntryCondition] = useState("");
  const [newExitCondition, setNewExitCondition] = useState("");
  const [newTimeframe, setNewTimeframe] = useState("");
  
  /**
   * Create a new strategy condition with default values
   */
  const createNewStrategyCondition = (order: number): StrategyCondition => ({
    id: uuidv4(),
    label: "",
    order,
    indicator: undefined,
    timeframe: undefined,
    expectedValue: undefined,
    description: undefined
  });
  
  // State for new structured conditions
  const [newRuleCondition, setNewRuleCondition] = useState<StrategyCondition>(
    createNewStrategyCondition(newStrategy.rules ? newStrategy.rules.length : 0)
  );
  const [newEntryConditionObj, setNewEntryConditionObj] = useState<StrategyCondition>(
    createNewStrategyCondition(newStrategy.entryConditions ? newStrategy.entryConditions.length : 0)
  );
  const [newExitConditionObj, setNewExitConditionObj] = useState<StrategyCondition>(
    createNewStrategyCondition(newStrategy.exitConditions ? newStrategy.exitConditions.length : 0)
  );
  
  // Removed toggle between simple and advanced mode, always using advanced mode
  
  /**
   * Converts legacy string-based rules/conditions to StrategyCondition[] format
   */
  const convertLegacyRulesToConditions = (legacyRules: string[]): StrategyCondition[] => {
    if (!legacyRules || legacyRules.length === 0) return [];
    
    return legacyRules.map((rule, index) => ({
      id: uuidv4(),
      label: rule,
      order: index,
    }));
  };
  
  /**
   * Updates a condition in an array of conditions
   */
  const updateConditionInArray = (
    conditions: StrategyCondition[], 
    id: string, 
    updates: Partial<StrategyCondition>
  ): StrategyCondition[] => {
    return conditions.map(condition => 
      condition.id === id ? { ...condition, ...updates } : condition
    );
  };
  
  /**
   * Removes a condition from an array by ID
   */
  const removeConditionFromArray = (
    conditions: StrategyCondition[], 
    id: string
  ): StrategyCondition[] => {
    return conditions.filter(condition => condition.id !== id);
  };
  
  /**
   * Add a condition to an array of conditions
   */
  const addConditionToArray = (
    array: StrategyCondition[], 
    condition: StrategyCondition
  ): StrategyCondition[] => {
    return [...array, condition];
  };
  
  /**
   * Helper to remove an item from a string array by index
   */
  const removeItemFromArray = (array: string[], index: number): string[] => {
    return array.filter((_, i) => i !== index);
  };
  
  // Fix data when there are multiple default strategies
  const fixMultipleDefaultStrategies = async (strategies: TradingStrategy[]) => {
    if (!auth.currentUser) return strategies;
    
    const userId = auth.currentUser.uid;
    const defaultStrategies = strategies.filter(s => s.isDefault === true);
    
    // If there is exactly 1 default strategy, no fix is needed
    if (defaultStrategies.length === 1) {
      return strategies;
    }
    
    // Handle cases where there are no default strategies or multiple default strategies
    if (defaultStrategies.length > 1) {
      // Sort by most recently updated time
      const sortedDefaultStrategies = [...defaultStrategies].sort((a, b) => {
        const timeA = a.updatedAt && 'seconds' in a.updatedAt ? a.updatedAt.seconds : 0;
        const timeB = b.updatedAt && 'seconds' in b.updatedAt ? b.updatedAt.seconds : 0;
        return timeB - timeA;
      });
      
      // Keep the most recently updated strategy as default
      const latestDefaultStrategy = sortedDefaultStrategies[0];
      
      // Update other strategies - remove default status
      const updatePromises = [];
      for (const strategy of defaultStrategies) {
        if (strategy.id !== latestDefaultStrategy.id) {
          updatePromises.push(
            updateStrategy(userId, strategy.id, {
              ...strategy,
              isDefault: false,
              updatedAt: Timestamp.now()
            })
          );
        }
      }
      
      // Wait for all updates to complete
      await Promise.all(updatePromises);
      
    } else if (strategies.length > 0) {
      // If there are no default strategies, set the first strategy as default
      const firstStrategy = strategies[0];
      
      await updateStrategy(userId, firstStrategy.id, {
        ...firstStrategy,
        isDefault: true,
        updatedAt: Timestamp.now()
      });
    }
    
    // Update the strategy list
    return await getStrategies(userId) as TradingStrategy[];
  };

  // Fetch strategies
  useEffect(() => {
    const fetchStrategies = async () => {
      try {
        if (!auth.currentUser) return;
        
        const userId = auth.currentUser.uid;
        let fetchedStrategies = await getStrategies(userId);
        
        // Fix data if necessary
        const fixedStrategies = await fixMultipleDefaultStrategies(fetchedStrategies as TradingStrategy[]);
        
        setStrategies(fixedStrategies);
      } catch (error) {
        console.error("Error fetching strategies:", error);
        toast({
          title: "Error loading strategies",
          description: "Could not load your trading strategies. Please try again.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchStrategies();
  }, [toast]);
  
  // Handle creating a new strategy
  const handleCreateStrategy = async () => {
    try {
      setIsCreating(true);
      
      if (!auth.currentUser) {
        toast({
          title: "Authentication error",
          description: "You must be logged in to create a strategy",
          variant: "destructive"
        });
        return;
      }
      
      if (!newStrategy.name || !newStrategy.description) {
        toast({
          title: "Missing information",
          description: "Strategy name and description are required",
          variant: "destructive"
        });
        return;
      }
      
      const userId = auth.currentUser.uid;

      // If the new strategy is set as default, unmark all other strategies in the database
      if (newStrategy.isDefault) {
        // Get all other strategies that are currently set as default
        const defaultStrategies = strategies.filter(s => s.isDefault);
        
        // Update other strategies to be non-default in Firebase
        const updatePromises = defaultStrategies.map(strategy => 
          updateStrategy(userId, strategy.id, {
            ...strategy,
            isDefault: false,
            updatedAt: Timestamp.now()
          })
        );
        
        // Wait for all updates to complete in parallel
        await Promise.all(updatePromises);
      }
      
      // Add the new strategy to Firebase
      const createdStrategy = await addStrategy(userId, newStrategy);
      
      // Update UI state
      if (newStrategy.isDefault) {
        // If the new strategy is default, update UI to set all other strategies as non-default
        setStrategies(prev => [
          { 
            ...newStrategy, 
            id: createdStrategy.id,
            userId: userId,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
          } as TradingStrategy, 
          ...prev.map(s => ({ ...s, isDefault: false }))
        ]);
      } else {
        // If not, just add the new strategy to the state
        setStrategies(prev => [{ 
          ...newStrategy, 
          id: createdStrategy.id,
          userId: userId,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        } as TradingStrategy, ...prev]);
      }
      
      toast({
        title: "Strategy created",
        description: `${newStrategy.name} has been created successfully`,
        variant: "default"
      });
      
      // Reset form
      setNewStrategy({
        name: "",
        description: "",
        rules: [] as StrategyCondition[],
        entryConditions: [] as StrategyCondition[],
        exitConditions: [] as StrategyCondition[],
        timeframes: [],
        riskRewardRatio: 2,
        notes: "",
        isDefault: false,
        rulesText: [],
        entryConditionsText: [],
        exitConditionsText: []
      });
      setIsDialogOpen(false);
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
  
  // Handle updating a strategy
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
      
      // Ensure all strategy conditions are properly formatted before saving
      const formattedStrategy = {
        ...strategy,
        rules: strategy.rules?.map(rule => ensureConditionFormat(rule)) || [],
        entryConditions: strategy.entryConditions?.map(condition => ensureConditionFormat(condition)) || [],
        exitConditions: strategy.exitConditions?.map(condition => ensureConditionFormat(condition)) || [],
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
          <DialogContent 
            className={useDialogVariant('form')}
          >
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
              
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Rules</Label>
                
                <StrategyConditionList
                  conditions={newStrategy.rules as StrategyCondition[] || []}
                  onAdd={(condition) => {
                    const updatedRules = [...(newStrategy.rules as StrategyCondition[] || []), condition];
                    setNewStrategy({
                      ...newStrategy,
                      rules: updatedRules,
                      // Cập nhật rulesText cho tương thích ngược
                      rulesText: updatedRules.map(r => r.label)
                    });
                  }}
                  onUpdate={(id, updates) => {
                    const updatedRules = updateConditionInArray(
                      newStrategy.rules as StrategyCondition[] || [], 
                      id, 
                      updates
                    );
                    setNewStrategy({
                      ...newStrategy,
                      rules: updatedRules,
                      // Cập nhật rulesText cho tương thích ngược
                      rulesText: updatedRules.map(r => r.label)
                    });
                  }}
                  onDelete={(id) => {
                    const updatedRules = removeConditionFromArray(
                      newStrategy.rules as StrategyCondition[] || [], 
                      id
                    );
                    setNewStrategy({
                      ...newStrategy,
                      rules: updatedRules,
                      // Cập nhật rulesText cho tương thích ngược
                      rulesText: updatedRules.map(r => r.label)
                    });
                  }}
                  title=""
                  emptyMessage="No rules defined yet. Add your first rule."
                  icon={<ListChecks className="h-4 w-4" />}
                />
              </div>
              
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Entry Conditions</Label>
                
                <StrategyConditionList
                  conditions={newStrategy.entryConditions as StrategyCondition[] || []}
                  onAdd={(condition) => {
                    const updatedConditions = [...(newStrategy.entryConditions as StrategyCondition[] || []), condition];
                    setNewStrategy({
                      ...newStrategy,
                      entryConditions: updatedConditions,
                      // Cập nhật entryConditionsText cho tương thích ngược
                      entryConditionsText: updatedConditions.map(c => c.label)
                    });
                  }}
                  onUpdate={(id, updates) => {
                    const updatedConditions = updateConditionInArray(
                      newStrategy.entryConditions as StrategyCondition[] || [], 
                      id, 
                      updates
                    );
                    setNewStrategy({
                      ...newStrategy,
                      entryConditions: updatedConditions,
                      // Cập nhật entryConditionsText cho tương thích ngược
                      entryConditionsText: updatedConditions.map(c => c.label)
                    });
                  }}
                  onDelete={(id) => {
                    const updatedConditions = removeConditionFromArray(
                      newStrategy.entryConditions as StrategyCondition[] || [], 
                      id
                    );
                    setNewStrategy({
                      ...newStrategy,
                      entryConditions: updatedConditions,
                      // Cập nhật entryConditionsText cho tương thích ngược
                      entryConditionsText: updatedConditions.map(c => c.label)
                    });
                  }}
                  title=""
                  emptyMessage="No entry conditions defined yet. Add your first condition."
                  icon={<ArrowDown className="h-4 w-4" />}
                />
              </div>
              
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Exit Conditions</Label>
                
                <StrategyConditionList
                  conditions={newStrategy.exitConditions as StrategyCondition[] || []}
                  onAdd={(condition) => {
                    const updatedConditions = [...(newStrategy.exitConditions as StrategyCondition[] || []), condition];
                    setNewStrategy({
                      ...newStrategy,
                      exitConditions: updatedConditions,
                      // Cập nhật exitConditionsText cho tương thích ngược
                      exitConditionsText: updatedConditions.map(c => c.label)
                    });
                  }}
                  onUpdate={(id, updates) => {
                    const updatedConditions = updateConditionInArray(
                      newStrategy.exitConditions as StrategyCondition[] || [], 
                      id, 
                      updates
                    );
                    setNewStrategy({
                      ...newStrategy,
                      exitConditions: updatedConditions,
                      // Cập nhật exitConditionsText cho tương thích ngược
                      exitConditionsText: updatedConditions.map(c => c.label)
                    });
                  }}
                  onDelete={(id) => {
                    const updatedConditions = removeConditionFromArray(
                      newStrategy.exitConditions as StrategyCondition[] || [], 
                      id
                    );
                    setNewStrategy({
                      ...newStrategy,
                      exitConditions: updatedConditions,
                      // Cập nhật exitConditionsText cho tương thích ngược
                      exitConditionsText: updatedConditions.map(c => c.label)
                    });
                  }}
                  title=""
                  emptyMessage="No exit conditions defined yet. Add your first condition."
                  icon={<LogOut className="h-4 w-4" />}
                />
              </div>
              
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Timeframes</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    placeholder="e.g., H4, D1..."
                    value={newTimeframe}
                    onChange={(e) => setNewTimeframe(e.target.value)}
                    className="flex-1 h-9"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      if (newTimeframe.trim()) {
                        setNewStrategy({
                          ...newStrategy,
                          timeframes: addItemToArray(newStrategy.timeframes || [], newTimeframe)
                        });
                        setNewTimeframe("");
                      }
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {newStrategy.timeframes && newStrategy.timeframes.length > 0 ? (
                    newStrategy.timeframes.map((timeframe, index) => (
                      <Badge 
                        key={index} 
                        variant="outline"
                        className="flex items-center gap-1 py-1"
                      >
                        <span>{timeframe}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0"
                          onClick={() => {
                            setNewStrategy({
                              ...newStrategy,
                              timeframes: removeItemFromArray(newStrategy.timeframes || [], index)
                            });
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No timeframes added yet</p>
                  )}
                </div>
              </div>
              
              <div className="space-y-1.5">
                <Label htmlFor="riskReward" className="text-sm font-medium">Risk-Reward Ratio</Label>
                <Input
                  id="riskReward"
                  type="number"
                  min="0.5"
                  step="0.5"
                  placeholder="e.g., 2"
                  value={newStrategy.riskRewardRatio}
                  onChange={(e) => setNewStrategy({...newStrategy, riskRewardRatio: parseFloat(e.target.value) || 0})}
                  className="h-9"
                />
              </div>
              
              <div className="space-y-1.5">
                <Label htmlFor="notes" className="text-sm font-medium">Additional Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Any additional notes about this strategy..."
                  rows={2}
                  value={newStrategy.notes}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewStrategy({...newStrategy, notes: e.target.value})}
                  className="min-h-[60px] text-sm"
                />
              </div>
            </div>
            
            <DialogHeaderFooterLayout
              footerContent={
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                    className="h-8 text-sm"
                  >
                    Cancel
                  </Button>
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
              }
            />
          </DialogContent>
        </Dialog>
      </div>
      
      {strategies.length === 0 ? (
        <Card className="border border-dashed">
          <CardContent className="pt-6 text-center">
            <div className="flex flex-col items-center justify-center py-4">
              <BookCopy className="h-12 w-12 text-muted-foreground/60 mb-4" />
              <h3 className="text-lg font-medium">No strategies yet</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-4">
                Create your first trading strategy to get started
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Strategy
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Accordion
          type="multiple"
          className="w-full space-y-4"
          defaultValue={[]} // Default closed all
        >
          {strategies.map((strategy) => (
            <AccordionItem
              key={strategy.id}
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
                {editMode === strategy.id ? (
                  // Edit mode
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor={`name-${strategy.id}`}>Strategy Name</Label>
                      <Input
                        id={`name-${strategy.id}`}
                        value={strategy.name}
                        onChange={(e) => {
                          setStrategies(prev => 
                            prev.map(s => s.id === strategy.id 
                              ? {...s, name: e.target.value} 
                              : s
                            )
                          );
                        }}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor={`description-${strategy.id}`}>Description</Label>
                      <Textarea
                        id={`description-${strategy.id}`}
                        value={strategy.description}
                        rows={2}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                          setStrategies(prev => 
                            prev.map(s => s.id === strategy.id 
                              ? {...s, description: e.target.value} 
                              : s
                            )
                          );
                        }}
                      />
                    </div>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Rules</Label>
                        <div className="space-y-2">
                          {strategy.rulesText?.map((ruleText, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <Input
                                value={ruleText}
                                onChange={(e) => {
                                  setStrategies(prev => 
                                    prev.map(s => s.id === strategy.id 
                                      ? {
                                          ...s, 
                                          rulesText: updateItemInArray(s.rulesText || [], index, e.target.value),
                                          // Đồng bộ cả định dạng mới
                                          rules: s.rules?.map((r, i) => 
                                            i === index && typeof r === 'object' 
                                              ? { ...r, label: e.target.value } 
                                              : r
                                          )
                                        } 
                                      : s
                                    )
                                  );
                                }}
                                className="flex-1"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setStrategies(prev => 
                                    prev.map(s => s.id === strategy.id 
                                      ? {
                                          ...s, 
                                          rulesText: removeItemFromArray(s.rulesText || [], index),
                                          // Đồng bộ cả định dạng mới
                                          rules: Array.isArray(s.rules) 
                                            ? s.rules.filter((_, i) => i !== index) 
                                            : s.rules
                                        } 
                                      : s
                                    )
                                  );
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                          <div className="flex items-center space-x-2">
                            <Input
                              placeholder="Add a new rule..."
                              value={newRule}
                              onChange={(e) => setNewRule(e.target.value)}
                              className="flex-1"
                            />
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => {
                                if (newRule.trim()) {
                                  // Tạo StrategyCondition mới với helper
                                  const newCondition = ensureConditionFormat({
                                    id: `rule-${Date.now()}`,
                                    label: newRule.trim(),
                                    order: (strategy.rules?.length || 0) + 1
                                  });
                                  
                                  setStrategies(prev => 
                                    prev.map(s => s.id === strategy.id 
                                      ? {
                                          ...s,
                                          // Thêm cả text để hiển thị
                                          rulesText: [...(s.rulesText || []), newRule.trim()],
                                          // Thêm object đầy đủ vào rules
                                          rules: [...(s.rules?.map(r => ensureConditionFormat(r)) || []), newCondition]
                                        } 
                                      : s
                                    )
                                  );
                                  setNewRule("");
                                }
                              }}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Entry Conditions</Label>
                        <div className="space-y-2">
                          {strategy.entryConditionsText?.map((conditionText, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <Input
                                value={conditionText}
                                onChange={(e) => {
                                  setStrategies(prev => 
                                    prev.map(s => s.id === strategy.id 
                                      ? {
                                          ...s, 
                                          entryConditionsText: updateItemInArray(s.entryConditionsText || [], index, e.target.value),
                                          // Đồng bộ các điều kiện định dạng mới
                                          entryConditions: s.entryConditions?.map((c, i) => 
                                            i === index && typeof c === 'object' 
                                              ? { ...c, label: e.target.value } 
                                              : c
                                          )
                                        } 
                                      : s
                                    )
                                  );
                                }}
                                className="flex-1"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setStrategies(prev => 
                                    prev.map(s => s.id === strategy.id 
                                      ? {
                                          ...s, 
                                          entryConditionsText: removeItemFromArray(s.entryConditionsText || [], index),
                                          // Đồng bộ cả định dạng mới
                                          entryConditions: Array.isArray(s.entryConditions) 
                                            ? s.entryConditions.filter((_, i) => i !== index) 
                                            : s.entryConditions
                                        } 
                                      : s
                                    )
                                  );
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                          <div className="flex items-center space-x-2">
                            <Input
                              placeholder="Add a new entry condition..."
                              value={newEntryCondition}
                              onChange={(e) => setNewEntryCondition(e.target.value)}
                              className="flex-1"
                            />
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => {
                                if (newEntryCondition.trim()) {
                                  // Tạo StrategyCondition mới với helper
                                  const newCondition = ensureConditionFormat({
                                    id: `entry-${Date.now()}`,
                                    label: newEntryCondition.trim(),
                                    order: (strategy.entryConditions?.length || 0) + 1
                                  });
                                  
                                  setStrategies(prev => 
                                    prev.map(s => s.id === strategy.id 
                                      ? {
                                          ...s,
                                          // Thêm cả text để hiển thị
                                          entryConditionsText: [...(s.entryConditionsText || []), newEntryCondition.trim()],
                                          // Thêm object đầy đủ vào entryConditions
                                          entryConditions: [...(s.entryConditions?.map(c => ensureConditionFormat(c)) || []), newCondition]
                                        } 
                                      : s
                                    )
                                  );
                                  setNewEntryCondition("");
                                }
                              }}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Exit Conditions</Label>
                        <div className="space-y-2">
                          {strategy.exitConditionsText?.map((conditionText, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <Input
                                value={conditionText}
                                onChange={(e) => {
                                  setStrategies(prev => 
                                    prev.map(s => s.id === strategy.id 
                                      ? {
                                          ...s, 
                                          exitConditionsText: updateItemInArray(s.exitConditionsText || [], index, e.target.value),
                                          // Đồng bộ cả định dạng mới
                                          exitConditions: s.exitConditions?.map((c, i) => 
                                            i === index && typeof c === 'object' 
                                              ? { ...c, label: e.target.value } 
                                              : c
                                          )
                                        } 
                                      : s
                                    )
                                  );
                                }}
                                className="flex-1"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setStrategies(prev => 
                                    prev.map(s => s.id === strategy.id 
                                      ? {
                                          ...s, 
                                          exitConditionsText: removeItemFromArray(s.exitConditionsText || [], index),
                                          // Đồng bộ cả định dạng mới
                                          exitConditions: Array.isArray(s.exitConditions) 
                                            ? s.exitConditions.filter((_, i) => i !== index) 
                                            : s.exitConditions
                                        } 
                                      : s
                                    )
                                  );
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                          <div className="flex items-center space-x-2">
                            <Input
                              placeholder="Add a new exit condition..."
                              value={newExitCondition}
                              onChange={(e) => setNewExitCondition(e.target.value)}
                              className="flex-1"
                            />
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => {
                                if (newExitCondition.trim()) {
                                  // Tạo StrategyCondition mới với helper
                                  const newCondition = ensureConditionFormat({
                                    id: `exit-${Date.now()}`,
                                    label: newExitCondition.trim(),
                                    order: (strategy.exitConditions?.length || 0) + 1
                                  });
                                  
                                  setStrategies(prev => 
                                    prev.map(s => s.id === strategy.id 
                                      ? {
                                          ...s,
                                          // Thêm cả text để hiển thị
                                          exitConditionsText: [...(s.exitConditionsText || []), newExitCondition.trim()],
                                          // Thêm object đầy đủ vào exitConditions với đảm bảo kiểu dữ liệu
                                          exitConditions: [...(s.exitConditions?.map(c => ensureConditionFormat(c)) || []), newCondition]
                                        } 
                                      : s
                                    )
                                  );
                                  setNewExitCondition("");
                                }
                              }}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Timeframes</Label>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {strategy.timeframes?.map((timeframe, index) => (
                            <Badge 
                              key={index} 
                              variant="outline"
                              className="flex items-center gap-1 py-1"
                            >
                              <span>{timeframe}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-4 w-4 p-0"
                                onClick={() => {
                                  setStrategies(prev => 
                                    prev.map(s => s.id === strategy.id 
                                      ? {
                                          ...s, 
                                          timeframes: removeItemFromArray(s.timeframes || [], index)
                                        } 
                                      : s
                                    )
                                  );
                                }}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Input
                            placeholder="Add a timeframe (e.g., H4, D1)..."
                            value={newTimeframe}
                            onChange={(e) => setNewTimeframe(e.target.value)}
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => {
                              if (newTimeframe.trim()) {
                                setStrategies(prev => 
                                  prev.map(s => s.id === strategy.id 
                                    ? {
                                        ...s, 
                                        timeframes: [...(s.timeframes || []), newTimeframe]
                                      } 
                                    : s
                                  )
                                );
                                setNewTimeframe("");
                              }
                            }}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`riskReward-${strategy.id}`}>Risk-Reward Ratio</Label>
                        <Input
                          id={`riskReward-${strategy.id}`}
                          type="number"
                          min="0.5"
                          step="0.5"
                          value={strategy.riskRewardRatio || 0}
                          onChange={(e) => {
                            setStrategies(prev => 
                              prev.map(s => s.id === strategy.id 
                                ? {...s, riskRewardRatio: parseFloat(e.target.value) || 0} 
                                : s
                              )
                            );
                          }}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`notes-${strategy.id}`}>Additional Notes</Label>
                        <Textarea
                          id={`notes-${strategy.id}`}
                          value={strategy.notes || ""}
                          rows={2}
                          onChange={(e) => {
                            setStrategies(prev => 
                              prev.map(s => s.id === strategy.id 
                                ? {...s, notes: e.target.value} 
                                : s
                              )
                            );
                          }}
                        />
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Label htmlFor={`default-${strategy.id}`} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            id={`default-${strategy.id}`}
                            checked={strategy.isDefault || false}
                            onChange={(e) => {
                              // When a strategy is marked as default, unmark all other strategies
                              if (e.target.checked) {
                                setStrategies(prev => 
                                  prev.map(s => ({
                                    ...s, 
                                    isDefault: s.id === strategy.id
                                  }))
                                );
                              } else {
                                // If unchecked, only update this strategy
                                setStrategies(prev => 
                                  prev.map(s => s.id === strategy.id 
                                    ? {...s, isDefault: false} 
                                    : s
                                  )
                                );
                              }
                            }}
                            className="rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <span>Set as default strategy</span>
                        </Label>
                      </div>
                    </div>
                    
                    <div className="flex justify-end space-x-2 pt-1.5">
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setEditMode(null);
                          // Reset form fields
                          setNewRule("");
                          setNewEntryCondition("");
                          setNewExitCondition("");
                          setNewTimeframe("");
                          // Fetch strategies again to reset any changes
                          if (auth.currentUser) {
                            getStrategies(auth.currentUser.uid)
                              .then(fetchedStrategies => {
                                setStrategies(fetchedStrategies as TradingStrategy[]);
                              })
                              .catch(error => {
                                console.error("Error fetching strategies:", error);
                              });
                          }
                        }}
                        className="h-8 text-sm px-3"
                      >
                        <X className="h-3.5 w-3.5 mr-1.5" />
                        Cancel
                      </Button>
                      <Button 
                        onClick={() => handleUpdateStrategy(strategy)} 
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
                  // View mode
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Description</h4>
                      <p className="mt-1">{strategy.description}</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {strategy.rulesText && strategy.rulesText.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center">
                            <ListChecks className="h-4 w-4 mr-1" />
                            Rules
                          </h4>
                          <ul className="space-y-1 pl-1">
                            {strategy.rulesText.map((ruleText, index) => (
                              <li key={index} className="text-sm flex items-start">
                                <span className="inline-block h-5 mr-2 text-muted-foreground">•</span>
                                {ruleText}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {strategy.entryConditionsText && strategy.entryConditionsText.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center">
                            <ArrowDown className="h-4 w-4 mr-1" />
                            Entry Conditions
                          </h4>
                          <ul className="space-y-1 pl-1">
                            {strategy.entryConditionsText.map((conditionText, index) => (
                              <li key={index} className="text-sm flex items-start">
                                <span className="inline-block h-5 mr-2 text-success">✓</span>
                                {conditionText}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {strategy.exitConditionsText && strategy.exitConditionsText.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center">
                            <LogOut className="h-4 w-4 mr-1" />
                            Exit Conditions
                          </h4>
                          <ul className="space-y-1 pl-1">
                            {strategy.exitConditionsText.map((conditionText, index) => (
                              <li key={index} className="text-sm flex items-start">
                                <span className="inline-block h-5 mr-2 text-destructive">✓</span>
                                {conditionText}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-4 pt-2">
                      {strategy.timeframes && strategy.timeframes.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center">
                            <TimerIcon className="h-4 w-4 mr-1" />
                            Timeframes
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {strategy.timeframes.map((timeframe, index) => (
                              <Badge key={index} variant="outline">
                                {timeframe}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {strategy.riskRewardRatio && (
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-2">
                            Risk-Reward Ratio
                          </h4>
                          <Badge className="bg-primary/10 hover:bg-primary/20 text-primary border-primary/20">
                            1:{strategy.riskRewardRatio}
                          </Badge>
                        </div>
                      )}
                    </div>
                    
                    {strategy.notes && (
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">Notes</h4>
                        <p className="text-sm text-muted-foreground">{strategy.notes}</p>
                      </div>
                    )}
                    
                    <div className="flex justify-end space-x-2 pt-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs px-2"
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete "${strategy.name}" strategy?`)) {
                            handleDeleteStrategy(strategy.id, strategy.name);
                          }
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                        Delete
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        className="h-7 text-xs px-2"
                        onClick={() => {
                          setEditMode(strategy.id);
                          // Reset form fields
                          setNewRule("");
                          setNewEntryCondition("");
                          setNewExitCondition("");
                          setNewTimeframe("");
                        }}
                      >
                        <Edit className="h-3.5 w-3.5 mr-1.5" />
                        Edit
                      </Button>
                    </div>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}