import { db } from './firebase';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { Achievement, UserAchievements } from '@/types';
import { defineAchievements } from './achievements-data';
import { useAchievementNotifications, findNewlyUnlockedAchievements, checkForLevelUp } from './achievement-notification-service';
import { getUserMetrics, calculateAndUpdateAllMetrics, TradeMetrics } from './trade-metrics-service';

// Mapping of points to levels
const USER_LEVELS: Record<number, number> = {
  1: 0, 2: 100, 3: 250, 4: 500, 5: 1000, 6: 2000, 7: 4000, 8: 8000, 9: 15000
};

export function calculateUserLevel(points: number): number {
  const levels = Object.keys(USER_LEVELS).map(Number);
  let userLevel = 1;
  for (const level of levels) {
    if (points >= USER_LEVELS[level]) {
      userLevel = level;
    } else {
      break;
    }
  }
  return userLevel;
}

export function calculatePointsForNextLevel(currentPoints: number): { nextLevel: number; pointsNeeded: number; currentLevelPoints: number; nextLevelPoints: number; progress: number; } {
  const currentLevel = calculateUserLevel(currentPoints);
  const isMaxLevel = currentLevel === 9;
  if (isMaxLevel) {
    return { nextLevel: 9, pointsNeeded: 0, currentLevelPoints: USER_LEVELS[9], nextLevelPoints: USER_LEVELS[9], progress: 100 };
  }
  const nextLevel = currentLevel + 1;
  const pointsForNextLevel = USER_LEVELS[nextLevel];
  const pointsNeeded = pointsForNextLevel - currentPoints;
  const currentLevelPoints = USER_LEVELS[currentLevel];
  const nextLevelPoints = USER_LEVELS[nextLevel];
  const levelPointsRange = nextLevelPoints - currentLevelPoints;
  const pointsIntoLevel = currentPoints - currentLevelPoints;
  const progress = levelPointsRange > 0 ? Math.round((pointsIntoLevel / levelPointsRange) * 100) : 0;
  return { nextLevel, pointsNeeded, currentLevelPoints, nextLevelPoints, progress };
}

function checkAchievementCriteria(metrics: TradeMetrics, achievement: Achievement): boolean {
  const { metricName, metricValue, comparison } = achievement.criteria;
  const actualValue = metrics[metricName as keyof TradeMetrics];
  if (actualValue === undefined || actualValue === null) return false;
  const numericValue = Number(actualValue);
  switch (comparison) {
    case 'greater': return numericValue >= metricValue;
    case 'equals': return numericValue === metricValue;
    case 'less': return numericValue <= metricValue;
    default: return false;
  }
}

class AchievementsService {
  async initializeUserAchievements(userId: string): Promise<void> {
    try {
      const userAchievementsRef = doc(db, 'userAchievements', userId);
      const docSnapshot = await getDoc(userAchievementsRef);
      if (!docSnapshot.exists()) {
        const initialData: Partial<UserAchievements> = {
          userId,
          totalPoints: 0,
          level: 1,
          updatedAt: serverTimestamp(),
          achievements: {}
        };
        const achievements = defineAchievements();
        achievements.forEach(achievement => {
          if (initialData.achievements) {
            initialData.achievements[achievement.id] = { isComplete: false, progress: 0 };
          }
        });
        await setDoc(userAchievementsRef, initialData);
      }
    } catch (error) {
      console.error('Error initializing user achievements:', error);
    }
  }

