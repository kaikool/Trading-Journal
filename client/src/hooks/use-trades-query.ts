/**
 * Hook React Query cho dữ liệu giao dịch
 * Thay thế hoàn toàn DataCacheContext và quản lý cache qua React Query
 */

import { useQuery } from "@tanstack/react-query";
import { getTrades } from "@/lib/firebase";
import { debug } from "@/lib/debug";
import { useAuth } from "./use-auth";
import { tradeUpdateService } from "@/services/trade-update-service";
import { useEffect } from "react";

export function useTradesQuery() {
  const { userId } = useAuth();
  
  const { 
    data: trades = [], 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: [`/trades/${userId}`],
    queryFn: async () => {
      if (!userId) return [];
      
      debug(`Fetching all trades for ${userId}`);
      return await getTrades(userId);
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
  
  // Register for trade changes - we still need this since firebase updates
  // can happen from multiple sources
  useEffect(() => {
    if (!userId) return;
    
    debug(`[useTradesQuery] Registering observer for trade updates for user ${userId}`);
    
    const unsubscribe = tradeUpdateService.registerObserver({
      onTradesChanged: (action, tradeId) => {
        debug(`[useTradesQuery] Trade changed via TradeUpdateService (${action}, ID: ${tradeId || 'unknown'}), triggering immediate refetch`);
        
        // Giải quyết vấn đề cập nhật bằng cách:
        // 1. Đợi invalidateQueries (đã thực hiện trong tradeUpdateService) hoàn tất
        // 2. Thêm độ trễ nhỏ trước khi refetch để đảm bảo Firebase đã cập nhật dữ liệu
        // 3. Force refetch bỏ qua stale time
        setTimeout(() => {
          debug(`[useTradesQuery] Executing refetch for action: ${action}`);
          refetch({ 
            cancelRefetch: true,     // Hủy các refetch đang chờ để tránh race condition
            throwOnError: false      // Không ném lỗi nếu refetch thất bại
          });
          
          // Double check để đảm bảo dữ liệu được cập nhật - giải quyết vấn đề Firebase delay
          setTimeout(() => {
            debug(`[useTradesQuery] Executing secondary refetch for action: ${action}`);
            refetch({ cancelRefetch: false, throwOnError: false });
          }, 500);
        }, 100);
      }
    });
    
    return () => {
      debug(`[useTradesQuery] Unregistering observer for user ${userId}`);
      unsubscribe();
    };
  }, [userId, refetch]);
  
  return {
    trades,
    isLoading,
    error,
    refetch
  };
}