import React, { useState, useEffect } from 'react';
import { Icons } from '@/components/icons/icons';
import { cn } from '@/lib/utils';
import { Achievement } from '@/types';
import { achievementLevelColors, achievementLevelLabel, getIconByName } from '@/lib/achievements-data';
import { useToast } from '@/hooks/use-toast';

interface AchievementPopupProps {
  achievement: Achievement | null;
  isLevelUp?: boolean;
  newLevel?: number;
  onClose: () => void;
}

const AchievementPopup: React.FC<AchievementPopupProps> = ({
  achievement,
  isLevelUp = false,
  newLevel = 0,
  onClose
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
    if (achievement || isLevelUp) {
      setIsVisible(true);
      
      // Auto hide after 5 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [achievement, isLevelUp]);
  
  // Show toast notification alongside popup
  useEffect(() => {
    if (achievement) {
      toast({
        title: 'Achievement Unlocked!',
        description: achievement.name,
        variant: 'default',
      });
    } else if (isLevelUp) {
      toast({
        title: 'Level Up!',
        description: `You've reached level ${newLevel}!`,
        variant: 'default',
      });
    }
  }, [achievement, isLevelUp, newLevel, toast]);
  
  // If component is not visible, trigger onClose after animation completes
  useEffect(() => {
    if (!isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 300); // match the CSS transition duration
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);
  
  if (!achievement && !isLevelUp) return null;
  
  return (
    <>
      {isVisible && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none p-4 transition-opacity duration-300 ease-in-out"
          style={{animation: isVisible ? 'fade-in 0.3s ease-in-out' : 'fade-out 0.3s ease-in-out'}}
        >
          <div className="w-full max-w-md mx-auto">
            {achievement && (
              <div
                className={cn(
                  "rounded-lg shadow-lg overflow-hidden border pointer-events-auto transform transition-all duration-300",
                  achievementLevelColors[achievement.level as keyof typeof achievementLevelColors].border,
                  achievementLevelColors[achievement.level as keyof typeof achievementLevelColors].bg,
                  "bg-background/95 backdrop-blur-sm",
                  "animate-slide-up"
                )}
              >
                <div className="p-4 sm:p-6">
                  <div className="flex items-center">
                    <div className="relative">
                      <div className={cn(
                        "w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center",
                        achievementLevelColors[achievement.level as keyof typeof achievementLevelColors].bg,
                        achievementLevelColors[achievement.level as keyof typeof achievementLevelColors].border,
                      )}>
                        {React.createElement(getIconByName(achievement.icon), {
                          className: cn("w-8 h-8", achievementLevelColors[achievement.level as keyof typeof achievementLevelColors].icon)
                        })}
                      </div>
                      <div className="absolute inset-0 rounded-full animate-pulse">
                        <div className={cn(
                          "w-full h-full rounded-full",
                          achievementLevelColors[achievement.level as keyof typeof achievementLevelColors].bg,
                        )}></div>
                      </div>
                    </div>
                    
                    <div className="ml-4 flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-lg">Achievement Unlocked!</h3>
                          <p className={cn(
                            "font-medium text-sm",
                            achievementLevelColors[achievement.level as keyof typeof achievementLevelColors].text
                          )}>
                            {achievementLevelLabel(achievement.level)}
                          </p>
                        </div>
                        <button
                          onClick={() => setIsVisible(false)}
                          className="rounded-full p-1 text-muted-foreground hover:bg-background/80"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                          </svg>
                          <span className="sr-only">Close</span>
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <h4 className="font-bold text-xl">{achievement.name}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{achievement.description}</p>
                  </div>
                  
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center space-x-1 text-amber-500">
                      <Icons.achievement.trophy className="w-4 h-4" />
                      <span className="font-medium text-sm">{achievement.points} points</span>
                    </div>
                    
                    <div className="animate-scale-in">
                      <div className="bg-green-500/10 text-green-500 rounded-full px-2 py-0.5 flex items-center space-x-1">
                        <Icons.achievement.check className="w-3 h-3" />
                        <span className="text-xs font-medium">Completed</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="h-1 w-full bg-gradient-to-r from-amber-300 via-amber-500 to-yellow-500"></div>
              </div>
            )}
            
            {isLevelUp && !achievement && (
              <div
                className="rounded-lg shadow-lg overflow-hidden border pointer-events-auto bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/20 bg-background/95 backdrop-blur-sm animate-slide-up"
              >
                <div className="p-4 sm:p-6">
                  <div className="flex items-center">
                    <div className="relative">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30">
                        <Icons.achievement.crown className="w-8 h-8 text-indigo-500" />
                      </div>
                      <div className="absolute inset-0 rounded-full animate-pulse">
                        <div className="w-full h-full rounded-full bg-gradient-to-r from-indigo-500/10 to-purple-500/10"></div>
                      </div>
                    </div>
                    
                    <div className="ml-4 flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-lg">Level Up!</h3>
                          <p className="font-medium text-sm text-indigo-500">
                            Your journey continues
                          </p>
                        </div>
                        <button
                          onClick={() => setIsVisible(false)}
                          className="rounded-full p-1 text-muted-foreground hover:bg-background/80"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                          </svg>
                          <span className="sr-only">Close</span>
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <h4 className="font-bold text-xl">Level {newLevel} Reached!</h4>
                    <p className="text-sm text-muted-foreground mt-1">You've gained new skills and experience as a trader.</p>
                  </div>
                  
                  <div className="mt-4">
                    <div className="flex space-x-2 justify-center animate-scale-in">
                      {[...Array(Math.min(5, newLevel))].map((_, i) => (
                        <div
                          key={i}
                          className="animate-spin-in"
                          style={{ animationDelay: `${i * 0.1}s` }}
                        >
                          <Icons.achievement.star className="w-5 h-5 text-yellow-500" fill="#eab308" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="h-1 w-full bg-gradient-to-r from-indigo-400 via-purple-500 to-indigo-600"></div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default AchievementPopup;