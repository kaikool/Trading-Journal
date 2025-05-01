import { useEffect } from "react";
import { StrategyCondition, StrategyConditionCheck, TradingStrategy } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";

import {
  Activity,
  Clock,
  Target,
  LineChart,
  ArrowRightLeft
} from "lucide-react";

interface StrategyCheckItemProps {
  condition: StrategyCondition;
  check: StrategyConditionCheck;
  onChange: (check: StrategyConditionCheck) => void;
}

/**
 * Individual strategy condition check item component
 */
export function StrategyCheckItem({ condition, check, onChange }: StrategyCheckItemProps) {
  return (
    <div className="flex items-start py-2 px-2 border-b border-border/30 last:border-0 hover:bg-muted/20">
      {/* Simple checkbox that toggles passed status directly */}
      <div className="flex-shrink-0 mr-3 pt-0.5">
        <Checkbox
          id={`check-${check.conditionId}`}
          checked={check.passed}
          onCheckedChange={(checked) => {
            onChange({
              ...check,
              checked: true, // Always mark as checked when user interacts with it
              passed: checked === true // Update the passed state based on checkbox
            });
          }}
          className="h-4 w-4"
        />
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <label
            htmlFor={`check-${check.conditionId}`}
            className="text-sm font-medium cursor-pointer flex-1"
          >
            {condition.label || "Untitled condition"}
          </label>
        </div>
        
        {/* Show details with appropriate badges */}
        <div className="mt-1 flex flex-wrap gap-1">
          {/* Indicator */}
          {condition.indicator && (
            <Badge variant="secondary" className="text-xs h-5 px-1.5">
              <Activity className="h-3 w-3 mr-1" />
              {condition.indicator}
            </Badge>
          )}
          
          {/* Timeframe */}
          {condition.timeframe && (
            <Badge variant="secondary" className="text-xs h-5 px-1.5">
              <Clock className="h-3 w-3 mr-1" />
              {condition.timeframe}
            </Badge>
          )}
          
          {/* Expected value */}
          {condition.expectedValue && (
            <Badge variant="secondary" className="text-xs h-5 px-1.5">
              <Target className="h-3 w-3 mr-1" />
              {condition.expectedValue}
            </Badge>
          )}
        </div>
        
        {/* Description with better styling */}
        {condition.description && (
          <p className="text-xs text-foreground mt-1">
            {condition.description}
          </p>
        )}
        
        {/* Notes field */}
        {check.checked && check.passed && (
          <div className="mt-1.5">
            <Input
              placeholder="Add notes..."
              value={check.notes || ""}
              onChange={(e) => onChange({ ...check, notes: e.target.value })}
              className="text-xs h-6 px-2"
            />
          </div>
        )}
      </div>
    </div>
  );
}

interface StrategyChecklistProps {
  strategy: TradingStrategy | null;
  value: StrategyConditionCheck[];
  onChange: (checks: StrategyConditionCheck[]) => void;
  showCompliance?: boolean;
}

/**
 * Strategy checklist component for trade form
 */
