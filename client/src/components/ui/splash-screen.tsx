import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { useLoadingStore } from '@/hooks/use-loading-store';
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
  brandName = 'Forex Journal',
  logoSize = 60,
}: SplashScreenProps) {
  const isAppLoading = useLoadingStore(state => state.isAppLoading);
  const progress = useLoadingStore(state => state.progress);
  const [visible, setVisible] = useState(true);
  const [startTime] = useState(Date.now());
  const [animationPhase, setAnimationPhase] = useState(0);
  
  // Sophisticated animation phases
  useEffect(() => {
    const phase1 = setTimeout(() => setAnimationPhase(1), 100);
    const phase2 = setTimeout(() => setAnimationPhase(2), 600);
    
    return () => {
      clearTimeout(phase1);
      clearTimeout(phase2);
    };
  }, []);
  
  // Handle minimum display time with smooth transitions
  useEffect(() => {
    if (!isAppLoading()) {
      const currentTime = Date.now();
      const elapsedTime = currentTime - startTime;
      
      if (elapsedTime >= minimumDisplayTime) {
        setAnimationPhase(3);
        const hideTimer = setTimeout(() => setVisible(false), 800);
        return () => clearTimeout(hideTimer);
      } else {
        const remainingTime = minimumDisplayTime - elapsedTime;
        const timer = setTimeout(() => {
          setAnimationPhase(3);
          setTimeout(() => setVisible(false), 800);
        }, remainingTime);
        
        return () => clearTimeout(timer);
      }
    }
  }, [isAppLoading, minimumDisplayTime, startTime]);
  
  // Smart progress animation
  useEffect(() => {
    const progressInterval = setInterval(() => {
      if (animationPhase === 3) {
        clearInterval(progressInterval);
        return;
      }
      
      const currentProgress = useLoadingStore.getState().progress;
      // Gradually slow down progress as it approaches 95%
      const increment = Math.max(0.1, (95 - currentProgress) / 40);
      
      if (currentProgress < 95) {
        useLoadingStore.getState().setProgress(currentProgress + increment);
      }
    }, 120);
    
    return () => clearInterval(progressInterval);
  }, [animationPhase]);
  
  if (!visible) return null;
  
  return (
    <AnimatePresence>
      <motion.div 
        className={cn(
          "fixed inset-0 z-50 flex items-center justify-center",
          "bg-background/90 backdrop-blur-sm",
          className
        )}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="w-80 max-w-[90vw]">
          {/* Modern logo container with subtle gradient background */}
          <motion.div
            className="mb-10 rounded-2xl overflow-hidden relative flex justify-center items-center bg-gradient-to-br from-background to-muted/30 p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={animationPhase >= 1 ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Elegant decorative elements */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
              <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
              <div className="absolute top-0 left-0 h-full w-[1px] bg-gradient-to-b from-transparent via-primary/30 to-transparent"></div>
              <div className="absolute top-0 right-0 h-full w-[1px] bg-gradient-to-b from-transparent via-primary/50 to-transparent"></div>
            </div>

            <div className="relative z-10">
              {logo || (
                <motion.div 
                  className="w-28 h-28 relative mx-auto"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  {/* Refined financial chart visualization */}
                  <svg width="100%" height="100%" viewBox="0 0 100 100" className="text-primary drop-shadow-sm">
                    {/* Subtle grid */}
                    <motion.g opacity="0.15">
                      <motion.line 
                        x1="10" y1="20" x2="90" y2="20" 
                        stroke="currentColor" 
                        strokeWidth="0.5"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1, delay: 0.1 }}
                      />
                      <motion.line 
                        x1="10" y1="40" x2="90" y2="40" 
                        stroke="currentColor" 
                        strokeWidth="0.5"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1, delay: 0.2 }}
                      />
                      <motion.line 
                        x1="10" y1="60" x2="90" y2="60" 
                        stroke="currentColor" 
                        strokeWidth="0.5"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1, delay: 0.3 }}
                      />
                      <motion.line 
                        x1="10" y1="80" x2="90" y2="80" 
                        stroke="currentColor" 
                        strokeWidth="0.5"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1, delay: 0.4 }}
                      />
                      
                      <motion.line 
                        x1="20" y1="10" x2="20" y2="90" 
                        stroke="currentColor" 
                        strokeWidth="0.5"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1, delay: 0.2 }}
                      />
                      <motion.line 
                        x1="40" y1="10" x2="40" y2="90" 
                        stroke="currentColor" 
                        strokeWidth="0.5"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1, delay: 0.3 }}
                      />
                      <motion.line 
                        x1="60" y1="10" x2="60" y2="90" 
                        stroke="currentColor" 
                        strokeWidth="0.5"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1, delay: 0.4 }}
                      />
                      <motion.line 
                        x1="80" y1="10" x2="80" y2="90" 
                        stroke="currentColor" 
                        strokeWidth="0.5"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1, delay: 0.5 }}
                      />
                    </motion.g>
                    
                    {/* Elegant frame */}
                    <motion.rect 
                      x="10" y="10" width="80" height="80" 
                      stroke="currentColor" 
                      fill="none"
                      strokeWidth="1.5"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 1.5 }}
                    />
                    
                    {/* Sophisticated candlestick chart */}
                    <motion.g 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5, delay: 0.8 }}
                    >
                      {/* Candlestick 1 - Down */}
                      <motion.line 
                        x1="20" y1="30" x2="20" y2="60" 
                        stroke="currentColor" 
                        strokeWidth="1"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.4, delay: 0.8 }}
                      />
                      <motion.rect 
                        x="17" y="35" width="6" height="20" 
                        fill="none" 
                        stroke="currentColor" 
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: 1 }}
                        transition={{ duration: 0.4, delay: 0.9 }}
                      />
                      
                      {/* Candlestick 2 - Up */}
                      <motion.line 
                        x1="35" y1="25" x2="35" y2="55" 
                        stroke="currentColor" 
                        strokeWidth="1"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.4, delay: 1.0 }}
                      />
                      <motion.rect 
                        x="32" y="25" width="6" height="15" 
                        fill="currentColor" 
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: 1 }}
                        transition={{ duration: 0.4, delay: 1.1 }}
                      />
                      
                      {/* Candlestick 3 - Up */}
                      <motion.line 
                        x1="50" y1="20" x2="50" y2="65" 
                        stroke="currentColor" 
                        strokeWidth="1"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.4, delay: 1.2 }}
                      />
                      <motion.rect 
                        x="47" y="20" width="6" height="25" 
                        fill="currentColor" 
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: 1 }}
                        transition={{ duration: 0.4, delay: 1.3 }}
                      />
                      
                      {/* Candlestick 4 - Down */}
                      <motion.line 
                        x1="65" y1="15" x2="65" y2="70" 
                        stroke="currentColor" 
                        strokeWidth="1"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.4, delay: 1.4 }}
                      />
                      <motion.rect 
                        x="62" y="40" width="6" height="25" 
                        fill="none" 
                        stroke="currentColor" 
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: 1 }}
                        transition={{ duration: 0.4, delay: 1.5 }}
                      />
                      
                      {/* Candlestick 5 - Up */}
                      <motion.line 
                        x1="80" y1="15" x2="80" y2="80" 
                        stroke="currentColor" 
                        strokeWidth="1"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.4, delay: 1.6 }}
                      />
                      <motion.rect 
                        x="77" y="15" width="6" height="40" 
                        fill="currentColor" 
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: 1 }}
                        transition={{ duration: 0.4, delay: 1.7 }}
                      />
                    </motion.g>
                    
                    {/* Elegant trend line overlay */}
                    <motion.path 
                      d="M20,45 C30,40 35,35 50,30 C65,25 75,20 80,20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeDasharray="2 2"
                      strokeLinecap="round"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 0.7 }}
                      transition={{ duration: 2, delay: 1.8 }}
                    />
                  </svg>
                  
                  {/* Subtle animated glow effect */}
                  <div className="absolute inset-0 rounded-full bg-primary/5 blur-xl animate-pulse-slow"></div>
                </motion.div>
              )}
            </div>
          </motion.div>
          
          {/* Elegant text content */}
          <motion.div
            className="text-center space-y-3 mb-8"
            initial={{ opacity: 0, y: 15 }}
            animate={animationPhase >= 1 ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.3 }}
          >
            <h1 className="text-2xl font-light tracking-wide">Forex Trading Journal</h1>
            <p className="text-foreground/60 text-sm font-light tracking-wider uppercase">{text}</p>
            
            {/* Subtle brand signature */}
            <div className="pt-1">
              <p className="text-[10px] uppercase tracking-[0.2em] text-primary/70 font-medium">
                {brandName}
              </p>
            </div>
          </motion.div>
          
          {/* Refined progress indicators */}
          <motion.div
            className="space-y-3"
            initial={{ opacity: 0 }}
            animate={animationPhase >= 1 ? { opacity: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            {/* Elegant progress percentage */}
            <div className="flex justify-between items-center text-[10px] uppercase tracking-wider text-foreground/40 px-1">
              <span>Loading</span>
              <span>{Math.round(progress)}%</span>
            </div>
            
            {/* Sophisticated progress bar */}
            <div className="h-[2px] w-full bg-muted/20 rounded-full overflow-hidden relative">
              {/* Primary progress */}
              <motion.div 
                className="h-full bg-primary/50 rounded-full"
                style={{ width: `${progress}%` }}
                transition={{ ease: [0.4, 0.0, 0.2, 1] }}
              />
              
              {/* Animated highlight effect */}
              <motion.div 
                className="absolute top-0 bottom-0 w-20 bg-gradient-to-r from-transparent via-primary/20 to-transparent"
                style={{ 
                  left: `-20px`,
                  transform: `translateX(${progress}%)`,
                  opacity: progress > 5 ? 1 : 0
                }}
                transition={{ ease: [0.4, 0.0, 0.2, 1] }}
              />
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}