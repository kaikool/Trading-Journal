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
    <div className="w-full">
      <div className="space-y-2">
        <Input 
          id={`condition-label-${condition.id}`}
          placeholder="Enter condition..." 
          value={condition.label}
          onChange={(e) => onChange({ ...condition, label: e.target.value })}
          className="h-9"
        />
        
        <div className="flex justify-end space-x-2">
          {onCancel && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={onCancel}
              className="h-8 px-3"
            >
              Cancel
            </Button>
          )}
          
          {isNew && onAdd ? (
            <Button
              variant="default"
              size="sm" 
              onClick={onAdd}
              disabled={!condition.label.trim()}
              className="h-8 px-3"
            >
              Add
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onChange(condition)}
              disabled={!condition.label.trim()}
              className="h-8 px-3"
            >
              Save
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
    <div className="flex items-center justify-between py-1 group">
      <div className="flex-1">
        <div className="text-sm">• {condition.label}</div>
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
          {icon && title && <h4 className="text-sm font-medium ml-1">{title}</h4>}
        </div>
        
        {!isAdding && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAdding(true)}
            className="h-8 px-3"
          >
            <Plus className="h-4 w-4 mr-2" />
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