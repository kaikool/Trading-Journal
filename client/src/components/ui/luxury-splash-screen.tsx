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
  text = 'Đang khởi tạo...',
  minimumDisplayTime = 2000,
  logoSize = 90,
  brandName = 'Táo Tầu',
}: LuxurySplashScreenProps) {
  const isAppLoading = useLoadingStore(state => state.isAppLoading);
  const progress = useLoadingStore(state => state.progress);
  const [visible, setVisible] = useState(true);
  const [startTime] = useState(Date.now());
  const [animationPhase, setAnimationPhase] = useState(0);
  
  // Sophisticated phased animation sequence
  useEffect(() => {
    // Phase 1: Initial reveal - subtle appearance (after 100ms)
    const phase1 = setTimeout(() => setAnimationPhase(1), 100);
    
    // Phase 2: Logo expansion with particle effects (after 400ms)
    const phase2 = setTimeout(() => setAnimationPhase(2), 400);
    
    // Phase 3: Orbital rings and glow effects (after 700ms)
    const phase3 = setTimeout(() => setAnimationPhase(3), 700);
    
    // Phase 4: Text elements with staggered appearance (after 900ms)
    const phase4 = setTimeout(() => setAnimationPhase(4), 900);
    
    // Phase 5: Progress indicator and final polish (after 1100ms)
    const phase5 = setTimeout(() => setAnimationPhase(5), 1100);
    
    // Cleanup timers on unmount
    return () => {
      clearTimeout(phase1);
      clearTimeout(phase2);
      clearTimeout(phase3);
      clearTimeout(phase4);
      clearTimeout(phase5);
    };
  }, []);
  
  // Handle minimum display time with elegant exit animation
  useEffect(() => {
    if (!isAppLoading()) {
      const currentTime = Date.now();
      const elapsedTime = currentTime - startTime;
      
      if (elapsedTime >= minimumDisplayTime) {
        // Begin exit animation sequence
        setAnimationPhase(6);
        
        // Allow exit animation to complete before unmounting
        const hideTimer = setTimeout(() => {
          setVisible(false);
        }, 900);
        
        return () => clearTimeout(hideTimer);
      } else {
        // Wait for minimum display time before exit animation
        const remainingTime = minimumDisplayTime - elapsedTime;
        const timer = setTimeout(() => {
          setAnimationPhase(6);
          
          // Allow exit animation to complete before unmounting
          setTimeout(() => {
            setVisible(false);
          }, 900);
        }, remainingTime);
        
        return () => clearTimeout(timer);
      }
    }
  }, [isAppLoading, minimumDisplayTime, startTime]);
  
  // Progress animation with elegant increments
  useEffect(() => {
    // Smooth progress updates with variable speed
    const progressInterval = setInterval(() => {
      // Stop progress animation during exit phase
      if (animationPhase === 6) {
        clearInterval(progressInterval);
        return;
      }
      
      // Get current progress value
      const currentProgress = useLoadingStore.getState().progress;
      
      // Sophisticated progress algorithm with variable increment speed
      // Slower at beginning and end, faster in the middle for natural feel
      if (currentProgress < 30) {
        // Slow start
        useLoadingStore.getState().setProgress(currentProgress + 0.3);
      } else if (currentProgress < 70) {
        // Faster middle section
        useLoadingStore.getState().setProgress(currentProgress + 0.6);
      } else if (currentProgress < 95) {
        // Slow finish
        useLoadingStore.getState().setProgress(currentProgress + 0.2);
      }
    }, 100);
    
    return () => clearInterval(progressInterval);
  }, [animationPhase]);
  
  // Don't render if not visible
  if (!visible) return null;
  
  // Particle elements for enhanced visual effect
  const renderParticles = () => {
    const particles = [];
    const particleCount = 12;
    
    for (let i = 0; i < particleCount; i++) {
      const size = Math.random() * 4 + 2;
      const angle = (i / particleCount) * 360;
      const delay = Math.random() * 0.5;
      const distance = logoSize * (0.8 + Math.random() * 0.6);
      
      particles.push(
        <motion.div
          key={i}
          className="absolute rounded-full bg-primary/70"
          initial={{ opacity: 0, scale: 0 }}
          animate={animationPhase >= 2 && animationPhase < 6 ? {
            opacity: [0, 0.9, 0],
            scale: [0, 1, 0],
            x: [0, Math.cos(angle * (Math.PI/180)) * distance * 0.3, Math.cos(angle * (Math.PI/180)) * distance],
            y: [0, Math.sin(angle * (Math.PI/180)) * distance * 0.3, Math.sin(angle * (Math.PI/180)) * distance]
          } : { opacity: 0, scale: 0 }}
          transition={{
            duration: 8,
            ease: "easeInOut",
            delay: delay,
            repeat: Infinity,
            repeatType: "loop"
          }}
          style={{
            width: size,
            height: size,
            left: "50%",
            top: "50%",
            filter: "blur(1px)"
          }}
        />
      );
    }
    
    return particles;
  };
  
  return (
    <AnimatePresence>
      <motion.div 
        className={cn(
          "fixed inset-0 z-50 flex flex-col items-center justify-center",
          "bg-gradient-to-br from-background via-background to-background/90 backdrop-blur-sm",
          className
        )}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="relative w-full max-w-md mx-auto px-6 text-center">
          {/* Ambient background effect */}
          <motion.div 
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={animationPhase >= 2 && animationPhase < 6 ? { opacity: 0.7 } : { opacity: 0 }}
            transition={{ duration: 1.5 }}
          >
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -inset-[100px] opacity-30">
                <div 
                  className="absolute top-1/2 left-1/2 w-[500px] h-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full"
                  style={{
                    background: "radial-gradient(circle, rgba(var(--primary), 0.15) 0%, rgba(var(--primary), 0.05) 40%, transparent 70%)",
                  }}
                />
              </div>
            </div>
          </motion.div>
          
          {/* Logo container with sophisticated animation */}
          <div className="relative mx-auto" style={{ width: logoSize * 1.8, height: logoSize * 1.8 }}>
            {/* Particle effects */}
            {renderParticles()}
            
            {/* Outer orbital ring */}
            <motion.div 
              className="absolute rounded-full border-[1.5px] border-primary/20"
              style={{ 
                width: logoSize * 1.8, 
                height: logoSize * 1.8,
                left: 0,
                top: 0,
              }}
              initial={{ opacity: 0, scale: 0.5, rotate: 0 }}
              animate={animationPhase >= 3 && animationPhase < 6 
                ? { opacity: 0.8, scale: 1, rotate: 360 } 
                : animationPhase === 6 
                  ? { opacity: 0, scale: 1.4, rotate: 360 } 
                  : { opacity: 0, scale: 0.5, rotate: 0 }}
              transition={{ 
                opacity: { duration: 0.7 }, 
                scale: { duration: 0.7, ease: "easeOut" },
                rotate: { duration: 20, ease: "linear", repeat: Infinity }
              }}
            />
            
            {/* Middle orbital ring with offset rotation */}
            <motion.div 
              className="absolute rounded-full border border-primary/15"
              style={{ 
                width: logoSize * 1.4, 
                height: logoSize * 1.4,
                left: logoSize * 0.2,
                top: logoSize * 0.2,
              }}
              initial={{ opacity: 0, scale: 0.5, rotate: 0 }}
              animate={animationPhase >= 3 && animationPhase < 6 
                ? { opacity: 0.6, scale: 1, rotate: -360 } 
                : animationPhase === 6 
                  ? { opacity: 0, scale: 1.4, rotate: -360 } 
                  : { opacity: 0, scale: 0.5, rotate: 0 }}
              transition={{ 
                opacity: { duration: 0.7, delay: 0.1 }, 
                scale: { duration: 0.7, delay: 0.1, ease: "easeOut" },
                rotate: { duration: 15, ease: "linear", repeat: Infinity }
              }}
            />
            
            {/* Inner orbital accent */}
            <motion.div 
              className="absolute rounded-full border-[2px] border-primary/30"
              style={{ 
                width: logoSize * 1.1, 
                height: logoSize * 1.1,
                left: logoSize * 0.35,
                top: logoSize * 0.35,
              }}
              initial={{ opacity: 0, scale: 0.5, rotate: 0 }}
              animate={animationPhase >= 3 && animationPhase < 6 
                ? { opacity: 1, scale: 1, rotate: 360 } 
                : animationPhase === 6 
                  ? { opacity: 0, scale: 1.4, rotate: 360 } 
                  : { opacity: 0, scale: 0.5, rotate: 0 }}
              transition={{ 
                opacity: { duration: 0.7, delay: 0.2 }, 
                scale: { duration: 0.7, delay: 0.2, ease: "easeOut" },
                rotate: { duration: 10, ease: "linear", repeat: Infinity }
              }}
            />
            
            {/* Main logo container with premium glow effect */}
            <motion.div 
              className="absolute rounded-full bg-background/95 shadow-xl overflow-hidden"
              style={{ 
                width: logoSize, 
                height: logoSize,
                left: logoSize * 0.4,
                top: logoSize * 0.4,
                boxShadow: animationPhase >= 2 && animationPhase < 6 
                  ? "0 0 40px rgba(var(--primary), 0.2), 0 0 15px rgba(var(--primary), 0.15) inset" 
                  : "none"
              }}
              initial={{ opacity: 0, scale: 0.5, y: 0 }}
              animate={animationPhase >= 1 
                ? (animationPhase < 6 
                  ? { opacity: 1, scale: 1, y: [0, -4, 0, 4, 0] } 
                  : { opacity: 0, scale: 1.5, y: 0 }) 
                : { opacity: 0, scale: 0.5, y: 0 }}
              transition={{
                opacity: { duration: 0.8 },
                scale: { duration: 0.8, ease: "easeOut" },
                y: { duration: 6, ease: "easeInOut", repeat: Infinity, repeatType: "mirror" }
              }}
            >
              {/* Subtle gradient overlay for premium look */}
              <motion.div 
                className="absolute inset-0 opacity-30"
                initial={{ opacity: 0 }}
                animate={animationPhase >= 2 && animationPhase < 6 ? { opacity: 0.3 } : { opacity: 0 }}
                transition={{ duration: 1 }}
                style={{
                  background: "linear-gradient(135deg, rgba(var(--primary), 0.3) 0%, transparent 60%)"
                }}
              />
              
              {/* Animated shine effect */}
              <motion.div 
                className="absolute inset-0 opacity-0"
                animate={animationPhase >= 2 && animationPhase < 6 
                  ? { opacity: [0, 0.5, 0], left: ["-100%", "100%", "100%"] } 
                  : { opacity: 0 }}
                transition={{
                  duration: 2,
                  ease: "easeInOut",
                  repeat: Infinity,
                  repeatDelay: 4
                }}
                style={{
                  background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)",
                  width: "100%",
                  height: "100%"
                }}
              />
              
              {/* Logo with sophisticated growth animation */}
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
                animate={animationPhase >= 1 
                  ? (animationPhase < 6 
                    ? { opacity: 1, scale: 1, rotate: 0 } 
                    : { opacity: 0, scale: 0, rotate: 10 }) 
                  : { opacity: 0, scale: 0.5, rotate: -10 }}
                transition={{
                  opacity: { duration: 0.8 },
                  scale: { duration: 0.8, type: "spring", stiffness: 100 },
                  rotate: { duration: 0.8, ease: "easeOut" }
                }}
              >
                <Icons.analytics.barChart 
                  className="text-primary"
                  style={{ 
                    width: logoSize * 0.6, 
                    height: logoSize * 0.6,
                    filter: "drop-shadow(0 0 8px rgba(var(--primary), 0.4))"
                  }} 
                />
              </motion.div>
            </motion.div>
          </div>
          
          {/* Text section with elegant staggered fade-in */}
          <div className="mt-10 space-y-4">
            {/* Main text with letter animation */}
            <div className="h-10 overflow-hidden">
              <motion.div
                initial={{ y: 40, opacity: 0 }}
                animate={animationPhase >= 4 
                  ? (animationPhase < 6 ? { y: 0, opacity: 1 } : { y: -40, opacity: 0 }) 
                  : { y: 40, opacity: 0 }}
                transition={{ duration: 0.7, delay: 0.1 }}
              >
                <motion.p 
                  className="text-xl font-medium text-foreground"
                >
                  {text.split('').map((char, index) => (
                    <motion.span
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={animationPhase >= 4 && animationPhase < 6 
                        ? { opacity: 1, y: 0 } : { opacity: 0, y: animationPhase >= 6 ? -20 : 20 }}
                      transition={{ 
                        duration: 0.4, 
                        delay: 0.1 + (index * 0.03),
                        ease: "easeOut"
                      }}
                      style={{ display: 'inline-block' }}
                    >
                      {char === ' ' ? '\u00A0' : char}
                    </motion.span>
                  ))}
                </motion.p>
              </motion.div>
            </div>
            
            {/* Elegant branded signature */}
            <div className="h-8 overflow-hidden">
              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={animationPhase >= 5 
                  ? (animationPhase < 6 ? { y: 0, opacity: 1 } : { y: -30, opacity: 0 }) 
                  : { y: 30, opacity: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <p className={cn(
                  "text-lg font-semibold",
                  "bg-gradient-to-r from-primary/80 via-primary to-primary/80",
                  "bg-clip-text text-transparent"
                )}>
                  made by {brandName}
                </p>
              </motion.div>
            </div>
          </div>
          
          {/* Luxurious progress indicator */}
          <motion.div 
            className="w-[280px] mx-auto mt-12 relative h-[2px]"
            initial={{ opacity: 0, scaleX: 0.8 }}
            animate={animationPhase >= 5 
              ? (animationPhase < 6 ? { opacity: 1, scaleX: 1 } : { opacity: 0, scaleX: 1.1 }) 
              : { opacity: 0, scaleX: 0.8 }}
            transition={{ duration: 0.7, delay: 0.3 }}
          >
            {/* Track with sophisticated gradient */}
            <div 
              className="absolute inset-0 rounded-full"
              style={{
                background: "linear-gradient(to right, rgba(var(--muted), 0.3), rgba(var(--muted), 0.6), rgba(var(--muted), 0.3))"
              }}
            />
            
            {/* Progress fill with premium animation */}
            <motion.div 
              className="absolute h-full rounded-full"
              style={{ 
                width: `${progress}%`,
                background: "linear-gradient(to right, rgba(var(--primary), 0.8), rgba(var(--primary), 1), rgba(var(--primary), 0.8))",
                boxShadow: "0 0 10px rgba(var(--primary), 0.4)"
              }}
              transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
            />
            
            {/* Animated shine effect */}
            <motion.div 
              className="absolute h-full w-20 rounded-full"
              style={{
                background: "linear-gradient(to right, transparent, rgba(255,255,255,0.8), transparent)",
                left: `calc(${progress}% - 100px)`
              }}
              animate={{ left: [`-20%`, `calc(${progress}% + 20px)`, `calc(${progress}% + 20px)`] }}
              transition={{
                duration: 2, 
                repeat: Infinity,
                repeatDelay: 0.5
              }}
            />
            
            {/* Elegant progress percentage display */}
            <motion.div
              className="absolute -top-8 text-sm font-medium text-primary/90"
              style={{ 
                left: `calc(${progress}%)`,
                transform: "translateX(-50%)"
              }}
              initial={{ opacity: 0, y: 10 }}
              animate={animationPhase >= 5 && animationPhase < 6 
                ? { opacity: progress > 5 ? 0.9 : 0, y: 0 } 
                : { opacity: 0, y: 10 }}
              transition={{ duration: 0.4 }}
            >
              {Math.round(progress)}%
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}