import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoalCard } from './GoalCard';
import { GoalForm } from './GoalForm';
import { MilestoneForm } from './MilestoneForm';
import { useGoalData } from '@/hooks/use-goal-data';
import { useUserData } from '@/hooks/use-user-data';
// Firebase Firestore based types now

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  PlusCircle, 
  Search, 
  Target as GoalIcon, 
  Trophy, 
  Clock, 
  FilterX,
  Info
} from 'lucide-react';

export function GoalList() {
  const { userData } = useUserData();
  const { 
    goalProgress, 
    createGoal, 
    updateGoal, 
    deleteGoal, 
    createMilestone,
    isLoadingProgress,
    isCreatingGoal,
    isUpdatingGoal,
    isDeletingGoal,
    isCreatingMilestone,
  } = useGoalData();

  // State management
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openMilestoneDialog, setOpenMilestoneDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [currentGoal, setCurrentGoal] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('active');

  // Handle creating a new goal
  const handleCreateGoal = (data: any) => {
    if (!userData) return;
    
    const goalData = {
      ...data,
      userId: userData.id,
      currentValue: 0,
      isCompleted: false,
    };
    
    createGoal(goalData);
    setOpenCreateDialog(false);
  };

  // Handle updating goal
  const handleUpdateGoal = (data: any) => {
    if (!currentGoal) return;
    
    updateGoal({
      id: currentGoal.id,
      data: data,
    });
    
    setOpenEditDialog(false);
    setCurrentGoal(null);
  };

  // Handle deleting goal
  const handleDeleteGoal = () => {
    if (!currentGoal) return;
    
    deleteGoal(currentGoal.id);
    setOpenDeleteDialog(false);
    setCurrentGoal(null);
  };

  // Handle adding milestone
  const handleCreateMilestone = (data: any) => {
    if (!currentGoal) return;
    
    createMilestone({
      goalId: currentGoal.id,
      data: {
        ...data,
        completedDate: data.isCompleted ? new Date() : null,
      },
    });
    
    setOpenMilestoneDialog(false);
  };

  // Show goal edit dialog
  const handleEditGoal = (goal: any) => {
    setCurrentGoal(goal);
    setOpenEditDialog(true);
  };

  // Show goal delete confirmation dialog
  const handleDeletePrompt = (goal: any) => {
    setCurrentGoal(goal);
    setOpenDeleteDialog(true);
  };

  // Show add milestone dialog
  const handleAddMilestone = (goal: any) => {
    setCurrentGoal(goal);
    setOpenMilestoneDialog(true);
  };

  // Filter goals by search keyword
  const filterGoals = (goals: any[]) => {
    if (!searchTerm) return goals;
    
    return goals.filter(goal => 
      goal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (goal.description && goal.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  };

  // Animation variants for goal list
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  // Render loading state
  if (isLoadingProgress) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <GoalIcon className="h-12 w-12 animate-pulse text-primary" />
        <p className="text-lg font-medium">Loading goal data...</p>
      </div>
    );
  }

  // No goal data available
  if (!goalProgress) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Trading Goals</h2>
          <Button onClick={() => setOpenCreateDialog(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create New Goal
          </Button>
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center h-96 space-y-4">
          <GoalIcon className="h-16 w-16 text-muted-foreground" />
          <div className="text-center space-y-2">
            <p className="text-xl font-medium">No goals yet</p>
            <p className="text-muted-foreground">
              Create goals to track and improve your trading performance
            </p>
            <Button 
              className="mt-4" 
              onClick={() => setOpenCreateDialog(true)}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Your First Goal
            </Button>
          </div>
        </div>

        {/* New goal dialog */}
        <Dialog open={openCreateDialog} onOpenChange={setOpenCreateDialog}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Goal</DialogTitle>
              <DialogDescription>
                Set up trading goals to track and improve your performance.
              </DialogDescription>
            </DialogHeader>
            <GoalForm 
              onSubmit={handleCreateGoal} 
              onCancel={() => setOpenCreateDialog(false)}
              isSubmitting={isCreatingGoal}
            />
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Goal data available - display list
  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Trading Goals</h2>
        <Button onClick={() => setOpenCreateDialog(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create New Goal
        </Button>
      </div>

      {/* Progress overview section */}
      <div className="bg-card rounded-lg p-4 mb-6 border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="col-span-1 md:col-span-2 flex flex-col justify-center">
            <h3 className="text-lg font-medium mb-2">Overall Progress</h3>
            <div className="flex items-center gap-2 mb-2">
              <Progress 
                value={goalProgress.overallProgress.progressPercentage} 
                className="h-4" 
              />
              <span className="font-medium w-12 text-right">
                {goalProgress.overallProgress.progressPercentage.toFixed(0)}%
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {goalProgress.overallProgress.completedGoals} / {goalProgress.overallProgress.totalGoals} goals completed
            </p>
          </div>
          
          <div className="space-y-2 flex flex-col justify-center">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-green-500" />
              <span className="font-medium">{goalProgress.completedGoals.length} completed goals</span>
            </div>
            <div className="flex items-center gap-2">
              <GoalIcon className="h-5 w-5 text-blue-500" />
              <span className="font-medium">{goalProgress.activeGoals.length} active goals</span>
            </div>
          </div>
          
          <div className="space-y-2 flex flex-col justify-center">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              <span className="font-medium">
                {goalProgress.upcomingMilestones.length} upcoming milestones
              </span>
            </div>
            {goalProgress.activeGoals.some(goal => 
              new Date(goal.endDate) < new Date() && !goal.isCompleted
            ) && (
              <div className="flex items-center gap-2">
                <Info className="h-5 w-5 text-red-500" />
                <span className="font-medium">
                  {goalProgress.activeGoals.filter(goal => 
                    new Date(goal.endDate) < new Date() && !goal.isCompleted
                  ).length} overdue goals
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search and filter section */}
      <div className="mb-4 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search goals..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1 h-7 w-7"
              onClick={() => setSearchTerm('')}
            >
              <FilterX className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        <Tabs 
          defaultValue="active" 
          className="w-full sm:w-[400px]"
          value={activeTab}
          onValueChange={setActiveTab}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'active' && (
            <motion.div
              key="active"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full"
            >
              <ScrollArea className="h-full pr-4">
                {filterGoals(goalProgress.activeGoals).length > 0 ? (
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                  >
                    {filterGoals(goalProgress.activeGoals).map((goal) => (
                      <GoalCard
                        key={goal.id}
                        goal={goal}
                        onEdit={() => handleEditGoal(goal)}
                        onDelete={() => handleDeletePrompt(goal)}
                        onAddMilestone={() => handleAddMilestone(goal)}
                      />
                    ))}
                  </motion.div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-center">
                    <GoalIcon className="h-12 w-12 text-muted-foreground mb-4" />
                    {searchTerm ? (
                      <>
                        <h3 className="text-lg font-medium">No goals found</h3>
                        <p className="text-muted-foreground">
                          No goals match your search term "{searchTerm}"
                        </p>
                      </>
                    ) : (
                      <>
                        <h3 className="text-lg font-medium">No active goals</h3>
                        <p className="text-muted-foreground">
                          You don't have any active goals yet
                        </p>
                        <Button
                          className="mt-4"
                          onClick={() => setOpenCreateDialog(true)}
                        >
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Create New Goal
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </ScrollArea>
            </motion.div>
          )}

          {activeTab === 'completed' && (
            <motion.div
              key="completed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full"
            >
              <ScrollArea className="h-full pr-4">
                {filterGoals(goalProgress.completedGoals).length > 0 ? (
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                  >
                    {filterGoals(goalProgress.completedGoals).map((goal) => (
                      <GoalCard
                        key={goal.id}
                        goal={goal}
                        onEdit={() => handleEditGoal(goal)}
                        onDelete={() => handleDeletePrompt(goal)}
                        onAddMilestone={() => handleAddMilestone(goal)}
                      />
                    ))}
                  </motion.div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-center">
                    <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
                    {searchTerm ? (
                      <>
                        <h3 className="text-lg font-medium">No goals found</h3>
                        <p className="text-muted-foreground">
                          No completed goals match your search term "{searchTerm}"
                        </p>
                      </>
                    ) : (
                      <>
                        <h3 className="text-lg font-medium">No completed goals</h3>
                        <p className="text-muted-foreground">
                          Complete goals to see them displayed here
                        </p>
                      </>
                    )}
                  </div>
                )}
              </ScrollArea>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Dialog for creating new goal */}
      <Dialog open={openCreateDialog} onOpenChange={setOpenCreateDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Goal</DialogTitle>
            <DialogDescription>
              Set up trading goals to track and improve your performance.
            </DialogDescription>
          </DialogHeader>
          <GoalForm 
            onSubmit={handleCreateGoal} 
            onCancel={() => setOpenCreateDialog(false)}
            isSubmitting={isCreatingGoal}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog for editing goal */}
      <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Goal</DialogTitle>
            <DialogDescription>
              Update your goal information.
            </DialogDescription>
          </DialogHeader>
          {currentGoal && (
            <GoalForm 
              defaultValues={{
                title: currentGoal.title,
                description: currentGoal.description || '',
                targetType: currentGoal.targetType,
                targetValue: currentGoal.targetValue,
                startDate: currentGoal.startDate?.toDate ? currentGoal.startDate.toDate() : new Date(),
                endDate: currentGoal.endDate?.toDate ? currentGoal.endDate.toDate() : new Date(),
                priority: currentGoal.priority,
                color: currentGoal.color || '',
              }}
              onSubmit={handleUpdateGoal} 
              onCancel={() => {
                setOpenEditDialog(false);
                setCurrentGoal(null);
              }}
              isSubmitting={isUpdatingGoal}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog for adding milestone */}
      <Dialog open={openMilestoneDialog} onOpenChange={setOpenMilestoneDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Milestone</DialogTitle>
            <DialogDescription>
              Create a new milestone for the goal "{currentGoal?.title}".
            </DialogDescription>
          </DialogHeader>
          {currentGoal && (
            <MilestoneForm 
              goalId={currentGoal.id}
              goalType={currentGoal.targetType}
              goalTarget={currentGoal.targetValue}
              onSubmit={handleCreateMilestone} 
              onCancel={() => {
                setOpenMilestoneDialog(false);
                setCurrentGoal(null);
              }}
              isSubmitting={isCreatingMilestone}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog xác nhận xóa mục tiêu */}
      <AlertDialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này sẽ xóa vĩnh viễn mục tiêu "{currentGoal?.title}" và tất cả cột mốc liên quan.
              Dữ liệu đã xóa không thể khôi phục.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setOpenDeleteDialog(false);
              setCurrentGoal(null);
            }}>
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteGoal}
              className="bg-destructive hover:bg-destructive/90"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}