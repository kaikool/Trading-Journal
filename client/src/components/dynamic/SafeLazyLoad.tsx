import React, { lazy, Suspense, useState, useEffect } from 'react';
import { LoadingFallback } from './LoadingFallback';
import ErrorBoundary from '@/components/ui/error-boundary';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons/icons';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { debug } from '@/lib/debug';
import { isPwaMode, clearAssetsCache } from '@/lib/serviceWorkerHelper';

interface SafeLazyLoadProps {
  moduleLoader: () => Promise<any>;
  fallback?: React.ReactNode;
  height?: number | string;
  retryOnError?: boolean;
  children?: React.ReactNode;
}

/**
 * Phát hiện lỗi MIME type để hiển thị thông báo phù hợp
 */
function isMIMETypeError(error: Error): boolean {
  if (!error) return false;
  
  const errorMessage = error.message || '';
  return errorMessage.includes('MIME type') || 
         errorMessage.includes('Unexpected token') ||
         errorMessage.includes('module') ||
         errorMessage.includes('Failed to fetch dynamically imported module');
}

/**
 * Improved component for safely lazy-loading React components
 * Designed to handle:
 * - Loading failures due to network issues
 * - MIME type errors in PWA mode
 * - Provides better fallback UI with retry mechanism
 */
export function SafeLazyLoad({
  moduleLoader,
  fallback,
  height = 300,
  retryOnError = true,
  children
}: SafeLazyLoadProps) {
  const [LazyComponent, setLazyComponent] = useState<React.ComponentType<any> | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Safely load the module with error handling
  useEffect(() => {
    if (LazyComponent) return;
    
    // Reset error state when trying to load again
    setError(null);
    
    moduleLoader()
      .then(module => {
        // Handle both default and named exports
        const Component = module.default || module;
        setLazyComponent(() => Component);
      })
      .catch(err => {
        debug('Error lazy loading component:', err);
        setError(err);
      });
  }, [moduleLoader, retryCount]);

  // Handle retry action
  const handleRetry = () => {
    setError(null);
    setRetryCount(prev => prev + 1);
  };

  // If we've loaded the component, render it
  if (LazyComponent) {
    return <LazyComponent {...(children as any)} />;
  }

  // If there was an error loading
  if (error) {
    // Check for MIME type error
    const isMIMEError = isMIMETypeError(error);
    
    // Xử lý lỗi MIME trong PWA mode
    if (isMIMEError && isPwaMode()) {
      // Thực hiện các hành động khắc phục
      clearAssetsCache().catch((err) => {
        console.error('Failed to clear cache:', err);
      });
    }
    
    return (
      <div className="flex items-center justify-center min-h-[150px] w-full" style={{ minHeight: typeof height === 'number' ? height : 300 }}>
        <div className="w-full max-w-md mx-auto p-4">
          <Alert variant="destructive" className="mb-4">
            <Icons.ui.warning className="h-5 w-5 mr-2" />
            <AlertTitle>Error Loading Content</AlertTitle>
            <AlertDescription>
              {isMIMEError ? (
                <>
                  Could not load component due to a MIME type error. This typically happens in PWA mode. 
                  {navigator.onLine ? ' Please try refreshing the page.' : ' You appear to be offline.'}
                </>
              ) : (
                <>
                  {error?.message || 'There was a problem loading this component.'}
                  {navigator.onLine ? '' : ' (You appear to be offline)'}
                </>
              )}
            </AlertDescription>
          </Alert>
          
          {retryOnError && (
            <div className="flex justify-center mt-4 gap-2">
              <Button onClick={handleRetry} className="gap-2">
                <Icons.ui.refresh className="h-4 w-4" />
                Retry
              </Button>
              
              {isMIMEError && (
                <Button 
                  onClick={() => window.location.reload()} 
                  variant="outline" 
                  className="gap-2"
                >
                  <Icons.ui.refresh className="h-4 w-4" />
                  Refresh Page
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Still loading
  return fallback || <LoadingFallback height={typeof height === 'number' ? height : undefined} showSpinner={true} />;
}

/**
 * Create a safely lazy-loaded component that handles MIME type errors
 * 
 * @param factory Function that loads the component module
 * @returns A lazy-loaded component wrapped with error handling
 */
export function createSafeLazyComponent<T>(factory: () => Promise<{ default: React.ComponentType<T> }>) {
  const LazyComponent = lazy(factory);
  
  return function SafeLazyComponent(props: T & { fallback?: React.ReactNode; height?: number | string }) {
    const { fallback, height, ...componentProps } = props as any;
    // Lưu trữ lỗi để có thể sử dụng trong onReset
    const errorRef = React.useRef<Error | null>(null);
    
    return (
      <ErrorBoundary
        fallback={({ error, resetErrorBoundary }) => {
          // Lưu lỗi để sử dụng trong onReset
          errorRef.current = error;
          
          // Check for MIME type error
          const isMIMEError = isMIMETypeError(error);
          
          // Xử lý lỗi MIME trong PWA mode ngay tại thời điểm render
          if (isMIMEError && isPwaMode()) {
            // Thực hiện các hành động khắc phục
            clearAssetsCache().catch((cacheErr) => {
              console.error('Failed to clear cache:', cacheErr);
            });
          }
          
          return (
            <div className="flex items-center justify-center min-h-[150px] w-full" style={{ minHeight: height || 300 }}>
              <div className="w-full max-w-md mx-auto p-4">
                <Alert variant="destructive" className="mb-4">
                  <Icons.ui.warning className="h-5 w-5 mr-2" />
                  <AlertTitle>Error Loading Content</AlertTitle>
                  <AlertDescription>
                    {isMIMEError ? (
                      <>
                        Could not load component due to a MIME type error. This typically happens in PWA mode. 
                        {navigator.onLine ? ' Please try refreshing the page.' : ' You appear to be offline.'}
                      </>
                    ) : (
                      <>
                        {error?.message || 'There was a problem loading this component.'}
                        {navigator.onLine ? '' : ' (You appear to be offline)'}
                      </>
                    )}
                  </AlertDescription>
                </Alert>
                
                <div className="flex justify-center mt-4 gap-2">
                  <Button onClick={resetErrorBoundary} className="gap-2">
                    <Icons.ui.refresh className="h-4 w-4" />
                    Retry
                  </Button>
                  
                  {isMIMEError && (
                    <Button 
                      onClick={() => window.location.reload()} 
                      variant="outline" 
                      className="gap-2"
                    >
                      <Icons.ui.refresh className="h-4 w-4" />
                      Refresh Page
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        }}
        onReset={() => {
          // onReset chỉ cần là một hàm đơn giản, không cần async và không cần tham số
          // Chúng ta đã xử lý lỗi MIME type ngay trong fallback
        }}
      >
        <Suspense fallback={fallback || <LoadingFallback height={height || 300} showSpinner={true} />}>
          <LazyComponent {...componentProps} />
        </Suspense>
      </ErrorBoundary>
    );
  };
}

export default SafeLazyLoad;