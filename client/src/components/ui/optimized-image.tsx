import React, { useState, useEffect, useRef, useMemo } from 'react';
import { cn } from "@/lib/utils";
import { Icons } from '@/components/icons/icons';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  aspectRatio?: string;
  tradeId?: string;
  imageType?: 'entry' | 'exit' | 'general';
  placeholder?: string;
  fallbackSrc?: string;
  loading?: 'eager' | 'lazy';
  priority?: boolean;
  className?: string;
  containerClassName?: string;
  onClick?: () => void;
}

/**
 * OptimizedImage component để tránh layout shift và cải thiện hiệu suất
 * 
 * @component
 * @param {Object} props
 * @param {string} props.src - Đường dẫn hình ảnh
 * @param {string} props.alt - Mô tả hình ảnh
 * @param {number} [props.width] - Chiều rộng
 * @param {number} [props.height] - Chiều cao
 * @param {string} [props.aspectRatio] - Tỷ lệ khung hình (ví dụ: '16/9', '4/3', '1/1')
 * @param {string} [props.tradeId] - ID của trade (để lưu vào bộ nhớ đệm)
 * @param {string} [props.imageType] - Loại hình ảnh ('entry', 'exit', 'general')
 * @param {string} [props.placeholder] - Hình ảnh đại diện khi đang tải
 * @param {string} [props.fallbackSrc] - Hình ảnh hiển thị khi lỗi
 * @param {string} [props.loading] - Chiến lược tải ('eager' hoặc 'lazy')
 * @param {boolean} [props.priority] - Ưu tiên tải
 * @param {string} [props.className] - CSS classes cho hình ảnh
 * @param {string} [props.containerClassName] - CSS classes cho container
 * @param {Function} [props.onClick] - Hàm xử lý khi click vào hình ảnh
 */
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  aspectRatio = '16/9',
  tradeId,
  imageType,
  placeholder = '/icons/blank-chart.svg',
  fallbackSrc = '/icons/image-not-supported.svg',
  loading = 'lazy',
  priority = false,
  className,
  containerClassName,
  onClick
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [finalSrc, setFinalSrc] = useState(src);
  const imgRef = useRef<HTMLImageElement>(null);
  const hasTriedFallback = useRef(false);

  // Tạo style cho aspect ratio và đảm bảo kích thước cố định
  const containerStyle = useMemo(() => {
    const style: React.CSSProperties = {};
    
    if (aspectRatio) {
      style.aspectRatio = aspectRatio;
    }
    
    if (width) {
      style.width = `${width}px`;
    }
    
    if (height) {
      style.height = `${height}px`;
    }
    
    return style;
  }, [aspectRatio, width, height]);

  // Xử lý khi src thay đổi
  useEffect(() => {
    if (src !== finalSrc && !isError) {
      setIsLoaded(false);
      setFinalSrc(src);
      hasTriedFallback.current = false;
    }
  }, [src, finalSrc, isError]);

  // Xử lý khi hình ảnh tải xong
  const handleLoad = () => {
    setIsLoaded(true);
    setIsError(false);
  };

  // Xử lý khi hình ảnh gặp lỗi
  const handleError = () => {
    if (!hasTriedFallback.current && finalSrc !== fallbackSrc) {
      console.error(`Lỗi khi tải ảnh: ${finalSrc}`);
      setIsError(true);
      setFinalSrc(fallbackSrc);
      hasTriedFallback.current = true;
    }
  };

  return (
    <div 
      className={cn(
        "relative overflow-hidden bg-transparent", /* Nền trong suốt để tránh viền đen */
        containerClassName
      )}
      style={containerStyle}
      onClick={onClick}
    >
      {/* Placeholder và loading indicator */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-transparent">
          {placeholder ? (
            <img 
              src={placeholder} 
              alt="Loading" 
              className="w-full h-full object-cover opacity-50"
              style={{ borderRadius: 'inherit' }} /* Kế thừa bo góc từ container cha */
            />
          ) : (
            <Icons.ui.spinner className="h-8 w-8 animate-spin text-muted-foreground/70" />
          )}
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-transparent">
          <Icons.ui.error className="h-8 w-8 text-destructive/70 mb-2" />
          <p className="text-xs text-muted-foreground">Không thể tải hình ảnh</p>
        </div>
      )}

      {/* Actual image */}
      <img
        ref={imgRef}
        src={finalSrc}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        className={cn(
          "w-full h-full object-cover transition-opacity duration-300",
          isLoaded ? "opacity-100" : "opacity-0",
          className
        )}
        style={{ borderRadius: 'inherit' }} /* Kế thừa bo góc từ container cha */
        onLoad={handleLoad}
        onError={handleError}
        data-trade-id={tradeId}
        data-image-type={imageType}
      />
    </div>
  );
};

export default OptimizedImage;