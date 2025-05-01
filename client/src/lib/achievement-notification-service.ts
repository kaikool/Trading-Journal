import { create } from 'zustand';
import { Achievement } from '@/types';

interface AchievementNotificationState {
  // Current achievement being displayed
  currentAchievement: Achievement | null;
  // Queue of achievements waiting to be displayed
  queue: Achievement[];
  // Level up notification
  levelUp: {
    isLevelUp: boolean;
    newLevel: number;
  };
  // Add an achievement to the queue
  enqueueAchievement: (achievement: Achievement) => void;
  // Show level up notification
  showLevelUp: (level: number) => void;
  // Remove the current achievement from display
  clearCurrentAchievement: () => void;
}

// Create a store for achievement notifications
export const useAchievementNotifications = create<AchievementNotificationState>((set, get) => ({
  currentAchievement: null,
  queue: [],
  levelUp: {
    isLevelUp: false,
    newLevel: 0,
  },
  
  // Add an achievement to the queue
  enqueueAchievement: (achievement: Achievement) => {
    const { currentAchievement, queue } = get();
    
    // If no achievement is currently displayed, show this one
    if (!currentAchievement) {
      set({ currentAchievement: achievement });
    } else {
      // Otherwise add to queue
      set({ queue: [...queue, achievement] });
    }
  },
  
  // Show level up notification
  showLevelUp: (level: number) => {
    set({
      levelUp: {
        isLevelUp: true,
        newLevel: level,
      }
    });
  },
  
  // Clear current achievement and show the next in queue
  clearCurrentAchievement: () => {
    const { queue } = get();
    
    if (queue.length > 0) {
      // Show the next achievement in queue
      const [next, ...remaining] = queue;
      set({
        currentAchievement: next,
        queue: remaining,
        levelUp: {
          isLevelUp: false,
          newLevel: 0,
        }
      });
    } else {
      // No more achievements in queue
      set({
        currentAchievement: null,
        levelUp: {
          isLevelUp: false,
          newLevel: 0,
        }
      });
    }
  }
}));

// Helper function to compare achievements and check if new ones are unlocked
export function findNewlyUnlockedAchievements(
  previousAchievements: { [id: string]: { isComplete: boolean } },
  currentAchievements: { [id: string]: { isComplete: boolean } },
  allAchievements: Achievement[]
): Achievement[] {
  // Find IDs of newly completed achievements
  const newlyCompleted = Object.keys(currentAchievements).filter(id => 
    currentAchievements[id]?.isComplete && 
    (!previousAchievements[id] || !previousAchievements[id]?.isComplete)
  );
  
  // Find the full achievement data for newly completed ones
  return allAchievements.filter(achievement => 
    newlyCompleted.includes(achievement.id)
  );
}

// Helper function to check for level up
export function checkForLevelUp(previousLevel: number, currentLevel: number): boolean {
  return currentLevel > previousLevel;
}