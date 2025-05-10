import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Goal, GoalMilestone } from '@shared/schema';
import { useUserData } from './use-user-data';
import { useToast } from './use-toast';
import { API_BASE } from '@/lib/api-config';

// Helper function to transform API response
const transformResponse = async (response: Response) => {
  const data = await response.json();
  return data;
};

// Implementation of apiRequest function
async function apiRequest(url: string, options: RequestInit = {}) {
  const fullUrl = url.startsWith('http') ? url : `${API_BASE}${url}`;
  const response = await fetch(fullUrl, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || response.statusText);
  }
  
  return response;
}

type GoalProgressData = {
  activeGoals: GoalProgressItem[];
  completedGoals: GoalProgressItem[];
  upcomingMilestones: {
    id: number;
    goalId: number;
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
  id: number;
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
    id: number;
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
  const userId = userData?.id;

  // Fetch all goals
  const {
    data: goals,
    isLoading: isLoadingGoals,
    error: goalsError
  } = useQuery({
    queryKey: ['/api/goals', userId],
    queryFn: async () => {
      const response = await apiRequest(`/api/goals?userId=${userId}`);
      return transformResponse(response);
    },
    enabled: !!userId,
  });

  // Fetch goal progress analytics
  const {
    data: goalProgress,
    isLoading: isLoadingProgress,
    error: progressError
  } = useQuery<{ success: boolean; progress: GoalProgressData }>({
    queryKey: ['/api/analytics/goals-progress', userId],
    queryFn: async () => {
      const response = await apiRequest(`/api/analytics/goals-progress?userId=${userId}`);
      return transformResponse(response);
    },
    enabled: !!userId,
  });

  // Create a new goal
  const createGoalMutation = useMutation({
    mutationFn: async (goalData: Partial<Goal>) => {
      const response = await apiRequest('/api/goals', {
        method: 'POST',
        body: JSON.stringify(goalData),
      });
      return transformResponse(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/goals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/goals-progress'] });
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
    mutationFn: async ({ id, data }: { id: number; data: Partial<Goal> }) => {
      const response = await apiRequest(`/api/goals/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      return transformResponse(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/goals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/goals-progress'] });
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
    mutationFn: async (goalId: number) => {
      const response = await apiRequest(`/api/goals/${goalId}`, {
        method: 'DELETE',
      });
      return transformResponse(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/goals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/goals-progress'] });
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
    mutationFn: async ({ goalId, data }: { goalId: number; data: Partial<GoalMilestone> }) => {
      const response = await apiRequest(`/api/goals/${goalId}/milestones`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return transformResponse(response);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/goals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/goals', variables.goalId, 'milestones'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/goals-progress'] });
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
    mutationFn: async ({ id, data }: { id: number; data: Partial<GoalMilestone> }) => {
      const response = await apiRequest(`/api/goals/milestones/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      return transformResponse(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/goals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/goals-progress'] });
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
    mutationFn: async (milestoneId: number) => {
      const response = await apiRequest(`/api/goals/milestones/${milestoneId}`, {
        method: 'DELETE',
      });
      return transformResponse(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/goals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/goals-progress'] });
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
    mutationFn: async (goalId: number) => {
      const response = await apiRequest(`/api/goals/${goalId}/calculate-progress`, {
        method: 'POST',
      });
      return transformResponse(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/goals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/goals-progress'] });
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
    goals: goals?.success ? goals.goals || [] : [],
    goalProgress: goalProgress?.success ? goalProgress.progress : undefined,
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