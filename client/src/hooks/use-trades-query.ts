/**
 * Hook React Query để quản lý dữ liệu giao dịch
 * Thay thế hoàn toàn cho useDataCache.trades
 */

import { useQuery } from "@tanstack/react-query";
import { auth, getTrades } from "@/lib/firebase";
import { debug } from "@/lib/debug";
import { tradeUpdateService, TradeChangeObserver } from "@/services/trade-update-service";
import { useEffect } from "react";

export function useTradesQuery() {
  const userId = auth.currentUser?.uid;

  const query = useQuery({
    queryKey: ['trades', userId],
    queryFn: async () => {
      if (!userId) return [];
      debug(`Fetching all trades for ${userId}`);
      return await getTrades(userId);
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 phút
    gcTime: 10 * 60 * 1000,   // 10 phút
    refetchOnWindowFocus: false,
  });

  // Đăng ký lắng nghe thay đổi trades qua TradeUpdateService
  useEffect(() => {
    if (!userId) return;
    
    const observer: TradeChangeObserver = {
      onTradesChanged: (action, tradeId) => {
        debug(`[useTradesQuery] Trade changed (${action}), refreshing data`);
        query.refetch();
      }
    };
    
    const unregister = tradeUpdateService.registerObserver(observer);
    return () => unregister();
  }, [userId, query.refetch]);

  return {
    trades: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    userId,
  };
}