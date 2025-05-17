import React, { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useLoading, LoadingLevel } from '@/contexts/LoadingContext';
import { ProgressBar } from './progress-bar';
import { Icons } from '@/components/icons/icons';

interface PageLoaderProps {
  className?: string;
  showSpinner?: boolean;
  id?: string;
  transparent?: boolean;
  text?: string;
}

export function PageLoader({
  className,
  showSpinner = true,
  id = 'page-loader',
  transparent = false,
  text,
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
          {/* Hiệu ứng loading - spinner đơn giản */}
          <div className="animate-spin text-primary">
            <Icons.ui.refresh className="w-12 h-12" />
          </div>
          
          {/* Hiển thị text nếu có */}
          {text && (
            <p className="mt-4 text-lg font-medium text-foreground">{text}</p>
          )}
        </div>
      )}
    </>
  );
}