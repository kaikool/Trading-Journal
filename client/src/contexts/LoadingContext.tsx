import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// Loading levels to handle different UI hierarchies
export enum LoadingLevel {
  COMPONENT = 'component', // Small UI components (cards, fields)
  PAGE = 'page',          // Page-level loading
  APP = 'app'             // Full app loading (startup, auth)
}

// Define the context type
interface LoadingContextType {
  // State getters
  isLoading: (id?: string, level?: LoadingLevel) => boolean;
  isComponentLoading: (id?: string) => boolean;
  isPageLoading: (id?: string) => boolean;
  isAppLoading: () => boolean;
  
  // State setters
  startLoading: (id: string, level: LoadingLevel) => void;
  stopLoading: (id: string, level: LoadingLevel) => void;
  
  // Global progress (0-100)
  progress: number;
  setProgress: (value: number) => void;
  
  // For advanced use cases
  loadingIds: Record<LoadingLevel, Set<string>>;
}

// Create the context with default values
const LoadingContext = createContext<LoadingContextType>({
  isLoading: () => false,
  isComponentLoading: () => false,
  isPageLoading: () => false,
  isAppLoading: () => false,
  startLoading: () => {},
  stopLoading: () => {},
  progress: 0,
  setProgress: () => {},
  loadingIds: {
    [LoadingLevel.COMPONENT]: new Set(),
    [LoadingLevel.PAGE]: new Set(),
    [LoadingLevel.APP]: new Set()
  }
});

// Create the provider component
export function LoadingProvider({ children }: { children: ReactNode }) {
  // Initialize loading state for different levels
  const [loadingState, setLoadingState] = useState<Record<LoadingLevel, Set<string>>>({
    [LoadingLevel.COMPONENT]: new Set(),
    [LoadingLevel.PAGE]: new Set(),
    [LoadingLevel.APP]: new Set()
  });
  
  // Global progress for top bar or other indicators
  const [progress, setProgress] = useState<number>(0);
  
  // Check if any loading is happening at a specific level
  const isLoading = useCallback((id?: string, level?: LoadingLevel): boolean => {
    if (!level) {
      // Check if any loading is happening at any level
      return (
        loadingState[LoadingLevel.COMPONENT].size > 0 ||
        loadingState[LoadingLevel.PAGE].size > 0 ||
        loadingState[LoadingLevel.APP].size > 0
      );
    }
    
    if (id) {
      // Check if specific ID is loading
      return loadingState[level].has(id);
    }
    
    // Check if any loading is happening at the specified level
    return loadingState[level].size > 0;
  }, [loadingState]);
  
  // Convenience methods for specific levels
  const isComponentLoading = useCallback((id?: string): boolean => {
    return isLoading(id, LoadingLevel.COMPONENT);
  }, [isLoading]);
  
  const isPageLoading = useCallback((id?: string): boolean => {
    return isLoading(id, LoadingLevel.PAGE);
  }, [isLoading]);
  
  const isAppLoading = useCallback((): boolean => {
    return isLoading(undefined, LoadingLevel.APP);
  }, [isLoading]);
  
  // Start loading for a specific ID at a specific level
  const startLoading = useCallback((id: string, level: LoadingLevel) => {
    setLoadingState(prev => {
      const newSet = new Set(prev[level]);
      newSet.add(id);
      return {
        ...prev,
        [level]: newSet
      };
    });
    
    // For page or app loading, reset progress to 0
    if (level === LoadingLevel.PAGE || level === LoadingLevel.APP) {
      setProgress(0);
    }
  }, []);
  
  // Stop loading for a specific ID at a specific level
  const stopLoading = useCallback((id: string, level: LoadingLevel) => {
    setLoadingState(prev => {
      const newSet = new Set(prev[level]);
      newSet.delete(id);
      return {
        ...prev,
        [level]: newSet
      };
    });
    
    // For page or app loading, set progress to 100 when complete
    if (level === LoadingLevel.PAGE || level === LoadingLevel.APP) {
      setProgress(100);
    }
  }, []);
  
  // Provide the loading state and methods to children
  const contextValue: LoadingContextType = {
    isLoading,
    isComponentLoading,
    isPageLoading,
    isAppLoading,
    startLoading,
    stopLoading,
    progress,
    setProgress,
    loadingIds: loadingState
  };
  
  return (
    <LoadingContext.Provider value={contextValue}>
      {children}
    </LoadingContext.Provider>
  );
}

// Custom hook to use loading context
export function useLoading() {
  const context = useContext(LoadingContext);
  
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  
  return context;
}

// Higher-order component to handle loading state automatically
export function withLoading<P extends object>(
  Component: React.ComponentType<P>,
  loadingId: string,
  level: LoadingLevel = LoadingLevel.COMPONENT
) {
  return function WithLoadingComponent(props: P & { isLoading?: boolean }) {
    const { startLoading, stopLoading } = useLoading();
    
    // Start loading when component mounts with isLoading=true
    React.useEffect(() => {
      if (props.isLoading) {
        startLoading(loadingId, level);
        return () => stopLoading(loadingId, level);
      }
    }, [props.isLoading]);
    
    return <Component {...props} />;
  };
}