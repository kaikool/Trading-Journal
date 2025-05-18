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
  logoSize = 90,
}: SplashScreenProps) {
  const isAppLoading = useLoadingStore(state => state.isAppLoading);
  const progress = useLoadingStore(state => state.progress);
  const [visible, setVisible] = useState(true);
  const [startTime] = useState(Date.now());
  const [animationPhase, setAnimationPhase] = useState(0);
  
  // Enhanced animation phases
  useEffect(() => {
    // Phase 1: Background and gradient appear
    const phase1 = setTimeout(() => setAnimationPhase(1), 100);
    
    // Phase 2: Logo appear with animation
    const phase2 = setTimeout(() => setAnimationPhase(2), 300);
    
    // Phase 3: Text and progress appear
    const phase3 = setTimeout(() => setAnimationPhase(3), 600);
    
    // Cleanup timers on unmount
    return () => {
      clearTimeout(phase1);
      clearTimeout(phase2);
      clearTimeout(phase3);
    };
  }, []);
  
  // Handle minimum display time with clean exit animation
  useEffect(() => {
    if (!isAppLoading()) {
      const currentTime = Date.now();
      const elapsedTime = currentTime - startTime;
      
      if (elapsedTime >= minimumDisplayTime) {
        // Begin exit animation
        setAnimationPhase(4);
        
        // Allow exit animation to complete before unmounting
        const hideTimer = setTimeout(() => {
          setVisible(false);
        }, 650);
        
        return () => clearTimeout(hideTimer);
      } else {
        // Wait for minimum display time
        const remainingTime = minimumDisplayTime - elapsedTime;
        const timer = setTimeout(() => {
          setAnimationPhase(4);
          
          // Allow exit animation to complete before unmounting
          setTimeout(() => {
            setVisible(false);
          }, 650);
        }, remainingTime);
        
        return () => clearTimeout(timer);
      }
    }
  }, [isAppLoading, minimumDisplayTime, startTime]);
  
  // Improved progress animation with smoother increments
  useEffect(() => {
    // Smooth progress updates
    const progressInterval = setInterval(() => {
      // Stop progress animation during exit phase
      if (animationPhase === 4) {
        clearInterval(progressInterval);
        return;
      }
      
      // Get current progress value
      const currentProgress = useLoadingStore.getState().progress;
      
      // Improved, smoother progress updates
      if (currentProgress < 95) {
        const increment = Math.max(0.2, (95 - currentProgress) / 50);
        useLoadingStore.getState().setProgress(currentProgress + increment);
      }
    }, 80);
    
    return () => clearInterval(progressInterval);
  }, [animationPhase]);
  
  // Don't render if not visible
  if (!visible) return null;
  
  return (
    <AnimatePresence>
      <motion.div 
        className={cn(
          "fixed inset-0 z-50 flex flex-col items-center justify-center",
          "bg-gradient-to-b from-background to-background/95",
          className
        )}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      >
        <div className="absolute inset-0 bg-primary/5 backdrop-blur-[2px]" />
        
        <motion.div 
          className="relative w-full max-w-[320px] mx-auto px-6 text-center z-10"
          initial={{ y: 20 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {/* Modern logo container with enhanced animation */}
          <motion.div 
            className="relative mx-auto mb-8"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={animationPhase >= 2 && animationPhase < 4 
              ? { scale: 1, opacity: 1 } 
              : { scale: 0.9, opacity: 0 }}
            transition={{ 
              duration: 0.7,
              ease: "easeOut"
            }}
          >
            {/* Decorative rings around logo */}
            <motion.div
              className="absolute inset-0 rounded-full border-4 border-primary/10"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={animationPhase >= 2 && animationPhase < 4 
                ? { scale: 1.2, opacity: 0.5, borderWidth: 2 } 
                : { scale: 0.6, opacity: 0 }}
              transition={{ 
                duration: 2.5, 
                ease: "easeInOut", 
                repeat: Infinity,
                repeatType: "loop"
              }}
              style={{
                width: logoSize + 20,
                height: logoSize + 20,
                left: -10,
                top: -10
              }}
            />
            
            {/* Inner decorative ring */}
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-primary/20"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={animationPhase >= 2 && animationPhase < 4 
                ? { scale: 1.1, opacity: 0.7 } 
                : { scale: 0.8, opacity: 0 }}
              transition={{ 
                duration: 2, 
                delay: 0.3,
                ease: "easeInOut", 
                repeat: Infinity,
                repeatType: "loop"
              }}
              style={{
                width: logoSize + 10,
                height: logoSize + 10,
                left: -5,
                top: -5
              }}
            />
            
            {/* Enhanced logo with subtle pulsing and rotation */}
            <motion.div 
              className="relative"
              animate={animationPhase >= 2 && animationPhase < 4 
                ? { 
                    scale: [1, 1.05, 1],
                    rotate: [0, 2, 0, -2, 0]
                  } 
                : { scale: 1, rotate: 0 }}
              transition={{ 
                duration: 6, 
                ease: "easeInOut", 
                repeat: Infinity,
                repeatType: "mirror"
              }}
            >
              {/* Logo with drop shadow */}
              <div className="relative">
                {logo || (
                  <div className="relative">
                    {/* Background glow effect */}
                    <div 
                      className="absolute rounded-full bg-primary/20 blur-xl"
                      style={{ 
                        width: logoSize * 0.8, 
                        height: logoSize * 0.8,
                        left: logoSize * 0.1,
                        top: logoSize * 0.1
                      }}
                    />
                    
                    {/* Main logo with enhanced styling */}
                    <div className="relative drop-shadow-lg">
                      <Icons.analytics.chartLine
                        className="text-primary" 
                        style={{ 
                          width: logoSize, 
                          height: logoSize
                        }}
                      />
                    </div>
                    
                    {/* Small highlight dots - decorative elements */}
                    <motion.div 
                      className="absolute w-2 h-2 rounded-full bg-primary/80"
                      style={{ right: 10, top: 15 }}
                      animate={{ opacity: [0.4, 0.9, 0.4] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <motion.div 
                      className="absolute w-1 h-1 rounded-full bg-primary/80"
                      style={{ left: 18, bottom: 20 }}
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.5, delay: 0.3, repeat: Infinity }}
                    />
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
          
          {/* Enhanced text section with staggered animation */}
          <motion.div 
            className="mb-7 space-y-3"
            initial={{ opacity: 0, y: 10 }}
            animate={animationPhase >= 3 && animationPhase < 4 
              ? { opacity: 1, y: 0 } 
              : { opacity: 0, y: 10 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            {/* App name - new addition */}
            <motion.h1 
              className="text-xl font-medium text-foreground"
              initial={{ opacity: 0 }}
              animate={animationPhase >= 3 && animationPhase < 4 
                ? { opacity: 1 } 
                : { opacity: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Forex Trading Journal
            </motion.h1>
            
            {/* Loading text - enhanced */}
            <motion.p 
              className="text-base font-light text-foreground/70 tracking-wide"
              initial={{ opacity: 0 }}
              animate={animationPhase >= 3 && animationPhase < 4 
                ? { opacity: 1 } 
                : { opacity: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {text}
            </motion.p>
            
            {/* Brand name - enhanced */}
            <motion.p 
              className="text-xs text-primary/80 font-normal"
              initial={{ opacity: 0 }}
              animate={animationPhase >= 3 && animationPhase < 4 
                ? { opacity: 1 } 
                : { opacity: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              made by {brandName}
            </motion.p>
          </motion.div>
          
          {/* Modern progress bar */}
          <motion.div 
            className="w-full mx-auto relative h-1.5 rounded-full overflow-hidden"
            initial={{ opacity: 0, scaleX: 0.8 }}
            animate={animationPhase >= 3 && animationPhase < 4 
              ? { opacity: 1, scaleX: 1 } 
              : { opacity: 0, scaleX: 0.8 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            {/* Track - subtle gradient */}
            <div className="absolute inset-0 bg-muted/30 rounded-full" />
            
            {/* Progress fill - gradient and glow effect */}
            <motion.div 
              className="absolute h-full rounded-full bg-gradient-to-r from-primary/70 to-primary"
              style={{ 
                width: `${progress}%`,
                boxShadow: '0 0 10px rgba(var(--primary), 0.5)'
              }}
              transition={{ duration: 0.2 }}
            >
              {/* Subtle shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}