/**
 * Hook để tải và hiển thị ảnh từ cache hoặc từ nguồn
 * 
 * Hook này cho phép:
 * - Tự động tải ảnh từ cache nếu có
 * - Tự động tải từ nguồn và lưu cache nếu chưa có
 * - Hiển thị placeholder trong khi đang tải
 * - Xử lý lỗi khi tải ảnh
 */

import { useState, useEffect } from 'react';
import { imageCacheService } from '@/lib/image-cache-service';

export interface UseCachedImageOptions {
  tradeId: string;
  imageType: string;
  expiry?: number;
  forceRefresh?: boolean;
  placeholder?: string;
}

export interface UseCachedImageResult {
  imageUrl: string | null;
  isLoading: boolean;
  error: Error | null;
  reload: () => void;
}

/**
 * Hook để lấy và quản lý ảnh từ cache
 */
export function useCachedImage(
  originalUrl: string | null | undefined,
  options: UseCachedImageOptions
): UseCachedImageResult {
  const [imageUrl, setImageUrl] = useState<string | null>(null); // Không hiển thị placeholder ngay lập tức
  const [isLoading, setIsLoading] = useState(true); // Bắt đầu với trạng thái loading
  const [error, setError] = useState<Error | null>(null);
  const [reloadCounter, setReloadCounter] = useState(0);
  const [hasAttempted, setHasAttempted] = useState(false);
  const [hasPreloadedImage, setHasPreloadedImage] = useState(false);

  useEffect(() => {
    // Kiểm tra XSS trong URL - bảo mật
    const isSafeUrl = (url: string) => {
      return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:') || url.startsWith('data:');
    };
    
    // Reset state khi URL thay đổi
    setError(null);
    setHasAttempted(false);
    setHasPreloadedImage(false);

    // Nếu không có URL, sử dụng placeholder và dừng loading ngay lập tức
    if (!originalUrl) {
      setImageUrl(options.placeholder || null);
      setIsLoading(false);
      return;
    }
    
    // Không set loading state ngay lập tức, chờ kiểm tra cache trước
    setIsLoading(true);
    
    // Kiểm tra nếu chúng ta đã có URL này trong bộ nhớ cache trình duyệt
    const checkInBrowserCache = async (url: string) => {
      // Kiểm tra caches API
      if ('caches' in window) {
        try {
          const cache = await window.caches.open('image-cache');
          const response = await cache.match(url);
          return response !== undefined;
        } catch (e) {
          // Ignore cache API errors, just continue loading
          return false;
        }
      }
      return false;
    };
    
    // Hàm preload ảnh trước khi hiển thị
    const preloadImage = (url: string): Promise<boolean> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          setHasPreloadedImage(true);
          resolve(true);
        };
        img.onerror = () => resolve(false);
        img.src = url;
      });
    };
    
    async function loadImage() {
      try {
        setError(null);

        if (typeof originalUrl !== 'string') {
          throw new Error('Invalid URL');
        }
        
        // Kiểm tra bảo mật URL
        if (!isSafeUrl(originalUrl)) {
          throw new Error('Unsafe URL scheme detected');
        }

        // Kiểm tra cache trước tiên - đây là phần quan trọng nhất
        const isInBrowserCache = await checkInBrowserCache(originalUrl);
        
        // Nếu đã có trong cache, sử dụng ngay lập tức
        if (isInBrowserCache && !options.forceRefresh) {
          setImageUrl(originalUrl);
          // Chờ preload ảnh trước khi tắt loading
          const preloaded = await preloadImage(originalUrl);
          if (preloaded) {
            setIsLoading(false);
            return;
          }
        }
        
        // Bắt đầu tải ảnh từ cache hoặc từ nguồn
        // Không thực hiện kiểm tra trực tiếp để tránh hiển thị lỗi tạm thời
        
        // Sử dụng service để lấy ảnh từ cache hoặc tải từ nguồn
        const cachedUrl = await imageCacheService.getOrFetchImage(originalUrl, {
          tradeId: options.tradeId,
          imageType: options.imageType,
          expiry: options.expiry,
          forceRefresh: options.forceRefresh
        });

        if (cachedUrl) {
          // Preload ảnh trước khi hiển thị
          await preloadImage(cachedUrl);
          setImageUrl(cachedUrl);
          setIsLoading(false);
        } else if (options.placeholder) {
          // Nếu không thể tải từ cache và có placeholder, sử dụng placeholder
          setImageUrl(options.placeholder);
          setIsLoading(false);
        } else {
          // Trường hợp không có cả hai, thử URL gốc
          setImageUrl(originalUrl);
          setIsLoading(false);
        }
      } catch (err) {
        // Log lỗi trong development
        if (process.env.NODE_ENV !== 'production') {
          console.error('Lỗi khi tải ảnh:', err);
        }
        
        setError(err instanceof Error ? err : new Error(String(err)));
        setIsLoading(false);
        
        // Luôn sử dụng placeholder trong trường hợp lỗi để tránh hiển thị lỗi tạm thời
        setImageUrl(options.placeholder || null);
      }
    }

    // Sử dụng setTimeout để tránh blocking UI, nhưng đặt độ ưu tiên cao hơn
    const timeoutId = setTimeout(loadImage, 5);

    // Cleanup function để revoke objectURL khi component unmount hoặc URL thay đổi
    return () => {
      clearTimeout(timeoutId);
      if (imageUrl && typeof imageUrl === 'string' && imageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [originalUrl, options.forceRefresh, reloadCounter, options.tradeId, options.imageType, options.expiry, options.placeholder]);

  // Function để tải lại ảnh
  const reload = () => {
    setReloadCounter(prev => prev + 1);
  };

  return { imageUrl, isLoading, error, reload };
}

export default useCachedImage;