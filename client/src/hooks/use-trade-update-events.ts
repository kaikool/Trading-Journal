/**
 * Hook để lắng nghe các sự kiện cập nhật giao dịch
 * 
 * Hook này đăng ký với TradeUpdateService để nhận thông báo khi có thay đổi giao dịch
 * giúp các component có thể cập nhật UI mà không cần tự quản lý các listener Firebase.
 */

import { useEffect, useCallback } from 'react';
import { tradeUpdateService, TradeChangeObserver } from '@/services/trade-update-service';
import { debug } from '@/lib/debug';

/**
 * Hook đăng ký lắng nghe các sự kiện cập nhật giao dịch
 * 
 * @param userId ID người dùng để theo dõi
 * @param callback Hàm callback được gọi khi có thay đổi
 */
export function useTradeUpdateEvents(
  userId: string,
  callback: (action: 'create' | 'update' | 'delete' | 'close', tradeId?: string) => void
) {
  // Đảm bảo callback không thay đổi giữa các lần render
  // để tránh đăng ký lại observer không cần thiết
  const stableCallback = useCallback(
    (action: 'create' | 'update' | 'delete' | 'close', tradeId?: string) => {
      debug(`[useTradeUpdateEvents] Received ${action} event for trade ${tradeId || 'unknown'}`);
      callback(action, tradeId);
    },
    [callback]
  );

  useEffect(() => {
    if (!userId) return;

    debug(`[useTradeUpdateEvents] Registering observer for user ${userId}`);
    
    // Tạo observer
    const observer: TradeChangeObserver = {
      onTradesChanged: stableCallback
    };
    
    // Đăng ký với TradeUpdateService
    const unregister = tradeUpdateService.registerObserver(observer);
    
    // Hủy đăng ký khi component unmount
    return () => {
      debug(`[useTradeUpdateEvents] Unregistering observer for user ${userId}`);
      unregister();
    };
  }, [userId, stableCallback]);
}