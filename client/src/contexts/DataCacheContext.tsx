import React, { createContext, useState, useEffect, useContext, ReactNode, useMemo, useCallback } from 'react';
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
  const [trades, setTrades] = useState<any[]>([]);
  const [userData, setUserData] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(0);
  
  // Thêm các state mới để tracking trạng thái cụ thể
  const [isTradesLoaded, setIsTradesLoaded] = useState(false);
  const [isUserDataLoaded, setIsUserDataLoaded] = useState(false);
  const [isCacheValid, setIsCacheValid] = useState(false);

  // Load cached data initially
  useEffect(() => {
    const loadFromCache = () => {
      try {
        const cachedDataStr = localStorage.getItem(STORAGE_KEY);
        
        if (cachedDataStr) {
          const cachedData = JSON.parse(cachedDataStr);
          const now = Date.now();
          
          // Kiểm tra phiên bản cache và thời hạn
          if (cachedData.version === CACHE_VERSION && 
              now - cachedData.lastUpdated < CACHE_EXPIRY_TIME) {
            setTrades(cachedData.trades || []);
            setUserData(cachedData.userData || null);
            setIsCacheValid(true);
            
            // Nếu cache có dữ liệu đầy đủ, đánh dấu là đã loaded
            if (cachedData.trades && cachedData.trades.length > 0) {
              setIsTradesLoaded(true);
            }
            
            if (cachedData.userData) {
              setIsUserDataLoaded(true);
            }
            
            debug('[DataCache] Loaded data from cache');
          } else {
            // Cache không đúng phiên bản hoặc hết hạn
            if (cachedData.version !== CACHE_VERSION) {
              debug('[DataCache] Cache version mismatch, clearing');
              localStorage.removeItem(STORAGE_KEY);
            } else {
              debug('[DataCache] Cache expired, will refresh data');
            }
            setIsCacheValid(false);
          }
        }
      } catch (error) {
        logError('[DataCache] Error loading from cache:', error);
        // Clear potentially corrupted cache
        localStorage.removeItem(STORAGE_KEY);
        setIsCacheValid(false);
      }
    };
    
    loadFromCache();
  }, []);

  // Listen for authentication changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
        setUserData(null);
        setTrades([]);
        setIsLoading(false);
      }
    });
    
    return () => unsubscribe();
  }, []);

  // Fetch or refresh data when userId changes or when refresh is triggered
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
    
    // Tối ưu hóa fetch user data để sử dụng cached data nếu có
    const fetchUserData = async () => {
      try {
        // Nếu đã có userData và không phải refresh, tránh re-fetch
        if (userData && lastRefresh === 0) {
          debug('[DataCache] Using existing userData, avoiding re-fetch');
          return;
        }
        
        const data = await getUserData(userId);
        if (data) {
          setUserData(data);
          setIsUserDataLoaded(true);
          
          // Update cache
          updateCache({ 
            trades, 
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
          setTrades(fetchedTrades);
          setIsTradesLoaded(true);
          setIsLoading(false);
          
          // Chỉ update cache khi có thay đổi thực sự
          if (JSON.stringify(fetchedTrades) !== JSON.stringify(trades)) {
            debug('[DataCache] Trades changed, updating cache');
            // Update cache with new trades
            updateCache({ 
              trades: fetchedTrades, 
              userData: userData, 
              lastUpdated: Date.now()
            });
          } else {
            debug('[DataCache] Trades unchanged, avoiding cache update');
          }
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
  }, [userId, lastRefresh, trades, userData]);

  // Helper function to update the cache
  const updateCache = (data: Omit<CachedData, 'version'>) => {
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
        
        // Update cache validity state
        setIsCacheValid(true);
        setIsTradesLoaded(true);
        setIsUserDataLoaded(true);
      }
    } catch (error) {
      logError('[DataCache] Error updating cache:', error);
      setIsCacheValid(false);
    }
  };

  // Force refresh data
  const refreshData = () => {
    setLastRefresh(Date.now());
  };

  // Clear cache
  const clearCache = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      debug('[DataCache] Cache cleared');
      refreshData();
    } catch (error) {
      logError('[DataCache] Error clearing cache:', error);
    }
  };

  // Memoize value để tránh re-render
  const value = useMemo(() => ({
    trades,
    userData,
    isLoading,
    userId,
    refreshData,
    clearCache,
    isCacheValid,
    isTradesLoaded,
    isUserDataLoaded
  }), [
    trades, 
    userData, 
    isLoading, 
    userId, 
    isCacheValid, 
    isTradesLoaded, 
    isUserDataLoaded
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