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
    
    const unsubscribe = tradeUpdateService.registerObserver({
      onTradesChanged: (action, tradeId) => {
        debug(`Trade changed via TradeUpdateService (${action}, ID: ${tradeId || 'unknown'}), triggering refetch`);
        refetch();
      }
    });
    
    return () => unsubscribe();
  }, [userId, refetch]);
  
  return {
    trades,
    isLoading,
    error,
    refetch
  };
}