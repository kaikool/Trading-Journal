import React, { useCallback } from "react";
import { TradingStrategy, StrategyCondition } from "@/types";
import { 
  ListChecks, 
  DoorOpen, 
  LogOut, 
  Plus,
  Bookmark 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StrategyConditionList, createNewCondition } from "./StrategyConditionInput";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox"; 
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

// Helpers for handling StrategyCondition arrays
function addConditionToArray(array: StrategyCondition[], condition: StrategyCondition): StrategyCondition[] {
  if (!condition.label.trim()) return array;
  console.log("[DEBUG-WRAPPER] Adding condition to array:", { condition, currentArray: array });
  return [...array, { 
    ...condition, 
    label: condition.label.trim(),
    order: condition.order || array.length
  }];
}

function updateConditionInArray(array: StrategyCondition[], id: string, updates: Partial<StrategyCondition>): StrategyCondition[] {
  return array.map(condition => 
    condition.id === id ? { ...condition, ...updates } : condition
  );
}

function removeConditionFromArray(array: StrategyCondition[], id: string): StrategyCondition[] {
  return array.filter(condition => condition.id !== id);
}

interface StrategyItemWrapperProps {
  strategy: TradingStrategy;
  isEditMode: boolean;
  isSaving: boolean;
  onEdit: () => void;
  onUpdate: (strategy: TradingStrategy) => void;
  onDelete: () => void;
  onSetAsDefault: () => void;
  onFieldChange: (fieldName: string, value: any) => void;
}

