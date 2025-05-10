import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useUserData } from './use-user-data';
import { useToast } from './use-toast';
import { addGoal, updateGoal, deleteGoal, calculateGoalProgress, onGoalsSnapshot } from '@/lib/firebase'; 
import { addMilestone, updateMilestone, deleteMilestone } from '@/lib/firebase';
import { auth } from '@/lib/firebase';
import { useEffect, useState } from 'react';
import { debug } from '@/lib/debug';

type GoalProgressData = {
  activeGoals: GoalProgressItem[];
  completedGoals: GoalProgressItem[];
  upcomingMilestones: {
    id: string;
    goalId: string;
    goalTitle: string;
    title: string;
    targetValue: number;
    progressPercentage: number;
  }[];
  overallProgress: {
    totalGoals: number;
    completedGoals: number;
    progressPercentage: number;
  };
};

type GoalProgressItem = {
  id: string;
  title: string;
  targetType: string;
  targetValue: number;
  currentValue: number;
  progressPercentage: number;
  isCompleted: boolean;
  startDate: Date;
  endDate: Date;
  daysLeft: number;
  priority: string;
  color: string | null;
  milestones?: {
    id: string;
    title: string;
    targetValue: number;
    isCompleted: boolean;
    progressPercentage: number;
  }[];
};

