import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Goal, GoalMilestone } from '@shared/schema';
import { useUserData } from './use-user-data';
import { useToast } from './use-toast';
import { addGoal, getGoals, getGoalById, updateGoal, deleteGoal, calculateGoalProgress, onGoalsSnapshot } from '@/lib/firebase'; 
import { addMilestone, getMilestones, updateMilestone, deleteMilestone } from '@/lib/firebase';
import { auth } from '@/lib/firebase';
import { useEffect, useState } from 'react';
import { debug } from '@/lib/debug';

// Helper function để chuyển đổi dữ liệu từ Firebase sang dạng phù hợp
const transformFirebaseData = <T>(data: any): T => {
  return data as T;
};

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

  // State cho dữ liệu mục tiêu từ Firebase
  const [goalsData, setGoalsData] = useState<any[]>([]);
  const [isLoadingGoals, setIsLoadingGoals] = useState(true);
  const [goalsError, setGoalsError] = useState<Error | null>(null);

  // State cho dữ liệu tiến độ mục tiêu
  const [goalProgressData, setGoalProgressData] = useState<GoalProgressData | undefined>(undefined);
  const [isLoadingProgress, setIsLoadingProgress] = useState(true);
  const [progressError, setProgressError] = useState<Error | null>(null);

  // Effect để lấy dữ liệu mục tiêu từ Firebase
  useEffect(() => {
    if (!firebaseUserId) {
      setIsLoadingGoals(false);
      return;
    }

    setIsLoadingGoals(true);
    
    // Đăng ký listener để lắng nghe thay đổi mục tiêu theo thời gian thực
    const unsubscribe = onGoalsSnapshot(
      firebaseUserId,
      (goals) => {
        debug(`Received ${goals.length} goals from Firebase`);
        setGoalsData(goals);
        setIsLoadingGoals(false);
        
        // Khi có dữ liệu mục tiêu mới, tính toán dữ liệu tiến độ
        calculateGoalProgressData(goals);
      },
      (error) => {
        debug("Error fetching goals:", error);
        setGoalsError(error);
        setIsLoadingGoals(false);
      }
    );

    // Cleanup khi component unmount
    return () => unsubscribe();
  }, [firebaseUserId]);

  // Hàm tính toán dữ liệu tiến độ mục tiêu
  const calculateGoalProgressData = (goals: any[]) => {
    try {
      setIsLoadingProgress(true);
      
      // Tính toán ngày hiện tại
      const now = new Date();
      
      // Chuẩn bị dữ liệu mục tiêu với thông tin tiến độ
      const goalsWithProgress = goals.map(goal => {
        // Tính số ngày còn lại
        const endDate = new Date(goal.endDate?.toDate ? goal.endDate.toDate() : goal.endDate);
        const daysLeft = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
        
        // Tính tiến độ mục tiêu
        const progressPercentage = Math.min(100, (goal.currentValue / goal.targetValue) * 100 || 0);
        
        // Tính tiến độ cho từng cột mốc
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
      
      // Phân loại mục tiêu thành đang hoạt động và đã hoàn thành
      const activeGoals = goalsWithProgress.filter(goal => !goal.isCompleted);
      const completedGoals = goalsWithProgress.filter(goal => goal.isCompleted);
      
      // Tìm các cột mốc sắp đến
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
      
      // Tính tổng tiến độ
      const totalGoals = goals.length;
      const completedGoalsCount = completedGoals.length;
      const overallProgressPercentage = totalGoals > 0 
        ? (completedGoalsCount / totalGoals) * 100 
        : 0;
      
      // Cập nhật state
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
    mutationFn: async (goalData: Partial<Goal>) => {
      if (!firebaseUserId) throw new Error("Người dùng chưa đăng nhập");
      
      // Chuyển đổi dữ liệu mục tiêu
      const formattedData = {
        ...goalData,
        userId: firebaseUserId
      };
      
      // Gọi hàm thêm mục tiêu từ Firebase
      return addGoal(firebaseUserId, formattedData);
    },
    onSuccess: () => {
      // Không cần invalidate query vì snapshot listener sẽ tự động cập nhật
      toast({
        title: 'Mục tiêu đã được tạo',
        description: 'Mục tiêu mới của bạn đã được tạo thành công.',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Lỗi khi tạo mục tiêu',
        description: error?.message || 'Đã xảy ra lỗi khi tạo mục tiêu.',
      });
    },
  });

  // Update an existing goal
  const updateGoalMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Goal> }) => {
      if (!firebaseUserId) throw new Error("Người dùng chưa đăng nhập");
      
      // Gọi hàm cập nhật mục tiêu từ Firebase
      return updateGoal(firebaseUserId, id, data);
    },
    onSuccess: () => {
      // Không cần invalidate query vì snapshot listener sẽ tự động cập nhật
      toast({
        title: 'Mục tiêu đã được cập nhật',
        description: 'Mục tiêu của bạn đã được cập nhật thành công.',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Lỗi khi cập nhật mục tiêu',
        description: error?.message || 'Đã xảy ra lỗi khi cập nhật mục tiêu.',
      });
    },
  });

  // Delete a goal
  const deleteGoalMutation = useMutation({
    mutationFn: async (goalId: string) => {
      if (!firebaseUserId) throw new Error("Người dùng chưa đăng nhập");
      
      // Gọi hàm xóa mục tiêu từ Firebase
      return deleteGoal(firebaseUserId, goalId);
    },
    onSuccess: () => {
      // Không cần invalidate query vì snapshot listener sẽ tự động cập nhật
      toast({
        title: 'Mục tiêu đã bị xóa',
        description: 'Mục tiêu đã được xóa thành công.',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Lỗi khi xóa mục tiêu',
        description: error?.message || 'Đã xảy ra lỗi khi xóa mục tiêu.',
      });
    },
  });

  // Create a milestone
  const createMilestoneMutation = useMutation({
    mutationFn: async ({ goalId, data }: { goalId: string; data: Partial<GoalMilestone> }) => {
      if (!firebaseUserId) throw new Error("Người dùng chưa đăng nhập");
      
      // Gọi hàm thêm cột mốc từ Firebase
      return addMilestone(firebaseUserId, goalId, data);
    },
    onSuccess: () => {
      // Không cần invalidate query vì snapshot listener sẽ tự động cập nhật
      toast({
        title: 'Cột mốc đã được tạo',
        description: 'Cột mốc mới đã được tạo thành công.',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Lỗi khi tạo cột mốc',
        description: error?.message || 'Đã xảy ra lỗi khi tạo cột mốc.',
      });
    },
  });

  // Update a milestone
  const updateMilestoneMutation = useMutation({
    mutationFn: async ({ goalId, milestoneId, data }: { goalId: string; milestoneId: string; data: Partial<GoalMilestone> }) => {
      if (!firebaseUserId) throw new Error("Người dùng chưa đăng nhập");
      
      // Gọi hàm cập nhật cột mốc từ Firebase
      return updateMilestone(firebaseUserId, goalId, milestoneId, data);
    },
    onSuccess: () => {
      // Không cần invalidate query vì snapshot listener sẽ tự động cập nhật
      toast({
        title: 'Cột mốc đã được cập nhật',
        description: 'Cột mốc đã được cập nhật thành công.',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Lỗi khi cập nhật cột mốc',
        description: error?.message || 'Đã xảy ra lỗi khi cập nhật cột mốc.',
      });
    },
  });

  // Delete a milestone
  const deleteMilestoneMutation = useMutation({
    mutationFn: async ({ goalId, milestoneId }: { goalId: string; milestoneId: string }) => {
      if (!firebaseUserId) throw new Error("Người dùng chưa đăng nhập");
      
      // Gọi hàm xóa cột mốc từ Firebase
      return deleteMilestone(firebaseUserId, goalId, milestoneId);
    },
    onSuccess: () => {
      // Không cần invalidate query vì snapshot listener sẽ tự động cập nhật
      toast({
        title: 'Cột mốc đã bị xóa',
        description: 'Cột mốc đã được xóa thành công.',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Lỗi khi xóa cột mốc',
        description: error?.message || 'Đã xảy ra lỗi khi xóa cột mốc.',
      });
    },
  });

  // Calculate goal progress
  const calculateGoalProgressMutation = useMutation({
    mutationFn: async (goalId: string) => {
      if (!firebaseUserId) throw new Error("Người dùng chưa đăng nhập");
      
      // Gọi hàm tính toán tiến độ từ Firebase
      return calculateGoalProgress(firebaseUserId, goalId);
    },
    onSuccess: () => {
      // Không cần invalidate query vì snapshot listener sẽ tự động cập nhật
      toast({
        title: 'Tiến độ đã được cập nhật',
        description: 'Tiến độ mục tiêu đã được tính toán lại thành công.',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Lỗi khi tính toán tiến độ',
        description: error?.message || 'Đã xảy ra lỗi khi tính toán tiến độ mục tiêu.',
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