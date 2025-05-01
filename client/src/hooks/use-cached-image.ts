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
  const [imageUrl, setImageUrl] = useState<string | null>(options.placeholder || null);
  const [isLoading, setIsLoading] = useState(!!originalUrl);
  const [error, setError] = useState<Error | null>(null);
  const [reloadCounter, setReloadCounter] = useState(0);
  const [hasAttempted, setHasAttempted] = useState(false);

  useEffect(() => {
    // Kiểm tra XSS trong URL - bảo mật
    const isSafeUrl = (url: string) => {
      return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:') || url.startsWith('data:');
    };
    
    // Quyết định xem có cần đặt loading state hay không
    let shouldSetLoading = true;
    
    // Reset state khi URL thay đổi
    setError(null);
    setHasAttempted(false);

    // Nếu không có URL, không làm gì cả
    if (!originalUrl) {
      setImageUrl(options.placeholder || null);
      setIsLoading(false);
      return;
    }
    
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
    
    // Tối ưu loading
    const attemptLoadFromCache = async () => {
      if (typeof originalUrl === 'string') {
        // Đánh dấu đã thử tải ảnh
        setHasAttempted(true);
        
        // Kiểm tra xem URL có trong cache của browser không
        const isInBrowserCache = await checkInBrowserCache(originalUrl);
        
        if (isInBrowserCache && !options.forceRefresh) {
          // Không cần set loading nếu có trong cache browser
          shouldSetLoading = false;
        }
      }
      
      if (shouldSetLoading) {
        setIsLoading(true);
      }
    };
    
    attemptLoadFromCache();

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

        // Cố gắng tải hình ảnh trực tiếp để kiểm tra trước
        try {
          // Tạo promise với timeout
          const imageLoadPromise = new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(true);
            img.onerror = () => reject(new Error('Failed to load image directly'));
            img.src = originalUrl;
          });
          
          // Set timeout 5 giây để tránh chờ quá lâu
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Image load timeout')), 5000);
          });
          
          // Thử tải hình ảnh với timeout
          await Promise.race([imageLoadPromise, timeoutPromise]);
        } catch (directLoadErr) {
          // Lỗi tải trực tiếp được ghi nhận nhưng chúng ta vẫn tiếp tục với cache
          console.warn('Cannot load image directly, trying cache:', directLoadErr);
        }

        // Sử dụng service để lấy ảnh từ cache hoặc tải từ nguồn
        const cachedUrl = await imageCacheService.getOrFetchImage(originalUrl, {
          tradeId: options.tradeId,
          imageType: options.imageType,
          expiry: options.expiry,
          forceRefresh: options.forceRefresh
        });

        if (cachedUrl) {
          setImageUrl(cachedUrl);
          setIsLoading(false);
        } else {
          // Nếu không lấy được từ cache, trở về URL gốc
          setImageUrl(originalUrl);
          setIsLoading(false);
        }
      } catch (err) {
        // Sử dụng biến boolean để kiểm soát log trong production
        if (process.env.NODE_ENV !== 'production') {
          console.error('Lỗi khi tải ảnh:', err);
        }
        
        setError(err instanceof Error ? err : new Error(String(err)));
        setIsLoading(false);
        
        // Giữ placeholder hoặc trả về URL gốc trong trường hợp lỗi
        if (options.placeholder) {
          setImageUrl(options.placeholder);
        } else if (originalUrl && typeof originalUrl === 'string' && isSafeUrl(originalUrl)) {
          // Trong trường hợp lỗi, vẫn thử dùng URL gốc
          setImageUrl(originalUrl);
        } else {
          setImageUrl(null);
        }
      }
    }

    // Đặt timeout ngắn để đảm bảo UI không bị block
    const timeoutId = setTimeout(loadImage, 10);

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