import { useState, useEffect, useCallback, useRef } from "react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import * as firebase from "@/lib/firebase";
import { TradeFilterOptions, Trade } from "@/types";
import { CurrencyPair, Direction, TradeResult } from "@/lib/forex-calculator";
import { Timestamp } from "firebase/firestore";
import { firebaseListenerService } from "@/services/firebase-listener-service";
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
      return {
        trades: result.trades as Trade[],
        lastDoc: result.lastDoc,
        totalCount: result.totalCount,
        hasMore: result.hasMore
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
    
    // Vẫn giữ lại Firebase listener cho backward compatibility
    const firebaseUnsubscribe = firebaseListenerService.onTradesSnapshot(
      userId,
      {
        callback: () => {
          // Không cần làm gì ở đây, TradeUpdateService sẽ xử lý thông báo
        },
        errorCallback: (error) => {
          logError("[PaginatedTrades] Error in Firebase snapshot:", error);
        }
      }
    );
    
    return () => {
      debug("[PaginatedTrades] Unregistering from TradeUpdateService");
      unregister();
      firebaseUnsubscribe();
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

    
    // Kiểm tra xem các trades có thông tin profitLoss không
    if (sortBy === "profit" || sortBy === "loss") {
      const tradesWithProfit = result.filter(t => t.profitLoss !== undefined);
      console.log("Trades with profit/loss info:", tradesWithProfit.length, "out of", result.length);
    }
    
    // Logic sắp xếp
    switch (sortBy) {
      case "newest":
        console.log("Sorting by newest first");
        result.sort((a, b) => {
          // Sort by isOpen first (open trades have priority)
          if (a.isOpen && !b.isOpen) return -1;
          if (!a.isOpen && b.isOpen) return 1;
          
          // Then sort by date (newest first)
          const dateA = getTimestamp(a.closeDate || a.createdAt);
          const dateB = getTimestamp(b.closeDate || b.createdAt);
          
          return dateB - dateA; // Mới nhất lên đầu
        });
        break;
      
      case "oldest":
        console.log("Sorting by oldest first");
        result.sort((a, b) => {
          // Sort by isOpen first (open trades have priority)
          if (a.isOpen && !b.isOpen) return -1;
          if (!a.isOpen && b.isOpen) return 1;
          
          // Then sort by date (oldest first)
          const dateA = getTimestamp(a.closeDate || a.createdAt);
          const dateB = getTimestamp(b.closeDate || b.createdAt);
          
          return dateA - dateB; // Cũ nhất lên đầu
        });
        break;
        
      case "profit":
        console.log("Sorting by highest profit first");
        // Lọc những trade có profitLoss và phân nhóm 
        const openTradesProfit = result.filter(trade => trade.isOpen);
        console.log("Open trades (always shown first):", openTradesProfit.length);
        
        const closedTradesProfit = result
          .filter(trade => !trade.isOpen && trade.profitLoss !== undefined)
          .sort((a, b) => (b.profitLoss || 0) - (a.profitLoss || 0));
        console.log("Closed trades sorted by profit:", closedTradesProfit.length);
        
        // Log the top 3 trades with highest profit for verification
        if (closedTradesProfit.length > 0) {
          console.log("Top 3 trades by profit:", 
            closedTradesProfit.slice(0, Math.min(3, closedTradesProfit.length))
            .map(t => ({ id: t.id, profit: t.profitLoss }))
          );
        }
        
        // Nối mảng: giao dịch mở trước, sau đó giao dịch đóng được sắp xếp
        result = [...openTradesProfit, ...closedTradesProfit];
        break;
        
      case "loss":
        console.log("Sorting by highest loss first");
        // Lọc những trade có profitLoss và phân nhóm
        const openTradesLoss = result.filter(trade => trade.isOpen);
        console.log("Open trades (always shown first):", openTradesLoss.length);
        
        const closedTradesLoss = result
          .filter(trade => !trade.isOpen && trade.profitLoss !== undefined)
          .sort((a, b) => (a.profitLoss || 0) - (b.profitLoss || 0));
        console.log("Closed trades sorted by loss:", closedTradesLoss.length);
        
        // Log the top 3 trades with highest loss for verification
        if (closedTradesLoss.length > 0) {
          console.log("Top 3 trades by loss:", 
            closedTradesLoss.slice(0, Math.min(3, closedTradesLoss.length))
            .map(t => ({ id: t.id, profit: t.profitLoss }))
          );
        }
        
        // Nối mảng: giao dịch mở trước, sau đó giao dịch đóng được sắp xếp
        result = [...openTradesLoss, ...closedTradesLoss];
        break;
      
      default:
        // Mặc định cũng sắp xếp như newest
        result.sort((a, b) => {
          // Sort by isOpen first (open trades have priority)
          if (a.isOpen && !b.isOpen) return -1;
          if (!a.isOpen && b.isOpen) return 1;
          
          // Then sort by date (newest first)
          const dateA = getTimestamp(a.closeDate || a.createdAt);
          const dateB = getTimestamp(b.closeDate || b.createdAt);
          
          return dateB - dateA; // Mới nhất lên đầu
        });
    }
    
    return result;
  }, [filters, sortBy]);
  
  // Áp dụng filter và lấy trades cho trang hiện tại
  const filteredTrades = applyFilters(data?.trades || []);
  
  // Nếu không có sortBy nào được chỉ định, sử dụng "newest" như mặc định
  if (!sortBy) {
    console.log("No sort option specified, using default 'newest'");
    setSortBy("newest");
  }
  
  // Theo dõi sự thay đổi của initialFilters và cập nhật filters
  useEffect(() => {
    // Use try-catch to handle potential circular references in JSON
    let currentFiltersJson = '{}';
    let previousFiltersJson = '{}';
    
    try {
      currentFiltersJson = JSON.stringify(initialFilters);
    } catch (err) {
      console.error('Error stringifying current filters:', err);
    }
    
    try {
      previousFiltersJson = JSON.stringify(initialFiltersRef.current);
    } catch (err) {
      console.error('Error stringifying previous filters:', err);
    }
    
    // Nếu initialFilters thay đổi, cập nhật filters
    if (currentFiltersJson !== previousFiltersJson) {
      console.log("Initial filters changed: ", initialFilters);
      initialFiltersRef.current = initialFilters;
      setFilters(initialFilters);
    }
  }, [initialFilters]);
  
  return {
    data: {
      trades: filteredTrades,
      totalCount: filteredTrades.length
    },
    isLoading,
    isError,
    error,
    isFetching,
    
    // Filter và Sort
    filters,
    setFilters,
    sortBy,
    setSortBy,
    
    // Hàm tiện ích
    refetch
  };
}