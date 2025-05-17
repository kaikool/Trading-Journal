import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { useLoadingStore } from '@/hooks/use-loading-store';
import { Icons } from '@/components/icons/icons';

interface ModernSplashScreenProps {
  className?: string;
  text?: string;
  minimumDisplayTime?: number;
  logoSize?: number;
  brandName?: string;
}

export function ModernSplashScreen({
  className,
  text = 'Đang tải ứng dụng...',
  minimumDisplayTime = 1500,
  logoSize = 80,
  brandName = 'Táo Tầu',
}: ModernSplashScreenProps) {
  const isAppLoading = useLoadingStore(state => state.isAppLoading);
  const progress = useLoadingStore(state => state.progress);
  const [visible, setVisible] = useState(true);
  const [startTime] = useState(Date.now());
  const [animationStage, setAnimationStage] = useState(0);
  
  // Handle display timing with minimum display time
  useEffect(() => {
    if (!isAppLoading()) {
      const currentTime = Date.now();
      const elapsedTime = currentTime - startTime;
      
      if (elapsedTime >= minimumDisplayTime) {
        // If minimum time passed, hide immediately but with animation
        setAnimationStage(2); // Transition out stage
        const timer = setTimeout(() => {
          setVisible(false);
        }, 800); // Animation duration
        
        return () => clearTimeout(timer);
      } else {
        // Schedule hiding after the remaining time
        const remainingTime = minimumDisplayTime - elapsedTime;
        const timer = setTimeout(() => {
          setAnimationStage(2); // Transition out stage
          
          setTimeout(() => {
            setVisible(false);
          }, 800); // Animation duration
        }, remainingTime);
        
        return () => clearTimeout(timer);
      }
    }
  }, [isAppLoading, minimumDisplayTime, startTime]);
  
  // Control animation stages
  useEffect(() => {
    // After initial render, move to the active state
    const timer = setTimeout(() => {
      setAnimationStage(1); // Fully visible active state
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
  // If not visible, don't render anything
  if (!visible) return null;
  
  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex flex-col items-center justify-center bg-background',
        'transition-all duration-800 ease-out',
        animationStage === 0 ? 'opacity-0' : 
        animationStage === 1 ? 'opacity-100' : 'opacity-0',
        className
      )}
    >
      <div className="flex flex-col items-center space-y-8 max-w-md mx-auto px-6 text-center">
        {/* Logo animation container */}
        <div 
          className={cn(
            'relative',
            'transition-all duration-700 ease-out transform',
            animationStage === 0 ? 'scale-75 opacity-0' : 
            animationStage === 1 ? 'scale-100 opacity-100' : 'scale-110 opacity-0',
          )}
          style={{ width: logoSize, height: logoSize }}
        >
          {/* Background pulse effect */}
          <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping-slow" 
               style={{ 
                 width: logoSize, 
                 height: logoSize,
                 animationDuration: '3s'
               }} />
          
          {/* Secondary pulse */}
          <div className="absolute inset-0 rounded-full bg-primary/5 animate-ping-slow" 
               style={{ 
                 width: logoSize, 
                 height: logoSize,
                 animationDuration: '2s',
                 animationDelay: '0.5s'
               }} />
          
          {/* Main logo */}
          <div className="absolute inset-0 flex items-center justify-center animate-float">
            <Icons.analytics.barChart 
              className="text-primary" 
              style={{ width: logoSize * 0.6, height: logoSize * 0.6 }} />
          </div>
          
          {/* Additional design elements */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="rounded-full border-2 border-primary/30 animate-spin-slow"
                 style={{ 
                   width: logoSize * 1.2, 
                   height: logoSize * 1.2,
                   animationDuration: '12s'
                 }} />
          </div>
        </div>
        
        {/* Text section with staggered animation */}
        <div className="space-y-4">
          <p className={cn(
            "text-xl font-medium text-foreground transition-all duration-500 delay-300",
            animationStage === 0 ? 'opacity-0 translate-y-2' : 
            animationStage === 1 ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
          )}>
            {text}
          </p>
          
          {/* Brand name with gradient text */}
          <p className={cn(
            "text-sm font-semibold transition-all duration-500 delay-500",
            "bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent",
            animationStage === 0 ? 'opacity-0 translate-y-2' : 
            animationStage === 1 ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
          )}>
            made by {brandName}
          </p>
        </div>
        
        {/* Progress bar with elegant design */}
        <div className={cn(
          "w-64 h-1 mt-2 bg-muted overflow-hidden rounded-full",
          "transition-all duration-500 delay-700",
          animationStage === 0 ? 'opacity-0 scale-x-75' : 
          animationStage === 1 ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-110'
        )}>
          <div 
            className="h-full bg-primary transition-all duration-500 ease-out rounded-full"
            style={{ 
              width: `${progress}%`,
              boxShadow: '0 0 10px rgba(var(--primary), 0.5), 0 0 5px rgba(var(--primary), 0.3)'
            }}
          />
        </div>
      </div>
    </div>
  );
}