import AchievementPopup from './AchievementPopup';
import { useAchievementNotifications } from '@/lib/achievement-notification-service';

const AchievementNotificationContainer = () => {
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