export function StrategyChecklist({
  strategy,
  value = [],
  onChange,
  showCompliance = true
}: StrategyChecklistProps) {
  // Initialize checks when strategy changes
  useEffect(() => {
    if (!strategy) return;
    
    // Create checks for each condition if not already present
    const createChecksForConditions = (
      conditions: StrategyCondition[],
      existingChecks: StrategyConditionCheck[]
    ): StrategyConditionCheck[] => {
      return conditions.map(condition => {
        // Find existing check for this condition
        const existingCheck = existingChecks.find(c => c.conditionId === condition.id);
        
        // Return existing check or create a new one
        return existingCheck || {
          conditionId: condition.id,
          checked: false,
          passed: false
        };
      });
    };
    
    // Get all existing checks
    const existingChecks = [...value];
    
    // Create new arrays of checks
    const ruleChecks = createChecksForConditions(strategy.rules || [], existingChecks);
    const entryChecks = createChecksForConditions(strategy.entryConditions || [], existingChecks);
    
    // Combine all checks and update state
    const allChecks = [...ruleChecks, ...entryChecks];
    
    // Only update if checks have changed
    if (JSON.stringify(allChecks) !== JSON.stringify(value)) {
      onChange(allChecks);
    }
  }, [strategy, value, onChange]);
  

  
  // Handle checking a condition
  const handleCheckChange = (updatedCheck: StrategyConditionCheck) => {
    const newChecks = value.map(check => 
      check.conditionId === updatedCheck.conditionId ? updatedCheck : check
    );
    
    onChange(newChecks);
  };
  
  if (!strategy) {
    return (
      <div className="text-sm text-muted-foreground py-4 text-center">
        Please select a strategy to see the checklist
      </div>
    );
  }
  
  // Get all conditions and corresponding checks
  const getRulesWithChecks = () => {
    if (!strategy.rules?.length) return [];
    
    return strategy.rules.map((condition, index) => {
      // Ensure each condition has a valid id
      if (!condition.id) {
        condition = { ...condition, id: `rule-${index}` };
      }
      
      return {
        condition,
        check: value.find(check => check.conditionId === condition.id) || {
          conditionId: condition.id,
          checked: false,
          passed: false
        }
      };
    });
  };
  
  const getEntryConditionsWithChecks = () => {
    if (!strategy.entryConditions?.length) return [];
    
    return strategy.entryConditions.map((condition, index) => {
      // Ensure each condition has a valid id
      if (!condition.id) {
        condition = { ...condition, id: `entry-${index}` };
      }
      
      return {
        condition,
        check: value.find(check => check.conditionId === condition.id) || {
          conditionId: condition.id,
          checked: false,
          passed: false
        }
      };
    });
  };
  
  const rulesWithChecks = getRulesWithChecks();
  const entryConditionsWithChecks = getEntryConditionsWithChecks();
  


  return (
    <div className="space-y-3">
      {showCompliance && (
        <div className="bg-background border p-2 rounded-md mb-1">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div>
                <h3 className="text-sm font-medium">Strategy Checklist</h3>
                <p className="text-xs text-muted-foreground">
                  {value.filter(c => c.checked && c.passed).length} of {(strategy.rules?.length || 0) + (strategy.entryConditions?.length || 0)} conditions met
                </p>
              </div>
            </div>
          </div>
        </div>  
      )}
      
      <Accordion type="multiple" defaultValue={["rules", "entry"]} className="w-full">
        {rulesWithChecks.length > 0 && (
          <AccordionItem value="rules" className="border-b border-border/50">
            <AccordionTrigger className="py-1.5 h-9 text-sm hover:bg-muted/20 px-2 rounded-md">
              <div className="flex items-center">
                <LineChart className="h-4 w-4 mr-1.5" />
                <span className="font-medium">Strategy Rules</span>
                <Badge variant="outline" className="ml-2 h-5 px-1.5 bg-background">
                  {rulesWithChecks.filter(r => r.check.checked && r.check.passed).length}/{rulesWithChecks.length}
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-1 pb-1 px-1">
              <div className="space-y-0 rounded-md overflow-hidden border border-border/40">
                {rulesWithChecks.map(({ condition, check }, index) => (
                  <StrategyCheckItem
                    key={`rule-${condition.id || index}`}
                    condition={condition}
                    check={check}
                    onChange={handleCheckChange}
                  />
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}
        
        {entryConditionsWithChecks.length > 0 && (
          <AccordionItem value="entry" className="border-b border-border/50">
            <AccordionTrigger className="py-1.5 h-9 text-sm hover:bg-muted/20 px-2 rounded-md">
              <div className="flex items-center">
                <ArrowRightLeft className="h-4 w-4 mr-1.5" />
                <span className="font-medium">Entry Conditions</span>
                <Badge variant="outline" className="ml-2 h-5 px-1.5 bg-background">
                  {entryConditionsWithChecks.filter(r => r.check.checked && r.check.passed).length}/{entryConditionsWithChecks.length}
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-1 pb-1 px-1">
              <div className="space-y-0 rounded-md overflow-hidden border border-border/40">
                {entryConditionsWithChecks.map(({ condition, check }, index) => (
                  <StrategyCheckItem
                    key={`entry-${condition.id || index}`}
                    condition={condition}
                    check={check}
                    onChange={handleCheckChange}
                  />
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    </div>
  );
}