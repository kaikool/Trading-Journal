import React from 'react';
import AchievementPopup from './AchievementPopup';
import { useAchievementNotifications } from '@/lib/achievement-notification-service';

/**
 * Container component that manages achievement notifications
 * This should be mounted in the app's root layout
 */
const AchievementNotificationContainer: React.FC = () => {
  const { 
    currentAchievement, 
    clearCurrentAchievement, 
    levelUp
  } = useAchievementNotifications();
  
  return (
    <>
      {(currentAchievement || levelUp.isLevelUp) && (
        <AchievementPopup 
          achievement={currentAchievement}
          isLevelUp={levelUp.isLevelUp}
          newLevel={levelUp.newLevel}
          onClose={clearCurrentAchievement}
        />
      )}
    </>
  );
};

export default AchievementNotificationContainer;