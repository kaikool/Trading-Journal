import { useState, useEffect, useCallback, useRef } from "react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import * as firebase from "@/lib/firebase";
import { TradeFilterOptions, Trade } from "@/types";
import { Timestamp } from "firebase/firestore";
import { tradeUpdateService, TradeChangeObserver } from "@/services/trade-update-service";
import { debug, logError } from "@/lib/debug";
import { getTimeStamp } from "@/utils/timestamp";

/**
 * Hook tùy chỉnh để lấy và xử lý danh sách giao dịch theo trang
 * 
 * @param options Các tùy chọn lọc và phân trang
 * @returns Dữ liệu giao dịch đã phân trang và các hàm điều khiển
 */
export function usePaginatedTrades(options: {
  pageSize?: number;
  sortOption?: string;
  filters?: TradeFilterOptions;
  enableRealtime?: boolean;
}) {
  const {
    pageSize = 10,
    sortOption = 'newest',
    filters = {},
    enableRealtime = true
  } = options;

  const userId = firebase.auth.currentUser?.uid;
  const queryClient = useQueryClient();
  
  // State cho dữ liệu và phân trang
  const [trades, setTrades] = useState<Trade[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasNextPage, setHasNextPage] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Tạo query key bao gồm tất cả tham số
  const queryKey = ['paginatedTrades', userId, sortOption, pageSize, currentPage, JSON.stringify(filters)];
  
  // Lấy dữ liệu phân trang từ Firebase
  const fetchPaginatedTrades = useCallback(async () => {
    if (!userId) return { trades: [], lastDoc: null, totalCount: 0, hasMore: false };
    
    debug(`[PaginatedTrades] Fetching page ${currentPage}, pageSize=${pageSize}, sort=${sortOption}`);
    
    try {
      // Lấy dữ liệu phân trang từ Firebase
      const result = await firebase.getPaginatedTrades(
        userId,
        pageSize,
        currentPage === 1 ? null : lastDoc,
        sortOption,
        filters
      );
      
      debug(`[PaginatedTrades] Fetched ${result.trades.length} trades, total=${result.totalCount}`);
      
      // Trả về kết quả chuẩn
      const hasMorePages = result.trades.length === pageSize;
      return {
        trades: result.trades as Trade[],
        lastDoc: result.lastDoc,
        totalCount: result.totalCount,
        hasMore: hasMorePages
      };
    } catch (error) {
      logError('[PaginatedTrades] Error fetching paginated trades:', error);
      throw error;
    }
  }, [userId, pageSize, currentPage, lastDoc, sortOption, filters]);
  
  // Sử dụng React Query
  const { 
    data, 
    isFetching: isQueryFetching,
    isError: isQueryError,
    error: queryError,
    refetch
  } = useQuery({
    queryKey,
    queryFn: fetchPaginatedTrades,
    staleTime: 5 * 60 * 1000, // 5 phút
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false
  });
  
  // Cập nhật state khi có dữ liệu mới
  useEffect(() => {
    if (data) {
      setTrades(data.trades);
      setLastDoc(data.lastDoc);
      setTotalCount(data.totalCount);
      setHasNextPage(data.hasMore);
    }
    
    setIsLoading(isQueryFetching);
    
    if (isQueryError && queryError) {
      setError(queryError as Error);
    } else {
      setError(null);
    }
  }, [data, isQueryFetching, isQueryError, queryError]);
  
  // Đăng ký với TradeUpdateService để nhận thông báo khi có thay đổi
  useEffect(() => {
    if (!userId || !enableRealtime) return;
    
    debug("[PaginatedTrades] Registering with TradeUpdateService");
    
    // Tạo observer để nhận thông báo khi có thay đổi
    const observer: TradeChangeObserver = {
      onTradesChanged: (action, tradeId) => {
        debug(`[PaginatedTrades] Trade changed (${action}, ID: ${tradeId || 'unknown'}), refreshing data`);
        
        // Không cần phải invalidate vì tradeUpdateService đã làm việc này
        // Chỉ cần refetch để lấy dữ liệu mới
        refetch();
      }
    };
    
    // Đăng ký observer với TradeUpdateService
    const unregister = tradeUpdateService.registerObserver(observer);
    
    // Không còn sử dụng Firebase listener nữa, chỉ dùng TradeUpdateService
    
    return () => {
      debug("[PaginatedTrades] Unregistering from TradeUpdateService");
      unregister();
    };
  }, [userId, enableRealtime, refetch]);
  
  // Hàm chuyển trang
  const goToPage = useCallback((page: number) => {
    if (page < 1) page = 1;
    setCurrentPage(page);
  }, []);
  
  // Trang trước
  const goToPreviousPage = useCallback(() => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  }, []);
  
  // Trang sau
  const goToNextPage = useCallback(() => {
    if (hasNextPage) {
      setCurrentPage(prev => prev + 1);
    }
  }, [hasNextPage]);
  
  // Tính tổng số trang
  const totalPages = Math.ceil(totalCount / pageSize);
  
  // Public API
  return {
    // Dữ liệu
    trades,
    totalCount,
    currentPage,
    totalPages,
    hasNextPage,
    
    // Điều khiển phân trang
    goToPage,
    goToPreviousPage,
    goToNextPage,
    
    // Trạng thái
    isLoading,
    isError: !!error,
    error,
    
    // Thủ công
    refetch
  };
}