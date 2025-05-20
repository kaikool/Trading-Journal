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
  
  // Handle timing - đơn giản hóa và ưu tiên hiệu suất
  useEffect(() => {
    if (!isAppLoading()) {
      const elapsedTime = Date.now() - startTime;
      
      // Hàm kết thúc splash screen và áp dụng hiệu ứng cho nội dung
      const finishSplashScreen = () => {
        // Thêm class vào body để kích hoạt hiệu ứng CSS cho nội dung chính
        document.body.classList.add('app-content-visible');
        
        // Thêm delay ngắn để animation có thể bắt đầu trước khi splash screen biến mất
        setTimeout(() => setVisible(false), 150);
      };
      
      if (elapsedTime >= minimumDisplayTime) {
        // Đã đủ thời gian hiển thị tối thiểu
        setPhase(4); // Chuyển sang phase cuối
        
        // Thêm timeout để người dùng có thể thấy phase cuối trước khi kết thúc
        const timer = setTimeout(finishSplashScreen, 300);
        return () => clearTimeout(timer);
      } else {
        // Chưa đủ thời gian hiển thị tối thiểu
        const remainingTime = minimumDisplayTime - elapsedTime;
        const timer = setTimeout(() => {
          setPhase(4); // Chuyển sang phase cuối
          
          // Thêm timeout để người dùng có thể thấy phase cuối trước khi kết thúc
          setTimeout(finishSplashScreen, 300);
        }, remainingTime);
        
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
          "safe-area-splash bg-gradient-to-br from-background/95 via-background to-background/90 dark:from-slate-950 dark:via-background dark:to-slate-900/90",
          // Đảm bảo safe area được áp dụng đúng cách
          "pt-safe pr-safe pb-safe pl-safe",
          className
        )}
        style={{
          // Đảm bảo hiển thị full screen, kể cả trên các thiết bị có notch hoặc rounded corners
          width: '100vw',
          maxWidth: '100vw', 
          maxHeight: '100vh',
          // Sử dụng dynamic viewport height để đảm bảo full screen trên mobile
          minHeight: '100vh',
        }}
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
        
        {/* Modern glass container */}
        <motion.div 
          className="relative z-10 w-full max-w-[260px] mx-auto p-5 rounded-xl bg-gradient-to-br from-background/40 to-background/10 dark:from-background/20 dark:to-background/5 backdrop-blur-xl border border-foreground/10 shadow-xl"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {/* Central Symbol - smaller and more compact */}
          <div className="relative flex justify-center mb-6">
            {logo || (
              <div className="relative w-24 h-24">
                {/* Simple background glow */}
                <motion.div 
                  className="absolute inset-0 opacity-10"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.1 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                >
                  <div className="absolute inset-[10%] bg-primary/20 rounded-full blur-md" />
                </motion.div>
                
                {/* Modern animated logo */}
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
                    
                    {/* Animated highlight */}
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
                
                {/* Removed orbiting dots */}
              </div>
            )}
          </div>
          
          {/* Text and Branding */}
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
          
          {/* Minimal progress indicator */}
          <motion.div 
            className="space-y-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.2 }}
          >
            {/* Simple progress bar */}
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
    </AnimatePresence>
  );
}