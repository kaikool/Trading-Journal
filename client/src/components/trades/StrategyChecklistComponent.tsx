import { useEffect } from "react";
import { StrategyCondition, StrategyConditionCheck, TradingStrategy } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";

import { Icons } from "@/components/icons/icons";

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
    <div className="p-3 hover:bg-muted/5 transition-colors">
      <div className="flex items-start gap-3">
        {/* Checkbox with better styling */}
        <div className="flex-shrink-0 mt-0.5">
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
            className="h-4 w-4 border-primary/40 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
          />
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <label
              htmlFor={`check-${check.conditionId}`}
              className="text-sm font-medium cursor-pointer flex-1"
            >
              {condition.label || "Untitled condition"}
            </label>
            
            {/* Passed status */}
            {check.checked && (
              <Badge 
                variant={check.passed ? "default" : "outline"} 
                className={`text-[10px] h-4 px-1.5 ml-2 ${check.passed 
                  ? "bg-success/20 hover:bg-success/20 text-success border-success/20" 
                  : "bg-destructive/10 hover:bg-destructive/10 text-destructive border-destructive/20"}`}
              >
                {check.passed 
                  ? <span className="flex items-center"><Icons.ui.check className="h-2.5 w-2.5 mr-0.5" />Passed</span> 
                  : <span className="flex items-center"><Icons.ui.x className="h-2.5 w-2.5 mr-0.5" />Failed</span>}
              </Badge>
            )}
          </div>
          
          {/* Show details with improved badges */}
          <div className="flex flex-wrap gap-1.5 mb-1.5">
            {/* Indicator */}
            {condition.indicator && (
              <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/20 text-[10px] h-5 px-1.5">
                <Icons.analytics.activity className="h-2.5 w-2.5 mr-1" />
                {condition.indicator}
              </Badge>
            )}
            
            {/* Timeframe */}
            {condition.timeframe && (
              <Badge variant="secondary" className="bg-muted/30 text-muted-foreground text-[10px] h-5 px-1.5">
                <Icons.general.clock className="h-2.5 w-2.5 mr-1" />
                {condition.timeframe}
              </Badge>
            )}
            
            {/* Expected value */}
            {condition.expectedValue && (
              <Badge variant="secondary" className="bg-muted/30 text-muted-foreground text-[10px] h-5 px-1.5">
                <Icons.general.target className="h-2.5 w-2.5 mr-1" />
                {condition.expectedValue}
              </Badge>
            )}
          </div>
          
          {/* Description with better styling */}
          {condition.description && (
            <p className="text-xs text-muted-foreground bg-muted/5 p-1.5 rounded-md border border-border/30">
              {condition.description}
            </p>
          )}
          
          {/* Notes field */}
          {check.checked && check.passed && (
            <div className="mt-2">
              <Input
                placeholder="Add notes about this condition..."
                value={check.notes || ""}
                onChange={(e) => onChange({ ...check, notes: e.target.value })}
                className="text-xs h-7 px-2 border-primary/20 focus:border-primary"
              />
            </div>
          )}
        </div>
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
    <div className="space-y-4">
      {showCompliance && (
        <div className="bg-muted/5 border border-border/30 p-3 rounded-lg mb-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div>
                <h3 className="text-sm font-medium flex items-center">
                  <Icons.ui.checkCircle className="h-3.5 w-3.5 mr-1.5 text-primary" />
                  Strategy Checklist
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {value.filter(c => c.checked && c.passed).length} of {(strategy.rules?.length || 0) + (strategy.entryConditions?.length || 0)} conditions met
                </p>
              </div>
            </div>
          </div>
        </div>  
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Strategy Rules */}
        {rulesWithChecks.length > 0 && (
          <div className="rounded-md border border-border/30 overflow-hidden bg-background/50">
            <div className="flex items-center justify-between border-b border-border/30 bg-muted/5 px-3 py-2">
              <div className="flex items-center gap-1.5">
                <Icons.nav.analytics className="h-3.5 w-3.5 text-primary" />
                <span className="text-sm font-medium">Strategy Rules</span>
              </div>
              <Badge variant="outline" className="h-5 px-1.5 bg-primary/5 text-xs">
                {rulesWithChecks.filter(r => r.check.checked && r.check.passed).length}/{rulesWithChecks.length}
              </Badge>
            </div>
            <div className="divide-y divide-border/30">
              {rulesWithChecks.map(({ condition, check }, index) => (
                <StrategyCheckItem
                  key={`rule-${condition.id || index}`}
                  condition={condition}
                  check={check}
                  onChange={handleCheckChange}
                />
              ))}
            </div>
          </div>
        )}
        
        {/* Entry Conditions */}
        {entryConditionsWithChecks.length > 0 && (
          <div className="rounded-md border border-border/30 overflow-hidden bg-background/50">
            <div className="flex items-center justify-between border-b border-border/30 bg-muted/5 px-3 py-2">
              <div className="flex items-center gap-1.5">
                <Icons.trade.entry className="h-3.5 w-3.5 text-primary" />
                <span className="text-sm font-medium">Entry Conditions</span>
              </div>
              <Badge variant="outline" className="h-5 px-1.5 bg-primary/5 text-xs">
                {entryConditionsWithChecks.filter(r => r.check.checked && r.check.passed).length}/{entryConditionsWithChecks.length}
              </Badge>
            </div>
            <div className="divide-y divide-border/30">
              {entryConditionsWithChecks.map(({ condition, check }, index) => (
                <StrategyCheckItem
                  key={`entry-${condition.id || index}`}
                  condition={condition}
                  check={check}
                  onChange={handleCheckChange}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}