import { createContext, useState, useEffect, useContext, ReactNode, useMemo, useCallback } from 'react';
import { auth, onTradesSnapshot, getUserData } from '@/lib/firebase';
import { debug, logError } from '@/lib/debug';

// Define cache structure with more specific types
interface CachedData {
  trades: any[];
  userData: any;
  lastUpdated: number;
  version: number; // Thêm version để quản lý schema migrations
}

interface DataCacheContextType {
  trades: any[];
  userData: any;
  isLoading: boolean;
  userId: string | null;
  refreshData: () => void;
  clearCache: () => void;
  isCacheValid: boolean; // Thêm flag để biết cache có valid không
  isTradesLoaded: boolean; // Thêm flag để biết trades đã load xong chưa
  isUserDataLoaded: boolean; // Thêm flag để biết userData đã load xong chưa
}

// Tăng thời gian cache lên 10 phút để tránh load lại quá nhiều
const CACHE_EXPIRY_TIME = 10 * 60 * 1000; // 10 minutes in milliseconds 
const STORAGE_KEY = 'trading_journal_cache';
const CACHE_VERSION = 1; // Version hiện tại của cache schema

// Export context để có thể sử dụng trong hook riêng biệt
export const DataCacheContext = createContext<DataCacheContextType | undefined>(undefined);

