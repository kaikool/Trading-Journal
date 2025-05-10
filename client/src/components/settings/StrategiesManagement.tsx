import React, { useState, useEffect, useMemo, useCallback } from "react";
import { TradingStrategy, StrategyCondition } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { auth, getStrategies, addStrategy, updateStrategy, deleteStrategy } from "@/lib/firebase";
import { Timestamp } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import ConfirmDeleteDialog from "@/components/common/ConfirmDeleteDialog";
import {
  StrategyConditionList,
} from "./StrategyConditionInput";

import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Icons } from "@/components/icons/icons";
import { cn } from "@/lib/utils";
// All icons are now imported from the centralized Icons component

// Common timeframes for forex
const COMMON_TIMEFRAMES = ["M1", "M5", "M15", "M30", "H1", "H4", "D1", "W1", "MN"];

// Helper functions for handling StrategyCondition arrays
const addConditionToArray = (array: StrategyCondition[], condition: StrategyCondition): StrategyCondition[] => {
  if (!condition.label.trim()) return array;
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
  return array.map(condition => {
    if (condition.id === id) {
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
    return {...condition};
  });
};

const removeConditionFromArray = (array: StrategyCondition[], id: string): StrategyCondition[] => {
  const newArray = array.filter(condition => condition.id !== id);
  return newArray.map((condition, index) => ({
    ...condition,
    order: index
  }));
};

// Helper to fix situations where multiple strategies are marked as default
const fixMultipleDefaultStrategies = async (strategies: TradingStrategy[]): Promise<TradingStrategy[]> => {
  const defaultStrategies = strategies.filter(s => s.isDefault === true);
  
  if (defaultStrategies.length <= 1) {
    return strategies;
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
  onEditFieldChange,
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
  onEditFieldChange?: (fieldName: string, value: any) => void;
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
        "app-accordion-item mb-2 border",
        strategy.isDefault 
          ? "border-primary/30" 
          : "border-border/50"
      )}
    >
      <AccordionTrigger className="px-3 py-2 hover:bg-muted/30 transition-colors">
        <div className="flex items-center justify-between w-full gap-1.5">
          <div className="flex items-center text-left gap-2">
            <div className={cn(
              "flex items-center justify-center w-7 h-7 rounded-full flex-shrink-0",
              strategy.isDefault 
                ? "bg-primary/15 text-primary/90 border border-primary/20" 
                : "bg-muted/40 text-muted-foreground/80 border border-border/50"
            )}>
              <Icons.trade.bookCopy className="h-3.5 w-3.5" />
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-sm">{strategy.name}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {strategy.isDefault && (
              <Badge variant="outline" className="font-normal text-xs h-5 px-1.5 py-0 border-primary/30 bg-primary/10 text-primary">
                <Icons.trade.bookmark className="h-2.5 w-2.5 mr-0.5" />
                Default
              </Badge>
            )}
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="app-accordion-content px-3 pb-3 pt-1">
        {isEditMode ? (
          <div className="space-y-5">
            <div className="space-y-4 bg-muted/10 p-4 rounded-lg border border-border/40">
              <div className="space-y-2">
                <Label htmlFor={`name-${strategy.id}`} className="text-sm flex items-center">
                  <Icons.trade.bookCopy className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                  Strategy Name
                </Label>
                <Input
                  id={`name-${strategy.id}`}
                  value={strategy.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  className="h-9"
                  placeholder="Give your strategy a clear name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor={`description-${strategy.id}`} className="text-sm flex items-center">
                  <Icons.analytics.lineChart className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                  Description
                </Label>
                <Textarea
                  id={`description-${strategy.id}`}
                  value={strategy.description || ''}
                  onChange={(e) => handleFieldChange('description', e.target.value)}
                  placeholder="Describe this strategy in a few sentences"
                  className="min-h-[70px] text-sm resize-none"
                />
              </div>
            </div>
            
            {/* Trading Rules */}
            <div className="space-y-1.5 mb-2">
              <StrategyConditionList
                title="Trading Rules"
                icon={<Icons.trade.listChecks className="h-4 w-4 mr-1" />}
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
                icon={<Icons.trade.doorOpen className="h-4 w-4 mr-1" />}
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
                icon={<Icons.trade.logOut className="h-4 w-4 mr-1" />}
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
                  <Icons.trade.clock className="h-4 w-4 mr-2" />
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
                      <Icons.ui.close 
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
                  <Icons.trade.bookmark className="h-3.5 w-3.5 mr-1.5" />
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
                <Icons.ui.close className="h-3.5 w-3.5 mr-1.5" />
                Cancel
              </Button>
              <Button 
                size="sm" 
                onClick={() => onUpdate(strategy)}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Icons.ui.spinner className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Icons.ui.save className="h-3.5 w-3.5 mr-1.5" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-4">
                {strategy.description && (
                  <div className="app-accordion-content-section p-3">
                    <h3 className="app-accordion-heading text-sm flex items-center">
                      <Icons.analytics.lineChart className="h-3.5 w-3.5 mr-1 text-primary/80" />
                      Strategy Overview
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{strategy.description}</p>
                  </div>
                )}
                
                {strategy.rules && strategy.rules.length > 0 && (
                  <div className="app-accordion-content-section p-3">
                    <h3 className="app-accordion-heading text-sm flex items-center">
                      <Icons.trade.listChecks className="h-3.5 w-3.5 mr-1 text-primary/80" />
                      Trading Rules
                    </h3>
                    <ul className="space-y-2">
                      {strategy.rules.map((rule) => (
                        <li key={rule.id} className="flex gap-2 group">
                          <div className="mt-0.5 flex-shrink-0">
                            <Badge variant="outline" className="w-5 h-5 flex items-center justify-center p-0 border-primary/20 bg-primary/5 rounded-full">
                              <Icons.ui.check className="h-3 w-3 text-primary" />
                            </Badge>
                          </div>
                          <div>
                            <span className="text-xs font-medium">{rule.label}</span>
                            {rule.description && (
                              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{rule.description}</p>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                {strategy.entryConditions && strategy.entryConditions.length > 0 && (
                  <div className="app-accordion-content-section p-3">
                    <h3 className="app-accordion-heading text-sm flex items-center bg-gradient-to-r from-success/90 to-success/70">
                      <Icons.trade.doorOpen className="h-3.5 w-3.5 mr-1 text-success/80" />
                      Entry Conditions
                    </h3>
                    <ul className="space-y-2">
                      {strategy.entryConditions.map((condition) => (
                        <li key={condition.id} className="flex gap-2 group">
                          <div className="mt-0.5 flex-shrink-0">
                            <Badge variant="outline" className="w-5 h-5 flex items-center justify-center p-0 border-success/20 bg-success/5 rounded-full">
                              <Icons.trade.arrowDown className="h-3 w-3 text-success" />
                            </Badge>
                          </div>
                          <div>
                            <span className="text-xs font-medium">{condition.label}</span>
                            {condition.description && (
                              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{condition.description}</p>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {strategy.exitConditions && strategy.exitConditions.length > 0 && (
                  <div className="app-accordion-content-section p-3">
                    <h3 className="app-accordion-heading text-sm flex items-center bg-gradient-to-r from-destructive/90 to-destructive/70">
                      <Icons.trade.logOut className="h-3.5 w-3.5 mr-1 text-destructive/80" />
                      Exit Conditions
                    </h3>
                    <ul className="space-y-2">
                      {strategy.exitConditions.map((condition) => (
                        <li key={condition.id} className="flex gap-2 group">
                          <div className="mt-0.5 flex-shrink-0">
                            <Badge variant="outline" className="w-5 h-5 flex items-center justify-center p-0 border-destructive/20 bg-destructive/5 rounded-full">
                              <Icons.trade.arrowUp className="h-3 w-3 text-destructive" />
                            </Badge>
                          </div>
                          <div>
                            <span className="text-xs font-medium">{condition.label}</span>
                            {condition.description && (
                              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{condition.description}</p>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
            
            {strategy.timeframes && strategy.timeframes.length > 0 && (
              <div className="app-accordion-content-section p-3">
                <h3 className="app-accordion-heading text-sm flex items-center bg-gradient-to-r from-primary/80 to-secondary/80">
                  <Icons.trade.clock className="h-3.5 w-3.5 mr-1 text-primary/80" />
                  Recommended Timeframes
                </h3>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {strategy.timeframes.sort().map(tf => (
                    <Badge key={tf} variant="secondary" className="px-2 py-0.5 text-xs bg-secondary/30 hover:bg-secondary/50 transition-colors border border-secondary/20">
                      {tf}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex justify-end gap-1.5 border-t border-border/20 mt-3 pt-3">
              {!strategy.isDefault && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={onSetAsDefault}
                  disabled={isSaving}
                  className="bg-primary/5 border-primary/20 text-primary hover:bg-primary/10 hover:text-primary h-8 px-2 text-xs"
                >
                  <Icons.trade.bookmark className="h-3 w-3 mr-1" />
                  Default
                </Button>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onEdit}
                className="bg-secondary/30 hover:bg-secondary/50 h-8 px-2 text-xs"
              >
                <Icons.general.edit className="h-3 w-3 mr-1" />
                Edit
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="text-destructive hover:text-destructive border-destructive/20 bg-destructive/5 hover:bg-destructive/10 h-8 px-2 text-xs"
                onClick={onDelete}
                disabled={isSaving}
              >
                <Icons.trade.trash className="h-3 w-3 mr-1" />
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
  // State for the list of strategies
  const [strategies, setStrategies] = useState<TradingStrategy[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  // State for tracking which strategy is being edited
  const [editStrategyId, setEditStrategyId] = useState<string | null>(null);
  const [editedStrategy, setEditedStrategy] = useState<Partial<TradingStrategy> | null>(null);
  
  // State cho dialog xác nhận xóa
  const [strategyToDelete, setStrategyToDelete] = useState<TradingStrategy | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // State for tracking new rule inputs
  const [newTimeframe, setNewTimeframe] = useState("");
  
  // State for new strategy creation
  const [newStrategy, setNewStrategy] = useState<Partial<TradingStrategy>>({
    id: uuidv4(),
    name: "",
    description: "",
    rules: Array<StrategyCondition>(),
    entryConditions: Array<StrategyCondition>(),
    exitConditions: Array<StrategyCondition>(),
    timeframes: [],
    isDefault: false,
  });
  
  const { toast } = useToast();
  
  // Reset the form fields
  const resetFormFields = useCallback(() => {
    setEditStrategyId(null);
    setEditedStrategy(null);
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
  
  // Handle opening delete confirmation dialog
  const handleOpenDeleteDialog = useCallback((strategy: TradingStrategy) => {
    if (!auth.currentUser || isSaving) return;
    setStrategyToDelete(strategy);
    setIsDeleteDialogOpen(true);
  }, [auth.currentUser, isSaving]);
  
  // Handle deleting a strategy after confirmation
  const handleDeleteStrategy = useCallback(async (strategy: TradingStrategy) => {
    if (!auth.currentUser || isSaving) return;
    
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
      setIsDeleteDialogOpen(false);
      setStrategyToDelete(null);
    }
  }, [isSaving, toast]);
  
  // Handle creating a new strategy
  const handleCreateStrategy = useCallback(async () => {
    if (!auth.currentUser || isCreating) return;
    
    try {
      setIsCreating(true);
      
      // Validate required fields
      if (!newStrategy.name?.trim()) {
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
        userId,
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
      const result = await addStrategy(userId, strategyWithTimestamp as TradingStrategy);
      
      // Extract proper ID from result - addStrategy returns {id: string} object or string
      const newStrategyId = typeof result === 'object' && result !== null && 'id' in result 
        ? String(result.id) 
        : String(result);
      
      // Create a properly typed strategy object with the correct ID structure
      const completeStrategy: TradingStrategy = {
        ...strategyWithTimestamp as TradingStrategy, 
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
        rules: Array<StrategyCondition>(),
        entryConditions: Array<StrategyCondition>(),
        exitConditions: Array<StrategyCondition>(),
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
            <Icons.ui.spinner className="w-8 h-8 animate-spin text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">Loading strategies...</p>
          </div>
        </div>
      );
    }
    
    if (strategies.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
            <Icons.trade.bookCopy className="h-8 w-8 text-muted-foreground/30" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No Trading Strategies Yet</h3>
          <p className="text-muted-foreground max-w-md mb-6">
            Create your first trading strategy to define rules and conditions for your trades.
          </p>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Icons.ui.plus className="h-4 w-4 mr-1.5" />
            Add Your First Strategy
          </Button>
        </div>
      );
    }
    
    return (
      <Accordion type="single" collapsible className="space-y-3">
        {strategies.map((strategy) => (
          <StrategyItem
            key={strategy.id}
            strategy={editStrategyId === strategy.id && editedStrategy ? { ...strategy, ...editedStrategy as TradingStrategy } : strategy}
            isEditMode={editStrategyId === strategy.id}
            onEdit={() => {
              setEditStrategyId(strategy.id);
              setEditedStrategy({ ...strategy });
            }}
            onUpdate={handleUpdateStrategy}
            onDelete={() => handleOpenDeleteDialog(strategy)}
            onSetAsDefault={() => handleSetDefaultStrategy(strategy)}
            isSaving={isSaving}
            onEditFieldChange={(fieldName, value) => {
              setEditedStrategy(prev => prev ? ({ ...prev, [fieldName]: value }) : null);
            }}
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
    newTimeframe,
    handleUpdateStrategy,
    handleDeleteStrategy,
    handleSetDefaultStrategy,
    resetFormFields
  ]);
  
  return (
    <>
      <div className="mb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-primary/90 via-primary to-primary/80 bg-clip-text text-transparent">Trading Strategies</h2>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Create and manage your trading strategies for consistent trading performance
          </p>
        </div>
      </div>
      
      {/* Render strategies list using memoized function */}
      {renderStrategyList}
      
      {/* Add Strategy Button at bottom */}
      <div className="flex justify-center mt-6 pt-4 border-t border-border/20">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="default" size="sm" className="w-full max-w-sm">
              <Icons.ui.plus className="h-4 w-4 mr-1.5" />
              Add Strategy
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] overflow-y-auto max-h-[85vh] safe-area-p">
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
                  icon={<Icons.trade.listChecks className="h-4 w-4 mr-1" />}
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
              
              <div className="pt-1">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isDefault"
                    checked={newStrategy.isDefault || false}
                    onCheckedChange={(checked) => setNewStrategy({...newStrategy, isDefault: checked === true})}
                  />
                  <Label htmlFor="isDefault" className="text-sm font-medium cursor-pointer">
                    <div className="flex items-center">
                      <Icons.trade.bookmark className="h-3.5 w-3.5 mr-1.5" />
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
                      rules: Array<StrategyCondition>(),
                      entryConditions: Array<StrategyCondition>(),
                      exitConditions: Array<StrategyCondition>(),
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
                    <Icons.ui.spinner className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Icons.ui.plus className="mr-1.5 h-3.5 w-3.5" />
                    Create Strategy
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    
      {/* Confirm Delete Dialog */}
      <ConfirmDeleteDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        itemToDelete={strategyToDelete}
        onConfirm={handleDeleteStrategy}
        title="Delete Strategy"
        description={strategyToDelete ? `Are you sure you want to delete the strategy "${strategyToDelete?.name}"? This action cannot be undone.` : "Are you sure you want to delete this strategy?"}
      />
    </div>
  );
}