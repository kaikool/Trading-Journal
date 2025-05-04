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
 * Component for displaying input form for a strategy condition
 */
export function StrategyConditionForm({
  condition,
  onChange,
  onAdd,
  onCancel,
  isNew = false
}: StrategyConditionFormProps) {
  return (
    <div className="mb-4 p-4 border rounded-md bg-card/50 w-full max-w-full sm:max-w-[800px]">
      <div className="space-y-4">
        <div>
          <Label htmlFor={`condition-label-${condition.id}`}>Condition</Label>
          <Input 
            id={`condition-label-${condition.id}`}
            placeholder="Example: EMA 50 uptrend"
            value={condition.label}
            onChange={(e) => onChange({ ...condition, label: e.target.value })}
            className="mb-1"
          />
          <p className="text-xs text-muted-foreground">
            Brief description of the condition (displayed in the list)
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <Label htmlFor={`condition-indicator-${condition.id}`}>
              <Activity className="h-3 w-3 inline mr-1" />
              Indicator
            </Label>
            <Select
              value={condition.indicator}
              onValueChange={(value) => onChange({ ...condition, indicator: value })}
            >
              <SelectTrigger id={`condition-indicator-${condition.id}`} className="w-full">
                <SelectValue placeholder="Select indicator" />
              </SelectTrigger>
              <SelectContent className="min-w-[200px] max-h-[300px]">
                {COMMON_INDICATORS.map(indicator => (
                  <SelectItem key={indicator} value={indicator}>
                    {indicator}
                  </SelectItem>
                ))}
                <SelectItem value="custom">Custom...</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor={`condition-timeframe-${condition.id}`}>
              <Clock className="h-3 w-3 inline mr-1" />
              Timeframe
            </Label>
            <Select
              value={condition.timeframe}
              onValueChange={(value) => onChange({ ...condition, timeframe: value })}
            >
              <SelectTrigger id={`condition-timeframe-${condition.id}`} className="w-full">
                <SelectValue placeholder="Select timeframe" />
              </SelectTrigger>
              <SelectContent className="min-w-[150px] max-h-[300px]">
                {COMMON_TIMEFRAMES.map(timeframe => (
                  <SelectItem key={timeframe} value={timeframe}>
                    {timeframe}
                  </SelectItem>
                ))}
                <SelectItem value="custom">Custom...</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor={`condition-value-${condition.id}`}>
              <Target className="h-3 w-3 inline mr-1" />
              Expected Value
            </Label>
            <Select
              value={condition.expectedValue}
              onValueChange={(value) => onChange({ ...condition, expectedValue: value })}
            >
              <SelectTrigger id={`condition-value-${condition.id}`} className="w-full">
                <SelectValue placeholder="Select value" />
              </SelectTrigger>
              <SelectContent className="min-w-[180px]">
                {COMMON_EXPECTED_VALUES.map(value => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
                <SelectItem value="custom">Custom...</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div>
          <Label htmlFor={`condition-description-${condition.id}`}>
            <Info className="h-3 w-3 inline mr-1" />
            Detailed Description (optional)
          </Label>
          <Textarea
            id={`condition-description-${condition.id}`}
            placeholder="Detailed description of this condition..."
            value={condition.description || ""}
            onChange={(e) => onChange({ ...condition, description: e.target.value })}
            className="h-20"
          />
        </div>
        
        <div className="flex justify-end space-x-2 pt-2">
          {onCancel && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={onCancel}
            >
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
          )}
          
          {isNew && onAdd ? (
            <Button
              variant="default"
              size="sm" 
              onClick={onAdd}
              disabled={!condition.label.trim()}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Condition
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onChange(condition)}
              disabled={!condition.label.trim()}
            >
              <Save className="h-4 w-4 mr-1" />
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
 * Component for displaying a saved strategy condition
 */
export function StrategyConditionItem({
  condition,
  onEdit,
  onDelete
}: StrategyConditionItemProps) {
  return (
    <div className="flex items-center justify-between py-2 group">
      <div className="flex-1">
        <div className="font-medium">{condition.label}</div>
        <div className="flex flex-wrap gap-1 mt-1">
          {condition.indicator && (
            <Badge variant="outline" className="text-xs">
              <Activity className="h-3 w-3 mr-1" />
              {condition.indicator}
            </Badge>
          )}
          
          {condition.timeframe && (
            <Badge variant="outline" className="text-xs">
              <Clock className="h-3 w-3 mr-1" />
              {condition.timeframe}
            </Badge>
          )}
          
          {condition.expectedValue && (
            <Badge variant="outline" className="text-xs">
              <Target className="h-3 w-3 mr-1" />
              {condition.expectedValue}
            </Badge>
          )}
        </div>
        
        {condition.description && (
          <p className="text-xs text-muted-foreground mt-1">
            {condition.description}
          </p>
        )}
      </div>
      
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-7 w-7"
          onClick={() => onEdit(condition.id)}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => onDelete(condition.id)}
        >
          <Trash2 className="h-3.5 w-3.5" />
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
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {icon}
          <h4 className="text-sm font-medium ml-1">{title}</h4>
        </div>
        
        {!isAdding && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsAdding(true)}
            className="h-7 px-2 text-xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add
          </Button>
        )}
      </div>
      
      {conditions.length === 0 && !isAdding ? (
        <p className="text-sm text-muted-foreground py-2">{emptyMessage}</p>
      ) : (
        <div className="space-y-1">
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
      
      {isAdding && (
        <StrategyConditionForm
          condition={newCondition}
          onChange={setNewCondition}
          onAdd={handleAdd}
          onCancel={() => setIsAdding(false)}
          isNew
        />
      )}
    </div>
  );
}