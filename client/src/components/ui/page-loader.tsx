import React, { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useLoading, LoadingLevel } from '@/contexts/LoadingContext';
import { ProgressBar } from './progress-bar';
import { Icons } from '@/components/icons/icons';
import { motion } from 'framer-motion';

interface PageLoaderProps {
  className?: string;
  showSpinner?: boolean;
  id?: string;
  transparent?: boolean;
  text?: string;
  useGrowthAnimation?: boolean;
}

export function PageLoader({
  className,
  showSpinner = true,
  id = 'page-loader',
  transparent = false,
  text = 'Loading',
  useGrowthAnimation = true,
}: PageLoaderProps) {
  const { startLoading, stopLoading, isPageLoading } = useLoading();
  
  // Tự động đăng ký loading khi component được mount
  useEffect(() => {
    // Khởi tạo loading khi component mount
    startLoading(id, LoadingLevel.PAGE);
    
    // Dọn dẹp khi unmount
    return () => {
      stopLoading(id, LoadingLevel.PAGE);
    };
  }, [id, startLoading, stopLoading]);
  
  // Hiển thị thanh progress ở đầu trang 
  return (
    <>
      <ProgressBar />
      
      {/* Phần overlay cho loading toàn trang */}
      {showSpinner && (
        <div
          className={cn(
            'fixed inset-0 z-50 flex flex-col items-center justify-center',
            transparent ? 'bg-background/40' : 'bg-background/80',
            className
          )}
        >
          {useGrowthAnimation ? (
            <div className="w-24 h-24 flex items-center justify-center">
              {/* Animated Growth Chart */}
              <motion.div 
                className="w-full h-full relative flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {/* Animated chart */}
                <svg width="100%" height="100%" viewBox="0 0 100 100" className="text-primary">
                  {/* Grid lines */}
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
            </div>
          ) : (
            <div className="animate-spin text-primary">
              <Icons.ui.refresh className="w-12 h-12" />
            </div>
          )}
          
          {/* Hiển thị text */}
          <p className="mt-4 text-lg font-medium text-foreground">{text}</p>
        </div>
      )}
    </>
  );
}