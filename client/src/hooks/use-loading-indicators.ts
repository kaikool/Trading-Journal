import { useEffect } from 'react';
import { useLoadingStore, LoadingLevel } from './use-loading-store';

/**
 * Hook để quản lý trạng thái loading cho React Query
 * Tự động kích hoạt loading state dựa trên trạng thái của React Query
 * 
 * @param id - ID dùng để định danh trạng thái loading
 * @param isLoading - Trạng thái isLoading từ React Query
 * @param level - Cấp độ loading (mặc định: component)
 */
export function useLoadingIndicators(
  id: string,
  isLoading: boolean,
  level: LoadingLevel = LoadingLevel.COMPONENT
) {
  const startLoading = useLoadingStore(state => state.startLoading);
  const stopLoading = useLoadingStore(state => state.stopLoading);
  const incrementProgress = useLoadingStore(state => state.incrementProgress);
  
  // Theo dõi trạng thái loading và cập nhật loading store
  useEffect(() => {
    if (isLoading) {
      // Bắt đầu loading và thiết lập progress ban đầu
      startLoading(id, level);
      
      // Giả lập tiến trình tải - tăng dần progress mỗi 100ms
      const interval = setInterval(() => {
        incrementProgress(3); // Tăng thêm 3% mỗi lần
      }, 100);
      
      return () => {
        clearInterval(interval);
        stopLoading(id, level);
      };
    } else {
      // Dừng loading khi đã hoàn thành
      stopLoading(id, level);
    }
  }, [id, isLoading, level, startLoading, stopLoading, incrementProgress]);
}

/**
 * Hook để sử dụng cho các page - quản lý loading cấp trang
 * 
 * @param id - ID dùng để định danh trạng thái loading
 * @param isLoading - Trạng thái loading
 */
export function usePageLoadingIndicator(id: string, isLoading: boolean) {
  useLoadingIndicators(id, isLoading, LoadingLevel.PAGE);
}

/**
 * Hook để sử dụng cho các component - quản lý loading cấp component
 * 
 * @param id - ID dùng để định danh trạng thái loading
 * @param isLoading - Trạng thái loading
 */
export function useComponentLoadingIndicator(id: string, isLoading: boolean) {
  useLoadingIndicators(id, isLoading, LoadingLevel.COMPONENT);
}