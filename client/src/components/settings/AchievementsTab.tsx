import React, { useState, useEffect } from "react";
import { useMemoWithPerf } from "@/lib/performance";
import { useQuery } from "@tanstack/react-query";
import { auth } from "@/lib/firebase";
import { Achievement, UserAchievements } from "@/types";
import { getUserAchievements, processUserAchievements } from "@/lib/achievements-service";
import { defineAchievements } from "@/lib/achievements-data";
import { getIconByName, achievementLevelColors, achievementCategoryColors, achievementLevelLabel, calculateLevelProgress, achievementLevelRank } from "@/lib/achievements-data";
import { cn } from "@/lib/utils";
import { format } from "date-fns";


import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

import {
  Trophy,
  Award,
  Medal,
  Star,
  RefreshCcw,
  Filter,
  ChevronRight,
  Check,
  FilterX,
  Loader2,
  Clock,
  Lock,
  Sparkles,
  AlertCircle,
  BookOpen,
  TrendingUp
} from "lucide-react";

interface AchievementCardProps {
  achievement: Achievement;
  userProgress: {
    isComplete: boolean;
    progress?: number;
    dateEarned?: string;
  };
}

// Card displaying an achievement - memoized for performance
const AchievementCard = React.memo(function AchievementCard({ achievement, userProgress }: AchievementCardProps) {
  const { id, name, description, icon, category, level, points } = achievement;
  const { isComplete, progress = 0, dateEarned } = userProgress;
  
  const Icon = getIconByName(icon);
  const levelColor = achievementLevelColors[level as keyof typeof achievementLevelColors];
  const categoryColor = achievementCategoryColors[category as keyof typeof achievementCategoryColors];
  
  return (
    <Card className={cn(
      "overflow-hidden transition-all duration-300 group", 
      levelColor.bg,
      levelColor.border,
      isComplete ? "shadow-md" : "opacity-85",
      "hover:shadow-md"
    )}>
      <CardHeader className="pb-2 relative">
        <div className="absolute top-2 right-2">
          <Badge 
            variant="outline" 
            className={cn(
              "font-semibold text-xs", 
              categoryColor.bg, 
              categoryColor.text,
              "border-0"
            )}
          >
            {categoryColor.label}
          </Badge>
        </div>
        
        <div className="flex items-center">
          <div className={cn(
            "w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0",
            levelColor.bg, 
            "border", 
            levelColor.border
          )}>
            <Icon className={cn("h-5 w-5 sm:h-6 sm:w-6", levelColor.icon)} />
          </div>
          
          <div>
            <CardTitle className="text-sm sm:text-base flex items-center">
              {name}
              {isComplete && <Check className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2 text-green-500" />}
            </CardTitle>
            <CardDescription className="text-[10px] sm:text-xs mt-0.5 line-clamp-2">
              {description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pb-2">
        <div className="flex justify-between items-center text-xs mt-1 mb-1.5">
          <div className="flex items-center font-medium">
            <Trophy className="h-3.5 w-3.5 mr-1 text-amber-500" />
            <span>{points} points</span>
          </div>
          <div className={cn(
            "px-2 py-0.5 rounded font-medium text-xs",
            levelColor.text,
            levelColor.bg
          )}>
            {achievementLevelLabel(level)}
          </div>
        </div>
        
        <div className="mt-2">
          <Progress 
            value={isComplete ? 100 : progress} 
            className={cn(
              "h-2 bg-background/50", 
              isComplete ? "bg-green-100 dark:bg-green-950" : "",
              isComplete ? "!bg-green-500" : ""
            )}
          />
        </div>
      </CardContent>
      
      {isComplete && dateEarned && (
        <CardFooter className="p-3 pb-3 pt-0">
          <div className="w-full flex items-center justify-end text-xs text-muted-foreground">
            <Clock className="h-3 w-3 mr-1" />
            <span>Earned: {format(new Date(dateEarned), "dd/MM/yyyy")}</span>
          </div>
        </CardFooter>
      )}
    </Card>
  );
});

// Component for level and progress - memoized
const LevelProgress = React.memo(function LevelProgress({ level, totalPoints }: { level: number; totalPoints: number }) {
  const progress = calculateLevelProgress(totalPoints);
  
  return (
    <div className="mb-6 p-4 bg-gradient-to-r from-violet-400/10 via-indigo-400/10 to-blue-400/10 rounded-lg border border-blue-500/10">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
            <Sparkles className="h-5 w-5 text-indigo-500" />
          </div>
          <div className="ml-3">
            <h4 className="font-semibold">Level {level}</h4>
            <p className="text-xs text-muted-foreground">
              {totalPoints} total points
            </p>
          </div>
        </div>
        
        <Badge variant="outline" className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30">
          {progress}% complete
        </Badge>
      </div>
      
      <Progress 
        value={progress} 
        className="h-2.5 bg-background/50 [&>div]:bg-gradient-to-r [&>div]:from-indigo-500 [&>div]:to-blue-500"
      />
      
      <div className="flex justify-between mt-2 text-xs text-muted-foreground">
        <span>Level {level}</span>
        <span>Level {level + 1}</span>
      </div>
    </div>
  );
});

// AchievementsTab Component - Achievements section in Settings
export const AchievementsTab: React.FC<{
  showNotifications: boolean;
  onToggleNotifications: (show: boolean) => void;
}> = ({ showNotifications, onToggleNotifications }) => {
  const userId = auth.currentUser?.uid || "";
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Fetch achievements from Firebase
  const { 
    data: userAchievements, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: [`/userAchievements/${userId}`],
    queryFn: async () => {
      if (!userId) return null;
      return await getUserAchievements(userId);
    },
    enabled: !!userId,
  });
  
  // Achievement list
  const achievementsList = defineAchievements();
  
  // Refresh achievements from real trading data
  const handleRefreshAchievements = async () => {
    if (!userId) return;
    
    setIsRefreshing(true);
    try {
      await processUserAchievements(userId);
      await refetch();
    } catch (error) {
      console.error("Error refreshing achievements:", error);
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Filter achievements by category - memoized for performance
  const filteredAchievements = useMemoWithPerf(
    () => {
      if (selectedCategory === "all") {
        return achievementsList;
      } else if (selectedCategory === "completed") {
        return achievementsList.filter(a => userAchievements?.achievements[a.id]?.isComplete);
      } else if (selectedCategory === "in-progress") {
        return achievementsList.filter(a => !userAchievements?.achievements[a.id]?.isComplete &&
          (userAchievements?.achievements[a.id]?.progress || 0) > 0);
      } else {
        return achievementsList.filter(a => a.category === selectedCategory);
      }
    },
    [selectedCategory, achievementsList, userAchievements?.achievements],
    true // force memoization even on high-performance devices
  );
  
  // Count achievements - memoized for performance
  const { completedCount, inProgressCount } = useMemoWithPerf(
    () => {
      // Count completed achievements
      const completed = achievementsList.filter(
        a => userAchievements?.achievements[a.id]?.isComplete
      ).length;
      
      // Count in-progress achievements
      const inProgress = achievementsList.filter(
        a => !userAchievements?.achievements[a.id]?.isComplete &&
          (userAchievements?.achievements[a.id]?.progress || 0) > 0
      ).length;
      
      return { completedCount: completed, inProgressCount: inProgress };
    },
    [achievementsList, userAchievements?.achievements],
    true // force memoization even on high-performance devices
  );
  
  if (isLoading) {
    return (
      <div className="py-8 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  if (error || !userAchievements) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="h-8 w-8 mx-auto mb-3 text-destructive" />
        <h3 className="font-medium text-lg mb-1">Unable to load achievements</h3>
        <p className="text-muted-foreground mb-4">
          An error occurred while loading your achievement data.
        </p>
        <Button 
          variant="outline" 
          onClick={() => refetch()}
        >
          Try Again
        </Button>
      </div>
    );
  }
  
  return (
    <div>
      {/* Achievement notifications */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium">Achievement Notifications</h3>
        <div className="flex items-center">
          <Switch
            id="achievement-notifications"
            checked={showNotifications}
            onCheckedChange={onToggleNotifications}
          />
          <Label 
            htmlFor="achievement-notifications" 
            className="ml-2 cursor-pointer"
          >
            {showNotifications ? "On" : "Off"}
          </Label>
        </div>
      </div>
      
      {/* Level progress */}
      <LevelProgress 
        level={userAchievements.level} 
        totalPoints={userAchievements.totalPoints} 
      />
      
      {/* Achievement overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 mb-6">
        <Card className="bg-primary/5 border-primary/10">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Achievements</p>
                <h4 className="text-lg sm:text-xl font-bold">{achievementsList.length}</h4>
              </div>
              <Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-primary/70" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-green-500/5 border-green-500/10">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Completed</p>
                <h4 className="text-lg sm:text-xl font-bold">{completedCount}</h4>
              </div>
              <Check className="h-5 w-5 sm:h-6 sm:w-6 text-green-500/70" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-amber-500/5 border-amber-500/10">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">In Progress</p>
                <h4 className="text-lg sm:text-xl font-bold">{inProgressCount}</h4>
              </div>
              <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-amber-500/70" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Achievement filter tabs */}
      <div className="flex items-center justify-between mb-4">
        <Tabs 
          defaultValue="all" 
          value={selectedCategory}
          onValueChange={setSelectedCategory}
          className="w-full"
        >
          {/* Category tabs in a single row */}
          <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-2">
            <div className="flex flex-1 w-full sm:w-auto mb-2 sm:mb-0">
              <TabsList className="grid grid-cols-5 h-9 w-full">
                <TabsTrigger value="all" className="text-[10px] sm:text-xs px-1 sm:px-3">
                  All
                </TabsTrigger>
                <TabsTrigger value="discipline" className="text-[10px] sm:text-xs px-1 sm:px-3">
                  Discipline
                </TabsTrigger>
                <TabsTrigger value="performance" className="text-[10px] sm:text-xs px-1 sm:px-3">
                  Performance
                </TabsTrigger>
                <TabsTrigger value="consistency" className="text-[10px] sm:text-xs px-1 sm:px-3">
                  Consistency
                </TabsTrigger>
                <TabsTrigger value="learning" className="text-[10px] sm:text-xs px-1 sm:px-3">
                  Learning
                </TabsTrigger>
              </TabsList>
            </div>
          </div>
          
          {/* Filtering and action buttons row */}
          <div className="flex flex-wrap mb-6 gap-2 items-center">
            <Button 
              variant={selectedCategory === "completed" ? "secondary" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(prev => 
                prev === "completed" ? "all" : "completed"
              )}
              className="h-8 text-xs"
            >
              <Check className="h-3.5 w-3.5 mr-1.5" />
              Completed
            </Button>
            
            <Button 
              variant={selectedCategory === "in-progress" ? "secondary" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(prev => 
                prev === "in-progress" ? "all" : "in-progress"
              )}
              className="h-8 text-xs"
            >
              <Clock className="h-3.5 w-3.5 mr-1.5" />
              In Progress
            </Button>
            
            <Button 
              variant="outline"
              size="sm"
              onClick={handleRefreshAchievements}
              disabled={isRefreshing}
              className="h-8 text-xs gap-1 ml-auto"
            >
              {isRefreshing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCcw className="h-3.5 w-3.5" />
              )}
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
          
          {/* Achievement list */}
          <div className="transition-all duration-200 ease-in-out fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredAchievements
                .sort((a, b) => {
                  // Sort by level rank first (bronze to master)
                  const levelRankA = achievementLevelRank[a.level] || 0;
                  const levelRankB = achievementLevelRank[b.level] || 0;
                  
                  if (levelRankA !== levelRankB) {
                    return levelRankA - levelRankB;
                  }
                  
                  // If same level, sort by category
                  if (a.category !== b.category) {
                    return a.category.localeCompare(b.category);
                  }
                  
                  // Finally sort by points if needed
                  return a.points - b.points;
                })
                .map(achievement => (
                  <AchievementCard
                    key={achievement.id}
                    achievement={achievement}
                    userProgress={userAchievements.achievements[achievement.id] || {
                      isComplete: false,
                      progress: 0
                    }}
                  />
                ))}
            </div>
            
            {filteredAchievements.length === 0 && (
              <div className="text-center py-8">
                <FilterX className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <h4 className="text-lg font-medium mb-1">No achievements found</h4>
                <p className="text-muted-foreground">
                  Try selecting a different category or removing filters to see all achievements.
                </p>
              </div>
            )}
          </div>
        </Tabs>
      </div>
      
      {/* Developer testing section for achievement popup - only shown in development */}
      {import.meta.env.DEV && (
        <div className="mt-8 border-t pt-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Developer Tools</h3>
          <div className="p-4 bg-muted/50 rounded-lg border">
            <h4 className="text-xs font-medium mb-2">Test Achievement System</h4>
            <p className="text-xs text-muted-foreground mb-3">
              These buttons will trigger achievement notifications for testing purposes.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};