export function DataCacheProvider({ children }: { children: ReactNode }) {
  // Mã bọc dữ liệu - một state duy nhất chứa toàn bộ trạng thái dữ liệu 
  const [dataState, setDataState] = useState({
    trades: [] as any[],
    userData: null as any,
    isTradesLoaded: false,
    isUserDataLoaded: false,
    isCacheValid: false
  });
  
  // State riêng để quản lý user authentication và loading
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(0);

  // Memoize hàm updateCache để tránh tạo lại trong mỗi render
  const updateCache = useCallback((data: Omit<CachedData, 'version'>) => {
    try {
      // Only cache if we have both userData and trades
      if (data.userData && data.trades && data.trades.length > 0) {
        // Add version to data before saving
        const dataWithVersion: CachedData = {
          ...data,
          version: CACHE_VERSION
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataWithVersion));
        debug('[DataCache] Updated cache');
        
        // Update all cache-related state in one operation để tránh nhiều lần re-render
        setDataState(prevState => ({
          ...prevState,
          isCacheValid: true,
          isTradesLoaded: true,
          isUserDataLoaded: true
        }));
      }
    } catch (error) {
      logError('[DataCache] Error updating cache:', error);
      setDataState(prevState => ({
        ...prevState,
        isCacheValid: false
      }));
    }
  }, []);

  // Force refresh data - memoize để tránh re-render
  const refreshData = useCallback(() => {
    setLastRefresh(Date.now());
  }, []);

  // Clear cache - memoize để tránh re-render
  const clearCache = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      debug('[DataCache] Cache cleared');
      refreshData();
    } catch (error) {
      logError('[DataCache] Error clearing cache:', error);
    }
  }, [refreshData]);

  // Gộp useEffect cho xử lý auth và cache initialization 
  useEffect(() => {
    // Khởi tạo từ cache
    const loadFromCache = () => {
      try {
        const cachedDataStr = localStorage.getItem(STORAGE_KEY);
        
        if (cachedDataStr) {
          const cachedData = JSON.parse(cachedDataStr);
          const now = Date.now();
          
          // Kiểm tra phiên bản cache và thời hạn
          if (cachedData.version === CACHE_VERSION && 
              now - cachedData.lastUpdated < CACHE_EXPIRY_TIME) {
            
            // Cập nhật toàn bộ state trong một lần để tránh nhiều lần re-render
            setDataState({
              trades: cachedData.trades || [],
              userData: cachedData.userData || null,
              isCacheValid: true,
              isTradesLoaded: cachedData.trades && cachedData.trades.length > 0,
              isUserDataLoaded: !!cachedData.userData
            });
            
            debug('[DataCache] Loaded data from cache');
          } else {
            // Cache không đúng phiên bản hoặc hết hạn
            if (cachedData.version !== CACHE_VERSION) {
              debug('[DataCache] Cache version mismatch, clearing');
              localStorage.removeItem(STORAGE_KEY);
            } else {
              debug('[DataCache] Cache expired, will refresh data');
            }
          }
        }
      } catch (error) {
        logError('[DataCache] Error loading from cache:', error);
        // Clear potentially corrupted cache
        localStorage.removeItem(STORAGE_KEY);
      }
    };
    
    // Load cache ngay khi component mount
    loadFromCache();
    
    // Đăng ký Auth listener
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
        // Reset trạng thái khi đăng xuất
        setDataState({
          trades: [],
          userData: null,
          isTradesLoaded: false,
          isUserDataLoaded: false,
          isCacheValid: false
        });
        setIsLoading(false);
      }
    });
    
    return () => unsubscribeAuth();
  }, []);

  // Fetch và sync data khi userId thay đổi hoặc khi refresh được trigger
  useEffect(() => {
    if (!userId) return;
    
    // Kiểm tra cache trước khi set loading state
    const cachedDataStr = localStorage.getItem(STORAGE_KEY);
    let shouldSetLoading = true;
    
    if (cachedDataStr) {
      try {
        const cachedData: CachedData = JSON.parse(cachedDataStr);
        const now = Date.now();
        
        // Chỉ set loading state nếu cache đã hết hạn hoặc refresh được trigger
        if (now - cachedData.lastUpdated < CACHE_EXPIRY_TIME && lastRefresh === 0) {
          shouldSetLoading = false;
          debug('[DataCache] Using valid cache, skipping loading state');
        }
      } catch (e) {
        // Nếu parse cache lỗi, vẫn set loading
        logError('[DataCache] Error parsing cache:', e);
      }
    }
    
    if (shouldSetLoading) {
      setIsLoading(true);
    }
    
    // Lưu trữ tham chiếu hiện tại để tránh stale closure
    const { trades: currentTrades, userData: currentUserData } = dataState;
    
    // Tối ưu hóa fetch user data để sử dụng cached data nếu có
    const fetchUserData = async () => {
      try {
        // Nếu đã có userData và không phải refresh, tránh re-fetch
        if (currentUserData && lastRefresh === 0 && dataState.isUserDataLoaded) {
          debug('[DataCache] Using existing userData, avoiding re-fetch');
          return;
        }
        
        const data = await getUserData(userId);
        if (data) {
          // Update userData trong một lần
          setDataState(prevState => ({
            ...prevState,
            userData: data,
            isUserDataLoaded: true
          }));
          
          // Update cache
          updateCache({ 
            trades: currentTrades, 
            userData: data, 
            lastUpdated: Date.now()
          });
        }
      } catch (error) {
        logError("[DataCache] Error fetching user data:", error);
      }
    };
    
    // Biến để theo dõi liệu đã có trade snapshot listener chưa
    let unsubscribed = false;
    
    // Start trade listener
    try {
      debug('[DataCache] Setting up trades snapshot listener');
      const unsubscribe = onTradesSnapshot(
        userId,
        (fetchedTrades) => {
          debug(`[DataCache] Received ${fetchedTrades.length} trades from snapshot`);
          
          // Sử dụng function form của setState để tránh dependency loop
          setDataState(prevState => {
            // Kiểm tra nếu có thay đổi thực sự
            const tradesChanged = JSON.stringify(fetchedTrades) !== JSON.stringify(prevState.trades);
            
            if (tradesChanged) {
              debug('[DataCache] Trades changed, updating cache');
              // Update cache outside of setState để tránh re-render thêm
              setTimeout(() => {
                updateCache({ 
                  trades: fetchedTrades, 
                  userData: prevState.userData, 
                  lastUpdated: Date.now()
                });
              }, 0);
            } else {
              debug('[DataCache] Trades unchanged, avoiding cache update');
            }
            
            return {
              ...prevState,
              trades: fetchedTrades,
              isTradesLoaded: true
            };
          });
          
          setIsLoading(false);
        },
        (error) => {
          logError("[DataCache] Error fetching trades:", error);
          setIsLoading(false);
        }
      );
      
      // Fetch user data
      fetchUserData();
      
      return () => {
        try {
          if (!unsubscribed) {
            debug('[DataCache] Unsubscribing from trades snapshot');
            unsubscribe();
            unsubscribed = true;
          }
        } catch (err) {
          logError("[DataCache] Error unsubscribing from trades snapshot:", err);
        }
      };
    } catch (error) {
      logError("[DataCache] Error setting up trades snapshot:", error);
      setIsLoading(false);
      return () => {}; // Return empty cleanup function
    }
  }, [userId, lastRefresh, updateCache, dataState]); 

  // Memoize value để tránh re-render
  const value = useMemo(() => ({
    trades: dataState.trades,
    userData: dataState.userData,
    isLoading,
    userId,
    refreshData,
    clearCache,
    isCacheValid: dataState.isCacheValid,
    isTradesLoaded: dataState.isTradesLoaded,
    isUserDataLoaded: dataState.isUserDataLoaded
  }), [
    dataState,
    isLoading, 
    userId, 
    refreshData,
    clearCache
  ]);

  return (
    <DataCacheContext.Provider value={value}>
      {children}
    </DataCacheContext.Provider>
  );
}

export function useDataCache() {
  const context = useContext(DataCacheContext);
  if (context === undefined) {
    throw new Error('useDataCache must be used within a DataCacheProvider');
  }
  return context;
}