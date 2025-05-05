import { db, auth } from './firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  getDocs,
  query,
  where,
  arrayUnion,
  serverTimestamp
} from 'firebase/firestore';
import { Achievement } from '@/types';
import { defineAchievements } from './achievements-data';
import { useAchievementNotifications, findNewlyUnlockedAchievements, checkForLevelUp } from './achievement-notification-service';
import { getUserMetrics, calculateAndUpdateAllMetrics, TradeMetrics } from './trade-metrics-service';

// Mapping of points to levels
// Higher levels require more points
const USER_LEVELS: Record<number, number> = {
  1: 0,      // Starting level
  2: 100,    // 100 points needed
  3: 250,
  4: 500,
  5: 1000,
  6: 2000,
  7: 4000, 
  8: 8000,
  9: 15000   // Master level requires 15,000 points
};

/**
 * Calculate user level based on total points
 * @param points - Total achievement points
 * @returns Current user level (1-9)
 */
export function calculateUserLevel(points: number): number {
  // Find the highest level where points meet the requirement
  const levels = Object.keys(USER_LEVELS).map(Number);
  
  let userLevel = 1; // Default level
  
  for (const level of levels) {
    if (points >= USER_LEVELS[level]) {
      userLevel = level;
    } else {
      break;
    }
  }
  
  return userLevel;
}

/**
 * Calculate points needed for next level
 * @param currentPoints - Current achievement points
 * @returns {Object} Object containing next level and points needed
 */
export function calculatePointsForNextLevel(currentPoints: number): { 
  nextLevel: number; 
  pointsNeeded: number;
  currentLevelPoints: number;
  nextLevelPoints: number;
  progress: number;
} {
  const currentLevel = calculateUserLevel(currentPoints);
  const isMaxLevel = currentLevel === 9;
  
  // If already at max level, return appropriate values
  if (isMaxLevel) {
    return {
      nextLevel: 9,
      pointsNeeded: 0,
      currentLevelPoints: USER_LEVELS[9],
      nextLevelPoints: USER_LEVELS[9],
      progress: 100
    };
  }
  
  const nextLevel = currentLevel + 1;
  const pointsForNextLevel = USER_LEVELS[nextLevel];
  const pointsNeeded = pointsForNextLevel - currentPoints;
  
  // Calculate progress percentage between current and next level
  const currentLevelPoints = USER_LEVELS[currentLevel];
  const nextLevelPoints = USER_LEVELS[nextLevel];
  const levelPointsRange = nextLevelPoints - currentLevelPoints;
  const pointsIntoLevel = currentPoints - currentLevelPoints;
  const progress = Math.round((pointsIntoLevel / levelPointsRange) * 100);
  
  return {
    nextLevel,
    pointsNeeded,
    currentLevelPoints,
    nextLevelPoints,
    progress
  };
}

/**
 * Kiểm tra xem thành tựu đã đáp ứng điều kiện chưa
 * @param metrics - Trade metrics để kiểm tra
 * @param achievement - Thành tựu cần kiểm tra
 * @returns true nếu thành tựu đạt điều kiện, false nếu không
 */
function checkAchievementCriteria(metrics: TradeMetrics, achievement: Achievement): boolean {
  const { metricName, metricValue, comparison } = achievement.criteria;
  
  // Lấy giá trị metrics tương ứng với tên metrics trong tiêu chí
  const actualValue = metrics[metricName as keyof TradeMetrics];
  
  // Kiểm tra nếu không có giá trị
  if (actualValue === undefined || actualValue === null) {
    return false;
  }
  
  // Số hóa giá trị để so sánh
  const numericValue = Number(actualValue);
  
  // So sánh theo loại
  switch (comparison) {
    case 'greater':
      return numericValue >= metricValue;
    case 'equals':
      return numericValue === metricValue;
    case 'less':
      return numericValue <= metricValue;
    default:
      return false;
  }
}

class AchievementsService {
  /**
   * Initialize user achievements in Firestore
   * @param userId - Firebase user ID
   */
  async initializeUserAchievements(userId: string): Promise<void> {
    try {
      // Check if user already has achievements document
      const userAchievementsRef = doc(db, 'userAchievements', userId);
      const docSnapshot = await getDoc(userAchievementsRef);
      
      if (!docSnapshot.exists()) {
        // Create initial achievements data structure
        const initialData: {
          userId: string;
          totalPoints: number;
          level: number;
          updatedAt: any;
          achievements: Record<string, { isComplete: boolean; completedAt: null }>;
        } = {
          userId,
          totalPoints: 0,
          level: 1,
          updatedAt: serverTimestamp(),
          achievements: {}
        };
        
        // Initialize all achievements as not completed
        const achievements = defineAchievements();
        achievements.forEach(achievement => {
          initialData.achievements[achievement.id] = {
            isComplete: false,
            completedAt: null
          };
        });
        
        await setDoc(userAchievementsRef, initialData);
      }
    } catch (error) {
      console.error('Error initializing user achievements:', error);
    }
  }
  
