/**
 * FirebaseListenerService
 * 
 * Dịch vụ quản lý tập trung tất cả Firebase listeners trong ứng dụng.
 * Sử dụng singleton pattern để đảm bảo rằng chỉ có một instance duy nhất.
 * Giúp tránh trường hợp listeners bị tạo nhiều lần và không được cleanup đúng cách.
 */

import { collection, doc, onSnapshot, query, orderBy, QuerySnapshot, DocumentData, Unsubscribe } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { debug, logError } from '@/lib/debug';

interface ListenerConfig<T> {
  callback: (data: T[]) => void;
  errorCallback?: (error: Error) => void;
  includeMetadataChanges?: boolean;
  cacheTimeout?: number;
}

class FirebaseListenerService {
  // Singleton instance
  private static instance: FirebaseListenerService;
  
  // Map to store active listeners
  private listeners: Map<string, {
    unsubscribe: Unsubscribe;
    lastUpdated: number;
    cacheVersion: number;
  }> = new Map();
  
  private constructor() {
    // Private constructor to prevent direct construction calls with the `new` operator
    debug('FirebaseListenerService initialized');
  }
  
  /**
   * Lấy instance duy nhất của FirebaseListenerService
   */
  public static getInstance(): FirebaseListenerService {
    if (!FirebaseListenerService.instance) {
      FirebaseListenerService.instance = new FirebaseListenerService();
    }
    return FirebaseListenerService.instance;
  }
  
  /**
   * Theo dõi collection trades của người dùng
   * 
   * @param userId ID người dùng
   * @param config Cấu hình listener
   * @returns Hàm hủy đăng ký
   */
  public onTradesSnapshot(userId: string, config: ListenerConfig<any>): Unsubscribe {
    const listenerId = `trades_${userId}`;
    return this.setupCollectionListener(
      listenerId,
      collection(db, 'users', userId, 'trades'),
      config
    );
  }
  
  /**
   * Theo dõi collection goals của người dùng
   * 
   * @param userId ID người dùng
   * @param config Cấu hình listener
   * @returns Hàm hủy đăng ký
   */
  public onGoalsSnapshot(userId: string, config: ListenerConfig<any>): Unsubscribe {
    const listenerId = `goals_${userId}`;
    return this.setupCollectionListener(
      listenerId,
      collection(db, 'users', userId, 'goals'),
      config
    );
  }
  
  /**
   * Theo dõi document user
   * 
   * @param userId ID người dùng
   * @param config Cấu hình listener
   * @returns Hàm hủy đăng ký
   */
  public onUserSnapshot(userId: string, config: ListenerConfig<any>): Unsubscribe {
    const listenerId = `user_${userId}`;
    return this.setupDocumentListener(
      listenerId,
      doc(db, 'users', userId),
      config
    );
  }
  
  /**
   * Thiết lập listener cho document
   * 
   * @param listenerId ID duy nhất cho listener
   * @param docRef Tham chiếu đến document
   * @param config Cấu hình listener
   * @returns Hàm hủy đăng ký
   */
  private setupDocumentListener(listenerId: string, docRef: any, config: ListenerConfig<any>): Unsubscribe {
    // Hủy listener hiện tại nếu tồn tại
    this.unregisterListener(listenerId);
    
    // Tạo listener mới
    debug(`Setting up document listener: ${listenerId}`);
    
    let active = true;
    const cacheVersion = Date.now();
    
    const unsubscribe = onSnapshot(
      docRef,
      { includeMetadataChanges: config.includeMetadataChanges || false },
      (snapshot: any) => {
        // Kiểm tra nếu listener không còn active
        if (!active) {
          debug(`Listener ${listenerId} received data but is no longer active`);
          return;
        }
        
        try {
          if (snapshot.exists()) {
            const data = {
              id: snapshot.id,
              ...snapshot.data()
            };
            config.callback([data]);
          } else {
            config.callback([]);
          }
        } catch (error) {
          debug(`Error in listener ${listenerId}:`, error);
          if (config.errorCallback && error instanceof Error) {
            config.errorCallback(error);
          }
        }
      },
      (error: Error) => {
        debug(`Error in listener ${listenerId}:`, error);
        if (config.errorCallback) {
          config.errorCallback(error);
        }
      }
    );
    
    // Lưu trữ thông tin listener
    this.listeners.set(listenerId, {
      unsubscribe,
      lastUpdated: Date.now(),
      cacheVersion
    });
    
    // Trả về hàm hủy đăng ký
    return () => this.unregisterListener(listenerId);
  }
  
