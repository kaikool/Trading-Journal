import { useState } from "react";
import { StrategyCondition } from "@/types";
import { v4 as uuidv4 } from "uuid";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  Plus, 
  Trash2, 
  Edit,
  Save,
  X,
  LineChart,
  Clock,
  Target,
  Activity,
  Info,
  Pencil
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

// Create a new StrategyCondition with default values
export const createNewCondition = (order: number): StrategyCondition => ({
  id: uuidv4(),
  label: "",
  order,
  indicator: undefined,
  timeframe: undefined,
  expectedValue: undefined,
  description: undefined
});

interface StrategyConditionFormProps {
  condition: StrategyCondition;
  onChange: (condition: StrategyCondition) => void;
  onAdd?: () => void;
  onCancel?: () => void;
  isNew?: boolean;
}

/**
 * Component for displaying input form for a strategy condition - compact, modern design
 */
export function StrategyConditionForm({
  condition,
  onChange,
  onAdd,
  onCancel,
  isNew = false
}: StrategyConditionFormProps) {
  return (
    <div className="mb-3 p-3 border rounded-md bg-card/60 w-full shadow-sm">
      <div className="space-y-2.5">
        {/* Main condition input with improved appearance */}
        <div className="relative">
          <Label 
            htmlFor={`condition-label-${condition.id}`}
            className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
          >
            Condition
          </Label>
          <Input 
            id={`condition-label-${condition.id}`}
            placeholder="Example: EMA 50 uptrend"
            value={condition.label}
            onChange={(e) => onChange({ ...condition, label: e.target.value })}
            className="mt-1 focus-visible:ring-1 border-muted/60"
          />
          <p className="text-xs text-muted-foreground mt-1 opacity-80">
            Brief, specific name for this condition
          </p>
        </div>
        
        {/* Responsive grid layout that adapts to screen size */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div>
            <Label 
              htmlFor={`condition-indicator-${condition.id}`}
              className="text-xs font-medium mb-1 flex items-center"
            >
              <Activity className="h-3 w-3 inline mr-1 text-primary/70" />
              Indicator
            </Label>
            <Select
              value={condition.indicator}
              onValueChange={(value) => onChange({ ...condition, indicator: value })}
            >
              <SelectTrigger 
                id={`condition-indicator-${condition.id}`} 
                className="w-full h-8 text-sm bg-background/50 focus:ring-1"
              >
                <SelectValue placeholder="Select indicator" />
              </SelectTrigger>
              <SelectContent className="min-w-[200px] max-h-[300px]">
                {COMMON_INDICATORS.map(indicator => (
                  <SelectItem key={indicator} value={indicator} className="text-sm">
                    {indicator}
                  </SelectItem>
                ))}
                <SelectItem value="custom" className="text-sm italic">Custom...</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label 
              htmlFor={`condition-timeframe-${condition.id}`}
              className="text-xs font-medium mb-1 flex items-center"
            >
              <Clock className="h-3 w-3 inline mr-1 text-primary/70" />
              Timeframe
            </Label>
            <Select
              value={condition.timeframe}
              onValueChange={(value) => onChange({ ...condition, timeframe: value })}
            >
              <SelectTrigger 
                id={`condition-timeframe-${condition.id}`} 
                className="w-full h-8 text-sm bg-background/50 focus:ring-1"
              >
                <SelectValue placeholder="Select timeframe" />
              </SelectTrigger>
              <SelectContent className="min-w-[150px] max-h-[300px]">
                {COMMON_TIMEFRAMES.map(timeframe => (
                  <SelectItem key={timeframe} value={timeframe} className="text-sm">
                    {timeframe}
                  </SelectItem>
                ))}
                <SelectItem value="custom" className="text-sm italic">Custom...</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label 
              htmlFor={`condition-value-${condition.id}`}
              className="text-xs font-medium mb-1 flex items-center"
            >
              <Target className="h-3 w-3 inline mr-1 text-primary/70" />
              Expected Value
            </Label>
            <Select
              value={condition.expectedValue}
              onValueChange={(value) => onChange({ ...condition, expectedValue: value })}
            >
              <SelectTrigger 
                id={`condition-value-${condition.id}`} 
                className="w-full h-8 text-sm bg-background/50 focus:ring-1"
              >
                <SelectValue placeholder="Select value" />
              </SelectTrigger>
              <SelectContent className="min-w-[180px]">
                {COMMON_EXPECTED_VALUES.map(value => (
                  <SelectItem key={value} value={value} className="text-sm">
                    {value}
                  </SelectItem>
                ))}
                <SelectItem value="custom" className="text-sm italic">Custom...</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Description area with compact height */}
        <div>
          <Label 
            htmlFor={`condition-description-${condition.id}`}
            className="text-xs font-medium mb-1 flex items-center"
          >
            <Info className="h-3 w-3 inline mr-1 text-primary/70" />
            Details (optional)
          </Label>
          <Textarea
            id={`condition-description-${condition.id}`}
            placeholder="Additional details about this condition..."
            value={condition.description || ""}
            onChange={(e) => onChange({ ...condition, description: e.target.value })}
            className="h-14 text-sm resize-none focus-visible:ring-1 border-muted/60"
          />
        </div>
        
        {/* Action buttons with improved design */}
        <div className="flex justify-end space-x-2 pt-1.5">
          {onCancel && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onCancel}
              className="h-8 px-3 text-xs font-normal"
            >
              <X className="h-3.5 w-3.5 mr-1 opacity-70" />
              Cancel
            </Button>
          )}
          
          {isNew && onAdd ? (
            <Button
              variant="default"
              size="sm" 
              onClick={onAdd}
              disabled={!condition.label.trim()}
              className="h-8 px-3 text-xs"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Add Condition
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onChange(condition)}
              disabled={!condition.label.trim()}
              className="h-8 px-3 text-xs"
            >
              <Save className="h-3.5 w-3.5 mr-1.5" />
              Update
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

interface StrategyConditionItemProps {
  condition: StrategyCondition;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

/**
 * Component for displaying a saved strategy condition with modern compact design
 */
export function StrategyConditionItem({
  condition,
  onEdit,
  onDelete
}: StrategyConditionItemProps) {
  return (
    <div className="flex items-start justify-between py-2 px-2.5 group rounded-md hover:bg-muted/30 transition-colors border border-transparent hover:border-muted/50">
      <div className="flex-1 min-w-0">
        {/* Title with hover effect */}
        <div className="font-medium text-sm truncate flex items-center">
          {condition.label}
          {condition.description && (
            <div className="relative ml-1.5 group/tooltip">
              <Info className="h-3 w-3 text-muted-foreground/70 cursor-help" />
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 p-2 bg-popover text-popover-foreground text-xs rounded shadow-md w-48 invisible group-hover/tooltip:visible opacity-0 group-hover/tooltip:opacity-100 transition-opacity z-50">
                {condition.description}
              </div>
            </div>
          )}
        </div>
        
        {/* Badges in a compact row with subtle styling */}
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          {condition.indicator && (
            <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-normal bg-muted/50 hover:bg-muted/80">
              <Activity className="h-2.5 w-2.5 mr-0.5 text-primary/70" />
              {condition.indicator}
            </Badge>
          )}
          
          {condition.timeframe && (
            <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-normal bg-muted/50 hover:bg-muted/80">
              <Clock className="h-2.5 w-2.5 mr-0.5 text-primary/70" />
              {condition.timeframe}
            </Badge>
          )}
          
          {condition.expectedValue && (
            <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-normal bg-muted/50 hover:bg-muted/80">
              <Target className="h-2.5 w-2.5 mr-0.5 text-primary/70" />
              {condition.expectedValue}
            </Badge>
          )}
        </div>
      </div>
      
      {/* Action buttons with smoother hover effect */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity self-center ml-1.5">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6 rounded-full hover:bg-primary/10 hover:text-primary"
          onClick={() => onEdit(condition.id)}
          title="Edit condition"
        >
          <Pencil className="h-3 w-3" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6 rounded-full hover:bg-destructive/10 hover:text-destructive"
          onClick={() => onDelete(condition.id)}
          title="Delete condition"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

interface StrategyConditionListProps {
  conditions: StrategyCondition[];
  onAdd: (condition: StrategyCondition) => void;
  onUpdate: (id: string, updates: Partial<StrategyCondition>) => void;
  onDelete: (id: string) => void;
  title: string;
  emptyMessage: string;
  icon?: React.ReactNode;
}

/**
 * Component for displaying and managing a list of strategy conditions
 * Redesigned for a more modern, compact, and responsive appearance
 */
export function StrategyConditionList({
  conditions = [],
  onAdd,
  onUpdate,
  onDelete,
  title,
  emptyMessage,
  icon
}: StrategyConditionListProps) {
  const [newCondition, setNewCondition] = useState<StrategyCondition>(
    createNewCondition(conditions.length)
  );
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const handleAdd = () => {
    if (newCondition.label.trim()) {
      onAdd(newCondition);
      setNewCondition(createNewCondition(conditions.length + 1));
      setIsAdding(false);
    }
  };
  
  const handleEdit = (id: string) => {
    setEditingId(id);
  };
  
  const handleUpdate = (updatedCondition: StrategyCondition) => {
    onUpdate(updatedCondition.id, updatedCondition);
    setEditingId(null);
  };
  
  return (
    <div className="space-y-2 bg-background/50 rounded-lg border border-border/30 p-3 shadow-sm">
      {/* Header with modern styling */}
      <div className="flex items-center justify-between pb-1.5">
        <div className="flex items-center gap-1.5">
          {icon && <div className="text-primary/70">{icon}</div>}
          {title && (
            <h4 className="text-sm font-medium tracking-tight">
              {title}
              {conditions.length > 0 && (
                <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                  ({conditions.length})
                </span>
              )}
            </h4>
          )}
        </div>
        
        {!isAdding && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsAdding(true)}
            className="h-7 px-2 text-xs hover:bg-primary/10 hover:text-primary"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add
          </Button>
        )}
      </div>
      
      {/* Separator line for visual clarity */}
      {(conditions.length > 0 || isAdding) && (
        <Separator className="bg-border/40 my-1" />
      )}
      
      {/* Empty state with better styling */}
      {conditions.length === 0 && !isAdding ? (
        <div className="text-sm text-muted-foreground py-3 px-1.5 flex items-center justify-center bg-muted/30 rounded-md">
          <p className="text-center text-xs opacity-80">{emptyMessage}</p>
        </div>
      ) : (
        <div className={cn(
          "space-y-0.5",
          conditions.length > 4 && "max-h-[280px] overflow-y-auto pr-1 scrollbar-thin"
        )}>
          {conditions.map(condition => 
            editingId === condition.id ? (
              <StrategyConditionForm
                key={condition.id}
                condition={condition}
                onChange={handleUpdate}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <StrategyConditionItem
                key={condition.id}
                condition={condition}
                onEdit={handleEdit}
                onDelete={onDelete}
              />
            )
          )}
        </div>
      )}
      
      {/* Add form with smooth transition */}
      {isAdding && (
        <div className="mt-2 animate-in fade-in slide-in-from-top-1 duration-200">
          <StrategyConditionForm
            condition={newCondition}
            onChange={setNewCondition}
            onAdd={handleAdd}
            onCancel={() => setIsAdding(false)}
            isNew
          />
        </div>
      )}
    </div>
  );
}