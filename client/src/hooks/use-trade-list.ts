import { useState, useEffect, useCallback, useRef } from "react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import * as firebase from "@/lib/firebase";
import { TradeFilterOptions, Trade } from "@/types";
import { CurrencyPair, Direction, TradeResult } from "@/lib/forex-calculator";
import { Timestamp } from "firebase/firestore";
import { useDataCache } from "@/contexts/DataCacheContext";
import { debug, logError } from "@/lib/debug";

/**
 * Hook tùy chỉnh để lấy và xử lý danh sách tất cả giao dịch
 * 
 * @param options Các tùy chọn lọc và sắp xếp
 * @returns Tất cả dữ liệu giao dịch đã được sắp xếp và lọc
 */
export function useTradeList(options: {
  initialFilters?: TradeFilterOptions;
  initialSortBy?: "newest" | "oldest" | "profit" | "loss";
  enableRealtime?: boolean;
}) {
  const {
    initialFilters = {},
    initialSortBy = "newest",
    enableRealtime = true
  } = options;

  const userId = firebase.auth.currentUser?.uid;
  const queryClient = useQueryClient();
  
  // State cho lọc và sắp xếp
  const initialFiltersRef = useRef(initialFilters);
  const [filters, setFilters] = useState<TradeFilterOptions>(initialFilters);
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "profit" | "loss">(initialSortBy);
  
  // Effect để cập nhật sortBy khi initialSortBy thay đổi
  useEffect(() => {
    if (initialSortBy !== sortBy) {
      debug("useTradeList: Updating sortBy from initialSortBy:", initialSortBy);
      setSortBy(initialSortBy);
      
      // Khi thay đổi sắp xếp, vô hiệu hóa tất cả các truy vấn liên quan để buộc refetch
      queryClient.invalidateQueries({ queryKey: ['trades', userId] });
    }
  }, [initialSortBy, sortBy, userId, queryClient, setSortBy]);
  
  // Cache kết quả truy vấn để tối ưu
  const allTradesRef = useRef<Trade[]>([]);
  const totalTradesCountRef = useRef<number | null>(null);
  
  // Tạo query key bao gồm tất cả các tham số
  const queryKey = ['trades', userId, sortBy, JSON.stringify(filters)];
  
  // Lấy cache context
  const { trades: cachedTrades } = useDataCache();
  
  // Hàm lấy tất cả dữ liệu từ Firestore hoặc từ cache
  const fetchAllTrades = useCallback(async () => {
    if (!userId) return { trades: [], totalCount: 0 };
    
    debug(`Fetching all trades with sortBy=${sortBy}`);
    
    try {
      // Sử dụng cached trades nếu có
      if (cachedTrades && cachedTrades.length > 0) {
        debug(`Using ${cachedTrades.length} trades from cache`);
        allTradesRef.current = cachedTrades as Trade[];
        totalTradesCountRef.current = cachedTrades.length;
      } else {
        // Fallback to Firebase nếu không có cache
        const allTrades = await firebase.getAllTrades(userId);
        // Ép kiểu để tránh lỗi TypeScript
        allTradesRef.current = allTrades as Trade[];
        totalTradesCountRef.current = allTrades.length;
      }
      
      debug(`Total trades fetched: ${allTradesRef.current.length}`);
    } catch (error) {
      logError("Error fetching all trades:", error);
      throw error;
    }
    
    // Tạo một bản sao để không thay đổi dữ liệu gốc
    const trades = [...allTradesRef.current];
    
    // Thực hiện sắp xếp dựa trên sortBy
    debug(`Sorting all ${trades.length} trades by ${sortBy}`);
    
    // Logic sắp xếp
    const getTimestamp = (date: any): number => {
      if (!date) return 0;
      
      if (typeof date === 'object' && 'toDate' in date && typeof date.toDate === 'function') {
        return date.toDate().getTime();
      }
      
      if (typeof date === 'object' && date && 'seconds' in date && 
          typeof date.seconds === 'number') {
        return new Date(date.seconds * 1000).getTime();
      }
      
      if (date instanceof Date) {
        return date.getTime();
      }
      
      return 0;
    };
    
    // Sắp xếp tất cả các giao dịch dựa trên tiêu chí
    switch (sortBy) {
      case "newest":
        trades.sort((a, b) => {
          // Lệnh mở luôn lên đầu
          if (a.isOpen && !b.isOpen) return -1;
          if (!a.isOpen && b.isOpen) return 1;
          
          // Sau đó là theo thời gian (mới nhất lên đầu)
          const dateA = getTimestamp(a.closeDate || a.entryDate);
          const dateB = getTimestamp(b.closeDate || b.entryDate);
          
          return dateB - dateA;
        });
        break;
        
      case "oldest":
        trades.sort((a, b) => {
          // Lệnh mở luôn lên đầu
          if (a.isOpen && !b.isOpen) return -1;
          if (!a.isOpen && b.isOpen) return 1;
          
          // Sau đó là theo thời gian (cũ nhất lên đầu)
          const dateA = getTimestamp(a.closeDate || a.entryDate);
          const dateB = getTimestamp(b.closeDate || b.entryDate);
          
          return dateA - dateB;
        });
        break;
        
      case "profit":
        // Lọc ra các lệnh mở (luôn ở đầu)
        const openTradesProfit = trades.filter(trade => trade.isOpen);
        debug(`Open trades (shown first): ${openTradesProfit.length}`);
        
        // Lệnh đóng được sắp xếp theo lợi nhuận cao nhất
        const closedTradesProfit = trades
          .filter(trade => !trade.isOpen && trade.profitLoss !== undefined)
          .sort((a, b) => (b.profitLoss || 0) - (a.profitLoss || 0));
        debug(`Closed trades sorted by profit: ${closedTradesProfit.length}`);
        
        // Log kiểm tra các giao dịch lợi nhuận cao nhất
        if (closedTradesProfit.length > 0) {
          debug("Top 3 trades by profit:", 
            closedTradesProfit.slice(0, Math.min(3, closedTradesProfit.length))
            .map(t => ({ id: t.id, profit: t.profitLoss }))
          );
        }
        
        // Kết hợp: lệnh mở trước, sau đó lệnh đóng theo lợi nhuận
        const sortedProfitTrades = [...openTradesProfit, ...closedTradesProfit];
        
        // Gán lại cho mảng gốc
        return {
          trades: sortedProfitTrades,
          totalCount: sortedProfitTrades.length
        };
        
      case "loss":
        // Lọc ra các lệnh mở (luôn ở đầu)
        const openTradesLoss = trades.filter(trade => trade.isOpen);
        debug(`Open trades (shown first): ${openTradesLoss.length}`);
        
        // Lệnh đóng được sắp xếp theo thua lỗ cao nhất
        const closedTradesLoss = trades
          .filter(trade => !trade.isOpen && trade.profitLoss !== undefined)
          .sort((a, b) => (a.profitLoss || 0) - (b.profitLoss || 0));
        debug(`Closed trades sorted by loss: ${closedTradesLoss.length}`);
        
        // Log kiểm tra các giao dịch thua lỗ cao nhất
        if (closedTradesLoss.length > 0) {
          debug("Top 3 trades by loss:", 
            closedTradesLoss.slice(0, Math.min(3, closedTradesLoss.length))
            .map(t => ({ id: t.id, profit: t.profitLoss }))
          );
        }
        
        // Kết hợp: lệnh mở trước, sau đó lệnh đóng theo thua lỗ
        const sortedLossTrades = [...openTradesLoss, ...closedTradesLoss];
        
        // Trả về kết quả
        return {
          trades: sortedLossTrades,
          totalCount: sortedLossTrades.length
        };
        
      default:
        // Mặc định như newest
        trades.sort((a, b) => {
          if (a.isOpen && !b.isOpen) return -1;
          if (!a.isOpen && b.isOpen) return 1;
          
          const dateA = getTimestamp(a.closeDate || a.entryDate);
          const dateB = getTimestamp(b.closeDate || b.entryDate);
          
          return dateB - dateA;
        });
    }
    
    // Trả về toàn bộ dữ liệu đã được sắp xếp
    return {
      trades,
      totalCount: trades.length
    };
  }, [userId, sortBy, cachedTrades, allTradesRef, totalTradesCountRef]);
  
  // Sử dụng react-query để lấy dữ liệu với cấu hình tối ưu
  const { 
    data, 
    isLoading, 
    isError, 
    error, 
    isFetching,
    refetch
  } = useQuery({
    queryKey,
    queryFn: fetchAllTrades,
    staleTime: 10 * 60 * 1000, // Tăng lên 10 phút để giảm refetch không cần thiết
    gcTime: 30 * 60 * 1000,    // Tăng thời gian garbage collection
    refetchOnWindowFocus: false, // Tắt refetch khi focus window
    refetchOnMount: false      // Không refetch khi component mount nếu data vẫn còn hạn
  });
  
  // Nếu bật realtime, thêm listener để cập nhật khi có thay đổi
  useEffect(() => {
    if (!userId || !enableRealtime) return;
    
    const unsubscribe = firebase.onTradesSnapshot(userId, (updatedTrades) => {
      debug("Realtime trades update received:", updatedTrades.length);
      
      // Cập nhật danh sách trades trong cache
      allTradesRef.current = updatedTrades as Trade[];
      totalTradesCountRef.current = updatedTrades.length;
      
      // Cập nhật cache của React Query
      queryClient.invalidateQueries({ queryKey: ['trades', userId] });
      
      // Fetch lại dữ liệu hiện tại nếu có thay đổi
      refetch();
    });
    
    return () => {
      unsubscribe(); // Hủy đăng ký listener khi unmount
    };
  }, [userId, enableRealtime, queryClient, refetch, allTradesRef, totalTradesCountRef]);
  
  // Lọc dữ liệu dựa trên các filter
  const applyFilters = useCallback((trades: any[]) => {
    if (!trades || trades.length === 0) return [];
    
    // Loại bỏ logs thường xuyên để tránh vòng lặp vô tận trong console
    // Chỉ log thông tin cơ bản về số lượng
    if (trades.length > 0 && process.env.NODE_ENV === 'development') {
      debug("Applying sort:", sortBy, "on", trades.length, "trades"); 
    }
    
    let result = [...trades] as Trade[];

    // Logic lọc - giống logic trong TradeHistory.tsx
    if (filters.startDate || filters.endDate) {
      result = result.filter(trade => {
        // Lấy dữ liệu thời gian từ trade theo loại Firebase Timestamp
        let tradeDate: Date;
        
        // Hàm helper để chuyển đổi timestamp khác loại thành Date
        const getDateFromTimestamp = (timestamp: any): Date => {
          if (!timestamp) return new Date();
          
          if (typeof timestamp === 'object' && 'toDate' in timestamp && typeof timestamp.toDate === 'function') {
            return timestamp.toDate();
          }
          
          if (typeof timestamp === 'object' && timestamp && 'seconds' in timestamp && 
              typeof timestamp.seconds === 'number') {
            return new Date(timestamp.seconds * 1000);
          }
          
          if (timestamp instanceof Date) {
            return timestamp;
          }
          
          return new Date();
        };
        
        if (trade.closeDate) {
          tradeDate = getDateFromTimestamp(trade.closeDate);
        } else if (trade.entryDate) {
          tradeDate = getDateFromTimestamp(trade.entryDate);
        } else {
          // Không có dữ liệu thời gian - hiếm gặp nhưng an toàn
          tradeDate = new Date();
        }
        
        if (filters.startDate && tradeDate < filters.startDate) return false;
        if (filters.endDate) {
          // Set end of day for the end date
          const endDate = new Date(filters.endDate);
          endDate.setHours(23, 59, 59, 999);
          if (tradeDate > endDate) return false;
        }
        
        return true;
      });
    }

    if (filters.pair && filters.pair.length > 0) {
      result = result.filter(trade => {
        // Debug log
        debug("Trade pair check:", trade.id, trade.pair, typeof trade.pair);
        
        // Kiểm tra trường pair có tồn tại và được định nghĩa
        if (!trade.pair) {
          debug("Trade has no pair field:", trade.id);
          return false;
        }
        
        // Chuẩn hóa pair thành chữ hoa để so sánh
        const normalizedPair = String(trade.pair).toUpperCase();
        const normalizedFilter = filters.pair ? 
          filters.pair.map(p => String(p).toUpperCase()) : 
          [];
        
        debug("Pair comparison:", normalizedPair, normalizedFilter);
        
        return normalizedFilter.includes(normalizedPair);
      });
    }

    if (filters.direction && filters.direction.length > 0) {
      result = result.filter(trade => {
        // Debug log
        debug("Trade direction check:", trade.id, trade.direction, typeof trade.direction);
        
        // Kiểm tra trường direction có tồn tại và được định nghĩa
        if (!trade.direction) {
          debug("Trade has no direction field:", trade.id);
          return false;
        }
        
        // Chuẩn hóa direction thành chữ hoa để so sánh
        const normalizedDirection = String(trade.direction).toUpperCase();
        const normalizedFilter = filters.direction ? 
          filters.direction.map(d => String(d).toUpperCase()) : 
          [];
        
        debug("Direction comparison:", normalizedDirection, normalizedFilter);
        
        return normalizedFilter.includes(normalizedDirection);
      });
    }

    if (filters.result && filters.result.length > 0) {
      result = result.filter(trade => {
        if (!trade.result) return false;
        
        const normalizedResult = String(trade.result).toUpperCase();
        const normalizedFilter = filters.result ? 
          filters.result.map(r => String(r).toUpperCase()) : 
          [];
        
        return normalizedFilter.includes(normalizedResult);
      });
    }

    if (filters.strategy && filters.strategy.length > 0) {
      result = result.filter(trade => {
        if (!trade.strategy) return false;
        
        const normalizedStrategy = String(trade.strategy).toLowerCase();
        const normalizedFilter = filters.strategy ? 
          filters.strategy.map(s => String(s).toLowerCase()) : 
          [];
        
        return normalizedFilter.includes(normalizedStrategy);
      });
    }
    
    // Filter by discipline conditions
    if (filters.hasFollowedPlan !== undefined) {
      debug("Applying followedPlan filter:", filters.hasFollowedPlan);
      result = result.filter(trade => {
        if (trade.discipline && 'followedPlan' in trade.discipline) {
          return trade.discipline.followedPlan === filters.hasFollowedPlan;
        } else if ('followedPlan' in trade) {
          return trade.followedPlan === filters.hasFollowedPlan;
        }
        return false;
      });
    }
    
    if (filters.hasEnteredEarly !== undefined) {
      debug("Applying enteredEarly filter:", filters.hasEnteredEarly);
      result = result.filter(trade => {
        if (trade.discipline && 'enteredEarly' in trade.discipline) {
          return trade.discipline.enteredEarly === filters.hasEnteredEarly;
        } else if ('enteredEarly' in trade) {
          return trade.enteredEarly === filters.hasEnteredEarly;
        }
        return false;
      });
    }
    
    if (filters.hasRevenge !== undefined) {
      debug("Applying revenge filter:", filters.hasRevenge);
      result = result.filter(trade => {
        if (trade.discipline && 'revenge' in trade.discipline) {
          return trade.discipline.revenge === filters.hasRevenge;
        } else if ('revenge' in trade) {
          return trade.revenge === filters.hasRevenge;
        }
        return false;
      });
    }
    
    if (filters.hasMovedSL !== undefined) {
      debug("Applying movedStopLoss filter:", filters.hasMovedSL);
      result = result.filter(trade => {
        if (trade.discipline && 'movedStopLoss' in trade.discipline) {
          return trade.discipline.movedStopLoss === filters.hasMovedSL;
        } else if ('movedStopLoss' in trade) {
          return trade.movedStopLoss === filters.hasMovedSL;
        }
        return false;
      });
    }
    
    if (filters.hasOverLeveraged !== undefined) {
      debug("Applying overLeveraged filter:", filters.hasOverLeveraged);
      result = result.filter(trade => {
        if (trade.discipline && 'overLeveraged' in trade.discipline) {
          return trade.discipline.overLeveraged === filters.hasOverLeveraged;
        } else if ('overLeveraged' in trade) {
          return trade.overLeveraged === filters.hasOverLeveraged;
        }
        return false;
      });
    }

    if (filters.hasNews !== undefined) {
      result = result.filter(trade => {
        // Special case for hasNews - always return false if not found to avoid misleading results
        if ('hasNews' in trade) {
          return trade.hasNews === filters.hasNews;
        }
        return false;
      });
    }

    // Filter by session type
    if (filters.sessionType && filters.sessionType.length > 0) {
      result = result.filter(trade => {
        if (!trade.sessionType) return false;
        
        return filters.sessionType!.includes(trade.sessionType);
      });
    }

    // Filter by emotion
    if (filters.emotion && filters.emotion.length > 0) {
      result = result.filter(trade => {
        if (!trade.emotion) return false;
        
        return filters.emotion!.includes(trade.emotion);
      });
    }

    // Sort mặc định cho tất cả các filter
    // - Lệnh mở luôn ở đầu
    // - Sau đó là theo thời điểm mới nhất
    if (sortBy === "profit" || sortBy === "loss") {
      // Profit và Loss đã được sắp xếp ở trên
    } else {
      // Sort theo ngày nếu không phải profit/loss
      debug("Applying sort:", sortBy, "on", result.length, "trades");
      
      if (sortBy === "newest") {
        debug("Sorting by newest first");
        result.sort((a, b) => {
          // Trade mở luôn hiển thị đầu tiên
          if (a.isOpen && !b.isOpen) return -1;
          if (!a.isOpen && b.isOpen) return 1;
          
          // Lấy đúng thời gian dựa trên trạng thái đóng/mở
          const dateA = a.closeDate ? (a.closeDate as any).seconds : (a.entryDate as any).seconds;
          const dateB = b.closeDate ? (b.closeDate as any).seconds : (b.entryDate as any).seconds;
          
          return dateB - dateA; // Mới nhất lên đầu
        });
      } else if (sortBy === "oldest") {
        debug("Sorting by oldest first");
        result.sort((a, b) => {
          // Trade mở luôn hiển thị đầu tiên
          if (a.isOpen && !b.isOpen) return -1;
          if (!a.isOpen && b.isOpen) return 1;
          
          // Lấy đúng thời gian dựa trên trạng thái đóng/mở
          const dateA = a.closeDate ? (a.closeDate as any).seconds : (a.entryDate as any).seconds;
          const dateB = b.closeDate ? (b.closeDate as any).seconds : (b.entryDate as any).seconds;
          
          return dateA - dateB; // Cũ nhất lên đầu
        });
      }
    }
    
    debug("Filtered trades count:", result.length);
    return result;
  }, [filters, sortBy]);

  // Áp dụng filter cho trades
  const filteredTrades = applyFilters(data?.trades || []);
  
  // Theo dõi sự thay đổi của initialFilters và cập nhật filters
  useEffect(() => {
    // Use try-catch to handle potential circular references in JSON
    let currentFiltersJson = '{}';
    let previousFiltersJson = '{}';
    
    try {
      currentFiltersJson = JSON.stringify(initialFilters);
    } catch (err) {
      logError('Error stringifying current filters:', err);
    }
    
    try {
      previousFiltersJson = JSON.stringify(initialFiltersRef.current);
    } catch (err) {
      logError('Error stringifying previous filters:', err);
    }
    
    // Nếu initialFilters thay đổi, cập nhật filters
    if (currentFiltersJson !== previousFiltersJson) {
      debug("Initial filters changed: ", initialFilters);
      initialFiltersRef.current = initialFilters;
      setFilters(initialFilters);
    }
  }, [initialFilters, initialFiltersRef, setFilters]);
  
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