  /**
   * Thiết lập listener cho collection
   * 
   * @param listenerId ID duy nhất cho listener
   * @param collectionRef Tham chiếu đến collection
   * @param config Cấu hình listener
   * @returns Hàm hủy đăng ký
   */
  private setupCollectionListener(listenerId: string, collectionRef: any, config: ListenerConfig<any>): Unsubscribe {
    // Hủy listener hiện tại nếu tồn tại
    this.unregisterListener(listenerId);
    
    // Tạo listener mới
    debug(`Setting up collection listener: ${listenerId}`);
    
    let active = true;
    const cacheVersion = Date.now();
    
    // Tạo query với sắp xếp theo createdAt
    const q = query(collectionRef, orderBy('createdAt', 'desc')) as any;
    
    const unsubscribe = onSnapshot(
      q,
      { includeMetadataChanges: config.includeMetadataChanges || false },
      (snapshot: QuerySnapshot<DocumentData>) => {
        // Kiểm tra nếu listener không còn active
        if (!active) {
          debug(`Listener ${listenerId} received data but is no longer active`);
          return;
        }
        
        try {
          debug(`Received ${snapshot.docs.length} documents from ${listenerId}`);
          
          // Biến đổi dữ liệu
          const items = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          // Gọi callback
          config.callback(items);
        } catch (error) {
          debug(`Error in listener ${listenerId}:`, error);
          if (config.errorCallback && error instanceof Error) {
            config.errorCallback(error);
          }
        }
      },
      (error: Error) => {
        debug(`Error in listener ${listenerId}:`, error);
        if (config.errorCallback) {
          config.errorCallback(error);
        }
      }
    );
    
    // Lưu trữ thông tin listener
    this.listeners.set(listenerId, {
      unsubscribe,
      lastUpdated: Date.now(),
      cacheVersion
    });
    
    // Trả về hàm hủy đăng ký
    return () => this.unregisterListener(listenerId);
  }
  
  /**
   * Hủy đăng ký listener
   * 
   * @param listenerId ID của listener
   */
  private unregisterListener(listenerId: string): void {
    const listener = this.listeners.get(listenerId);
    if (listener) {
      debug(`Unregistering listener: ${listenerId}`);
      try {
        listener.unsubscribe();
        this.listeners.delete(listenerId);
        debug(`Listener ${listenerId} unsubscribed and cleaned up`);
      } catch (error) {
        logError(`Error unregistering listener ${listenerId}:`, error);
      }
    }
  }
  
  /**
   * Hủy đăng ký tất cả listeners
   */
  public unregisterAllListeners(): void {
    debug(`Unregistering all ${this.listeners.size} listeners`);
    
    // Convert Map entries to array first to avoid iteration issues
    Array.from(this.listeners.entries()).forEach(([listenerId, listener]) => {
      try {
        listener.unsubscribe();
        debug(`Listener ${listenerId} unsubscribed`);
      } catch (error) {
        logError(`Error unregistering listener ${listenerId}:`, error);
      }
    });
    
    this.listeners.clear();
    debug('All listeners unregistered');
  }
  
  /**
   * Kiểm tra xem một listener đã tồn tại hay chưa
   * 
   * @param listenerId ID của listener
   */
  public hasListener(listenerId: string): boolean {
    return this.listeners.has(listenerId);
  }
  
  /**
   * Số lượng listeners đang hoạt động
   */
  public activeListenerCount(): number {
    return this.listeners.size;
  }
}

// Export singleton instance
export const firebaseListenerService = FirebaseListenerService.getInstance();