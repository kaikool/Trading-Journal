/**
 * PageTransition Component
 * 
 * Component này bọc các trang và cung cấp animation mượt mà khi chuyển đổi giữa các trang
 * Hỗ trợ đa dạng kiểu animation và các tùy chọn performance
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import { usePageTransition } from '@/lib/motion';
import { cn } from '@/lib/utils';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
  mode?: 'forward' | 'backward';
  id?: string;
}

export function PageTransition({
  children,
  className,
  mode = 'forward',
  id,
}: PageTransitionProps) {
  const [location] = useLocation();
  const motionProps = usePageTransition(mode);
  
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={id || location}
        {...motionProps}
        className={cn('w-full', className)}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * PageContainer Component
 * 
 * Container cho layout trang, bọc nội dung để đảm bảo 
 * hiển thị đúng và nhất quán
 */
export function PageContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'container max-w-screen-xl mx-auto px-4 sm:px-6 pb-16 pt-4',
        className
      )}
    >
      {children}
    </div>
  );
}