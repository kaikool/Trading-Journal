import React from 'react';
import { cn } from '@/lib/utils';

interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  fullWidth?: boolean;
  noMargin?: boolean;
  noPadding?: boolean;
}

/**
 * Page Container Component
 * 
 * A consistent container for page content with responsive padding
 * and consistent max-width
 * 
 * @param fullWidth - Removes max-width constraint
 * @param noMargin - Removes container margin
 * @param noPadding - Removes container padding
 */
export function PageContainer({
  children,
  className,
  fullWidth = false,
  noMargin = false,
  noPadding = false,
  ...props
}: PageContainerProps) {
  return (
    <div
      className={cn(
        'flex-1 flex flex-col',
        !noMargin && 'my-2 md:my-4',
        !noPadding && 'px-4 md:px-6',
        !fullWidth && 'max-w-7xl mx-auto w-full',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export default PageContainer;