export function useGoalData() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { userData } = useUserData();
  const firebaseUserId = auth.currentUser?.uid;

  // State for goal data from Firebase
  const [goalsData, setGoalsData] = useState<any[]>([]);
  const [isLoadingGoals, setIsLoadingGoals] = useState(true);
  const [goalsError, setGoalsError] = useState<Error | null>(null);

  // State for goal progress data
  const [goalProgressData, setGoalProgressData] = useState<GoalProgressData | undefined>(undefined);
  const [isLoadingProgress, setIsLoadingProgress] = useState(true);
  const [progressError, setProgressError] = useState<Error | null>(null);

  // Effect to fetch goal data from Firebase
  useEffect(() => {
    if (!firebaseUserId) {
      setIsLoadingGoals(false);
      return;
    }

    setIsLoadingGoals(true);
    
    // Register listener to monitor goal changes in real-time
    const unsubscribe = onGoalsSnapshot(
      firebaseUserId,
      (goals) => {
        debug(`Received ${goals.length} goals from Firebase`);
        setGoalsData(goals);
        setIsLoadingGoals(false);
        
        // When new goal data is received, calculate progress data
        calculateGoalProgressData(goals);
      },
      (error) => {
        debug("Error fetching goals:", error);
        setGoalsError(error);
        setIsLoadingGoals(false);
      }
    );

    // Cleanup when component unmounts
    return () => unsubscribe();
  }, [firebaseUserId]);

  // Function to calculate goal progress data
  const calculateGoalProgressData = (goals: any[]) => {
    try {
      setIsLoadingProgress(true);
      
      // Calculate current date
      const now = new Date();
      
      // Prepare goal data with progress information
      const goalsWithProgress = goals.map(goal => {
        // Calculate days remaining
        const endDate = new Date(goal.endDate?.toDate ? goal.endDate.toDate() : goal.endDate);
        const daysLeft = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
        
        // Calculate goal progress
        const progressPercentage = Math.min(100, (goal.currentValue / goal.targetValue) * 100 || 0);
        
        // Calculate progress for each milestone
        const milestonesWithProgress = (goal.milestones || []).map((milestone: any) => {
          const milestoneProgress = goal.currentValue >= milestone.targetValue ? 100 : 
            Math.min(100, (goal.currentValue / milestone.targetValue) * 100);
          
          return {
            ...milestone,
            progressPercentage: milestoneProgress
          };
        });
        
        return {
          ...goal,
          daysLeft,
          progressPercentage,
          milestones: milestonesWithProgress
        };
      });
      
      // Categorize goals into active and completed
      const activeGoals = goalsWithProgress.filter(goal => !goal.isCompleted);
      const completedGoals = goalsWithProgress.filter(goal => goal.isCompleted);
      
      // Find upcoming milestones
      const allMilestones = goalsWithProgress.flatMap(goal => 
        (goal.milestones || []).map((milestone: any) => ({
          id: milestone.id,
          goalId: goal.id,
          goalTitle: goal.title,
          title: milestone.title,
          targetValue: milestone.targetValue,
          progressPercentage: milestone.progressPercentage
        }))
      );
      
      const upcomingMilestones = allMilestones
        .filter((milestone: any) => milestone.progressPercentage < 100)
        .sort((a: any, b: any) => b.progressPercentage - a.progressPercentage)
        .slice(0, 5);
      
      // Calculate overall progress
      const totalGoals = goals.length;
      const completedGoalsCount = completedGoals.length;
      const overallProgressPercentage = totalGoals > 0 
        ? (completedGoalsCount / totalGoals) * 100 
        : 0;
      
      // Update state
      setGoalProgressData({
        activeGoals,
        completedGoals,
        upcomingMilestones,
        overallProgress: {
          totalGoals,
          completedGoals: completedGoalsCount,
          progressPercentage: overallProgressPercentage
        }
      });
      
      setIsLoadingProgress(false);
    } catch (error) {
      debug("Error calculating goal progress data:", error);
      setProgressError(error as Error);
      setIsLoadingProgress(false);
    }
  };

  // Create a new goal
  const createGoalMutation = useMutation({
    mutationFn: async (goalData: any) => {
      if (!firebaseUserId) throw new Error("User is not logged in");
      
      // Format the goal data
      const formattedData = {
        ...goalData,
        userId: firebaseUserId
      };
      
      // Call the Firebase add goal function
      return addGoal(firebaseUserId, formattedData);
    },
    onSuccess: () => {
      // No need to invalidate query as snapshot listener will auto-update
      toast({
        title: 'Goal Created',
        description: 'Your new goal has been created successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error Creating Goal',
        description: error?.message || 'An error occurred while creating the goal.',
      });
    },
  });

  // Update an existing goal
  const updateGoalMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      if (!firebaseUserId) throw new Error("User is not logged in");
      
      // Call the Firebase update goal function
      return updateGoal(firebaseUserId, id, data);
    },
    onSuccess: () => {
      // No need to invalidate query as snapshot listener will auto-update
      toast({
        title: 'Goal Updated',
        description: 'Your goal has been updated successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error Updating Goal',
        description: error?.message || 'An error occurred while updating the goal.',
      });
    },
  });

  // Delete a goal
  const deleteGoalMutation = useMutation({
    mutationFn: async (goalId: string) => {
      if (!firebaseUserId) throw new Error("User is not logged in");
      
      // Call the Firebase delete goal function
      return deleteGoal(firebaseUserId, goalId);
    },
    onSuccess: () => {
      // No need to invalidate query as snapshot listener will auto-update
      toast({
        title: 'Goal Deleted',
        description: 'The goal has been deleted successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error Deleting Goal',
        description: error?.message || 'An error occurred while deleting the goal.',
      });
    },
  });

  // Create a milestone
  const createMilestoneMutation = useMutation({
    mutationFn: async ({ goalId, data }: { goalId: string; data: any }) => {
      if (!firebaseUserId) throw new Error("User is not logged in");
      
      // Call the Firebase add milestone function
      return addMilestone(firebaseUserId, goalId, data);
    },
    onSuccess: () => {
      // No need to invalidate query as snapshot listener will auto-update
      toast({
        title: 'Milestone Created',
        description: 'New milestone has been created successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error Creating Milestone',
        description: error?.message || 'An error occurred while creating the milestone.',
      });
    },
  });

  // Update a milestone
  const updateMilestoneMutation = useMutation({
    mutationFn: async ({ goalId, milestoneId, data }: { goalId: string; milestoneId: string; data: any }) => {
      if (!firebaseUserId) throw new Error("User is not logged in");
      
      // Call the Firebase update milestone function
      return updateMilestone(firebaseUserId, goalId, milestoneId, data);
    },
    onSuccess: () => {
      // No need to invalidate query as snapshot listener will auto-update
      toast({
        title: 'Milestone Updated',
        description: 'Milestone has been updated successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error Updating Milestone',
        description: error?.message || 'An error occurred while updating the milestone.',
      });
    },
  });

  // Delete a milestone
  const deleteMilestoneMutation = useMutation({
    mutationFn: async ({ goalId, milestoneId }: { goalId: string; milestoneId: string }) => {
      if (!firebaseUserId) throw new Error("User is not logged in");
      
      // Call the Firebase delete milestone function
      return deleteMilestone(firebaseUserId, goalId, milestoneId);
    },
    onSuccess: () => {
      // No need to invalidate query as snapshot listener will auto-update
      toast({
        title: 'Milestone Deleted',
        description: 'Milestone has been deleted successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error Deleting Milestone',
        description: error?.message || 'An error occurred while deleting the milestone.',
      });
    },
  });

  // Calculate goal progress
  const calculateGoalProgressMutation = useMutation({
    mutationFn: async (goalId: string) => {
      if (!firebaseUserId) throw new Error("User is not logged in");
      
      // Call the Firebase calculate progress function
      return calculateGoalProgress(firebaseUserId, goalId);
    },
    onSuccess: () => {
      // No need to invalidate query as snapshot listener will auto-update
      toast({
        title: 'Progress Updated',
        description: 'Goal progress has been recalculated successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error Calculating Progress',
        description: error?.message || 'An error occurred while calculating goal progress.',
      });
    },
  });

  return {
    // Queries
    goals: goalsData,
    goalProgress: goalProgressData,
    isLoadingGoals,
    isLoadingProgress,
    goalsError,
    progressError,

    // Mutations
    createGoal: createGoalMutation.mutate,
    updateGoal: updateGoalMutation.mutate,
    deleteGoal: deleteGoalMutation.mutate,
    createMilestone: createMilestoneMutation.mutate,
    updateMilestone: updateMilestoneMutation.mutate,
    deleteMilestone: deleteMilestoneMutation.mutate,
    calculateGoalProgress: calculateGoalProgressMutation.mutate,

    // Mutation states
    isCreatingGoal: createGoalMutation.isPending,
    isUpdatingGoal: updateGoalMutation.isPending,
    isDeletingGoal: deleteGoalMutation.isPending,
    isCreatingMilestone: createMilestoneMutation.isPending,
    isUpdatingMilestone: updateMilestoneMutation.isPending,
    isDeletingMilestone: deleteMilestoneMutation.isPending,
    isCalculatingProgress: calculateGoalProgressMutation.isPending,
  };
}