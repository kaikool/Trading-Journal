import { useEffect } from 'react';
import { useLoading, LoadingLevel } from '@/contexts/LoadingContext';

/**
 * Hook để quản lý trạng thái loading trong các component
 * 
 * @param id - ID dùng để định danh trạng thái loading
 * @param isLoading - Trạng thái loading hiện tại 
 * @param level - Cấp độ loading (component, page hoặc app)
 * @param deps - Các dependencies sẽ trigger cập nhật trạng thái loading
 */
export function useLoadingEffect(
  id: string,
  isLoading: boolean,
  level: LoadingLevel = LoadingLevel.COMPONENT,
  deps: any[] = []
) {
  const { startLoading, stopLoading } = useLoading();
  
  useEffect(() => {
    if (isLoading) {
      startLoading(id, level);
    } else {
      stopLoading(id, level);
    }
    
    return () => {
      stopLoading(id, level);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isLoading, level, startLoading, stopLoading, ...deps]);
}

/**
 * Hook để xử lý trạng thái loading từ React Query 
 * 
 * @param id - ID dùng để định danh trạng thái loading
 * @param isQueryLoading - Trạng thái loading từ React Query (isLoading hoặc isFetching)
 * @param level - Cấp độ loading (component, page hoặc app)
 */
export function useQueryLoadingEffect(
  id: string,
  isQueryLoading: boolean,
  level: LoadingLevel = LoadingLevel.COMPONENT
) {
  useLoadingEffect(id, isQueryLoading, level);
}