export function StrategyItemWrapper({
  strategy,
  isEditMode,
  isSaving,
  onEdit,
  onUpdate,
  onDelete,
  onSetAsDefault,
  onFieldChange
}: StrategyItemWrapperProps) {

  const handleFieldChange = useCallback((fieldName: string, value: any) => {
    console.log("[DEBUG-WRAPPER] Strategy field change:", fieldName, value);
    onFieldChange(fieldName, value);
  }, [onFieldChange]);

  if (!isEditMode) {
    return (
      <div className="space-y-3 pt-1">
        <p className="text-sm">{strategy.description}</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {strategy.rules && strategy.rules.length > 0 && (
            <div>
              <h5 className="text-xs font-medium flex items-center mb-1.5">
                <ListChecks className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                Trading Rules
              </h5>
              <div className="space-y-1 pl-2">
                {strategy.rules.map((rule, index) => (
                  <div key={rule.id} className="text-sm">
                    {rule.label}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {strategy.entryConditions && strategy.entryConditions.length > 0 && (
            <div>
              <h5 className="text-xs font-medium flex items-center mb-1.5">
                <DoorOpen className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                Entry Conditions
              </h5>
              <div className="space-y-1 pl-2">
                {strategy.entryConditions.map((condition, index) => (
                  <div key={condition.id} className="text-sm">
                    {condition.label}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {strategy.exitConditions && strategy.exitConditions.length > 0 && (
            <div>
              <h5 className="text-xs font-medium flex items-center mb-1.5">
                <LogOut className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                Exit Conditions
              </h5>
              <div className="space-y-1 pl-2">
                {strategy.exitConditions.map((condition, index) => (
                  <div key={condition.id} className="text-sm">
                    {condition.label}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="flex justify-between pt-2">
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
              className="h-7 text-xs"
            >
              Edit
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={onDelete}
              className="h-7 text-xs text-red-500 hover:text-red-600 hover:border-red-300"
            >
              Delete
            </Button>
          </div>
          
          {!strategy.isDefault && (
            <Button
              variant="outline"
              size="sm"
              onClick={onSetAsDefault}
              className="h-7 text-xs"
              disabled={isSaving}
            >
              <Bookmark className="h-3 w-3 mr-1" />
              Set as Default
            </Button>
          )}
        </div>
      </div>
    );
  }
  
  // Edit mode - show forms for editing
  return (
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
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <h4 className="font-medium flex items-center">
            <ListChecks className="h-4 w-4 mr-2" />
            Trading Rules
          </h4>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const newCondition = createNewCondition(strategy.rules?.length || 0);
              console.log("[DEBUG-WRAPPER] Creating new rule condition:", newCondition);
              handleFieldChange('rules', 
                addConditionToArray(strategy.rules || [], newCondition)
              );
            }}
            className="h-6 px-2 text-xs hover:text-primary"
          >
            <Plus className="h-3.5 w-3.5 mr-1 opacity-70" />
            Add
          </Button>
        </div>
        <StrategyConditionList
          hideAddbutton={true}
          title=""
          emptyMessage="No rules defined yet"
          conditions={strategy.rules || []}
          onAdd={(condition) => {
            console.log("[DEBUG-WRAPPER] Adding rule from ConditionList:", condition);
            handleFieldChange('rules', 
              addConditionToArray(strategy.rules || [], condition)
            );
          }}
          onUpdate={(id, updates) => {
            console.log("[DEBUG-WRAPPER] Updating rule:", id, updates);
            const updatedRules = updateConditionInArray(strategy.rules || [], id, updates);
            handleFieldChange('rules', updatedRules);
          }}
          onDelete={(id) => {
            console.log("[DEBUG-WRAPPER] Deleting rule:", id);
            handleFieldChange('rules', 
              removeConditionFromArray(strategy.rules || [], id)
            );
          }}
        />
      </div>
        
      {/* Entry Conditions */}
      <div className="space-y-1.5 mt-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium flex items-center">
            <DoorOpen className="h-4 w-4 mr-2" />
            Entry Conditions
          </h4>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const newCondition = createNewCondition(strategy.entryConditions?.length || 0);
              console.log("[DEBUG-WRAPPER] Creating new entry condition:", newCondition);
              handleFieldChange('entryConditions', 
                addConditionToArray(strategy.entryConditions || [], newCondition)
              );
            }}
            className="h-6 px-2 text-xs hover:text-primary"
          >
            <Plus className="h-3.5 w-3.5 mr-1 opacity-70" />
            Add
          </Button>
        </div>
        <StrategyConditionList
          hideAddbutton={true}
          title=""
          emptyMessage="No entry conditions defined yet"
          conditions={strategy.entryConditions || []}
          onAdd={(condition) => {
            console.log("[DEBUG-WRAPPER] Adding entry condition from ConditionList:", condition);
            handleFieldChange('entryConditions', 
              addConditionToArray(strategy.entryConditions || [], condition)
            );
          }}
          onUpdate={(id, updates) => {
            console.log("[DEBUG-WRAPPER] Updating entry condition:", id, updates);
            const updatedConditions = updateConditionInArray(strategy.entryConditions || [], id, updates);
            handleFieldChange('entryConditions', updatedConditions);
          }}
          onDelete={(id) => {
            console.log("[DEBUG-WRAPPER] Deleting entry condition:", id);
            handleFieldChange('entryConditions', 
              removeConditionFromArray(strategy.entryConditions || [], id)
            );
          }}
        />
      </div>
        
      {/* Exit Conditions */}
      <div className="space-y-1.5 mt-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium flex items-center">
            <LogOut className="h-4 w-4 mr-2" />
            Exit Conditions
          </h4>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const newCondition = createNewCondition(strategy.exitConditions?.length || 0);
              console.log("[DEBUG-WRAPPER] Creating new exit condition:", newCondition);
              handleFieldChange('exitConditions', 
                addConditionToArray(strategy.exitConditions || [], newCondition)
              );
            }}
            className="h-6 px-2 text-xs hover:text-primary"
          >
            <Plus className="h-3.5 w-3.5 mr-1 opacity-70" />
            Add
          </Button>
        </div>
        <StrategyConditionList
          hideAddbutton={true}
          title=""
          emptyMessage="No exit conditions defined yet"
          conditions={strategy.exitConditions || []}
          onAdd={(condition) => {
            console.log("[DEBUG-WRAPPER] Adding exit condition from ConditionList:", condition);
            handleFieldChange('exitConditions', 
              addConditionToArray(strategy.exitConditions || [], condition)
            );
          }}
          onUpdate={(id, updates) => {
            console.log("[DEBUG-WRAPPER] Updating exit condition:", id, updates);
            const updatedConditions = updateConditionInArray(strategy.exitConditions || [], id, updates);
            handleFieldChange('exitConditions', updatedConditions);
          }}
          onDelete={(id) => {
            console.log("[DEBUG-WRAPPER] Deleting exit condition:", id);
            handleFieldChange('exitConditions', 
              removeConditionFromArray(strategy.exitConditions || [], id)
            );
          }}
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
          onClick={onEdit}
          className="h-8 text-sm px-3"
        >
          Cancel
        </Button>
        
        <Button
          variant="default"
          size="sm"
          onClick={() => onUpdate(strategy)}
          disabled={isSaving}
          className="h-8 text-sm px-4"
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}