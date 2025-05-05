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
 * Component for displaying input form for a strategy condition - minimalistic design
 */
export function StrategyConditionForm({
  condition,
  onChange,
  onAdd,
  onCancel,
  isNew = false
}: StrategyConditionFormProps) {
  return (
    <div className="mb-2 px-2 py-2 border-l-2 border-primary/20 w-full bg-transparent">
      <div className="space-y-2">
        {/* Minimalist condition input */}
        <div className="relative">
          <Input 
            id={`condition-label-${condition.id}`}
            placeholder="Enter condition..."
            value={condition.label}
            onChange={(e) => onChange({ ...condition, label: e.target.value })}
            className="border-0 border-b px-0 py-1 rounded-none text-sm font-medium focus-visible:ring-0 focus-visible:border-primary/50"
          />
        </div>
        
        {/* Ultra-clean selection layout */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-1.5 text-xs">
          <div className="flex flex-col">
            <Select
              value={condition.indicator}
              onValueChange={(value) => onChange({ ...condition, indicator: value })}
            >
              <SelectTrigger 
                id={`condition-indicator-${condition.id}`} 
                className="border-0 h-7 text-xs py-0 px-0 focus:ring-0 bg-transparent"
              >
                <div className="flex items-center gap-1">
                  <Activity className="h-3 w-3 text-muted-foreground" />
                  <SelectValue placeholder="Select indicator" />
                </div>
              </SelectTrigger>
              <SelectContent className="min-w-[160px] max-h-[280px]">
                {COMMON_INDICATORS.map(indicator => (
                  <SelectItem key={indicator} value={indicator} className="text-xs">
                    {indicator}
                  </SelectItem>
                ))}
                <SelectItem value="custom" className="text-xs italic">Custom...</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex flex-col">
            <Select
              value={condition.timeframe}
              onValueChange={(value) => onChange({ ...condition, timeframe: value })}
            >
              <SelectTrigger 
                id={`condition-timeframe-${condition.id}`} 
                className="border-0 h-7 text-xs py-0 px-0 focus:ring-0 bg-transparent"
              >
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <SelectValue placeholder="Select timeframe" />
                </div>
              </SelectTrigger>
              <SelectContent className="min-w-[120px] max-h-[280px]">
                {COMMON_TIMEFRAMES.map(timeframe => (
                  <SelectItem key={timeframe} value={timeframe} className="text-xs">
                    {timeframe}
                  </SelectItem>
                ))}
                <SelectItem value="custom" className="text-xs italic">Custom...</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex flex-col">
            <Select
              value={condition.expectedValue}
              onValueChange={(value) => onChange({ ...condition, expectedValue: value })}
            >
              <SelectTrigger 
                id={`condition-value-${condition.id}`} 
                className="border-0 h-7 text-xs py-0 px-0 focus:ring-0 bg-transparent"
              >
                <div className="flex items-center gap-1">
                  <Target className="h-3 w-3 text-muted-foreground" />
                  <SelectValue placeholder="Select value" />
                </div>
              </SelectTrigger>
              <SelectContent className="min-w-[160px]">
                {COMMON_EXPECTED_VALUES.map(value => (
                  <SelectItem key={value} value={value} className="text-xs">
                    {value}
                  </SelectItem>
                ))}
                <SelectItem value="custom" className="text-xs italic">Custom...</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Minimal description input - uses an expandable input that starts small */}
        <div className="pt-0.5">
          <div className="relative">
            <div className="absolute left-0 top-1.5 text-muted-foreground">
              <Info className="h-2.5 w-2.5" />
            </div>
            <Textarea
              id={`condition-description-${condition.id}`}
              placeholder="Optional details..."
              value={condition.description || ""}
              onChange={(e) => onChange({ ...condition, description: e.target.value })}
              className="text-xs resize-none border-0 bg-muted/30 pl-4 pt-1 pb-1 h-7 focus:h-12 transition-all duration-200 focus:outline-none focus:ring-0"
            />
          </div>
        </div>
        
        {/* Minimalistic action buttons */}
        <div className="flex justify-end gap-2 pt-1">
          {onCancel && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onCancel}
              className="h-6 w-6 p-0 rounded-full"
              title="Cancel"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
          
          {isNew && onAdd ? (
            <Button
              variant="ghost"
              size="sm" 
              onClick={onAdd}
              disabled={!condition.label.trim()}
              className="h-6 px-2 text-[10px] text-primary hover:text-primary hover:bg-primary/10"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onChange(condition)}
              disabled={!condition.label.trim()}
              className="h-6 w-6 p-0 rounded-full text-primary hover:bg-primary/10"
              title="Save changes"
            >
              <Save className="h-3 w-3" />
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
 * Component for displaying a saved strategy condition with ultra-minimalistic design
 */
export function StrategyConditionItem({
  condition,
  onEdit,
  onDelete
}: StrategyConditionItemProps) {
  return (
    <div className="group py-1 border-b border-border/10 last:border-b-0">
      <div className="flex items-center justify-between">
        {/* Main condition information with minimalist styling */}
        <div className="flex-1 flex items-center gap-2 overflow-hidden">
          {/* Condition label with compact styling */}
          <div className="font-medium text-sm truncate">
            {condition.label}
          </div>
          
          {/* Minimal micro indicators - just dots with tooltips */}
          <div className="flex items-center space-x-0.5">
            {condition.indicator && (
              <div className="relative group/tooltip">
                <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 py-1 px-1.5 bg-popover/90 text-[10px] rounded shadow-sm whitespace-nowrap invisible group-hover/tooltip:visible opacity-0 group-hover/tooltip:opacity-100 transition-opacity z-50">
                  <span className="flex items-center gap-1">
                    <Activity className="h-2 w-2" />
                    {condition.indicator}
                  </span>
                </div>
              </div>
            )}
            
            {condition.timeframe && (
              <div className="relative group/tooltip">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500/60" />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 py-1 px-1.5 bg-popover/90 text-[10px] rounded shadow-sm whitespace-nowrap invisible group-hover/tooltip:visible opacity-0 group-hover/tooltip:opacity-100 transition-opacity z-50">
                  <span className="flex items-center gap-1">
                    <Clock className="h-2 w-2" />
                    {condition.timeframe}
                  </span>
                </div>
              </div>
            )}
            
            {condition.expectedValue && (
              <div className="relative group/tooltip">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500/60" />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 py-1 px-1.5 bg-popover/90 text-[10px] rounded shadow-sm whitespace-nowrap invisible group-hover/tooltip:visible opacity-0 group-hover/tooltip:opacity-100 transition-opacity z-50">
                  <span className="flex items-center gap-1">
                    <Target className="h-2 w-2" />
                    {condition.expectedValue}
                  </span>
                </div>
              </div>
            )}
            
            {condition.description && (
              <div className="relative group/tooltip">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500/60" />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 py-1 px-1.5 bg-popover/90 text-[10px] rounded shadow-sm max-w-[180px] invisible group-hover/tooltip:visible opacity-0 group-hover/tooltip:opacity-100 transition-opacity z-50">
                  <span className="line-clamp-3">
                    {condition.description}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Ultra-minimal action buttons */}
        <div className="flex gap-px opacity-0 group-hover:opacity-100 transition-opacity">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-5 w-5 rounded-full"
            onClick={() => onEdit(condition.id)}
            title="Edit"
          >
            <Pencil className="h-2.5 w-2.5 text-muted-foreground" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-5 w-5 rounded-full"
            onClick={() => onDelete(condition.id)}
            title="Delete"
          >
            <Trash2 className="h-2.5 w-2.5 text-muted-foreground" />
          </Button>
        </div>
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
  hideAddbutton?: boolean;
}

/**
 * Component for displaying and managing a list of strategy conditions
 * Ultra-minimalistic design for efficient screen space usage
 */
export function StrategyConditionList({
  conditions = [],
  onAdd,
  onUpdate,
  onDelete,
  title,
  emptyMessage,
  icon,
  hideAddbutton = false
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
    <div className="border-l-2 border-primary/10 pl-3 py-0.5 mb-3">
      {/* Integrated header with add button inline */}
      <div className="flex items-center gap-x-1 mb-1">
        {icon && <div className="text-muted-foreground">{icon}</div>}
        {title && (
          <span className="text-xs font-medium text-foreground/80 flex-1">
            {title}
            {conditions.length > 0 && (
              <span className="ml-1 text-[10px] text-muted-foreground">
                {conditions.length}
              </span>
            )}
          </span>
        )}
        
        {/* Add button directly in the header row */}
        {!isAdding && !hideAddbutton && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsAdding(true)}
            className="h-4 px-1 text-[10px] text-muted-foreground hover:text-primary"
            title="Add condition"
          >
            <Plus className="h-2.5 w-2.5 mr-0.5" />
            Add
          </Button>
        )}
      </div>
      
      {/* Empty state - ultra minimal */}
      {conditions.length === 0 && !isAdding ? (
        <div className="text-[10px] text-muted-foreground/70 pl-1 py-1">
          {emptyMessage}
        </div>
      ) : (
        <div className={cn(
          "pl-0.5",
          conditions.length > 5 && "max-h-[220px] overflow-y-auto scrollbar-none"
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
      
      {/* Add form with clean transition */}
      {isAdding && (
        <div className="animate-in fade-in-50 duration-100 mt-1">
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