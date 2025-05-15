/**
 * TradeUpdateService
 * 
 * Dịch vụ tập trung để quản lý thống nhất cập nhật UI sau các thao tác CRUD giao dịch.
 * Sử dụng TanStack Query làm nền tảng cho việc quản lý cache và revalidation.
 */

import { debug, logError } from '@/lib/debug';
import { QueryClient } from '@tanstack/react-query';

// Singleton instance
let queryClientInstance: QueryClient | null = null;

// Các key gốc cho truy vấn giao dịch
const TRADE_QUERY_ROOT_KEY = 'trades';

// Interface chung cho các observers
export interface TradeChangeObserver {
  // Parameters are used in implementations of this interface
  // eslint-disable-next-line no-unused-vars
  onTradesChanged: (action: 'create' | 'update' | 'delete' | 'close', tradeId?: string) => void;
}

class TradeUpdateService {
  private static instance: TradeUpdateService;
  private observers: Set<TradeChangeObserver> = new Set();
  
  private constructor() {
    debug('TradeUpdateService initialized');
  }
  
  /**
   * Lấy instance duy nhất của TradeUpdateService
   */
  public static getInstance(): TradeUpdateService {
    if (!TradeUpdateService.instance) {
      TradeUpdateService.instance = new TradeUpdateService();
    }
    return TradeUpdateService.instance;
  }
  
  /**
   * Đặt QueryClient instance để sử dụng cho invalidation
   */
  public setQueryClient(queryClient: QueryClient) {
    queryClientInstance = queryClient;
    debug('TradeUpdateService: QueryClient đã được đặt');
  }
  
  /**
   * Thông báo thêm mới giao dịch
   * 
   * @param userId ID người dùng
   * @param tradeId ID giao dịch mới (tùy chọn)
   */
  public notifyTradeCreated(userId: string, tradeId?: string) {
    debug(`TradeUpdateService: Trade created notification (ID: ${tradeId || 'unknown'})`);
    // Đảm bảo invalidation xong trước khi thông báo cho observers
    this._invalidateTradeQueries(userId);
    // Thêm micro-delay để đảm bảo invalidation hoàn tất trước khi thông báo
    setTimeout(() => {
      this._notifyObservers('create', tradeId);
    }, 0);
  }
  
  /**
   * Thông báo cập nhật giao dịch
   * 
   * @param userId ID người dùng
   * @param tradeId ID giao dịch cập nhật
   */
  public notifyTradeUpdated(userId: string, tradeId: string) {
    debug(`TradeUpdateService: Trade updated notification (ID: ${tradeId})`);
    this._invalidateTradeQueries(userId);
    // Thêm micro-delay để đảm bảo invalidation hoàn tất trước khi thông báo
    setTimeout(() => {
      this._notifyObservers('update', tradeId);
    }, 0);
  }
  
  /**
   * Thông báo xóa giao dịch
   * 
   * @param userId ID người dùng
   * @param tradeId ID giao dịch đã xóa
   */
  public notifyTradeDeleted(userId: string, tradeId: string) {
    debug(`TradeUpdateService: Trade deleted notification (ID: ${tradeId})`);
    this._invalidateTradeQueries(userId);
    // Thêm micro-delay để đảm bảo invalidation hoàn tất trước khi thông báo
    setTimeout(() => {
      this._notifyObservers('delete', tradeId);
    }, 0);
  }
  
  /**
   * Thông báo đóng giao dịch
   * 
   * @param userId ID người dùng
   * @param tradeId ID giao dịch đã đóng
   */
  public notifyTradeClosed(userId: string, tradeId: string) {
    debug(`TradeUpdateService: Trade closed notification (ID: ${tradeId})`);
    this._invalidateTradeQueries(userId);
    // Thêm micro-delay để đảm bảo invalidation hoàn tất trước khi thông báo
    setTimeout(() => {
      this._notifyObservers('close', tradeId);
    }, 0);
  }
  
  /**
   * Đăng ký một observer mới
   * 
   * @param observer Đối tượng observer
   */
  public registerObserver(observer: TradeChangeObserver): () => void {
    this.observers.add(observer);
    
    // Trả về hàm unregister
    return () => {
      this.observers.delete(observer);
    };
  }
  
  /**
   * Vô hiệu hóa tất cả các truy vấn liên quan đến giao dịch
   */
  private _invalidateTradeQueries(userId: string) {
    if (!queryClientInstance) {
      logError('TradeUpdateService: QueryClient chưa được đặt. Không thể invalidate.');
      return;
    }
    
    try {
      // Vô hiệu hóa truy vấn trade chính từ useTradesQuery
      queryClientInstance.invalidateQueries({ 
        queryKey: [`/trades/${userId}`],
        exact: true,
        refetchType: 'active',
      });
      
      // Vô hiệu hóa tất cả các truy vấn liên quan đến giao dịch cho người dùng này
      // Sử dụng cấu trúc phân cấp để bắt tất cả các truy vấn con
      queryClientInstance.invalidateQueries({ 
        queryKey: [TRADE_QUERY_ROOT_KEY, userId],
        refetchType: 'active',
      });
      
      // Vô hiệu hóa các truy vấn liên quan đến phân tích và thống kê
      queryClientInstance.invalidateQueries({ 
        queryKey: ['analytics', userId],
        refetchType: 'active',
      });
      
      // Vô hiệu hóa các truy vấn liên quan đến mục tiêu
      queryClientInstance.invalidateQueries({ 
        queryKey: ['goals', userId],
        refetchType: 'active',
      });
      
      // Vô hiệu hóa các truy vấn cụ thể của từng trade (cho ViewTrade)
      if (userId) {
        queryClientInstance.invalidateQueries({
          predicate: (query) => {
            const key = query.queryKey;
            return Array.isArray(key) && 
                  key.length > 1 && 
                  key[0] === 'trade' && 
                  key[1].includes(userId);
          },
          refetchType: 'active',
        });
      }
      
      debug(`TradeUpdateService: Invalidated all trade related queries for user ${userId}`);
    } catch (error) {
      logError('TradeUpdateService: Error invalidating queries', error);
    }
  }
  
  /**
   * Thông báo cho tất cả các observers về sự thay đổi
   */
  private _notifyObservers(action: 'create' | 'update' | 'delete' | 'close', tradeId?: string) {
    // Chuyển đổi Set thành Array trước khi duyệt qua để tránh lỗi TSC
    Array.from(this.observers).forEach(observer => {
      try {
        observer.onTradesChanged(action, tradeId);
      } catch (error) {
        logError('TradeUpdateService: Error notifying observer', error);
      }
    });
  }
}

// Export singleton instance
export const tradeUpdateService = TradeUpdateService.getInstance();