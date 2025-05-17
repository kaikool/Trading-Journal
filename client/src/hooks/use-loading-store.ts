import { create } from 'zustand';

// Định nghĩa các cấp độ loading
export enum LoadingLevel {
  COMPONENT = 'component', // Component nhỏ (card, form field...)
  PAGE = 'page',          // Page hoặc tab lớn
  APP = 'app'             // Toàn bộ app hoặc lúc khởi động
}

// Type cho state của loading store
type LoadingState = {
  // Danh sách ID đang loading theo từng cấp độ
  loadingIds: Record<LoadingLevel, Set<string>>;
  
  // Progress hiện tại (0-100) cho progress bar
  progress: number;
  
  // Getters
  isLoading: (id?: string, level?: LoadingLevel) => boolean;
  isComponentLoading: (id?: string) => boolean;
  isPageLoading: (id?: string) => boolean;
  isAppLoading: () => boolean;
  
  // Setters
  startLoading: (id: string, level: LoadingLevel) => void;
  stopLoading: (id: string, level: LoadingLevel) => void;
  setProgress: (value: number) => void;
  incrementProgress: (amount?: number) => void;
};

// Tạo store với Zustand
export const useLoadingStore = create<LoadingState>((set, get) => ({
  // State ban đầu
  loadingIds: {
    [LoadingLevel.COMPONENT]: new Set<string>(),
    [LoadingLevel.PAGE]: new Set<string>(),
    [LoadingLevel.APP]: new Set<string>()
  },
  progress: 0,
  
  // Kiểm tra trạng thái loading ở một cấp độ cụ thể
  isLoading: (id?: string, level?: LoadingLevel) => {
    const { loadingIds } = get();
    
    if (!level) {
      // Kiểm tra có bất kỳ loading nào ở bất kỳ cấp độ nào
      return (
        loadingIds[LoadingLevel.COMPONENT].size > 0 ||
        loadingIds[LoadingLevel.PAGE].size > 0 ||
        loadingIds[LoadingLevel.APP].size > 0
      );
    }
    
    if (id) {
      // Kiểm tra ID cụ thể có đang loading không
      return loadingIds[level].has(id);
    }
    
    // Kiểm tra có bất kỳ loading nào ở cấp độ cụ thể
    return loadingIds[level].size > 0;
  },
  
  // Các helper functions cho từng cấp độ
  isComponentLoading: (id?: string) => get().isLoading(id, LoadingLevel.COMPONENT),
  isPageLoading: (id?: string) => get().isLoading(id, LoadingLevel.PAGE),
  isAppLoading: () => get().isLoading(undefined, LoadingLevel.APP),
  
  // Thêm một ID vào danh sách đang loading
  startLoading: (id: string, level: LoadingLevel) => {
    set(state => {
      const newLoadingIds = { ...state.loadingIds };
      const newSet = new Set(newLoadingIds[level]);
      newSet.add(id);
      newLoadingIds[level] = newSet;
      
      // Đối với page và app loading, reset progress
      if (level === LoadingLevel.PAGE || level === LoadingLevel.APP) {
        return { loadingIds: newLoadingIds, progress: 0 };
      }
      
      return { loadingIds: newLoadingIds };
    });
  },
  
  // Xóa một ID khỏi danh sách đang loading
  stopLoading: (id: string, level: LoadingLevel) => {
    set(state => {
      const newLoadingIds = { ...state.loadingIds };
      const newSet = new Set(newLoadingIds[level]);
      newSet.delete(id);
      newLoadingIds[level] = newSet;
      
      // Đối với page và app loading, set progress = 100 khi hoàn thành
      if (level === LoadingLevel.PAGE || level === LoadingLevel.APP) {
        return { loadingIds: newLoadingIds, progress: 100 };
      }
      
      return { loadingIds: newLoadingIds };
    });
  },
  
  // Đặt giá trị progress cụ thể
  setProgress: (value: number) => {
    // Đảm bảo giá trị nằm trong khoảng 0-100
    const clampedValue = Math.max(0, Math.min(100, value));
    set({ progress: clampedValue });
  },
  
  // Tăng progress theo một lượng nhất định
  incrementProgress: (amount = 10) => {
    set(state => {
      const newProgress = Math.min(100, state.progress + amount);
      return { progress: newProgress };
    });
  }
}));