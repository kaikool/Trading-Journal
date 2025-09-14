import { useMutation } from '@tanstack/react-query';
import { useUserDataQuery } from './use-user-data-query';
import { useAuth } from './use-auth';
import { useToast } from './use-toast';
import { addGoal, updateGoal, deleteGoal, calculateGoalProgress, getGoals } from '@/lib/firebase';
import { addMilestone, updateMilestone, deleteMilestone } from '@/lib/firebase';
import { useEffect, useState, useCallback } from 'react';

const log = (...a: any[]) => console.log('[use-goal-data]', ...a);
const warn = (...a: any[]) => console.warn('[use-goal-data]', ...a);
const err  = (...a: any[]) => console.error('[use-goal-data]', ...a);

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
  const { userData } = useUserDataQuery();
  const { userId: firebaseUserId } = useAuth();

  const [goalsData, setGoalsData] = useState<any[]>([]);
  const [isLoadingGoals, setIsLoadingGoals] = useState(true);
  const [goalsError, setGoalsError] = useState<Error | null>(null);

  const [goalProgressData, setGoalProgressData] = useState<GoalProgressData | undefined>(undefined);
  const [isLoadingProgress, setIsLoadingProgress] = useState(true);
  const [progressError, setProgressError] = useState<Error | null>(null);

  const fetchGoalData = useCallback(async () => {
    if (!firebaseUserId) {
      warn('fetchGoalData: missing firebaseUserId -> skip');
      setIsLoadingGoals(false);
      return;
    }
    setIsLoadingGoals(true);
    try {
      log('fetchGoalData: start for uid=', firebaseUserId);
      const goals = await getGoals(firebaseUserId);
      log('fetchGoalData: received goals count=', goals?.length, goals);
      setGoalsData(goals || []);
      setIsLoadingGoals(false);
      calculateGoalProgressData(goals || []);
    } catch (e: any) {
      err('fetchGoalData: error=', e?.message || e);
      setGoalsError(e as Error);
      setIsLoadingGoals(false);
    }
  }, [firebaseUserId]);

  useEffect(() => {
    if (!firebaseUserId) {
      warn('useEffect:init: no uid -> not fetching');
      setIsLoadingGoals(false);
      return;
    }
    log('useEffect:init: uid=', firebaseUserId);
    fetchGoalData();

    // DEBUG: giảm polling xuống 5s trong lúc bắt lỗi
    const intervalId = setInterval(fetchGoalData, 5000);
    return () => clearInterval(intervalId);
  }, [firebaseUserId, fetchGoalData]);

  const calculateGoalProgressData = (goals: any[]) => {
    try {
      setIsLoadingProgress(true);
      const now = new Date();
      const goalsWithProgress = goals.map((goal) => {
        const endDate = new Date(goal.endDate?.toDate ? goal.endDate.toDate() : goal.endDate);
        const daysLeft = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
        const progressPercentage = Math.round(Math.min(100, (goal.currentValue / goal.targetValue) * 100 || 0));
        const milestonesWithProgress = (goal.milestones || []).map((m: any) => {
          const p = goal.currentValue >= m.targetValue ? 100 : Math.round(Math.min(100, (goal.currentValue / m.targetValue) * 100));
          return { ...m, progressPercentage: p };
        });
        return { ...goal, daysLeft, progressPercentage, milestones: milestonesWithProgress };
      });

      const activeGoals = goalsWithProgress.filter((g) => !g.isCompleted);
      const completedGoals = goalsWithProgress.filter((g) => g.isCompleted);

      const allMilestones = goalsWithProgress.flatMap((g) =>
        (g.milestones || []).map((m: any) => ({
          id: m.id, goalId: g.id, goalTitle: g.title,
          title: m.title, targetValue: m.targetValue,
          progressPercentage: m.progressPercentage,
        })),
      );

      const upcomingMilestones = allMilestones
        .filter((m: any) => m.progressPercentage < 100)
        .sort((a: any, b: any) => b.progressPercentage - a.progressPercentage)
        .slice(0, 5);

      const totalGoals = goals.length;
      const completedGoalsCount = completedGoals.length;
      const overallProgressPercentage = totalGoals > 0 ? Math.round((completedGoalsCount / totalGoals) * 100) : 0;

      setGoalProgressData({
        activeGoals,
        completedGoals,
        upcomingMilestones,
        overallProgress: { totalGoals, completedGoals: completedGoalsCount, progressPercentage: overallProgressPercentage },
      });

      setIsLoadingProgress(false);
      log('calculateGoalProgressData: done');
    } catch (e: any) {
      err('calculateGoalProgressData: error=', e?.message || e);
      setProgressError(e as Error);
      setIsLoadingProgress(false);
    }
  };

  const createGoalMutation = useMutation({
    mutationFn: async (goalData: any) => {
      log('createGoal: invoked with uid=', firebaseUserId, 'payload=', goalData);
      if (!firebaseUserId) throw new Error('User is not logged in');
      const formatted = { ...goalData, userId: firebaseUserId };
      return addGoal(firebaseUserId, formatted);
    },
    onSuccess: (res: any) => {
      log('createGoal:onSuccess result=', res);
      fetchGoalData();
      toast({ title: 'Goal Created', description: 'Your new goal has been created successfully.' });
    },
    onError: (e: any) => {
      err('createGoal:onError=', e?.message || e);
      toast({ variant: 'destructive', title: 'Error Creating Goal', description: e?.message || 'Create goal failed' });
    },
  });

  const updateGoalMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      log('updateGoal: invoked uid=', firebaseUserId, 'id=', id, 'data=', data);
      if (!firebaseUserId) throw new Error('User is not logged in');
      return updateGoal(firebaseUserId, id, data);
    },
    onSuccess: (r: any) => {
      log('updateGoal:onSuccess=', r);
      fetchGoalData();
      toast({ title: 'Goal Updated', description: 'Your goal has been updated successfully.' });
    },
    onError: (e: any) => {
      err('updateGoal:onError=', e?.message || e);
      toast({ variant: 'destructive', title: 'Error Updating Goal', description: e?.message || 'Update goal failed' });
    },
  });

  const deleteGoalMutation = useMutation({
    mutationFn: async (goalId: string) => {
      log('deleteGoal: invoked uid=', firebaseUserId, 'id=', goalId);
      if (!firebaseUserId) throw new Error('User is not logged in');
      return deleteGoal(firebaseUserId, goalId);
    },
    onSuccess: (r: any) => {
      log('deleteGoal:onSuccess=', r);
      fetchGoalData();
      toast({ title: 'Goal Deleted', description: 'The goal has been deleted successfully.' });
    },
    onError: (e: any) => {
      err('deleteGoal:onError=', e?.message || e);
      toast({ variant: 'destructive', title: 'Error Deleting Goal', description: e?.message || 'Delete goal failed' });
    },
  });

  const createMilestoneMutation = useMutation({
    mutationFn: async ({ goalId, data }: { goalId: string; data: any }) => {
      log('createMilestone: invoked uid=', firebaseUserId, 'goalId=', goalId, 'data=', data);
      if (!firebaseUserId) throw new Error('User is not logged in');
      return addMilestone(firebaseUserId, goalId, data);
    },
    onSuccess: (r: any) => {
      log('createMilestone:onSuccess=', r);
      fetchGoalData();
      toast({ title: 'Milestone Created', description: 'New milestone has been created successfully.' });
    },
    onError: (e: any) => {
      err('createMilestone:onError=', e?.message || e);
      toast({ variant: 'destructive', title: 'Error Creating Milestone', description: e?.message || 'Create milestone failed' });
    },
  });

  const updateMilestoneMutation = useMutation({
    mutationFn: async ({ goalId, milestoneId, data }: { goalId: string; milestoneId: string; data: any }) => {
      log('updateMilestone: invoked uid=', firebaseUserId, 'goalId=', goalId, 'milestoneId=', milestoneId, 'data=', data);
      if (!firebaseUserId) throw new Error('User is not logged in');
      return updateMilestone(firebaseUserId, goalId, milestoneId, data);
    },
    onSuccess: (r: any) => {
      log('updateMilestone:onSuccess=', r);
      fetchGoalData();
      toast({ title: 'Milestone Updated', description: 'Milestone has been updated successfully.' });
    },
    onError: (e: any) => {
      err('updateMilestone:onError=', e?.message || e);
      toast({ variant: 'destructive', title: 'Error Updating Milestone', description: e?.message || 'Update milestone failed' });
    },
  });

  const deleteMilestoneMutation = useMutation({
    mutationFn: async ({ goalId, milestoneId }: { goalId: string; milestoneId: string }) => {
      log('deleteMilestone: invoked uid=', firebaseUserId, 'goalId=', goalId, 'milestoneId=', milestoneId);
      if (!firebaseUserId) throw new Error('User is not logged in');
      return deleteMilestone(firebaseUserId, goalId, milestoneId);
    },
    onSuccess: (r: any) => {
      log('deleteMilestone:onSuccess=', r);
      fetchGoalData();
      toast({ title: 'Milestone Deleted', description: 'Milestone has been deleted successfully.' });
    },
    onError: (e: any) => {
      err('deleteMilestone:onError=', e?.message || e);
      toast({ variant: 'destructive', title: 'Error Deleting Milestone', description: e?.message || 'Delete milestone failed' });
    },
  });

  const calculateGoalProgressMutation = useMutation({
    mutationFn: async (goalId: string) => {
      log('calculateProgress: invoked uid=', firebaseUserId, 'goalId=', goalId);
      if (!firebaseUserId) throw new Error('User is not logged in');
      return calculateGoalProgress(firebaseUserId, goalId);
    },
    onSuccess: (r: any) => {
      log('calculateProgress:onSuccess=', r);
      fetchGoalData();
      toast({ title: 'Progress Updated', description: 'Goal progress has been recalculated successfully.' });
    },
    onError: (e: any) => {
      err('calculateProgress:onError=', e?.message || e);
      toast({ variant: 'destructive', title: 'Error Calculating Progress', description: e?.message || 'Calculate progress failed' });
    },
  });

  return {
    goals: goalsData,
    goalProgress: goalProgressData,
    isLoadingGoals,
    isLoadingProgress,
    goalsError,
    progressError,

    createGoal: createGoalMutation.mutate,
    updateGoal: updateGoalMutation.mutate,
    deleteGoal: deleteGoalMutation.mutate,
    createMilestone: createMilestoneMutation.mutate,
    updateMilestone: updateMilestoneMutation.mutate,
    deleteMilestone: deleteMilestoneMutation.mutate,
    calculateGoalProgress: calculateGoalProgressMutation.mutate,

    isCreatingGoal: createGoalMutation.isPending,
    isUpdatingGoal: updateGoalMutation.isPending,
    isDeletingGoal: deleteGoalMutation.isPending,
    isCreatingMilestone: createMilestoneMutation.isPending,
    isUpdatingMilestone: updateMilestoneMutation.isPending,
    isDeletingMilestone: deleteMilestoneMutation.isPending,
    isCalculatingProgress: calculateGoalProgressMutation.isPending,
  };
}
