
import React from 'react';
import { StrategyCondition, StrategyConditionCheck, TradingStrategy } from "@/types";
import { Checkbox } from "@/components/ui/checkbox";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { cn } from '@/lib/utils';

interface StrategyCheckItemProps {
  condition: StrategyCondition;
  check: StrategyConditionCheck | undefined;
  onCheckChange: (id: string, passed: boolean) => void;
}

function StrategyCheckItem({ condition, check, onCheckChange }: StrategyCheckItemProps) {
  // The UI state 'checked' is derived from the 'passed' state.
  const isChecked = check ? check.passed : false;

  const handleCheck = (checked: boolean | 'indeterminate') => {
    // The callback uses 'passed' terminology.
    onCheckChange(condition.id, checked as boolean);
  };

  return (
    <div className={cn(
      "flex items-start py-2.5 px-2 border-b border-border/30 last:border-0 transition-colors",
      isChecked ? 'bg-primary/5' : 'hover:bg-muted/30'
    )}>
      <div className="flex-shrink-0 mr-3 pt-0.5">
        <Checkbox
          id={`check-${condition.id}`}
          checked={isChecked}
          onCheckedChange={handleCheck}
          className="h-4 w-4"
        />
      </div>
      
      <div className="flex-1 min-w-0">
        <label
          htmlFor={`check-${condition.id}`}
          className="text-sm font-medium cursor-pointer flex-1"
        >
          {/* Using .label, which is the correct property for the condition's name */}
          {condition.label || "Untitled condition"} 
        </label>
        
        {condition.description && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {condition.description}
          </p>
        )}
      </div>
    </div>
  );
}

interface StrategyChecklistProps {
  strategy: TradingStrategy | null;
  strategyChecks: StrategyConditionCheck[];
  onCheckChange: (id: string, passed: boolean) => void;
}

export function StrategyChecklist({
  strategy,
  strategyChecks = [],
  onCheckChange
}: StrategyChecklistProps) {

  if (!strategy) {
    return (
      <div className="text-sm text-muted-foreground py-4 text-center">
        Please select a strategy to see the checklist.
      </div>
    );
  }

  const renderConditionSection = (title: string, conditions: StrategyCondition[] | undefined, accordionValue: string) => {
    const conditionList = conditions || [];
    if (conditionList.length === 0) return null;

    const passedCount = conditionList.reduce((acc, condition) => {
      const check = strategyChecks.find(c => c.conditionId === condition.id);
      return acc + (check && check.passed ? 1 : 0);
    }, 0);

    return (
      <AccordionItem value={accordionValue} className="border-b-0">
        <AccordionTrigger className="py-1.5 h-9 text-sm hover:bg-muted/20 px-2 rounded-md">
          <div className="flex items-center justify-between w-full">
            <span className="font-medium">{title}</span>
            <Badge variant="outline" className="h-5 px-1.5 bg-background">
              {passedCount}/{conditionList.length}
            </Badge>
          </div>
        </AccordionTrigger>
        <AccordionContent className="pt-1 pb-1 px-0">
          <div className="rounded-md overflow-hidden border border-border/40">
            {conditionList.map((condition, index) => (
              <StrategyCheckItem
                key={condition.id || `${accordionValue}-${index}`}
                condition={condition}
                check={strategyChecks.find(c => c.conditionId === condition.id)}
                onCheckChange={onCheckChange}
              />
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    );
  };

  const rulesSection = renderConditionSection('Strategy Rules', strategy.rules, 'rules');
  const entrySection = renderConditionSection('Entry Conditions', strategy.entryConditions, 'entry');

  if (!rulesSection && !entrySection) {
      return (
       <div className="text-sm text-muted-foreground py-4 text-center">
        This strategy has no conditions defined.
      </div>
    );
  }

  return (
    <Accordion type="multiple" defaultValue={['rules', 'entry']} className="w-full">
      {rulesSection}
      {entrySection}
    </Accordion>
  );
}
