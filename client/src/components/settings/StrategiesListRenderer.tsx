import React, { useState, useCallback } from "react";
import { TradingStrategy, StrategyCondition } from "@/types";
import { Accordion } from "@/components/ui/accordion";
import { createNewCondition } from "./StrategyConditionInput";
import { StrategyItemWrapper } from "./StrategyItemWrapper";

interface StrategiesListRendererProps {
  strategies: TradingStrategy[];
  editMode: string | null;
  isSaving: boolean;
  onSetEditMode: (id: string | null) => void;
  onUpdateStrategy: (strategy: TradingStrategy) => void;
  onDeleteStrategy: (id: string, name: string) => void;
  onStrategyFieldChange: (strategyId: string, fieldName: string, value: any) => void;
  onSetDefaultStrategy: (strategy: TradingStrategy) => void;
  newRule: string;
  newEntryCondition: string;
  newExitCondition: string;
  newTimeframe: string;
  setNewRule: (value: string) => void;
  setNewEntryCondition: (value: string) => void;
  setNewExitCondition: (value: string) => void;
  setNewTimeframe: (value: string) => void;
}

export function StrategiesListRenderer({
  strategies,
  editMode,
  isSaving,
  onSetEditMode,
  onUpdateStrategy,
  onDeleteStrategy,
  onStrategyFieldChange,
  onSetDefaultStrategy,
  newRule,
  newEntryCondition,
  newExitCondition,
  newTimeframe,
  setNewRule,
  setNewEntryCondition,
  setNewExitCondition,
  setNewTimeframe
}: StrategiesListRendererProps) {
  const resetFormFields = useCallback(() => {
    setNewRule("");
    setNewEntryCondition("");
    setNewExitCondition("");
    setNewTimeframe("");
  }, [setNewRule, setNewEntryCondition, setNewExitCondition, setNewTimeframe]);

  return (
    <Accordion type="single" collapsible className="space-y-3">
      {strategies.map(strategy => {
        // Handler function for each strategy's field changes 
        const handleEditFieldChange = (fieldName: string, value: any) => {
          console.log("[DEBUG-LIST] Strategy field change for:", strategy.id, fieldName, value);
          // Pass to parent component to update state
          onStrategyFieldChange(strategy.id, fieldName, value);
        };
        
        return (
          <StrategyItemWrapper
            key={strategy.id}
            strategy={strategy}
            isEditMode={editMode === strategy.id}
            isSaving={isSaving}
            onEdit={() => onSetEditMode(strategy.id)}
            onUpdate={() => onUpdateStrategy(strategy)}
            onDelete={() => {
              if (window.confirm(`Are you sure you want to delete "${strategy.name}" strategy?`)) {
                onDeleteStrategy(strategy.id, strategy.name);
              }
            }}
            onSetAsDefault={() => onSetDefaultStrategy(strategy)}
            onFieldChange={handleEditFieldChange}
          />
        );
      })}
    </Accordion>
  );
}