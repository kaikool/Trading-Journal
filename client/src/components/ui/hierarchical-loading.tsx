import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AppSkeleton, SkeletonLevel } from '@/components/ui/app-skeleton';
import { cn } from '@/lib/utils';
import NProgress from 'nprogress';

// Cài đặt NProgress
import 'nprogress/nprogress.css';
NProgress.configure({ 
  showSpinner: false,
  trickleSpeed: 100,
  minimum: 0.1,
  easing: 'ease',
  speed: 300
});

// Định nghĩa các kiểu dữ liệu
type ComponentLoadingState = Record<string, boolean>;
type LoadingContextType = {
  // Các hàm cho Component Level Loading
  startComponentLoading: (id: string) => void;
  stopComponentLoading: (id: string) => void;
  isComponentLoading: (id: string) => boolean;
  
  // Các hàm cho Page Level Loading
  startPageLoading: () => void;
  stopPageLoading: () => void;
  updatePageProgress: (progress: number) => void;
  isPageLoading: boolean;
  
  // Các hàm cho App Level Loading
  startAppLoading: () => void;
  stopAppLoading: () => void;
  isAppLoading: boolean;
};

// Tạo LoadingContext
const LoadingContext = createContext<LoadingContextType>({
  startComponentLoading: () => {},
  stopComponentLoading: () => {},
  isComponentLoading: () => false,
  
  startPageLoading: () => {},
  stopPageLoading: () => {},
  updatePageProgress: () => {},
  isPageLoading: false,
  
  startAppLoading: () => {},
  stopAppLoading: () => {},
  isAppLoading: false
});

interface LoadingProviderProps {
  children: ReactNode;
}

// LoadingProvider component
export function HierarchicalLoadingProvider({ children }: LoadingProviderProps) {
  const [componentLoadingState, setComponentLoadingState] = useState<ComponentLoadingState>({});
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [isAppLoading, setIsAppLoading] = useState(false);
  
  // Component Level Loading
  const startComponentLoading = (id: string) => {
    setComponentLoadingState(prev => ({
      ...prev,
      [id]: true
    }));
  };
  
  const stopComponentLoading = (id: string) => {
    setComponentLoadingState(prev => ({
      ...prev,
      [id]: false
    }));
  };
  
  const isComponentLoading = (id: string) => {
    return !!componentLoadingState[id];
  };
  
  // Page Level Loading
  const startPageLoading = () => {
    setIsPageLoading(true);
    NProgress.start();
  };
  
  const stopPageLoading = () => {
    setIsPageLoading(false);
    NProgress.done();
  };
  
  const updatePageProgress = (progress: number) => {
    if (progress >= 0 && progress <= 100) {
      NProgress.set(progress / 100);
    }
  };
  
  // App Level Loading
  const startAppLoading = () => {
    setIsAppLoading(true);
  };
  
  const stopAppLoading = () => {
    setIsAppLoading(false);
  };
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      NProgress.done();
    };
  }, []);
  
  const contextValue = {
    startComponentLoading,
    stopComponentLoading,
    isComponentLoading,
    
    startPageLoading,
    stopPageLoading,
    updatePageProgress,
    isPageLoading,
    
    startAppLoading,
    stopAppLoading,
    isAppLoading
  };
  
  return (
    <LoadingContext.Provider value={contextValue}>
      {isAppLoading && <AppSplashScreen />}
      {children}
    </LoadingContext.Provider>
  );
}

// Hook để sử dụng context
export const useHierarchicalLoading = () => useContext(LoadingContext);

// App Splash Screen component
function AppSplashScreen() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <div className="flex flex-col items-center space-y-4">
        <div className="w-20 h-20 relative animate-pulse">
          <img src="/logo.svg" alt="App Logo" className="w-full h-full" />
        </div>
        <div className="w-40 h-1 bg-muted overflow-hidden rounded-full">
          <div className="h-full bg-primary animate-progress-indeterminate" />
        </div>
        <p className="text-sm text-muted-foreground animate-pulse">
          Loading application...
        </p>
      </div>
    </div>
  );
}

// ComponentLoading component
interface ComponentLoadingProps {
  id: string;
  children: ReactNode;
  skeletonLevel: SkeletonLevel;
  className?: string;
  height?: number;
  skeletonProps?: Record<string, any>;
}

export function ComponentLoading({
  id,
  children,
  skeletonLevel,
  className,
  height,
  skeletonProps = {}
}: ComponentLoadingProps) {
  const { isComponentLoading } = useHierarchicalLoading();
  const loading = isComponentLoading(id);
  
  if (loading) {
    return (
      <div className={cn("w-full", className)}>
        <AppSkeleton
          level={skeletonLevel}
          className={className}
          height={height}
          customProps={skeletonProps}
        />
      </div>
    );
  }
  
  return <>{children}</>;
}

// Thêm style cho progress animation
const styles = `
  @keyframes progress-indeterminate {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
  
  .animate-progress-indeterminate {
    animation: progress-indeterminate 1.5s ease-in-out infinite;
    width: 100%;
  }
`;

// Inject styles vào document
if (typeof document !== 'undefined') {
  const styleEl = document.createElement('style');
  styleEl.textContent = styles;
  document.head.appendChild(styleEl);
}