  async getUserAchievements(userId: string): Promise<UserAchievements | null> {
    try {
      await this.initializeUserAchievements(userId);
      const userAchievementsRef = doc(db, 'userAchievements', userId);
      const docSnapshot = await getDoc(userAchievementsRef);
      if (docSnapshot.exists()) {
        return docSnapshot.data() as UserAchievements;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user achievements:', error);
      return null;
    }
  }

  async updateUserAchievement(userId: string, achievementId: string, isComplete: boolean): Promise<void> {
    try {
      const prevData = await this.getUserAchievements(userId);
      const achievement = defineAchievements().find(a => a.id === achievementId);
      if (!achievement) throw new Error(`Achievement ${achievementId} not found`);
      const userAchievementsRef = doc(db, 'userAchievements', userId);
      const prevStatus = prevData?.achievements?.[achievementId]?.isComplete || false;
      if (prevStatus !== isComplete) {
        const updateData: any = {
          [`achievements.${achievementId}.isComplete`]: isComplete,
          updatedAt: serverTimestamp()
        };
        if (isComplete) {
          updateData[`achievements.${achievementId}.completedAt`] = serverTimestamp();
          updateData.totalPoints = (prevData?.totalPoints || 0) + achievement.points;
          const newLevel = calculateUserLevel(updateData.totalPoints);
          if (newLevel > (prevData?.level || 1)) updateData.level = newLevel;
        } else {
          updateData.totalPoints = Math.max(0, (prevData?.totalPoints || 0) - achievement.points);
          const newLevel = calculateUserLevel(updateData.totalPoints);
          if (newLevel < (prevData?.level || 1)) updateData.level = newLevel;
        }
        await updateDoc(userAchievementsRef, updateData);
        if (isComplete && !prevStatus) {
          const { enqueueAchievement, showLevelUp } = useAchievementNotifications.getState();
          enqueueAchievement(achievement);
          const prevLevel = prevData?.level || 1;
          const currentLevel = updateData.level || prevLevel;
          if (currentLevel > prevLevel) showLevelUp(currentLevel);
        }
      }
    } catch (error) {
      console.error('Error updating user achievement:', error);
    }
  }

  async updateAchievementProgress(userId: string, achievementId: string, progress: number): Promise<void> {
    try {
      const validatedProgress = Math.max(0, Math.min(100, progress));
      const userAchievementsRef = doc(db, 'userAchievements', userId);
      await updateDoc(userAchievementsRef, {
        [`achievements.${achievementId}.progress`]: validatedProgress,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating achievement progress:', error);
    }
  }

  async processAchievements(userId: string, forceRefresh: boolean = false): Promise<void> {
    try {
      const userData = await this.getUserAchievements(userId);
      if (!userData) return;

      // FIX: Guard against missing achievements object
      if (!userData.achievements) {
        userData.achievements = {};
      }

      const prevAchievements = { ...userData.achievements };
      const prevLevel = userData.level || 1;

      let metrics: TradeMetrics | null = forceRefresh ? await calculateAndUpdateAllMetrics(userId) : await getUserMetrics(userId);
      if (!metrics) metrics = await calculateAndUpdateAllMetrics(userId);
      if (!metrics) {
        console.error('Failed to get or calculate metrics');
        return;
      }

      const achievements = defineAchievements();
      for (const achievement of achievements) {
        const isAlreadyComplete = userData.achievements[achievement.id]?.isComplete || false;
        if (!isAlreadyComplete) {
          const shouldComplete = checkAchievementCriteria(metrics, achievement);
          if (shouldComplete) {
            await this.updateUserAchievement(userId, achievement.id, true);
          } else if (achievement.criteria.streak) {
            const metricValue = metrics[achievement.criteria.metricName as keyof TradeMetrics] as number;
            const targetValue = achievement.criteria.metricValue;
            const progressPercent = targetValue > 0 ? Math.min(100, Math.floor((metricValue / targetValue) * 100)) : 0;
            await this.updateAchievementProgress(userId, achievement.id, progressPercent);
          }
        }
      }

      const updatedUserData = await this.getUserAchievements(userId);
      if (updatedUserData) {
        if (!updatedUserData.achievements) updatedUserData.achievements = {}; // Guard again for safety
        const newlyUnlocked = findNewlyUnlockedAchievements(prevAchievements, updatedUserData.achievements, achievements);
        if (newlyUnlocked.length > 0) {
          const { enqueueAchievement } = useAchievementNotifications.getState();
          newlyUnlocked.forEach((achievement, index) => {
            setTimeout(() => enqueueAchievement(achievement), index * 500);
          });
        }
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

  async processTradeTrigger(userId: string, action: 'create' | 'update' | 'delete'): Promise<void> {
    await calculateAndUpdateAllMetrics(userId);
    await this.processAchievements(userId, false);
  }

  async getEnhancedAchievements(userId: string): Promise<{ achievements: Achievement[]; totalPoints: number; level: number; nextLevel: { level: number; pointsNeeded: number; progress: number; }; }> {
    try {
      const userData = await this.getUserAchievements(userId);
      if (!userData) throw new Error('User achievements not found');

      // FIX: Guard against missing achievements object
      if (!userData.achievements) {
        userData.achievements = {};
      }

      const allAchievements = defineAchievements();
      const enhancedAchievements = allAchievements.map(achievement => {
        const userAchievement = userData.achievements[achievement.id];
        return {
          ...achievement,
          isComplete: userAchievement?.isComplete || false,
          dateEarned: userAchievement?.dateEarned ? new Date(userAchievement.dateEarned).toISOString() : undefined,
          progress: userAchievement?.progress || 0
        };
      });

      const nextLevelInfo = calculatePointsForNextLevel(userData.totalPoints || 0);
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
      return {
        achievements: defineAchievements().map(a => ({ ...a, isComplete: false, progress: 0})),
        totalPoints: 0,
        level: 1,
        nextLevel: { level: 2, pointsNeeded: 100, progress: 0 }
      };
    }
  }
}

export const achievementsService = new AchievementsService();
export const getUserAchievements = (userId: string) => achievementsService.getUserAchievements(userId);
export const processUserAchievements = (userId: string, forceRefresh: boolean = false) => achievementsService.processAchievements(userId, forceRefresh);
export const processTradeTrigger = (userId: string, action: 'create' | 'update' | 'delete') => achievementsService.processTradeTrigger(userId, action);
export const getEnhancedAchievements = (userId: string) => achievementsService.getEnhancedAchievements(userId);
export function calculateLevelProgress(totalPoints: number): number {
  return calculatePointsForNextLevel(totalPoints).progress;
}