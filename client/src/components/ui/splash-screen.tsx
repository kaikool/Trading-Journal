import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { useLoadingStore } from '@/hooks/use-loading-store';
import { Icons } from '@/components/icons/icons';
import { motion, AnimatePresence } from 'framer-motion';

interface SplashScreenProps {
  className?: string;
  logo?: React.ReactNode;
  text?: string;
  minimumDisplayTime?: number;
  brandName?: string;
  logoSize?: number;
}

export function SplashScreen({
  className,
  logo,
  text = 'Loading...',
  minimumDisplayTime = 2000,
  brandName = 'Táo Tầu',
  logoSize = 80,
}: SplashScreenProps) {
  const isAppLoading = useLoadingStore(state => state.isAppLoading);
  const progress = useLoadingStore(state => state.progress);
  const [visible, setVisible] = useState(true);
  const [startTime] = useState(Date.now());
  const [animationPhase, setAnimationPhase] = useState(0);
  
  // Animation phases - minimalist approach
  useEffect(() => {
    // Phase 1: Logo appear
    const phase1 = setTimeout(() => setAnimationPhase(1), 100);
    
    // Phase 2: Text and progress appear
    const phase2 = setTimeout(() => setAnimationPhase(2), 400);
    
    // Cleanup timers on unmount
    return () => {
      clearTimeout(phase1);
      clearTimeout(phase2);
    };
  }, []);
  
  // Handle minimum display time with clean exit animation
  useEffect(() => {
    if (!isAppLoading()) {
      const currentTime = Date.now();
      const elapsedTime = currentTime - startTime;
      
      if (elapsedTime >= minimumDisplayTime) {
        // Begin exit animation
        setAnimationPhase(3);
        
        // Allow exit animation to complete before unmounting
        const hideTimer = setTimeout(() => {
          setVisible(false);
        }, 500);
        
        return () => clearTimeout(hideTimer);
      } else {
        // Wait for minimum display time
        const remainingTime = minimumDisplayTime - elapsedTime;
        const timer = setTimeout(() => {
          setAnimationPhase(3);
          
          // Allow exit animation to complete before unmounting
          setTimeout(() => {
            setVisible(false);
          }, 500);
        }, remainingTime);
        
        return () => clearTimeout(timer);
      }
    }
  }, [isAppLoading, minimumDisplayTime, startTime]);
  
  // Progress animation with simple increments
  useEffect(() => {
    // Smooth progress updates
    const progressInterval = setInterval(() => {
      // Stop progress animation during exit phase
      if (animationPhase === 3) {
        clearInterval(progressInterval);
        return;
      }
      
      // Get current progress value
      const currentProgress = useLoadingStore.getState().progress;
      
      // Simple, consistent progress updates
      if (currentProgress < 95) {
        useLoadingStore.getState().setProgress(currentProgress + 0.4);
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
          "bg-background",
          className
        )}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="w-full max-w-[280px] mx-auto px-4 text-center">
          {/* Minimal logo with subtle growth animation */}
          <motion.div 
            className="relative mx-auto mb-6"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={animationPhase >= 1 && animationPhase < 3 
              ? { scale: 1, opacity: 1 } 
              : { scale: 1.1, opacity: 0 }}
            transition={{ 
              duration: 0.7,
              ease: "easeOut"
            }}
          >
            {/* Minimalist logo */}
            <motion.div 
              animate={animationPhase >= 1 && animationPhase < 3 
                ? { scale: [1, 1.03, 1] } 
                : { scale: 1 }}
              transition={{ 
                duration: 3, 
                ease: "easeInOut", 
                repeat: Infinity,
                repeatType: "mirror"
              }}
            >
              {logo || (
                <Icons.analytics.barChart 
                  className="text-primary" 
                  style={{ 
                    width: logoSize, 
                    height: logoSize
                  }}
                />
              )}
            </motion.div>
          </motion.div>
          
          {/* Minimalist text section */}
          <motion.div 
            className="mb-5 space-y-2"
            initial={{ opacity: 0 }}
            animate={animationPhase >= 2 && animationPhase < 3 
              ? { opacity: 1 } 
              : { opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Loading text - minimal */}
            <p className="text-base font-normal text-foreground/80 tracking-wider">
              {text}
            </p>
            
            {/* Brand name - minimal */}
            <p className="text-xs text-primary/90 font-normal">
              made by {brandName}
            </p>
          </motion.div>
          
          {/* Extremely thin progress bar - minimalist */}
          <motion.div 
            className="w-full mx-auto relative h-[1px]"
            initial={{ opacity: 0 }}
            animate={animationPhase >= 2 && animationPhase < 3 
              ? { opacity: 0.9 } 
              : { opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Track - barely visible */}
            <div className="absolute inset-0 bg-muted/20" />
            
            {/* Progress fill - clean and minimal */}
            <motion.div 
              className="absolute h-full bg-primary/90"
              style={{ 
                width: `${progress}%`
              }}
              transition={{ duration: 0.2 }}
            />
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}