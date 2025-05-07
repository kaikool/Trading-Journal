import React, { useState, useEffect, useRef, memo } from 'react';
import { Loader2 } from 'lucide-react';
import { useCachedImage } from '@/hooks/use-cached-image';
import { cn } from '@/lib/utils';
import { withErrorBoundary } from '@/components/ui/error-boundary';

interface OptimizedImageProps {
  src: string | null | undefined;
  alt: string;
  tradeId?: string;
  imageType?: string;
  placeholder?: string;
  width?: number | string;
  height?: number | string;
  aspectRatio?: string; // e.g., '16/9', '4/3', '1/1'
  className?: string;
  containerClassName?: string;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  loading?: 'eager' | 'lazy';
  priority?: boolean;
  fallbackSrc?: string;
  onClick?: React.MouseEventHandler<HTMLImageElement>;
  onLoad?: (event: React.SyntheticEvent<HTMLImageElement>) => void;
  onError?: (event: React.SyntheticEvent<HTMLImageElement>) => void;
}

/**
 * OptimizedImage Component
 * 
 * Một component hình ảnh tối ưu đảm bảo:
 * 1. Ngăn layout shift bằng cách dùng aspect ratio cố định
 * 2. Hiển thị placeholder trong khi đang tải
 * 3. Tối ưu hiệu suất với useCachedImage hook
 * 4. Xử lý gracefully các lỗi với error fallback
 * 5. Lazy loading cho hiệu suất
 */
function OptimizedImageBase({
  src,
  alt,
  tradeId = 'unknown',
  imageType = 'image',
  placeholder = '/icons/blank-chart.svg',
  width,
  height,
  aspectRatio = '16/9',
  className = '',
  containerClassName = '',
  objectFit = 'cover',
  loading = 'lazy',
  priority = false,
  fallbackSrc = '/icons/image-not-supported.svg',
  onClick,
  onLoad,
  onError,
}: OptimizedImageProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);

  // Sử dụng custom hook để lấy ảnh từ cache khi có thể
  const { 
    imageUrl, 
    isLoading, 
    error,
    reload 
  } = useCachedImage(src, {
    tradeId,
    imageType,
    placeholder,
    forceRefresh: false
  });

  // Theo dõi trạng thái load ảnh
  useEffect(() => {
    if (!isLoading && imageUrl && !error) {
      // Preload image để lấy kích thước
      const img = new Image();
      img.src = imageUrl;
      
      img.onload = () => {
        setDimensions({
          width: img.naturalWidth,
          height: img.naturalHeight
        });
        setImageLoaded(true);
        setHasError(false);
      };
      
      img.onerror = () => {
        setHasError(true);
        setImageLoaded(false);
        console.error(`Error loading image: ${imageUrl}`);
      };
    }
  }, [imageUrl, isLoading, error]);

  // Xử lý lỗi khi tải ảnh
  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setHasError(true);
    setImageLoaded(false);
    
    // Áp dụng ảnh fallback 
    if (e.currentTarget.src !== fallbackSrc) {
      e.currentTarget.src = fallbackSrc;
    }
    
    if (onError) {
      onError(e);
    }
  };

  // Xử lý khi ảnh tải xong
  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setImageLoaded(true);
    setHasError(false);
    
    if (onLoad) {
      onLoad(e);
    }
  };

  // Retry loading nếu cần
  const handleRetry = () => {
    setHasError(false);
    setImageLoaded(false);
    reload();
  };

  // Tính style dựa trên aspect ratio
  const containerStyle: React.CSSProperties = {
    position: 'relative',
    width: width ? (typeof width === 'number' ? `${width}px` : width) : '100%',
    height: height ? (typeof height === 'number' ? `${height}px` : height) : 'auto',
    aspectRatio: aspectRatio,
    overflow: 'hidden',
  };

  return (
    <div 
      className={cn("optimized-image-container", containerClassName)}
      style={containerStyle}
      data-testid="optimized-image-container"
      data-loaded={imageLoaded}
      data-error={hasError}
    >
      {/* Placeholder khi đang loading */}
      {(isLoading || !imageLoaded) && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 animate-pulse">
          <div className="flex flex-col items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <span className="text-xs text-muted-foreground mt-1">Loading...</span>
          </div>
        </div>
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
          <div className="flex flex-col items-center justify-center">
            <img src={fallbackSrc} alt="Image failed to load" className="h-8 w-8 opacity-70" />
            <span className="text-xs text-muted-foreground mt-1">Failed to load image</span>
            <button 
              onClick={handleRetry}
              className="text-xs text-primary hover:underline mt-2 focus:outline-none focus:ring-2 focus:ring-primary rounded px-2 py-1"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Actual image */}
      <img
        ref={imgRef}
        src={imageUrl || placeholder}
        alt={alt}
        loading={priority ? 'eager' : loading}
        className={cn(
          'optimized-image',
          (isLoading || !imageLoaded) ? 'opacity-0' : 'opacity-100',
          className
        )}
        style={{
          objectFit,
          transition: 'opacity 0.2s ease-in-out',
          width: '100%',
          height: '100%',
        }}
        onClick={onClick}
        onLoad={handleLoad}
        onError={handleError}
        decoding="async"
        draggable="false"
      />
    </div>
  );
}

// Tạo type cho fallback props
interface OptimizedImageErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

// Fallback component cho image errors
const OptimizedImageErrorFallback = ({ error, resetErrorBoundary }: OptimizedImageErrorFallbackProps) => (
  <div className="relative w-full h-full min-h-[100px] bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center">
    <div className="flex flex-col items-center justify-center p-4 text-center">
      <img src="/icons/image-not-supported.svg" alt="Error loading image" className="h-8 w-8 opacity-70 mb-2" />
      <p className="text-xs text-muted-foreground">Image error occurred</p>
      <button
        onClick={resetErrorBoundary}
        className="text-xs text-primary hover:underline mt-2 focus:outline-none focus:ring-2 focus:ring-primary rounded px-2 py-1"
      >
        Try again
      </button>
    </div>
  </div>
);

// Bọc component trong một error boundary
const OptimizedImage = withErrorBoundary(memo(OptimizedImageBase) as React.ComponentType<OptimizedImageProps>, {
  fallback: OptimizedImageErrorFallback,
  onReset: () => {
    console.log('OptimizedImage error boundary reset');
  },
  onError: (error: Error) => {
    console.error('OptimizedImage error caught by boundary:', error);
  }
});

export { OptimizedImage };