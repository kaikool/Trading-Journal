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
  const [startTime] = useState(Date.now());
  const [phase, setPhase] = useState(0);
  
  // Animation phases
  useEffect(() => {
    const phases = [
      setTimeout(() => setPhase(1), 200),
      setTimeout(() => setPhase(2), 700),
      setTimeout(() => setPhase(3), 1200)
    ];
    
    return () => phases.forEach(clearTimeout);
  }, []);
  
  // Handle timing
  useEffect(() => {
    if (!isAppLoading()) {
      const elapsedTime = Date.now() - startTime;
      
      if (elapsedTime >= minimumDisplayTime) {
        setPhase(4);
        const timer = setTimeout(() => setVisible(false), 650);
        return () => clearTimeout(timer);
      } else {
        const timer = setTimeout(() => {
          setPhase(4);
          setTimeout(() => setVisible(false), 650);
        }, minimumDisplayTime - elapsedTime);
        
        return () => clearTimeout(timer);
      }
    }
  }, [isAppLoading, minimumDisplayTime, startTime]);
  
  // Progress control
  useEffect(() => {
    if (phase === 4) return;
    
    const interval = setInterval(() => {
      const current = useLoadingStore.getState().progress;
      // Slow down as progress increases
      const increment = (100 - current) / 50;
      
      if (current < 95) {
        useLoadingStore.getState().setProgress(current + increment);
      }
    }, 100);
    
    return () => clearInterval(interval);
  }, [phase]);
  
  if (!visible) return null;
  
  return (
    <AnimatePresence mode="wait">
      <motion.div 
        className={cn(
          "fixed inset-0 z-[100] flex flex-col items-center justify-center",
          "bg-gradient-to-br from-background via-background to-background/95 dark:from-slate-950 dark:to-slate-900",
          className
        )}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Market patterns */}
          <motion.div 
            className="absolute top-0 right-0 w-[60%] h-[60%] opacity-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.05 }}
            transition={{ duration: 2 }}
          >
            {Array.from({ length: 10 }).map((_, i) => (
              <motion.div 
                key={i}
                className="absolute bg-primary/30"
                style={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  width: `${10 + Math.random() * 30}px`,
                  height: `${100 + Math.random() * 200}px`,
                  opacity: 0.1 + Math.random() * 0.2
                }}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ 
                  duration: 1.5 + Math.random(),
                  delay: 0.5 + Math.random() * 1.5,
                  ease: "easeOut"
                }}
              />
            ))}
          </motion.div>
          
          {/* Chart grid */}
          <div className="absolute inset-0 opacity-[0.03]">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={`h-${i}`} className="absolute h-px w-full bg-foreground/50" style={{ top: `${i * 5}%` }} />
            ))}
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={`v-${i}`} className="absolute w-px h-full bg-foreground/50" style={{ left: `${i * 5}%` }} />
            ))}
          </div>
        </div>
        
        {/* Content container with glassmorphism */}
        <motion.div 
          className="relative z-10 w-full max-w-md mx-auto p-8 rounded-lg"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {/* Central Symbol */}
          <div className="relative flex justify-center mb-12">
            {logo || (
              <div className="relative w-32 h-32">
                {/* Glowing backdrop */}
                {/* Simpler backdrop */}
                
                {/* Subtle background glow */}
                <motion.div 
                  className="absolute inset-0 opacity-20"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.2 }}
                  transition={{ duration: 1, delay: 0.5 }}
                >
                  <div className="absolute inset-[10%] bg-primary/20 rounded-full blur-lg" />
                </motion.div>
                
                {/* Currency symbols */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative w-20 h-20">
                    {/* Nến Nhật xuất hiện dần theo thứ tự */}
                    {/* Nến 1 - Bullish */}
                    <motion.div
                      className="absolute"
                      style={{ left: '10%', bottom: '30%', width: '10%', height: '25%' }}
                      initial={{ scaleY: 0, opacity: 0 }}
                      animate={{ scaleY: 1, opacity: 1 }}
                      transition={{ duration: 0.5, delay: 0.7 }}
                    >
                      <motion.div 
                        className="w-0.5 h-3 bg-foreground mx-auto"
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: 1 }}
                        transition={{ duration: 0.3, delay: 0.7 }}
                      />
                      <motion.div 
                        className="w-full h-full bg-primary" 
                      />
                      <motion.div 
                        className="w-0.5 h-5 bg-foreground mx-auto"
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: 1 }}
                        transition={{ duration: 0.3, delay: 0.7 }}
                      />
                    </motion.div>

                    {/* Nến 2 - Bearish */}
                    <motion.div
                      className="absolute"
                      style={{ left: '30%', bottom: '20%', width: '10%', height: '20%' }}
                      initial={{ scaleY: 0, opacity: 0 }}
                      animate={{ scaleY: 1, opacity: 1 }}
                      transition={{ duration: 0.5, delay: 0.9 }}
                    >
                      <motion.div 
                        className="w-0.5 h-6 bg-foreground mx-auto"
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: 1 }}
                        transition={{ duration: 0.3, delay: 0.9 }}
                      />
                      <motion.div 
                        className="w-full h-full border border-foreground bg-transparent" 
                      />
                      <motion.div 
                        className="w-0.5 h-4 bg-foreground mx-auto"
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: 1 }}
                        transition={{ duration: 0.3, delay: 0.9 }}
                      />
                    </motion.div>

                    {/* Nến 3 - Bullish */}
                    <motion.div
                      className="absolute"
                      style={{ left: '50%', bottom: '15%', width: '10%', height: '40%' }}
                      initial={{ scaleY: 0, opacity: 0 }}
                      animate={{ scaleY: 1, opacity: 1 }}
                      transition={{ duration: 0.5, delay: 1.1 }}
                    >
                      <motion.div 
                        className="w-0.5 h-2 bg-foreground mx-auto"
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: 1 }}
                        transition={{ duration: 0.3, delay: 1.1 }}
                      />
                      <motion.div 
                        className="w-full h-full bg-primary" 
                      />
                      <motion.div 
                        className="w-0.5 h-3 bg-foreground mx-auto"
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: 1 }}
                        transition={{ duration: 0.3, delay: 1.1 }}
                      />
                    </motion.div>

                    {/* Nến 4 - Bullish Strong */}
                    <motion.div
                      className="absolute"
                      style={{ left: '70%', bottom: '10%', width: '10%', height: '50%' }}
                      initial={{ scaleY: 0, opacity: 0 }}
                      animate={{ scaleY: 1, opacity: 1 }}
                      transition={{ duration: 0.5, delay: 1.3 }}
                    >
                      <motion.div 
                        className="w-0.5 h-3 bg-foreground mx-auto"
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: 1 }}
                        transition={{ duration: 0.3, delay: 1.3 }}
                      />
                      <motion.div 
                        className="w-full h-full bg-primary" 
                      />
                      <motion.div 
                        className="w-0.5 h-1 bg-foreground mx-auto"
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: 1 }}
                        transition={{ duration: 0.3, delay: 1.3 }}
                      />
                    </motion.div>

                    {/* Trendline tăng */}
                    <motion.div 
                      className="absolute inset-0"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5, delay: 1.5 }}
                    >
                      <svg width="100%" height="100%" viewBox="0 0 100 100" className="absolute inset-0">
                        <motion.path 
                          d="M15,70 C30,60 50,50 85,30" 
                          stroke="currentColor" 
                          strokeWidth="1.5"
                          strokeDasharray="150"
                          fill="none"
                          className="text-primary"
                          initial={{ strokeDashoffset: 150 }}
                          animate={{ strokeDashoffset: 0 }}
                          transition={{ duration: 1.5, delay: 1.5, ease: "easeOut" }}
                        />
                      </svg>
                    </motion.div>
                  </div>
                </div>
                
                {/* Removed orbiting dots */}
              </div>
            )}
          </div>
          
          {/* Text and Branding */}
          <div className="text-center space-y-6 mb-10">
            <motion.h1 
              className="text-3xl font-light tracking-wider"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              <span className="font-semibold text-primary">Forex</span> <span className="text-foreground">Trading Journal</span>
            </motion.h1>
            
            <motion.div
              className="space-y-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 1 }}
            >
              <p className="text-muted-foreground text-sm tracking-wider uppercase">
                {text}<span className="inline-block ml-1 animate-pulse">...</span>
              </p>
              <div className="h-px w-16 bg-primary/30 mx-auto"/>
            </motion.div>
          </div>
          
          {/* Progress indicators */}
          <motion.div 
            className="space-y-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.2 }}
          >
            {/* Progress percentage with blurred glow */}
            <div className="relative h-px w-full bg-muted/50 rounded-full overflow-hidden">
              <motion.div 
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary/40 via-primary to-primary/80"
                style={{ width: `${progress}%` }}
                transition={{ ease: "easeOut" }}
              />
              
              <motion.div 
                className="absolute top-0 left-0 h-full w-20 bg-foreground/20 blur-sm"
                style={{ 
                  left: `-10px`,
                  transform: `translateX(${progress}%)`
                }}
              />
            </div>
            
            <div className="flex justify-between text-[10px] tracking-wider text-muted-foreground">
              <span className="uppercase">{brandName}</span>
              <span>{Math.round(progress)}%</span>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}