  /**
   * Get user achievements from Firestore
   * @param userId - Firebase user ID
   * @returns User achievement data
   */
  async getUserAchievements(userId: string): Promise<any> {
    try {
      // First ensure user has achievement data
      await this.initializeUserAchievements(userId);
      
      // Get user achievements
      const userAchievementsRef = doc(db, 'userAchievements', userId);
      const docSnapshot = await getDoc(userAchievementsRef);
      
      if (docSnapshot.exists()) {
        return docSnapshot.data();
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching user achievements:', error);
      return null;
    }
  }
  
  /**
   * Update a specific achievement for a user
   * @param userId - Firebase user ID
   * @param achievementId - Achievement ID to update
   * @param isComplete - Whether achievement is complete
   */
  async updateUserAchievement(
    userId: string, 
    achievementId: string, 
    isComplete: boolean
  ): Promise<void> {
    try {
      // Get previous achievement data for comparison
      const prevData = await this.getUserAchievements(userId);
      
      // Find achievement data
      const achievements = defineAchievements();
      const achievement = achievements.find(a => a.id === achievementId);
      
      if (!achievement) {
        throw new Error(`Achievement ${achievementId} not found`);
      }
      
      // Update achievement status
      const userAchievementsRef = doc(db, 'userAchievements', userId);
      
      // Only update if achievement status has changed
      const prevStatus = prevData?.achievements?.[achievementId]?.isComplete || false;
      
      if (prevStatus !== isComplete) {
        const updateData: any = {
          [`achievements.${achievementId}.isComplete`]: isComplete,
          updatedAt: serverTimestamp()
        };
        
        // If marking as complete, set completion timestamp and add points
        if (isComplete) {
          updateData[`achievements.${achievementId}.completedAt`] = serverTimestamp();
          updateData.totalPoints = (prevData?.totalPoints || 0) + achievement.points;
          
          // Check if level has increased
          const newLevel = calculateUserLevel(updateData.totalPoints);
          if (newLevel > (prevData?.level || 1)) {
            updateData.level = newLevel;
          }
        } else {
          // If marking as incomplete, remove points
          updateData.totalPoints = Math.max(0, (prevData?.totalPoints || 0) - achievement.points);
          
          // Check if level has decreased
          const newLevel = calculateUserLevel(updateData.totalPoints);
          if (newLevel < (prevData?.level || 1)) {
            updateData.level = newLevel;
          }
        }
        
        await updateDoc(userAchievementsRef, updateData);
        
        // Show achievement popup notifications if an achievement was unlocked
        if (isComplete && !prevStatus) {
          // Check for newly completed achievements
          const { enqueueAchievement } = useAchievementNotifications.getState();
          enqueueAchievement(achievement);
          
          // Check for level up
          const prevLevel = prevData?.level || 1;
          const currentLevel = updateData.level || prevLevel;
          
          if (currentLevel > prevLevel) {
            const { showLevelUp } = useAchievementNotifications.getState();
            showLevelUp(currentLevel);
          }
        }
      }
    } catch (error) {
      console.error('Error updating user achievement:', error);
    }
  }

  /**
   * Cập nhật tiến trình của một thành tựu
   * @param userId - ID người dùng Firebase
   * @param achievementId - ID thành tựu
   * @param progress - Tiến trình hoàn thành (0-100)
   */
  async updateAchievementProgress(
    userId: string,
    achievementId: string,
    progress: number
  ): Promise<void> {
    try {
      // Đảm bảo tiến trình trong khoảng 0-100
      const validatedProgress = Math.max(0, Math.min(100, progress));

      // Cập nhật trong Firestore
      const userAchievementsRef = doc(db, 'userAchievements', userId);
      await updateDoc(userAchievementsRef, {
        [`achievements.${achievementId}.progress`]: validatedProgress,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating achievement progress:', error);
    }
  }
  
  /**
   * Process achievements based on updated data
   * Automatically updates any achievements that match the criteria
   * @param userId - Firebase user ID
   * @param forceRefresh - Force recalculate all metrics
   */
  async processAchievements(userId: string, forceRefresh: boolean = false): Promise<void> {
    try {
      // Get current user achievements
      const userData = await this.getUserAchievements(userId);
      
      if (!userData) return;
      
      // First, store previous state for comparison later
      const prevAchievements = { ...userData.achievements };
      const prevLevel = userData.level || 1;
      
      // Recalculate all metrics if forced or if there are no metrics yet
      let metrics: TradeMetrics | null;
      
      if (forceRefresh) {
        // Recalculate all metrics from scratch
        metrics = await calculateAndUpdateAllMetrics(userId);
      } else {
        // Try to get existing metrics
        metrics = await getUserMetrics(userId);
        
        // If no metrics exist, calculate them
        if (!metrics) {
          metrics = await calculateAndUpdateAllMetrics(userId);
        }
      }
      
      // If still no metrics, stop
      if (!metrics) {
        console.error('Failed to get or calculate metrics');
        return;
      }
      
      // Process each achievement to see if it should be updated
      const achievements = defineAchievements();
      for (const achievement of achievements) {
        // Check if achievement is already complete
        const isAlreadyComplete = userData.achievements[achievement.id]?.isComplete || false;
        
        if (!isAlreadyComplete) {
          // Check if achievement should be completed based on criteria
          const shouldComplete = checkAchievementCriteria(metrics, achievement);
          
          // If achievement criteria met, update it
          if (shouldComplete) {
            await this.updateUserAchievement(userId, achievement.id, true);
          } else {
            // Update progress for streak-based achievements
            if (achievement.criteria.streak) {
              const metricValue = metrics[achievement.criteria.metricName as keyof TradeMetrics] as number;
              const targetValue = achievement.criteria.metricValue;
              
              // Calculate progress percentage
              const progressPercent = Math.min(100, Math.floor((metricValue / targetValue) * 100));
              
              // Update progress
              await this.updateAchievementProgress(userId, achievement.id, progressPercent);
            }
          }
        }
      }
      
      // Get updated user achievements to check for notifications
      const updatedUserData = await this.getUserAchievements(userId);
      
      if (updatedUserData) {
        // Find newly unlocked achievements
        const newlyUnlocked = findNewlyUnlockedAchievements(
          prevAchievements,
          updatedUserData.achievements,
          defineAchievements()
        );
        
        // Enqueue notifications for all newly unlocked achievements
        if (newlyUnlocked.length > 0) {
          const { enqueueAchievement } = useAchievementNotifications.getState();
          
          // Schedule notifications with a small delay between them
          newlyUnlocked.forEach((achievement, index) => {
            setTimeout(() => {
              enqueueAchievement(achievement);
            }, index * 500); // 500ms delay between notifications
          });
        }
        
        // Check for level up
        const currentLevel = updatedUserData.level || 1;
        if (checkForLevelUp(prevLevel, currentLevel)) {
          const { showLevelUp } = useAchievementNotifications.getState();
          showLevelUp(currentLevel);
        }
      }
    } catch (error) {
      console.error('Error processing achievements:', error);
    }
  }
  
  /**
   * Trigger achievement processing after trade actions
   * @param userId - Firebase user ID
   * @param action - The action performed (create, update, delete)
   */
  async processTradeTrigger(userId: string, action: 'create' | 'update' | 'delete'): Promise<void> {
    // Force refresh metrics and process achievements
    await calculateAndUpdateAllMetrics(userId);
    await this.processAchievements(userId, false);
  }
  
  /**
   * Get all user achievements with additional information
   * @param userId - Firebase user ID
   * @returns Enhanced achievement data with progress information
   */
  async getEnhancedAchievements(userId: string): Promise<{
    achievements: Achievement[];
    totalPoints: number;
    level: number;
    nextLevel: {
      level: number;
      pointsNeeded: number;
      progress: number;
    };
  }> {
    try {
      // Get user achievement data
      const userData = await this.getUserAchievements(userId);
      
      if (!userData) {
        throw new Error('User achievements not found');
      }
      
      // Get all achievement definitions
      const allAchievements = defineAchievements();
      
      // Enhance with completion status and progress
      const enhancedAchievements = allAchievements.map(achievement => {
        const userAchievement = userData.achievements[achievement.id];
        
        return {
          ...achievement,
          isComplete: userAchievement?.isComplete || false,
          dateEarned: userAchievement?.completedAt ? new Date(userAchievement.completedAt.seconds * 1000).toISOString() : undefined,
          progress: userAchievement?.progress || 0
        };
      });
      
      // Calculate next level info
      const nextLevelInfo = calculatePointsForNextLevel(userData.totalPoints);
      
      return {
        achievements: enhancedAchievements,
        totalPoints: userData.totalPoints || 0,
        level: userData.level || 1,
        nextLevel: {
          level: nextLevelInfo.nextLevel,
          pointsNeeded: nextLevelInfo.pointsNeeded,
          progress: nextLevelInfo.progress
        }
      };
    } catch (error) {
      console.error('Error getting enhanced achievements:', error);
      
      // Return empty data
      return {
        achievements: [],
        totalPoints: 0,
        level: 1,
        nextLevel: {
          level: 2,
          pointsNeeded: 100,
          progress: 0
        }
      };
    }
  }
}

export const achievementsService = new AchievementsService();

// Export directly for backward compatibility with existing code
export const getUserAchievements = (userId: string) => achievementsService.getUserAchievements(userId);
export const processUserAchievements = (userId: string, forceRefresh: boolean = false) => 
  achievementsService.processAchievements(userId, forceRefresh);
export const processTradeTrigger = (userId: string, action: 'create' | 'update' | 'delete') => 
  achievementsService.processTradeTrigger(userId, action);
export const getEnhancedAchievements = (userId: string) => 
  achievementsService.getEnhancedAchievements(userId);