import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { useLoading } from '@/contexts/LoadingContext';
import { Icons } from '@/components/icons/icons';

interface SplashScreenProps {
  className?: string;
  logo?: React.ReactNode;
  text?: string;
  minimumDisplayTime?: number;
  showProgressBar?: boolean;
}

export function SplashScreen({
  className,
  logo,
  text = 'Đang tải ứng dụng...',
  minimumDisplayTime = 1000,
  showProgressBar = true,
}: SplashScreenProps) {
  const { isAppLoading, progress } = useLoading();
  const [visible, setVisible] = useState(true);
  const [startTime] = useState(Date.now());
  
  // Handle display timing with minimum display time
  useEffect(() => {
    if (!isAppLoading()) {
      const currentTime = Date.now();
      const elapsedTime = currentTime - startTime;
      
      if (elapsedTime >= minimumDisplayTime) {
        // If minimum time passed, hide immediately
        setVisible(false);
      } else {
        // Schedule hiding after the remaining time
        const remainingTime = minimumDisplayTime - elapsedTime;
        const timer = setTimeout(() => {
          setVisible(false);
        }, remainingTime);
        
        return () => clearTimeout(timer);
      }
    }
  }, [isAppLoading, minimumDisplayTime, startTime]);
  
  // If not visible, don't render anything
  if (!visible) return null;
  
  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex flex-col items-center justify-center bg-background transition-opacity duration-500',
        isAppLoading() ? 'opacity-100' : 'opacity-0 pointer-events-none',
        className
      )}
    >
      <div className="flex flex-col items-center space-y-6 max-w-md mx-auto text-center">
        {/* Logo section */}
        <div className="w-20 h-20 relative animate-pulse-grow">
          {logo || (
            <div className="w-full h-full flex items-center justify-center">
              <Icons.logo className="w-16 h-16" />
            </div>
          )}
        </div>
        
        {/* Text section */}
        <div className="space-y-3">
          <p className="text-lg font-medium text-foreground">{text}</p>
          <p className="text-sm text-muted-foreground opacity-80">made by Táo Tầu</p>
        </div>
        
        {/* Progress bar */}
        {showProgressBar && (
          <div className="w-60 h-1 mt-4 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// Add this to global.css or create a new file for animations
// @keyframes pulse-grow {
//   0%, 100% {
//     transform: scale(1);
//     opacity: 0.8;
//   }
//   50% {
//     transform: scale(1.05);
//     opacity: 1;
//   }
// }
//
// .animate-pulse-grow {
//   animation: pulse-grow 2s infinite ease-in-out;
// }