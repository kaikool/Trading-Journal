/**
 * use-cached-image.ts
 * 
 * React hook tối ưu hiệu suất cho việc sử dụng image-cache-service với React components
 * 
 * Mục tiêu:
 * - Cung cấp cách dễ dàng để tải và hiển thị hình ảnh từ Firebase Storage
 * - Tự động quản lý trạng thái tải, lỗi và caching
 * - Giảm tải lượng dữ liệu và thời gian tải bằng cách sử dụng bộ nhớ đệm
 * - Hỗ trợ advanced features như prefetching, retry logic
 * 
 * Sử dụng:
 * ```tsx
 * const { url, isLoading, error } = useCachedImage('path/to/image.jpg');
 * 
 * return (
 *   <div>
 *     {isLoading && <Spinner />}
 *     {error && <ErrorMessage error={error} />}
 *     {url && <img src={url} alt="Cached image" />}
 *   </div>
 * );
 * ```
 */

import { useState, useEffect, useCallback } from 'react';
import { getCachedImageUrl, invalidateImageCache } from '@/lib/image-cache-service';
import { logError } from '@/lib/debug';

interface UseCachedImageOptions {
  bypassCache?: boolean;     // Bỏ qua cache và tải trực tiếp từ Firebase
  forceRefresh?: boolean;    // Làm mới cache cho hình ảnh này
  retry?: boolean;           // Thử lại nếu gặp lỗi
  retryCount?: number;       // Số lần thử lại tối đa (mặc định: 2)
  retryDelay?: number;       // Thời gian chờ giữa các lần thử lại (ms) (mặc định: 1000)
  placeholder?: string;      // URL ảnh giữ chỗ khi đang tải
  fetchOnMount?: boolean;    // Tự động tải khi component được mount (mặc định: true)
  tradeId?: string;          // ID của giao dịch (được sử dụng trong component LazyTradeHistoryCard)
  imageType?: string;        // Loại hình ảnh (entryM15, exitM15, entryH4, exitH4, ...)
}

interface UseCachedImageResult {
  url: string | null;           // URL hình ảnh sau khi tải thành công
  imageUrl: string | null;      // Alias của url để tương thích với các component cũ
  isLoading: boolean;          // Trạng thái tải
  error: Error | null;         // Lỗi nếu có
  invalidate: () => void;      // Hàm để làm mới cache cho hình ảnh này
  refetch: () => Promise<void>;// Hàm để tải lại hình ảnh
}

/**
 * Hook để tải và quản lý hình ảnh sử dụng cache hai lớp
 * 
 * @param path Đường dẫn Firebase Storage hoặc URL của hình ảnh
 * @param options Tùy chọn cấu hình
 * @returns Kết quả bao gồm URL, trạng thái tải và các hàm tiện ích
 */
export function useCachedImage(
  path: string | null | undefined,
  options: UseCachedImageOptions = {}
): UseCachedImageResult {
  // Giá trị mặc định cho các tùy chọn
  const {
    bypassCache = false,
    forceRefresh = false,
    retry = true,
    retryCount = 2,
    retryDelay = 1000,
    placeholder = '',
    fetchOnMount = true
  } = options;

  // State
  const [url, setUrl] = useState<string | null>(placeholder || null);
  const [isLoading, setIsLoading] = useState<boolean>(!!path && fetchOnMount);
  const [error, setError] = useState<Error | null>(null);
  const [retries, setRetries] = useState<number>(0);

  // Hàm để làm mới cache cho hình ảnh này
  const invalidate = useCallback(() => {
    if (path) {
      invalidateImageCache(path);
      setUrl(placeholder || null);
    }
  }, [path, placeholder]);

  // Hàm để tải hình ảnh
  const fetchImage = useCallback(async (): Promise<void> => {
    // Nếu không có path, không thực hiện gì cả
    if (!path) {
      setIsLoading(false);
      setUrl(null);
      setError(null);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Tải URL từ cache hoặc Firebase
      const imageUrl = await getCachedImageUrl(path, {
        bypassCache,
        forceRefresh
      });

      // Cập nhật state với URL mới
      setUrl(imageUrl);
      setIsLoading(false);
      // Reset retries nếu thành công
      setRetries(0);
    } catch (err) {
      setIsLoading(false);
      
      const typedError = err instanceof Error ? err : new Error(String(err));
      setError(typedError);
      logError(`Error loading image from path ${path}:`, typedError);

      // Xử lý thử lại nếu được bật
      if (retry && retries < retryCount) {
        // Thử lại sau một khoảng thời gian
        setTimeout(() => {
          setRetries(prev => prev + 1);
          fetchImage();
        }, retryDelay);
      }
    }
  }, [path, bypassCache, forceRefresh, retry, retryCount, retryDelay, retries]);

  // Effect để tải hình ảnh khi path thay đổi hoặc component mount
  useEffect(() => {
    // Reset state khi path thay đổi
    setRetries(0);
    
    // Chỉ tải nếu có path và fetchOnMount được bật
    if (path && fetchOnMount) {
      fetchImage();
    } else if (!path) {
      // Nếu không có path, đặt lại state
      setUrl(placeholder || null);
      setIsLoading(false);
      setError(null);
    }
  }, [path, fetchOnMount, placeholder]);

  return {
    url,
    imageUrl: url, // Thêm alias imageUrl để tương thích với component cũ
    isLoading,
    error,
    invalidate,
    refetch: fetchImage
  };
}

// This default export is used in multiple components (ChartImageDialog, LazyTradeHistoryCard)
// ts-prune may incorrectly flag this as unused when named imports are used
export default useCachedImage;