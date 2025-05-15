/**
 * Event Bus - Hệ thống pub/sub tập trung cho ứng dụng
 * 
 * Giúp giảm thiểu số lượng listeners và tránh xử lý chồng chéo
 */

import { debug } from './debug';

type EventCallback = (...args: any[]) => void;

interface EventMap {
  [eventName: string]: EventCallback[];
}

class EventBus {
  private events: EventMap = {};
  private static instance: EventBus;

  private constructor() {
    // Khởi tạo singleton
  }

  /**
   * Lấy instance của EventBus
   */
  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  /**
   * Đăng ký lắng nghe một sự kiện
   * 
   * @param eventName Tên sự kiện
   * @param callback Hàm callback khi sự kiện xảy ra
   * @returns Function để hủy đăng ký
   */
  public on(eventName: string, callback: EventCallback): () => void {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }
    
    this.events[eventName].push(callback);
    
    // Trả về hàm để hủy đăng ký
    return () => this.off(eventName, callback);
  }

  /**
   * Hủy đăng ký lắng nghe sự kiện
   * 
   * @param eventName Tên sự kiện
   * @param callback Hàm callback đã đăng ký
   */
  public off(eventName: string, callback: EventCallback): void {
    if (!this.events[eventName]) return;
    
    this.events[eventName] = this.events[eventName].filter(
      (cb) => cb !== callback
    );
    
    // Dọn dẹp nếu không còn callback nào
    if (this.events[eventName].length === 0) {
      delete this.events[eventName];
    }
  }

  /**
   * Phát sự kiện đến tất cả listeners
   * 
   * @param eventName Tên sự kiện
   * @param args Các tham số truyền đến callbacks
   */
  public emit(eventName: string, ...args: any[]): void {
    if (!this.events[eventName]) return;
    
    debug(`[EventBus] Emitting event: ${eventName} with ${this.events[eventName].length} listeners`);
    
    // Sao chép mảng để tránh vấn đề nếu có callback nào đó gọi off() trong khi đang emit
    const callbacks = [...this.events[eventName]];
    
    for (const callback of callbacks) {
      try {
        callback(...args);
      } catch (error) {
        console.error(`[EventBus] Error in event handler for ${eventName}:`, error);
      }
    }
  }

  /**
   * Đăng ký một lần duy nhất
   * 
   * @param eventName Tên sự kiện
   * @param callback Hàm callback
   * @returns Function để hủy đăng ký
   */
  public once(eventName: string, callback: EventCallback): () => void {
    const onceCallback = (...args: any[]) => {
      this.off(eventName, onceCallback);
      callback(...args);
    };
    
    return this.on(eventName, onceCallback);
  }

  /**
   * Xóa tất cả listeners cho một sự kiện
   * 
   * @param eventName Tên sự kiện, nếu không có sẽ xóa tất cả
   */
  public clear(eventName?: string): void {
    if (eventName) {
      delete this.events[eventName];
    } else {
      this.events = {};
    }
  }
}

// Tạo và export singleton instance
export const eventBus = EventBus.getInstance();

// Định nghĩa các event names để đảm bảo tính nhất quán
export const EVENT_NAMES = {
  TRADES_UPDATED: 'trades:updated',
  TRADE_CREATED: 'trade:created',
  TRADE_UPDATED: 'trade:updated',
  TRADE_DELETED: 'trade:deleted',
  TRADE_CLOSED: 'trade:closed',
  USER_DATA_UPDATED: 'user:dataUpdated',
  CACHE_UPDATED: 'cache:updated',
  ACHIEVEMENTS_UPDATED: 'achievements:updated'
};

