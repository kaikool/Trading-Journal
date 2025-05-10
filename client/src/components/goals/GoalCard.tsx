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

// Priority colors với độ tương phản cao
const priorityColors: Record<string, string> = {
  low: 'bg-success text-white font-medium',
  medium: 'bg-warning text-white font-medium',
  high: 'bg-destructive text-white font-medium',
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
  
  // Determine progress color using semantic colors
  const getProgressColor = (percentage: number, isCompleted: boolean, isOverdue: boolean) => {
    if (isCompleted) return 'bg-success';
    if (isOverdue) return 'bg-destructive';
    if (percentage >= 75) return 'bg-success';
    if (percentage >= 50) return 'bg-warning';
    if (percentage >= 25) return 'bg-orange-500';
    return 'bg-destructive';
  };

  // Custom card border based on goal color or priority
  const cardBorderStyle = goal.color 
    ? { borderColor: goal.color, borderWidth: 'var(--goal-card-border-width)' } 
    : {};

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="goal-transition"
    >
      <Card className="overflow-hidden" style={cardBorderStyle}>
        <CardHeader className="pb-2" compact>
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl font-bold">{goal.title}</CardTitle>
            <Badge className={priorityColors[goal.priority]}>
              {priorityLabels[goal.priority]}
            </Badge>
          </div>
          <CardDescription className="flex items-center gap-1 text-sm text-muted-foreground">
            <TrendingUp size="var(--goal-icon-size)" />
            <span>{targetTypeLabels[goal.targetType] || goal.targetType}</span>
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pb-[var(--spacing-2)]" compact>
          <div className="mb-[var(--goal-section-margin)]">
            <div className="flex justify-between mb-[var(--goal-inner-gap)] items-center">
              <div className="text-sm text-muted-foreground">Progress</div>
              <div className="text-sm font-medium">
                {goal.progressPercentage.toFixed(0)}%
              </div>
            </div>
            <Progress 
              value={goal.progressPercentage} 
              className="h-2"
              indicatorClassName={getProgressColor(goal.progressPercentage, goal.isCompleted, isOverdue)}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-[var(--spacing-2)] mb-[var(--goal-section-margin)]">
            <div className="text-sm">
              <div className="text-muted-foreground">Current</div>
              <div className="font-medium">
                {formatValue(goal.currentValue, goal.targetType)}
              </div>
            </div>
            <div className="text-sm">
              <div className="text-muted-foreground">Target</div>
              <div className="font-medium">
                {formatValue(goal.targetValue, goal.targetType)}
              </div>
            </div>
          </div>
          
          <div className="flex justify-between text-sm mb-[var(--goal-inner-gap)]">
            <div className="flex items-center gap-[var(--goal-inner-gap)]">
              <Calendar size="var(--goal-icon-size)" className="text-muted-foreground" />
              <span className="text-muted-foreground">
                {isOverdue ? 'Overdue' : `${goal.daysLeft} days left`}
              </span>
            </div>
            
            {goal.isCompleted && (
              <div className="flex items-center gap-[var(--goal-inner-gap)] text-success">
                <Award size="var(--goal-icon-size)" />
                <span>Completed</span>
              </div>
            )}
            
            {isOverdue && !goal.isCompleted && (
              <div className="flex items-center gap-[var(--goal-inner-gap)] text-destructive">
                <AlertCircle size="var(--goal-icon-size)" />
                <span>Overdue</span>
              </div>
            )}
          </div>
          
          {goal.milestones && goal.milestones.length > 0 && (
            <div className="mt-[var(--goal-section-margin)]">
              <div className="text-sm font-medium mb-[var(--spacing-2)]">Milestones</div>
              <div className="milestone-list space-y-[var(--spacing-2)]">
                {goal.milestones.map((milestone) => (
                  <div key={milestone.id} className="bg-secondary p-[var(--spacing-2)] rounded-md text-sm">
                    <div className="flex justify-between items-center mb-[var(--goal-inner-gap)]">
                      <span className="font-medium">{milestone.title}</span>
                      {milestone.isCompleted && (
                        <Badge variant="outline" className="text-success border-success">
                          Completed
                        </Badge>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">
                        {formatValue(milestone.targetValue, goal.targetType)}
                      </span>
                      <span className="text-xs">{milestone.progressPercentage.toFixed(0)}%</span>
                    </div>
                    <Progress
                      value={milestone.progressPercentage}
                      className="h-1 mt-[var(--goal-inner-gap)]"
                      indicatorClassName={milestone.isCompleted ? 'bg-success' : ''}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="pt-[var(--spacing-2)]" compact>
          <div className="flex flex-wrap items-center justify-between w-full gap-[var(--spacing-2)]">
            {/* Các nút action chính */}
            <div className="flex gap-[var(--goal-inner-gap)]">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-[var(--goal-button-height)] w-[var(--goal-button-icon-only-width)]"
                      onClick={() => onEdit && onEdit()}
                    >
                      <Pencil size="var(--goal-button-icon-size)" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Edit Goal</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-[var(--goal-button-height)] w-[var(--goal-button-icon-only-width)] text-destructive"
                      onClick={() => onDelete && onDelete()}
                    >
                      <Trash2 size="var(--goal-button-icon-size)" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Delete Goal</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            
            {/* Các nút chức năng */}
            <div className="flex gap-[var(--goal-inner-gap)] ml-auto">
              <Button 
                variant="default" 
                size="sm"
                className="h-[var(--goal-button-height)] flex items-center gap-[var(--goal-inner-gap)] px-[var(--spacing-2)] sm:px-[var(--spacing-3)]"
                onClick={() => onAddMilestone && onAddMilestone()}
              >
                <Plus size="var(--goal-button-icon-size)" />
                <span>Add Milestone</span>
              </Button>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="secondary" 
                      size="icon"
                      className="h-[var(--goal-button-height)] w-[var(--goal-button-icon-only-width)]"
                      onClick={() => calculateGoalProgress(goal.id.toString())}
                    >
                      <RefreshCw size="var(--goal-button-icon-size)" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Update Progress</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
}