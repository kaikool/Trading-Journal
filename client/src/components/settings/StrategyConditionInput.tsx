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
  onSave?: () => void;
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
  onSave,
  isNew = false
}: StrategyConditionFormProps) {
  const [advancedMode, setAdvancedMode] = useState(false);
  
  return (
    <div className="mb-2 w-full bg-card/30 border border-border/30 rounded-md overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
      <div className="space-y-1.5 p-2">
        {/* Compact condition input with advanced toggle */}
        <div className="flex items-center gap-1.5">
          <Input 
            id={`condition-label-${condition.id}`}
            placeholder="Enter condition..."
            value={condition.label}
            onChange={(e) => onChange({...condition, label: e.target.value})}
            className="h-7 text-sm flex-1 bg-transparent"
          />
          
          <Button
            type="button"
            variant={advancedMode ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setAdvancedMode(!advancedMode)}
            className="h-7 w-7 p-0 text-muted-foreground"
            title={advancedMode ? "Hide details" : "Show details"}
          >
            <Settings2 className="h-3.5 w-3.5" />
          </Button>
        </div>
        
        {/* Compact, modern advanced options */}
        {advancedMode && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-1.5 bg-muted/10 p-2 rounded-md border border-border/30">
            <div>
              <Label className="text-[10px] font-medium text-primary/80 mb-1 flex items-center">
                <Activity className="h-3 w-3 mr-1" />
                Indicator
              </Label>
              <Select
                value={condition.indicator}
                onValueChange={(value) => onChange({...condition, indicator: value})}
              >
                <SelectTrigger 
                  id={`condition-indicator-${condition.id}`} 
                  className="h-6 text-xs"
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
              <Label className="text-[10px] font-medium text-blue-500/80 mb-1 flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                Timeframe
              </Label>
              <Select
                value={condition.timeframe}
                onValueChange={(value) => onChange({...condition, timeframe: value})}
              >
                <SelectTrigger 
                  id={`condition-timeframe-${condition.id}`} 
                  className="h-6 text-xs"
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
              <Label className="text-[10px] font-medium text-green-500/80 mb-1 flex items-center">
                <Target className="h-3 w-3 mr-1" />
                Expected Value
              </Label>
              <Select
                value={condition.expectedValue}
                onValueChange={(value) => onChange({...condition, expectedValue: value})}
              >
                <SelectTrigger 
                  id={`condition-value-${condition.id}`} 
                  className="h-6 text-xs"
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
            
            <div className="md:col-span-3">
              <Label className="text-[10px] font-medium text-muted-foreground/90 mb-1 flex items-center">
                <Info className="h-3 w-3 mr-1" />
                Description (optional)
              </Label>
              <Textarea
                id={`condition-description-${condition.id}`}
                placeholder="Add more details about this condition..."
                value={condition.description || ""}
                onChange={(e) => onChange({...condition, description: e.target.value})}
                className="text-xs resize-none min-h-[36px] max-h-[70px] bg-background/50"
              />
            </div>
          </div>
        )}
        
        {/* Action buttons in a clean footer */}
        <div className="flex justify-end gap-1.5 pt-1 border-t border-border/20 mt-1.5">
          {onCancel && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onCancel}
              className="h-6 px-2 text-xs"
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
              className="h-6 px-2.5 text-xs bg-primary/90 hover:bg-primary"
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
                if (onSave) {
                  onSave();
                } else {
                  onChange({...condition});
                }
              }}
              disabled={!condition.label.trim()}
              className="h-6 px-2.5 text-xs bg-primary/90 hover:bg-primary"
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
    <div className="group py-1 px-2 border border-border/30 rounded-md mb-1 bg-card/30 hover:bg-muted/10 hover:border-primary/20 hover:shadow-sm transition-all duration-200">
      <div className="flex items-center justify-between gap-2">
        {/* Main condition with badge indicators */}
        <div className="flex-1 flex flex-col gap-0.5 py-0.5">
          <div className="flex items-center flex-wrap gap-1">
            <div className="font-medium text-xs text-foreground/90">
              {condition.label}
            </div>
            {/* Only show indicators if they exist */}
            {hasDetails && (
              <div className="flex items-center flex-wrap gap-0.5">
                {condition.indicator && (
                  <Badge variant="outline" className="px-1 h-3.5 text-[9px] bg-primary/5 border-primary/20 font-normal">
                    <Activity className="h-2 w-2 mr-0.5 text-primary/80" />
                    {condition.indicator}
                  </Badge>
                )}
                
                {condition.timeframe && (
                  <Badge variant="outline" className="px-1 h-3.5 text-[9px] bg-blue-500/5 border-blue-500/20 text-blue-600 dark:text-blue-400 font-normal">
                    <Clock className="h-2 w-2 mr-0.5 text-blue-500/80" />
                    {condition.timeframe}
                  </Badge>
                )}
                
                {condition.expectedValue && (
                  <Badge variant="outline" className="px-1 h-3.5 text-[9px] bg-green-500/5 border-green-500/20 text-green-600 dark:text-green-400 font-normal">
                    <Target className="h-2 w-2 mr-0.5 text-green-500/80" />
                    {condition.expectedValue}
                  </Badge>
                )}
              </div>
            )}
          </div>
          
          {/* Description - only show if it exists */}
          {condition.description && (
            <div className="text-[9px] text-muted-foreground line-clamp-1 pl-0.5">
              {condition.description}
            </div>
          )}
        </div>
        
        {/* Action buttons - smaller, better positioned */}
        <div className="flex gap-0.5 ml-auto">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-5 w-5 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-150"
            onClick={() => onEdit(condition.id)}
            title="Edit"
          >
            <Pencil className="h-2.5 w-2.5 text-muted-foreground hover:text-primary" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-5 w-5 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-150"
            onClick={() => onDelete(condition.id)}
            title="Delete"
          >
            <Trash2 className="h-2.5 w-2.5 text-muted-foreground hover:text-destructive" />
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
  
  // Thêm state để giữ các thay đổi trước khi lưu
  const [editingConditions, setEditingConditions] = useState<Record<string, StrategyCondition>>({});
  
  // Khi bắt đầu edit, lưu trạng thái hiện tại vào state
  const handleEdit = (id: string) => {
    const conditionToEdit = conditions.find(c => c.id === id);
    if (conditionToEdit) {
      setEditingConditions({
        ...editingConditions,
        [id]: { ...conditionToEdit }
      });
    }
    setEditingId(id);
  };
  
  // Khi nhập liệu, chỉ cập nhật state local, không gọi onUpdate
  const handleEditChange = (updatedCondition: StrategyCondition) => {
    setEditingConditions({
      ...editingConditions,
      [updatedCondition.id]: updatedCondition
    });
  };
  
  // Khi Save, mới gọi onUpdate
  // Hàm này sẽ được gọi khi nhấn nút Save
  const handleUpdate = (updatedCondition: StrategyCondition) => {
    console.log("Saving condition:", updatedCondition);
    
    // Đơn giản hóa: tạo đối tượng updates rõ ràng thay vì truyền toàn bộ đối tượng
    const cleanUpdates = {
      label: updatedCondition.label,
      order: updatedCondition.order,
      indicator: updatedCondition.indicator,
      timeframe: updatedCondition.timeframe,
      expectedValue: updatedCondition.expectedValue,
      description: updatedCondition.description
    };
    
    // Gọi onUpdate với id và đối tượng updates đã được làm sạch
    onUpdate(updatedCondition.id, cleanUpdates);
    setEditingId(null);
    
    // Xóa khỏi editingConditions vì đã lưu
    const newEditingConditions = { ...editingConditions };
    delete newEditingConditions[updatedCondition.id];
    setEditingConditions(newEditingConditions);
  };
  
  const handleAdd = () => {
    if (newCondition.label.trim()) {
      onAdd(newCondition);
      setNewCondition(createNewCondition(conditions.length + 1));
      setIsAdding(false);
    }
  };
  
  return (
    <div className="mb-3">
      {/* Modern header with count badge */}
      {(title || !hideAddbutton) && (
        <div className="flex items-center justify-between mb-1.5">
          {title && (
            <div className="flex items-center gap-0.5">
              {icon && <span className="text-muted-foreground">{icon}</span>}
              <span className="font-medium text-xs text-foreground/90 bg-gradient-to-r from-primary/80 to-primary bg-clip-text text-transparent">
                {title.toUpperCase()}
                {conditions.length > 0 && (
                  <Badge variant="secondary" className="ml-1.5 h-4 px-1 text-[10px]">
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
              className="h-6 px-2 text-[10px] border-dashed border-border/50 hover:border-primary/30 hover:bg-primary/5"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add
            </Button>
          )}
        </div>
      )}
      
      {/* Content area with conditions */}
      <div className={cn(
        "space-y-0.5",
        conditions.length > 8 && "max-h-[320px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent"
      )}>
        {/* Empty state - modern but minimal */}
        {conditions.length === 0 && !isAdding ? (
          <div className="text-[10px] text-muted-foreground border border-dashed border-border/40 rounded-md p-2 text-center bg-muted/5">
            {emptyMessage}
          </div>
        ) : (
          /* Condition items list */
          <div className="space-y-0">
            {conditions.map(condition => 
              editingId === condition.id ? (
                <StrategyConditionForm
                  key={condition.id}
                  condition={editingConditions[condition.id] || condition}
                  onChange={handleEditChange}
                  onCancel={() => setEditingId(null)}
                  onAdd={undefined}
                  isNew={false}
                  onSave={() => {
                    const updatedCondition = editingConditions[condition.id];
                    if (updatedCondition) {
                      handleUpdate(updatedCondition);
                    }
                  }}
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
        <div className="animate-in fade-in-50 slide-in-from-top-1 duration-100 mt-1.5">
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