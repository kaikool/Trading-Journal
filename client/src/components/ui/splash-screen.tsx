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
}

export function SplashScreen({
  className,
  logo,
  text = 'Initializing',
  minimumDisplayTime = 2000,
  brandName = 'FOREX PRO',
}: SplashScreenProps) {
  const isAppLoading = useLoadingStore(state => state.isAppLoading);
  const progress = useLoadingStore(state => state.progress);
  const [visible, setVisible] = useState(true);
  const [isFinishing, setIsFinishing] = useState(false); // IMPROVEMENT: Replaced 'phase' state with a clear boolean state
  const [startTime] = useState(Date.now());
  
  // IMPROVEMENT: Removed unused useEffect for animation phases (1, 2, 3)

  // Main transition logic - Preserved original timing and flow
  useEffect(() => {
    // Don't run again if the finishing sequence has already started
    if (isAppLoading() || isFinishing) return;

    const finishSplashScreen = () => {
      // Step 1: Prepare the main app content to be rendered but keep it invisible
      document.body.classList.add('app-content-ready');
      
      // Step 2: After a short delay, make the main app content visible (triggers fade-in)
      setTimeout(() => {
        document.body.classList.add('app-content-visible');
        
        // Step 3: Wait for the app content fade-in to start, then hide the splash screen
        // This triggers the exit animation of the splash screen.
        setTimeout(() => {
          setVisible(false);
        }, 800); // Original duration for a smooth transition
      }, 200);
    };

    const elapsedTime = Date.now() - startTime;
    const remainingTime = minimumDisplayTime - elapsedTime;

    const startFinishingSequence = () => {
      setIsFinishing(true); // Signal to stop the progress bar
      setTimeout(finishSplashScreen, 300); // Wait 300ms before starting the visual transition
    };

    let timerId: NodeJS.Timeout;
    if (remainingTime <= 0) {
      // Minimum display time met, start the sequence.
      startFinishingSequence();
    } else {
      // Wait until the minimum display time has passed.
      timerId = setTimeout(startFinishingSequence, remainingTime);
    }

    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, [isAppLoading, minimumDisplayTime, startTime, isFinishing]);
  
  // Progress control logic - Preserved original behavior
  useEffect(() => {
    if (isFinishing) return; // Stop progress simulation when finishing
    
    const interval = setInterval(() => {
      const current = useLoadingStore.getState().progress;
      if (current < 95) {
        const increment = (100 - current) / 50;
        useLoadingStore.getState().setProgress(current + increment);
      } else {
        clearInterval(interval); // Stop interval when progress is near complete
      }
    }, 100);
    
    return () => clearInterval(interval);
  }, [isFinishing]);
  
  // BUG FIX & IMPROVEMENT: AnimatePresence now correctly wraps the conditional component
  // This makes the 'exit' animation work as intended.
  return (
    <AnimatePresence mode="wait">
      {visible && (
        <motion.div 
          className={cn(
            "fixed inset-0 z-[100] flex flex-col items-center justify-center",
            "safe-area-splash",
            "bg-background",
            className
          )}
          style={{
            width: '100vw',
            maxWidth: '100vw', 
            maxHeight: '100vh',
            minHeight: '100vh',
          }}
          initial={{ opacity: 1 }} // Start fully visible
          animate={{ opacity: 1 }} // Stay visible
          exit={{ opacity: 0, transition: { duration: 0.6, ease: "easeInOut" } }} // Fade out on exit
        >
          {/* Container for the content */}
          <motion.div 
            className="relative z-10 w-full max-w-[270px] mx-auto p-6 rounded-2xl bg-background dark:bg-slate-900 border border-border shadow-2xl"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{ boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)' }}
          >
            {/* All inner content remains the same... */}
            <div className="relative flex justify-center mb-6">
              {logo || (
                <div className="relative w-24 h-24">
                  <motion.div 
                    className="absolute inset-0 opacity-10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.1 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                  >
                    <div className="absolute inset-[10%] bg-primary/20 rounded-full blur-md" />
                  </motion.div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative">
                      <motion.div
                        className="relative z-10 text-primary text-3xl font-black tracking-tighter"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                      >
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-foreground">FX</span>
                      </motion.div>
                      <motion.div 
                        className="absolute -inset-1 bg-primary/10 blur-md rounded-full"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ 
                          opacity: [0, 0.6, 0.2],
                          scale: [0.8, 1.2, 1]
                        }}
                        transition={{ 
                          duration: 2, 
                          ease: "easeInOut",
                          repeat: Infinity,
                          repeatType: "reverse"
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="text-center space-y-2 mb-5">
              <motion.h1 
                className="text-2xl font-bold tracking-tight"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.8 }}
              >
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/80">FOREX</span>
                <span className="text-foreground"> PRO</span>
              </motion.h1>
              <motion.div
                className="space-y-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 1 }}
              >
                <p className="text-muted-foreground text-xs tracking-wider">
                  {text}<span className="inline-block ml-1 animate-pulse">...</span>
                </p>
              </motion.div>
            </div>
            <motion.div 
              className="space-y-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 1.2 }}
            >
              <div className="relative h-px w-full bg-muted/30 rounded-full overflow-hidden">
                <motion.div 
                  className="absolute top-0 left-0 h-full bg-primary/60"
                  style={{ width: `${progress}%` }}
                  transition={{ ease: "easeOut" }}
                />
              </div>
              <div className="flex justify-between text-[9px] tracking-wider text-muted-foreground opacity-80">
                <span className="uppercase">{brandName}</span>
                <span>{Math.round(progress)}%</span>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}