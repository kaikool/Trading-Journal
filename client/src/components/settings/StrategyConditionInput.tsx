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
  Pencil,
  Check,
  ChevronRight,
  ArrowDown,
  Settings2
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
export function createNewCondition(order: number): StrategyCondition {
  return {
    id: uuidv4(),
    label: "",
    order,
    indicator: undefined,
    timeframe: undefined,
    expectedValue: undefined,
    description: undefined
  };
}

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
  const [advancedMode, setAdvancedMode] = useState(false);
  
  return (
    <div className="mb-2 w-full bg-transparent border border-primary/5 rounded-md overflow-hidden shadow-sm">
      <div className="space-y-2 p-2">
        {/* Streamlined condition input with advanced toggle */}
        <div className="flex items-center gap-2">
          <Input 
            id={`condition-label-${condition.id}`}
            placeholder="Enter condition..."
            value={condition.label}
            onChange={(e) => {
              // Sử dụng bản sao mới tránh tham chiếu đối tượng gốc
              const updatedCondition = {
                ...condition,
                label: e.target.value
              };
              onChange(updatedCondition);
            }}
            className="h-8 text-sm flex-1"
          />
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setAdvancedMode(!advancedMode)}
            className="h-8 w-8 p-0 text-muted-foreground"
            title={advancedMode ? "Hide details" : "Show details"}
          >
            <Settings2 className="h-3.5 w-3.5" />
          </Button>
        </div>
        
        {/* Advanced options */}
        {advancedMode && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2 bg-muted/20 p-2 rounded-sm">
            <div>
              <Label className="text-[10px] text-muted-foreground mb-1 flex items-center">
                <Activity className="h-3 w-3 mr-1" />
                Indicator
              </Label>
              <Select
                value={condition.indicator}
                onValueChange={(value) => {
                  const updatedCondition = {
                    ...condition,
                    indicator: value
                  };
                  onChange(updatedCondition);
                }}
              >
                <SelectTrigger 
                  id={`condition-indicator-${condition.id}`} 
                  className="h-7 text-xs"
                >
                  <SelectValue placeholder="Select indicator" />
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

            <div>
              <Label className="text-[10px] text-muted-foreground mb-1 flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                Timeframe
              </Label>
              <Select
                value={condition.timeframe}
                onValueChange={(value) => onChange({...condition, timeframe: value})}
              >
                <SelectTrigger 
                  id={`condition-timeframe-${condition.id}`} 
                  className="h-7 text-xs"
                >
                  <SelectValue placeholder="Select timeframe" />
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
            
            <div>
              <Label className="text-[10px] text-muted-foreground mb-1 flex items-center">
                <Target className="h-3 w-3 mr-1" />
                Value
              </Label>
              <Select
                value={condition.expectedValue}
                onValueChange={(value) => onChange({...condition, expectedValue: value})}
              >
                <SelectTrigger 
                  id={`condition-value-${condition.id}`} 
                  className="h-7 text-xs"
                >
                  <SelectValue placeholder="Select value" />
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
            
            <div className="md:col-span-3 mt-1">
              <Label className="text-[10px] text-muted-foreground mb-1 flex items-center">
                <Info className="h-3 w-3 mr-1" />
                Description (optional)
              </Label>
              <Textarea
                id={`condition-description-${condition.id}`}
                placeholder="Add more details about this condition..."
                value={condition.description || ""}
                onChange={(e) => onChange({...condition, description: e.target.value})}
                className="text-xs resize-none min-h-[40px] max-h-[80px]"
              />
            </div>
          </div>
        )}
        
        {/* Action buttons in a clean footer */}
        <div className="flex justify-end gap-2 pt-1 border-t border-border/10 mt-2">
          {onCancel && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onCancel}
              className="h-7 px-2 text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Cancel
            </Button>
          )}
          
          {isNew && onAdd ? (
            <Button
              variant="default"
              size="sm" 
              onClick={onAdd}
              disabled={!condition.label.trim()}
              className="h-7 px-3 text-xs"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add
            </Button>
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onChange({...condition});
              }}
              disabled={!condition.label.trim()}
              className="h-7 px-3 text-xs"
            >
              <Check className="h-3 w-3 mr-1" />
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
 * Component for displaying a saved strategy condition with modern minimalistic design
 */
