import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { useLoadingStore } from '@/hooks/use-loading-store';
import { Icons } from '@/components/icons/icons';

interface PremiumSplashScreenProps {
  className?: string;
  text?: string;
  minimumDisplayTime?: number;
  logoSize?: number;
  brandName?: string;
}

export function PremiumSplashScreen({
  className,
  text = 'Đang khởi tạo...',
  minimumDisplayTime = 2000,
  logoSize = 90,
  brandName = 'Táo Tầu',
}: PremiumSplashScreenProps) {
  const isAppLoading = useLoadingStore(state => state.isAppLoading);
  const progress = useLoadingStore(state => state.progress);
  const [visible, setVisible] = useState(true);
  const [startTime] = useState(Date.now());
  const [animationPhase, setAnimationPhase] = useState(0);
  
  // Theo dõi các giai đoạn animation
  useEffect(() => {
    // Giai đoạn 1: Hiện logo (sau 100ms)
    const phase1 = setTimeout(() => setAnimationPhase(1), 100);
    
    // Giai đoạn 2: Hiện vòng tròn xung quanh + bắt đầu xoay (sau 400ms)
    const phase2 = setTimeout(() => setAnimationPhase(2), 400);
    
    // Giai đoạn 3: Hiện text (sau 700ms)
    const phase3 = setTimeout(() => setAnimationPhase(3), 700);
    
    // Giai đoạn 4: Hiện brand name + progress bar (sau 900ms)
    const phase4 = setTimeout(() => setAnimationPhase(4), 900);
    
    // Dọn dẹp timers khi unmount
    return () => {
      clearTimeout(phase1);
      clearTimeout(phase2);
      clearTimeout(phase3);
      clearTimeout(phase4);
    };
  }, []);
  
  // Handle display timing with minimum display time
  useEffect(() => {
    if (!isAppLoading()) {
      const currentTime = Date.now();
      const elapsedTime = currentTime - startTime;
      
      if (elapsedTime >= minimumDisplayTime) {
        // Bắt đầu animation thoát
        setAnimationPhase(5);
        
        // Chờ animation hoàn tất rồi mới ẩn đi
        const hideTimer = setTimeout(() => {
          setVisible(false);
        }, 800);
        
        return () => clearTimeout(hideTimer);
      } else {
        // Chờ đủ thời gian tối thiểu rồi mới thoát
        const remainingTime = minimumDisplayTime - elapsedTime;
        const timer = setTimeout(() => {
          setAnimationPhase(5);
          
          // Chờ animation hoàn tất rồi mới ẩn đi
          setTimeout(() => {
            setVisible(false);
          }, 800);
        }, remainingTime);
        
        return () => clearTimeout(timer);
      }
    }
  }, [isAppLoading, minimumDisplayTime, startTime]);
  
  // Tăng progress một cách mượt mà
  useEffect(() => {
    // Tăng progress mỗi 120ms
    const progressInterval = setInterval(() => {
      // Nếu đang ở giai đoạn thoát, không tăng nữa
      if (animationPhase === 5) {
        clearInterval(progressInterval);
        return;
      }
      
      // Lấy progress hiện tại
      const currentProgress = useLoadingStore.getState().progress;
      
      // Tự động tăng progress nếu dưới 95%
      if (currentProgress < 95) {
        useLoadingStore.getState().setProgress(currentProgress + 0.5);
      }
    }, 120);
    
    return () => clearInterval(progressInterval);
  }, [animationPhase]);
  
  // Nếu không hiển thị, không render gì cả
  if (!visible) return null;
  
  return (
    <div className={cn(
      "fixed inset-0 z-50 flex flex-col items-center justify-center",
      "bg-gradient-to-b from-background to-background/95 backdrop-blur-sm",
      animationPhase === 5 ? "opacity-0 transition-opacity duration-800" : "opacity-100",
      className
    )}>
      <div className="relative w-full max-w-md mx-auto px-6 text-center">
        {/* Logo container with growth animation */}
        <div className={cn(
          "relative mx-auto transition-all duration-700 ease-out transform",
          animationPhase === 0 ? "scale-50 opacity-0" : 
          animationPhase === 5 ? "scale-150 opacity-0" : 
          "scale-100 opacity-100"
        )}
        style={{ width: logoSize, height: logoSize }}>
          {/* Outer orbital ring - appears in phase 2 */}
          <div className={cn(
            "absolute rounded-full border-2 border-primary/30",
            "transition-all duration-700 ease-out",
            animationPhase < 2 ? "opacity-0 scale-50" : 
            animationPhase === 5 ? "opacity-0 scale-150" : 
            "opacity-100 scale-100 animate-spin-slow",
          )}
            style={{ 
              width: logoSize * 1.5, 
              height: logoSize * 1.5,
              left: -logoSize * 0.25,
              top: -logoSize * 0.25,
              animationDuration: '12s'
            }} />
          
          {/* Middle orbital ring - appears in phase 2 with delay */}
          <div className={cn(
            "absolute rounded-full border border-primary/20",
            "transition-all duration-700 delay-100 ease-out",
            animationPhase < 2 ? "opacity-0 scale-50" : 
            animationPhase === 5 ? "opacity-0 scale-150" : 
            "opacity-100 scale-100 animate-spin-slow",
          )}
            style={{ 
              width: logoSize * 1.2, 
              height: logoSize * 1.2,
              left: -logoSize * 0.1,
              top: -logoSize * 0.1,
              animationDuration: '9s',
              animationDirection: 'reverse'
            }} />
            
          {/* Main logo container with glow */}
          <div className={cn(
            "absolute inset-0 rounded-full bg-background",
            "flex items-center justify-center",
            "transition-all duration-700 ease-out",
            "shadow-lg",
            animationPhase >= 2 ? "animate-float" : "",
            animationPhase === 5 ? "scale-150 opacity-0" : "scale-100"
          )}>
            {/* Logo glow */}
            <div className={cn(
              "absolute inset-0 rounded-full",
              "transition-all duration-700 ease-out",
              animationPhase < 2 ? "opacity-0" : 
              animationPhase === 5 ? "opacity-0" : "opacity-100"
            )}
              style={{
                boxShadow: "0 0 40px rgba(var(--primary), 0.2), 0 0 20px rgba(var(--primary), 0.1) inset",
              }} />
            
            {/* Main logo with subtle growth animation */}
            <Icons.analytics.barChart 
              className={cn(
                "text-primary transition-all duration-700",
                animationPhase === 0 ? "opacity-0 scale-50" : 
                animationPhase === 5 ? "opacity-0 scale-150" : 
                "opacity-100 scale-100"
              )}
              style={{ 
                width: logoSize * 0.6, 
                height: logoSize * 0.6,
                filter: "drop-shadow(0 0 8px rgba(var(--primary), 0.3))" 
              }} />
          </div>
        </div>
        
        {/* Text section with staggered fade-in */}
        <div className="mt-12 space-y-4">
          {/* Main text */}
          <div className={cn(
            "overflow-hidden h-9", // Fixed height to prevent layout shift
            "transition-all duration-700 ease-out",
            animationPhase < 3 ? "opacity-0" : 
            animationPhase === 5 ? "opacity-0" : "opacity-100"
          )}>
            <p className={cn(
              "text-xl font-medium text-foreground",
              "transform transition-transform duration-700 ease-out",
              animationPhase < 3 ? "translate-y-full" : 
              animationPhase === 5 ? "-translate-y-full" : "translate-y-0"
            )}>
              {text}
            </p>
          </div>
          
          {/* Brand name with gradient */}
          <div className={cn(
            "overflow-hidden h-7", // Fixed height to prevent layout shift
            "transition-all duration-700 delay-100 ease-out",
            animationPhase < 4 ? "opacity-0" : 
            animationPhase === 5 ? "opacity-0" : "opacity-100"
          )}>
            <p className={cn(
              "text-lg font-semibold",
              "bg-gradient-to-r from-primary via-primary/90 to-primary/70",
              "bg-clip-text text-transparent",
              "transform transition-transform duration-700 delay-100 ease-out",
              animationPhase < 4 ? "translate-y-full" : 
              animationPhase === 5 ? "-translate-y-full" : "translate-y-0"
            )}>
              made by {brandName}
            </p>
          </div>
        </div>
        
        {/* Premium progress bar */}
        <div className={cn(
          "w-72 mx-auto mt-10 relative h-1",
          "transition-all duration-700 delay-200 ease-out",
          animationPhase < 4 ? "opacity-0 scale-x-90" : 
          animationPhase === 5 ? "opacity-0 scale-x-110" : "opacity-100 scale-x-100"
        )}>
          {/* Track with subtle gradient */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-muted/70 via-muted to-muted/70"></div>
          
          {/* Progress fill with animation and glow */}
          <div 
            className={cn(
              "absolute h-full rounded-full",
              "bg-gradient-to-r from-primary/90 via-primary to-primary/90",
              "transition-all duration-700 ease-out"
            )}
            style={{ 
              width: `${progress}%`,
              boxShadow: "0 0 10px rgba(var(--primary), 0.5)",
              transition: "width 400ms cubic-bezier(0.34, 1.56, 0.64, 1)"
            }}
          />
          
          {/* Shine effect */}
          <div 
            className="absolute h-full w-20 rounded-full bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"
            style={{ left: `${progress - 10}%` }}
          />
        </div>
      </div>
    </div>
  );
}