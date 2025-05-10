import React from 'react';
import { cn } from '@/lib/utils';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  fullWidth?: boolean;
}

export function PageContainer({ 
  children, 
  className,
  fullWidth = false,
}: PageContainerProps) {
  return (
    <div className={cn(
      "px-4 py-6 md:px-6 lg:py-8",
      !fullWidth && "container mx-auto max-w-7xl",
      className
    )}>
      {children}
    </div>
  );
}