export function StrategyConditionItem({
  condition,
  onEdit,
  onDelete
}: StrategyConditionItemProps) {
  const hasDetails = condition.indicator || condition.timeframe || condition.expectedValue || condition.description;
  
  return (
    <div className="group py-1.5 px-2.5 border rounded-md mb-1.5 bg-background hover:bg-muted/20 transition-colors">
      <div className="flex items-center justify-between gap-3">
        {/* Main condition with badge indicators */}
        <div className="flex-1 flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <div className="font-medium text-sm">
              {condition.label}
            </div>
            {/* Only show indicators if they exist */}
            {hasDetails && (
              <div className="flex items-center gap-1">
                {condition.indicator && (
                  <Badge variant="outline" className="px-1 h-4 text-[9px] bg-primary/5 font-normal">
                    <Activity className="h-2 w-2 mr-0.5" />
                    {condition.indicator}
                  </Badge>
                )}
                
                {condition.timeframe && (
                  <Badge variant="outline" className="px-1 h-4 text-[9px] bg-blue-500/5 border-blue-500/20 text-blue-600 dark:text-blue-400 font-normal">
                    <Clock className="h-2 w-2 mr-0.5" />
                    {condition.timeframe}
                  </Badge>
                )}
                
                {condition.expectedValue && (
                  <Badge variant="outline" className="px-1 h-4 text-[9px] bg-green-500/5 border-green-500/20 text-green-600 dark:text-green-400 font-normal">
                    <Target className="h-2 w-2 mr-0.5" />
                    {condition.expectedValue}
                  </Badge>
                )}
              </div>
            )}
          </div>
          
          {/* Description - only show if it exists */}
          {condition.description && (
            <div className="text-[10px] text-muted-foreground line-clamp-1 pl-1 mt-0.5">
              {condition.description}
            </div>
          )}
        </div>
        
        {/* Action buttons */}
        <div className="flex gap-1">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 w-6 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => onEdit(condition.id)}
            title="Edit"
          >
            <Edit className="h-3 w-3 text-muted-foreground" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 w-6 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => onDelete(condition.id)}
            title="Delete"
          >
            <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
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
 * Modern, clean design optimized for responsive displays
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
    <div className="mb-4">
      {/* Modern header with count badge */}
      {(title || !hideAddbutton) && (
        <div className="flex items-center justify-between mb-2">
          {title && (
            <div className="flex items-center gap-1">
              {icon && <span className="text-muted-foreground">{icon}</span>}
              <span className="font-medium text-sm text-foreground/90">
                {title}
                {conditions.length > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                    {conditions.length}
                  </Badge>
                )}
              </span>
            </div>
          )}
          
          {/* Consistent Add button */}
          {!isAdding && !hideAddbutton && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAdding(true)}
              className="h-7 px-2 text-xs"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add
            </Button>
          )}
        </div>
      )}
      
      {/* Content area with conditions */}
      <div className={cn(
        "space-y-0.5",
        conditions.length > 8 && "max-h-[320px] overflow-y-auto pr-1"
      )}>
        {/* Empty state - modern but minimal */}
        {conditions.length === 0 && !isAdding ? (
          <div className="text-xs text-muted-foreground border border-dashed border-border/50 rounded-md p-3 text-center">
            {emptyMessage}
          </div>
        ) : (
          /* Condition items list */
          <div className="space-y-0">
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
      </div>
      
      {/* Add new condition form */}
      {isAdding && (
        <div className="animate-in fade-in-50 slide-in-from-top-1 duration-100 mt-2">
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