import React, { useState, useEffect } from 'react';
import { Trophy, Check, Star, Crown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Achievement } from '@/types';
import { achievementLevelColors, achievementLevelLabel, getIconByName } from '@/lib/achievements-data';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence, MotionProps } from 'framer-motion';
import { achievementVariants, overlayVariants, useMotionConfig } from '@/lib/motion.config';

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
  const { variants, enabled } = useMotionConfig();
  
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
    if (!isVisible && !enabled) {
      // Nếu không dùng motion, cần tự xử lý đóng
      const timer = setTimeout(() => {
        onClose();
      }, 300); 
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose, enabled]);
  
  if (!achievement && !isLevelUp) return null;
  
  // Props chung cho các thành phần motion
  const motionProps: MotionProps = {
    initial: "hidden",
    animate: isVisible ? "visible" : "exit",
    exit: "exit",
    variants: variants.achievement,
    onAnimationComplete: (definition) => {
      if (definition === "exit") {
        onClose();
      }
    }
  };
  
  // Cấu hình riêng cho các hiệu ứng bên trong
  const itemMotionProps: MotionProps = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { delay: 0.1, duration: 0.3 }
  };
  
  const badgeMotionProps: MotionProps = {
    initial: { scale: 0 },
    animate: { scale: 1 },
    transition: { delay: 0.3, type: "spring", stiffness: 500, damping: 15 }
  };
  
  const starsMotionProps: MotionProps = {
    initial: { scale: 0, rotate: -30 },
    animate: { scale: 1, rotate: 0 },
    transition: { type: "spring", stiffness: 300, damping: 10 }
  };
  
  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div 
          className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none p-4"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <div className="w-full max-w-md mx-auto">
            {achievement && (
              <motion.div
                {...motionProps}
                className={cn(
                  "rounded-lg shadow-lg overflow-hidden border pointer-events-auto",
                  achievementLevelColors[achievement.level as keyof typeof achievementLevelColors].border,
                  achievementLevelColors[achievement.level as keyof typeof achievementLevelColors].bg,
                  "bg-background/95 backdrop-blur-sm"
                )}
              >
                <div className="p-4 sm:p-6">
                  <div className="flex items-center">
                    <div className="relative">
                      <motion.div 
                        className={cn(
                          "w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center",
                          achievementLevelColors[achievement.level as keyof typeof achievementLevelColors].bg,
                          achievementLevelColors[achievement.level as keyof typeof achievementLevelColors].border,
                        )}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.1, type: "spring", stiffness: 400, damping: 10 }}
                      >
                        {React.createElement(getIconByName(achievement.icon), {
                          className: cn("w-8 h-8", achievementLevelColors[achievement.level as keyof typeof achievementLevelColors].icon)
                        })}
                      </motion.div>
                      <motion.div 
                        className="absolute inset-0 rounded-full" 
                        animate={{ 
                          opacity: [0.5, 0.8, 0.5],
                          scale: [1, 1.05, 1]
                        }}
                        transition={{ 
                          repeat: Infinity, 
                          duration: 2,
                          ease: "easeInOut"
                        }}
                      >
                        <div className={cn(
                          "w-full h-full rounded-full",
                          achievementLevelColors[achievement.level as keyof typeof achievementLevelColors].bg,
                        )}></div>
                      </motion.div>
                    </div>
                    
                    <div className="ml-4 flex-1">
                      <div className="flex justify-between items-start">
                        <motion.div {...itemMotionProps}>
                          <h3 className="font-bold text-lg">Achievement Unlocked!</h3>
                          <p className={cn(
                            "font-medium text-sm",
                            achievementLevelColors[achievement.level as keyof typeof achievementLevelColors].text
                          )}>
                            {achievementLevelLabel(achievement.level)}
                          </p>
                        </motion.div>
                        <button
                          onClick={() => setIsVisible(false)}
                          className="rounded-full p-1 text-muted-foreground hover:bg-background/80"
                        >
                          <X size={16} />
                          <span className="sr-only">Close</span>
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <motion.div 
                    className="mt-4" 
                    {...itemMotionProps}
                    transition={{ delay: 0.2 }}
                  >
                    <h4 className="font-bold text-xl">{achievement.name}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{achievement.description}</p>
                  </motion.div>
                  
                  <div className="mt-4 flex items-center justify-between">
                    <motion.div 
                      className="flex items-center space-x-1 text-amber-500"
                      {...itemMotionProps}
                      transition={{ delay: 0.3 }}
                    >
                      <Trophy className="w-4 h-4" />
                      <span className="font-medium text-sm">{achievement.points} points</span>
                    </motion.div>
                    
                    <motion.div {...badgeMotionProps}>
                      <div className="bg-green-500/10 text-green-500 rounded-full px-2 py-0.5 flex items-center space-x-1">
                        <Check className="w-3 h-3" />
                        <span className="text-xs font-medium">Completed</span>
                      </div>
                    </motion.div>
                  </div>
                </div>
                <motion.div 
                  className="h-1 w-0 bg-gradient-to-r from-amber-300 via-amber-500 to-yellow-500"
                  animate={{ width: "100%" }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                />
              </motion.div>
            )}
            
            {isLevelUp && !achievement && (
              <motion.div
                {...motionProps}
                className="rounded-lg shadow-lg overflow-hidden border pointer-events-auto bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/20 bg-background/95 backdrop-blur-sm"
              >
                <div className="p-4 sm:p-6">
                  <div className="flex items-center">
                    <div className="relative">
                      <motion.div 
                        className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.1, type: "spring", stiffness: 400, damping: 10 }}
                      >
                        <Crown className="w-8 h-8 text-indigo-500" />
                      </motion.div>
                      <motion.div 
                        className="absolute inset-0 rounded-full" 
                        animate={{ 
                          opacity: [0.5, 0.8, 0.5],
                          scale: [1, 1.05, 1]
                        }}
                        transition={{ 
                          repeat: Infinity, 
                          duration: 2,
                          ease: "easeInOut"
                        }}
                      >
                        <div className="w-full h-full rounded-full bg-gradient-to-r from-indigo-500/10 to-purple-500/10"></div>
                      </motion.div>
                    </div>
                    
                    <div className="ml-4 flex-1">
                      <div className="flex justify-between items-start">
                        <motion.div {...itemMotionProps}>
                          <h3 className="font-bold text-lg">Level Up!</h3>
                          <p className="font-medium text-sm text-indigo-500">
                            Your journey continues
                          </p>
                        </motion.div>
                        <button
                          onClick={() => setIsVisible(false)}
                          className="rounded-full p-1 text-muted-foreground hover:bg-background/80"
                        >
                          <X size={16} />
                          <span className="sr-only">Close</span>
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <motion.div 
                    className="mt-4"
                    {...itemMotionProps}
                    transition={{ delay: 0.2 }}
                  >
                    <h4 className="font-bold text-xl">Level {newLevel} Reached!</h4>
                    <p className="text-sm text-muted-foreground mt-1">You've gained new skills and experience as a trader.</p>
                  </motion.div>
                  
                  <motion.div 
                    className="mt-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div className="flex space-x-2 justify-center">
                      {[...Array(Math.min(5, newLevel))].map((_, i) => (
                        <motion.div
                          key={i}
                          {...starsMotionProps}
                          transition={{ 
                            delay: 0.3 + (i * 0.1),
                            type: "spring", 
                            stiffness: 500, 
                            damping: 10 
                          }}
                        >
                          <Star className="w-5 h-5 text-yellow-500" fill="#eab308" />
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                </div>
                <motion.div 
                  className="h-1 w-0 bg-gradient-to-r from-indigo-400 via-purple-500 to-indigo-600"
                  animate={{ width: "100%" }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                />
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AchievementPopup;