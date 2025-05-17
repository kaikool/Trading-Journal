import React, { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useLoading, LoadingLevel } from '@/contexts/LoadingContext';
import { Skeleton } from './skeleton';
import { AppSkeleton, SkeletonLevel } from './app-skeleton';

interface ComponentLoaderProps {
  id: string;
  className?: string;
  children?: React.ReactNode;
  fallback?: React.ReactNode;
  showOverlay?: boolean;
  skeletonType?: SkeletonLevel;
  skeletonProps?: Record<string, any>;
}

export function ComponentLoader({
  id,
  className,
  children,
  fallback,
  showOverlay = false,
  skeletonType,
  skeletonProps = {},
}: ComponentLoaderProps) {
  const { startLoading, stopLoading, isComponentLoading } = useLoading();
  const isLoading = isComponentLoading(id);
  
  // Tự động đăng ký loading khi component được mount
  useEffect(() => {
    // Khởi tạo loading khi component mount
    startLoading(id, LoadingLevel.COMPONENT);
    
    // Dọn dẹp khi unmount
    return () => {
      stopLoading(id, LoadingLevel.COMPONENT);
    };
  }, [id, startLoading, stopLoading]);
  
  // Hiển thị skeleton phù hợp với loại component
  const renderSkeleton = () => {
    if (fallback) {
      return fallback;
    }
    
    if (skeletonType) {
      return <AppSkeleton level={skeletonType} {...skeletonProps} />;
    }
    
    return (
      <div className="p-4 h-40">
        <Skeleton className="w-full h-full" />
      </div>
    );
  };
  
  // Nếu không loading, hiển thị children
  if (!isLoading) {
    return <>{children}</>;
  }
  
  // Nếu đang loading, hiển thị skeleton hoặc fallback
  return (
    <div className={cn("relative", className)}>
      {showOverlay && (
        <div className="absolute inset-0 bg-background/80 z-10 flex items-center justify-center">
          <div className="animate-pulse text-foreground text-sm">Đang tải...</div>
        </div>
      )}
      
      {renderSkeleton()}
    </div>
  );
}