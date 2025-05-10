import React from 'react';
import { motion } from 'framer-motion';
import { useUserData } from '@/hooks/use-user-data';
import { useGoalData } from '@/hooks/use-goal-data';
import { formatDistanceToNow, isAfter } from 'date-fns';
import { enUS } from 'date-fns/locale';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Pencil, 
  Trash2, 
  Award, 
  Calendar, 
  AlertCircle, 
  TrendingUp, 
  MoreHorizontal, 
  Plus, 
  RefreshCw 
} from 'lucide-react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface GoalCardProps {
  goal: {
    id: number;
    title: string;
    targetType: string;
    targetValue: number;
    currentValue: number;
    progressPercentage: number;
    isCompleted: boolean;
    startDate: Date | string;
    endDate: Date | string;
    daysLeft: number;
    priority: string;
    color: string | null;
    milestones?: {
      id: number;
      title: string;
      targetValue: number;
      isCompleted: boolean;
      progressPercentage: number;
    }[];
  };
  onEdit?: () => void;
  onDelete?: () => void;
  onAddMilestone?: () => void;
}

// Mapping for target types
const targetTypeLabels: Record<string, string> = {
  profit: 'Profit',
  winRate: 'Win Rate',
  profitFactor: 'Profit Factor',
  riskRewardRatio: 'R:R Ratio',
  balance: 'Balance',
  trades: 'Number of Trades',
};

// Format value based on target type
const formatValue = (value: number, type: string): string => {
  switch (type) {
    case 'profit':
    case 'balance':
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
    case 'winRate':
      return `${value}%`;
    case 'profitFactor':
    case 'riskRewardRatio':
      return value.toFixed(2);
    case 'trades':
      return value.toString();
    default:
      return value.toString();
  }
};

// Priority colors
const priorityColors: Record<string, string> = {
  low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

// Priority labels
const priorityLabels: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

export function GoalCard({ goal, onEdit, onDelete, onAddMilestone }: GoalCardProps) {
  const { calculateGoalProgress } = useGoalData();
  
  // Format dates
  const startDate = new Date(goal.startDate);
  const endDate = new Date(goal.endDate);
  const isOverdue = isAfter(new Date(), endDate) && !goal.isCompleted;
  
  // Determine progress color
  const getProgressColor = (percentage: number, isCompleted: boolean, isOverdue: boolean) => {
    if (isCompleted) return 'bg-green-500';
    if (isOverdue) return 'bg-red-500';
    if (percentage >= 75) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    if (percentage >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  // Custom card border based on goal color or priority
  const cardBorderStyle = goal.color 
    ? { borderColor: goal.color, borderWidth: '2px' } 
    : {};

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden shadow-sm" style={cardBorderStyle}>
        {/* More compact card header with reduced spacing */}
        <CardHeader className="py-2 px-3">
          <div className="flex justify-between items-center">
            <CardTitle className="text-base font-bold truncate">{goal.title}</CardTitle>
            <Badge className={`${priorityColors[goal.priority]} text-xs`}>
              {priorityLabels[goal.priority]}
            </Badge>
          </div>
          <CardDescription className="flex items-center gap-1 text-xs text-muted-foreground">
            <TrendingUp size={12} />
            <span>{targetTypeLabels[goal.targetType] || goal.targetType}</span>
          </CardDescription>
        </CardHeader>
        
        {/* More compact content with reduced spacing */}
        <CardContent className="py-2 px-3">
          <div className="mb-2">
            <div className="flex justify-between mb-1 items-center">
              <div className="text-xs text-muted-foreground">Progress</div>
              <div className="text-xs font-medium">
                {goal.progressPercentage.toFixed(0)}%
              </div>
            </div>
            <Progress 
              value={goal.progressPercentage} 
              className="h-1.5"
              indicatorClassName={getProgressColor(goal.progressPercentage, goal.isCompleted, isOverdue)}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div className="text-xs">
              <div className="text-muted-foreground">Current</div>
              <div className="font-medium truncate">
                {formatValue(goal.currentValue, goal.targetType)}
              </div>
            </div>
            <div className="text-xs">
              <div className="text-muted-foreground">Target</div>
              <div className="font-medium truncate">
                {formatValue(goal.targetValue, goal.targetType)}
              </div>
            </div>
          </div>
          
          <div className="flex justify-between text-xs mb-1">
            <div className="flex items-center gap-1">
              <Calendar size={12} className="text-muted-foreground" />
              <span className="text-muted-foreground">
                {isOverdue ? 'Overdue' : `${goal.daysLeft} days left`}
              </span>
            </div>
            
            {goal.isCompleted && (
              <div className="flex items-center gap-1 text-green-500">
                <Award size={12} />
                <span>Completed</span>
              </div>
            )}
            
            {isOverdue && !goal.isCompleted && (
              <div className="flex items-center gap-1 text-destructive">
                <AlertCircle size={12} />
                <span>Overdue</span>
              </div>
            )}
          </div>
          
          {goal.milestones && goal.milestones.length > 0 && (
            <div className="mt-2">
              <div className="text-xs font-medium mb-1">Milestones</div>
              <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
                {goal.milestones.map((milestone) => (
                  <div key={milestone.id} className="bg-secondary p-1.5 rounded-md text-xs">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="font-medium truncate max-w-[70%]">{milestone.title}</span>
                      {milestone.isCompleted && (
                        <Badge variant="outline" className="text-green-500 border-green-500 text-[10px] px-1 py-0">
                          Completed
                        </Badge>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground truncate max-w-[70%]">
                        {formatValue(milestone.targetValue, goal.targetType)}
                      </span>
                      <span className="text-[10px]">{milestone.progressPercentage.toFixed(0)}%</span>
                    </div>
                    <Progress
                      value={milestone.progressPercentage}
                      className="h-1 mt-0.5"
                      indicatorClassName={milestone.isCompleted ? 'bg-green-500' : ''}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
        
        {/* More compact footer with tighter controls */}
        <CardFooter className="py-1.5 px-3">
          <div className="flex items-center justify-between w-full">
            {/* Action buttons in compact format */}
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => onEdit && onEdit()}
              >
                <Pencil size={13} />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive"
                onClick={() => onDelete && onDelete()}
              >
                <Trash2 size={13} />
              </Button>
            </div>
            
            {/* Function buttons with reduced size */}
            <div className="flex gap-1 ml-auto">
              <Button 
                variant="default" 
                size="sm"
                className="h-7 flex items-center gap-1 px-2 text-xs"
                onClick={() => onAddMilestone && onAddMilestone()}
              >
                <Plus size={13} />
                <span>Add</span>
              </Button>
              
              <Button 
                variant="secondary" 
                size="icon"
                className="h-7 w-7"
                onClick={() => calculateGoalProgress(goal.id.toString())}
              >
                <RefreshCw size={13} />
              </Button>
            </div>
          </div>
        </CardFooter>
      </Card>
    </motion.div>>
  );
}