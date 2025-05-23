import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLoadingStore } from '@/hooks/use-loading-store';
import { SplashScreen } from './splash-screen';
import { ProgressBar } from './progress-bar';

interface LoadingProviderProps {
  children: ReactNode;
  splashMinDisplayTime?: number;
  showProgressBar?: boolean;
  progressBarColor?: 'primary' | 'secondary' | 'accent' | 'info';
}

// Định nghĩa loading provider mới sử dụng zustand store
export function LoadingProvider({
  children,
  splashMinDisplayTime = 1000,
  showProgressBar = true,
  progressBarColor = 'primary',
}: LoadingProviderProps) {
  const isAppLoading = useLoadingStore(state => state.isAppLoading);
  const isPageLoading = useLoadingStore(state => state.isPageLoading);
  
  return (
    <>
      {/* Hiển thị thanh progress ở đầu trang */}
      {showProgressBar && (
        <ProgressBar 
          fixed={true} 
          height={3} 
          color={progressBarColor}
        />
      )}
      
      {/* Nội dung chính của ứng dụng - không cần SplashScreen cấp page */}
      {children}
    </>
  );
}