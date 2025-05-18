import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { useLoadingStore } from '@/hooks/use-loading-store';
import { Icons } from '@/components/icons/icons';
import { motion, AnimatePresence } from 'framer-motion';

interface LuxurySplashScreenProps {
  className?: string;
  text?: string;
  minimumDisplayTime?: number;
  logoSize?: number;
  brandName?: string;
}

export function LuxurySplashScreen({
  className,
  text = 'Loading...',
  minimumDisplayTime = 2000,
  logoSize = 100,
  brandName = 'Táo Tầu',
}: LuxurySplashScreenProps) {
  const isAppLoading = useLoadingStore(state => state.isAppLoading);
  const progress = useLoadingStore(state => state.progress);
  const [visible, setVisible] = useState(true);
  const [startTime] = useState(Date.now());
  const [animationPhase, setAnimationPhase] = useState(0);
  
  // Animation phases
  useEffect(() => {
    // Phase 1: Initial logo reveal
    const phase1 = setTimeout(() => setAnimationPhase(1), 100);
    
    // Phase 2: Logo growth and effects
    const phase2 = setTimeout(() => setAnimationPhase(2), 300);
    
    // Phase 3: Text reveal
    const phase3 = setTimeout(() => setAnimationPhase(3), 500);
    
    // Phase 4: Progress bar
    const phase4 = setTimeout(() => setAnimationPhase(4), 700);
    
    // Cleanup timers on unmount
    return () => {
      clearTimeout(phase1);
      clearTimeout(phase2);
      clearTimeout(phase3);
      clearTimeout(phase4);
    };
  }, []);
  
  // Handle minimum display time with elegant exit animation
  useEffect(() => {
    if (!isAppLoading()) {
      const currentTime = Date.now();
      const elapsedTime = currentTime - startTime;
      
      if (elapsedTime >= minimumDisplayTime) {
        // Begin exit animation
        setAnimationPhase(5);
        
        // Allow exit animation to complete before unmounting
        const hideTimer = setTimeout(() => {
          setVisible(false);
        }, 600);
        
        return () => clearTimeout(hideTimer);
      } else {
        // Wait for minimum display time
        const remainingTime = minimumDisplayTime - elapsedTime;
        const timer = setTimeout(() => {
          setAnimationPhase(5);
          
          // Allow exit animation to complete before unmounting
          setTimeout(() => {
            setVisible(false);
          }, 600);
        }, remainingTime);
        
        return () => clearTimeout(timer);
      }
    }
  }, [isAppLoading, minimumDisplayTime, startTime]);
  
  // Progress animation with elegant increments
  useEffect(() => {
    // Smooth progress updates
    const progressInterval = setInterval(() => {
      // Stop progress animation during exit phase
      if (animationPhase === 5) {
        clearInterval(progressInterval);
        return;
      }
      
      // Get current progress value
      const currentProgress = useLoadingStore.getState().progress;
      
      // Calculate increment based on current progress
      if (currentProgress < 30) {
        // Slow start
        useLoadingStore.getState().setProgress(currentProgress + 0.3);
      } else if (currentProgress < 80) {
        // Faster middle section
        useLoadingStore.getState().setProgress(currentProgress + 0.5);
      } else if (currentProgress < 95) {
        // Slow finish
        useLoadingStore.getState().setProgress(currentProgress + 0.1);
      }
    }, 100);
    
    return () => clearInterval(progressInterval);
  }, [animationPhase]);
  
  // Don't render if not visible
  if (!visible) return null;
  
  return (
    <AnimatePresence>
      <motion.div 
        className={cn(
          "fixed inset-0 z-50 flex flex-col items-center justify-center",
          "bg-background backdrop-blur-sm",
          className
        )}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="relative w-full max-w-sm mx-auto px-6 text-center">
          {/* Logo with growth animation */}
          <motion.div 
            className="relative mx-auto mb-8"
            initial={{ scale: 0.7, opacity: 0 }}
            animate={animationPhase >= 1 && animationPhase < 5 
              ? { scale: 1, opacity: 1 } 
              : { scale: 1.2, opacity: 0 }}
            transition={{ 
              type: "spring", 
              stiffness: 260, 
              damping: 20, 
              duration: 0.8 
            }}
          >
            {/* Logo glow effect */}
            <motion.div
              className="absolute -inset-3 rounded-full opacity-30 blur-md"
              style={{ background: `radial-gradient(circle, rgba(var(--primary), 0.3) 0%, transparent 70%)` }}
              animate={{ 
                scale: [1, 1.1, 1],
                opacity: [0.2, 0.3, 0.2] 
              }}
              transition={{ 
                duration: 2.5, 
                repeat: Infinity, 
                repeatType: "mirror" 
              }}
            />
            
            {/* Main logo */}
            <motion.div 
              className="relative flex items-center justify-center"
              animate={animationPhase >= 2 && animationPhase < 5 
                ? { 
                    scale: [1, 1.05, 1],
                    rotate: [0, 1, 0, -1, 0]
                  } 
                : { scale: 1, rotate: 0 }}
              transition={{ 
                duration: 3, 
                ease: "easeInOut", 
                repeat: Infinity,
                repeatType: "mirror"
              }}
            >
              <Icons.analytics.barChart 
                className="text-primary" 
                style={{ 
                  width: logoSize, 
                  height: logoSize,
                  filter: "drop-shadow(0 0 8px rgba(var(--primary), 0.4))"
                }}
              />
            </motion.div>
          </motion.div>
          
          {/* Loading text */}
          <motion.div 
            className="mb-6"
            initial={{ opacity: 0, y: 10 }}
            animate={animationPhase >= 3 && animationPhase < 5 
              ? { opacity: 1, y: 0 } 
              : { opacity: 0, y: animationPhase >= 5 ? -10 : 10 }}
            transition={{ 
              duration: 0.5, 
              ease: "easeOut"
            }}
          >
            <motion.p 
              className="text-xl font-medium text-foreground tracking-wide"
              animate={{ opacity: [0.8, 1, 0.8] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {text}
            </motion.p>
          </motion.div>
          
          {/* Brand name */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={animationPhase >= 3 && animationPhase < 5 
              ? { opacity: 1, y: 0 } 
              : { opacity: 0, y: animationPhase >= 5 ? -10 : 10 }}
            transition={{ 
              duration: 0.5, 
              delay: 0.1,
              ease: "easeOut"
            }}
          >
            <p className={cn(
              "text-sm font-medium",
              "bg-gradient-to-r from-primary/80 via-primary to-primary/80",
              "bg-clip-text text-transparent"
            )}>
              made by {brandName}
            </p>
          </motion.div>
          
          {/* Thin, elegant progress bar */}
          <motion.div 
            className="w-full mx-auto mt-8 relative h-[1.5px]"
            initial={{ opacity: 0, scaleX: 0.8 }}
            animate={animationPhase >= 4 && animationPhase < 5 
              ? { opacity: 1, scaleX: 1 } 
              : { opacity: 0, scaleX: animationPhase >= 5 ? 1.1 : 0.8 }}
            transition={{ duration: 0.5 }}
          >
            {/* Track */}
            <div 
              className="absolute inset-0 rounded-full bg-muted/30"
            />
            
            {/* Progress fill */}
            <motion.div 
              className="absolute h-full rounded-full bg-primary"
              style={{ 
                width: `${progress}%`,
                boxShadow: "0 0 6px rgba(var(--primary), 0.3)"
              }}
              transition={{ duration: 0.3 }}
            />
            
            {/* Animated shine effect */}
            <motion.div 
              className="absolute h-full w-16 rounded-full"
              style={{
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)",
                left: `calc(${progress}% - 50px)`
              }}
              animate={{ left: [`-10%`, `calc(${progress}% - 10px)`, `calc(${progress}% - 10px)`] }}
              transition={{
                duration: 1.5, 
                repeat: Infinity,
                repeatDelay: 0.8
              }}
            />
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}