import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoalCard } from './GoalCard';
import { GoalForm } from './GoalForm';
import { MilestoneForm } from './MilestoneForm';
import { useGoalData } from '@/hooks/use-goal-data';
import { useUserData } from '@/hooks/use-user-data';
import { Goal as GoalType, GoalMilestone } from '@shared/schema';

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

  // State quản lý
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openMilestoneDialog, setOpenMilestoneDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [currentGoal, setCurrentGoal] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('active');

  // Xử lý tạo mục tiêu mới
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

  // Xử lý cập nhật mục tiêu
  const handleUpdateGoal = (data: any) => {
    if (!currentGoal) return;
    
    updateGoal({
      id: currentGoal.id,
      data: data,
    });
    
    setOpenEditDialog(false);
    setCurrentGoal(null);
  };

  // Xử lý xóa mục tiêu
  const handleDeleteGoal = () => {
    if (!currentGoal) return;
    
    deleteGoal(currentGoal.id);
    setOpenDeleteDialog(false);
    setCurrentGoal(null);
  };

  // Xử lý thêm cột mốc
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

  // Hiển thị dialog chỉnh sửa mục tiêu
  const handleEditGoal = (goal: any) => {
    setCurrentGoal(goal);
    setOpenEditDialog(true);
  };

  // Hiển thị dialog xác nhận xóa mục tiêu
  const handleDeletePrompt = (goal: any) => {
    setCurrentGoal(goal);
    setOpenDeleteDialog(true);
  };

  // Hiển thị dialog thêm cột mốc
  const handleAddMilestone = (goal: any) => {
    setCurrentGoal(goal);
    setOpenMilestoneDialog(true);
  };

  // Lọc mục tiêu theo từ khóa tìm kiếm
  const filterGoals = (goals: any[]) => {
    if (!searchTerm) return goals;
    
    return goals.filter(goal => 
      goal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (goal.description && goal.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  };

  // Animation variants cho danh sách mục tiêu
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
        <Goal className="h-12 w-12 animate-pulse text-primary" />
        <p className="text-lg font-medium">Đang tải dữ liệu mục tiêu...</p>
      </div>
    );
  }

  // Không có dữ liệu mục tiêu
  if (!goalProgress) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Mục tiêu Giao dịch</h2>
          <Button onClick={() => setOpenCreateDialog(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Tạo mục tiêu mới
          </Button>
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center h-96 space-y-4">
          <Goal className="h-16 w-16 text-muted-foreground" />
          <div className="text-center space-y-2">
            <p className="text-xl font-medium">Chưa có mục tiêu nào</p>
            <p className="text-muted-foreground">
              Tạo mục tiêu để theo dõi và nâng cao hiệu suất giao dịch của bạn
            </p>
            <Button 
              className="mt-4" 
              onClick={() => setOpenCreateDialog(true)}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Tạo mục tiêu đầu tiên
            </Button>
          </div>
        </div>

        {/* Dialog tạo mục tiêu mới */}
        <Dialog open={openCreateDialog} onOpenChange={setOpenCreateDialog}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Tạo mục tiêu mới</DialogTitle>
              <DialogDescription>
                Thiết lập mục tiêu giao dịch để theo dõi và cải thiện hiệu suất của bạn.
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

  // Dữ liệu mục tiêu có sẵn - hiển thị danh sách
  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Mục tiêu Giao dịch</h2>
        <Button onClick={() => setOpenCreateDialog(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Tạo mục tiêu mới
        </Button>
      </div>

      {/* Phần tổng quan về tiến độ */}
      <div className="bg-card rounded-lg p-4 mb-6 border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="col-span-1 md:col-span-2 flex flex-col justify-center">
            <h3 className="text-lg font-medium mb-2">Tổng tiến độ đạt được</h3>
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
              {goalProgress.overallProgress.completedGoals} / {goalProgress.overallProgress.totalGoals} mục tiêu đã hoàn thành
            </p>
          </div>
          
          <div className="space-y-2 flex flex-col justify-center">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-green-500" />
              <span className="font-medium">{goalProgress.completedGoals.length} mục tiêu hoàn thành</span>
            </div>
            <div className="flex items-center gap-2">
              <Goal className="h-5 w-5 text-blue-500" />
              <span className="font-medium">{goalProgress.activeGoals.length} mục tiêu đang thực hiện</span>
            </div>
          </div>
          
          <div className="space-y-2 flex flex-col justify-center">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              <span className="font-medium">
                {goalProgress.upcomingMilestones.length} cột mốc sắp đến
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
                  ).length} mục tiêu quá hạn
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Phần tìm kiếm và lọc */}
      <div className="mb-4 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm mục tiêu..."
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
            <TabsTrigger value="active">Đang thực hiện</TabsTrigger>
            <TabsTrigger value="completed">Đã hoàn thành</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Nội dung tab */}
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
                    <Goal className="h-12 w-12 text-muted-foreground mb-4" />
                    {searchTerm ? (
                      <>
                        <h3 className="text-lg font-medium">Không tìm thấy mục tiêu</h3>
                        <p className="text-muted-foreground">
                          Không có mục tiêu nào phù hợp với từ khóa "{searchTerm}"
                        </p>
                      </>
                    ) : (
                      <>
                        <h3 className="text-lg font-medium">Không có mục tiêu đang thực hiện</h3>
                        <p className="text-muted-foreground">
                          Bạn chưa có mục tiêu đang thực hiện nào
                        </p>
                        <Button
                          className="mt-4"
                          onClick={() => setOpenCreateDialog(true)}
                        >
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Tạo mục tiêu mới
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
                        <h3 className="text-lg font-medium">Không tìm thấy mục tiêu</h3>
                        <p className="text-muted-foreground">
                          Không có mục tiêu hoàn thành nào phù hợp với từ khóa "{searchTerm}"
                        </p>
                      </>
                    ) : (
                      <>
                        <h3 className="text-lg font-medium">Chưa có mục tiêu hoàn thành</h3>
                        <p className="text-muted-foreground">
                          Hoàn thành mục tiêu để xem chúng hiển thị ở đây
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

      {/* Dialog tạo mục tiêu mới */}
      <Dialog open={openCreateDialog} onOpenChange={setOpenCreateDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tạo mục tiêu mới</DialogTitle>
            <DialogDescription>
              Thiết lập mục tiêu giao dịch để theo dõi và cải thiện hiệu suất của bạn.
            </DialogDescription>
          </DialogHeader>
          <GoalForm 
            onSubmit={handleCreateGoal} 
            onCancel={() => setOpenCreateDialog(false)}
            isSubmitting={isCreatingGoal}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog chỉnh sửa mục tiêu */}
      <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa mục tiêu</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin mục tiêu của bạn.
            </DialogDescription>
          </DialogHeader>
          {currentGoal && (
            <GoalForm 
              defaultValues={{
                title: currentGoal.title,
                description: currentGoal.description || '',
                targetType: currentGoal.targetType,
                targetValue: currentGoal.targetValue,
                startDate: new Date(currentGoal.startDate),
                endDate: new Date(currentGoal.endDate),
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

      {/* Dialog thêm cột mốc */}
      <Dialog open={openMilestoneDialog} onOpenChange={setOpenMilestoneDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Thêm cột mốc</DialogTitle>
            <DialogDescription>
              Tạo cột mốc mới cho mục tiêu "{currentGoal?.title}".
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