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
   * Process achievements based on updated data
   * Automatically updates any achievements that match the criteria
   * @param userId - Firebase user ID
   * @param checkData - Data to check against achievement criteria
   */
  async processAchievements(userId: string, checkData: any): Promise<void> {
    // Get current user achievements
    const userData = await this.getUserAchievements(userId);
    
    if (!userData) return;
    
    // First, store previous state for comparison later
    const prevAchievements = { ...userData.achievements };
    const prevLevel = userData.level || 1;
    
    // Process each achievement to see if it should be updated
    const achievements = defineAchievements();
    for (const achievement of achievements) {
      // Check if achievement is already complete
      const isAlreadyComplete = userData.achievements[achievement.id]?.isComplete || false;
      
      if (!isAlreadyComplete) {
        // Check if achievement should be completed based on criteria
        // This is a placeholder - actual implementation depends on achievement criteria
        let shouldComplete = false;
        
        // Example check for win rate achievements
        if (achievement.id.includes('win-rate') && checkData.winRate) {
          const requiredRate = parseInt(achievement.id.split('-')[2]) / 100;
          shouldComplete = checkData.winRate >= requiredRate;
        }
        
        // Example check for trades count achievements
        if (achievement.id.includes('trades-count') && checkData.totalTrades) {
          const requiredCount = parseInt(achievement.id.split('-')[2]);
          shouldComplete = checkData.totalTrades >= requiredCount;
        }
        
        // Example check for profit achievements
        if (achievement.id.includes('profit-') && checkData.totalProfit) {
          const requiredProfit = parseInt(achievement.id.split('-')[1]);
          shouldComplete = checkData.totalProfit >= requiredProfit;
        }
        
        // If achievement criteria met, update it
        if (shouldComplete) {
          await this.updateUserAchievement(userId, achievement.id, true);
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
  }
}

export const achievementsService = new AchievementsService();

// Export directly for backward compatibility with existing code
export const getUserAchievements = (userId: string) => achievementsService.getUserAchievements(userId);
export const processUserAchievements = (userId: string, checkData?: any) => achievementsService.processAchievements(userId, checkData ?? {});