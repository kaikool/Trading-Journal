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
  logoSize = 60,
}: SplashScreenProps) {
  const isAppLoading = useLoadingStore(state => state.isAppLoading);
  const progress = useLoadingStore(state => state.progress);
  const [visible, setVisible] = useState(true);
  const [startTime] = useState(Date.now());
  const [animationPhase, setAnimationPhase] = useState(0);
  
  // Simple animation phases
  useEffect(() => {
    const phase1 = setTimeout(() => setAnimationPhase(1), 100);
    const phase2 = setTimeout(() => setAnimationPhase(2), 500);
    
    return () => {
      clearTimeout(phase1);
      clearTimeout(phase2);
    };
  }, []);
  
  // Handle minimum display time
  useEffect(() => {
    if (!isAppLoading()) {
      const currentTime = Date.now();
      const elapsedTime = currentTime - startTime;
      
      if (elapsedTime >= minimumDisplayTime) {
        setAnimationPhase(3);
        const hideTimer = setTimeout(() => setVisible(false), 500);
        return () => clearTimeout(hideTimer);
      } else {
        const remainingTime = minimumDisplayTime - elapsedTime;
        const timer = setTimeout(() => {
          setAnimationPhase(3);
          setTimeout(() => setVisible(false), 500);
        }, remainingTime);
        
        return () => clearTimeout(timer);
      }
    }
  }, [isAppLoading, minimumDisplayTime, startTime]);
  
  // Progress animation
  useEffect(() => {
    const progressInterval = setInterval(() => {
      if (animationPhase === 3) {
        clearInterval(progressInterval);
        return;
      }
      
      const currentProgress = useLoadingStore.getState().progress;
      if (currentProgress < 95) {
        useLoadingStore.getState().setProgress(currentProgress + 0.5);
      }
    }, 100);
    
    return () => clearInterval(progressInterval);
  }, [animationPhase]);
  
  if (!visible) return null;
  
  return (
    <AnimatePresence>
      <motion.div 
        className={cn(
          "fixed inset-0 z-50 flex items-center justify-center",
          "bg-background",
          className
        )}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Simple container */}
        <div className="w-72 text-center">
          {/* Logo */}
          <div className="mb-8 flex justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={animationPhase >= 1 ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              {/* Animated Growth Chart */}
              <div className="w-24 h-24 mx-auto flex items-center justify-center">
                {logo || (
                  <motion.div 
                    className="w-full h-full relative flex items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Animated candlesticks */}
                    <svg width="100%" height="100%" viewBox="0 0 100 100" className="text-primary">
                      {/* Animated grid lines */}
                      <motion.path 
                        d="M10,80 H90" 
                        stroke="currentColor" 
                        strokeOpacity="0.3"
                        strokeWidth="1"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                      />
                      
                      <motion.path 
                        d="M10,60 H90" 
                        stroke="currentColor" 
                        strokeOpacity="0.2"
                        strokeWidth="1"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                      />
                      
                      <motion.path 
                        d="M10,40 H90" 
                        stroke="currentColor" 
                        strokeOpacity="0.2"
                        strokeWidth="1"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                      />
                      
                      {/* Y-axis */}
                      <motion.path 
                        d="M10,20 L10,80" 
                        stroke="currentColor" 
                        strokeWidth="1.5"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.5 }}
                      />
                      
                      {/* X-axis */}
                      <motion.path 
                        d="M10,80 L90,80" 
                        stroke="currentColor" 
                        strokeWidth="1.5"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                      />
                      
                      {/* Data points with animation */}
                      <motion.g
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2, delay: 0.6 }}
                      >
                        {/* Growth line */}
                        <motion.path 
                          d="M20,70 L35,65 L50,55 L65,60 L80,30"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 1.5, delay: 0.7 }}
                        />
                        
                        {/* Data points */}
                        <motion.circle cx="20" cy="70" r="3" fill="currentColor"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.2, delay: 0.7 }}
                        />
                        <motion.circle cx="35" cy="65" r="3" fill="currentColor"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.2, delay: 0.9 }}
                        />
                        <motion.circle cx="50" cy="55" r="3" fill="currentColor"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.2, delay: 1.1 }}
                        />
                        <motion.circle cx="65" cy="60" r="3" fill="currentColor"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.2, delay: 1.3 }}
                        />
                        <motion.circle cx="80" cy="30" r="4" fill="currentColor"
                          initial={{ scale: 0 }}
                          animate={{ scale: [0, 1.3, 1] }}
                          transition={{ duration: 0.5, delay: 1.5 }}
                        />
                      </motion.g>
                      
                      {/* Trend arrow */}
                      <motion.path 
                        d="M80,30 L87,25 L83,37 Z" 
                        fill="currentColor"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.3, delay: 2 }}
                      />
                    </svg>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
          
          {/* Text */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={animationPhase >= 1 ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-6 space-y-2"
          >
            <h1 className="text-xl font-medium">Forex Trading Journal</h1>
            <p className="text-foreground/70 text-sm">{text}</p>
            <p className="text-xs text-primary/80">made by {brandName}</p>
          </motion.div>
          
          {/* Progress */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={animationPhase >= 1 ? { opacity: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="h-1 w-full bg-muted/20 rounded-full overflow-hidden"
          >
            <motion.div 
              className="h-full bg-primary rounded-full"
              style={{ width: `${progress}%` }}
            />
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}