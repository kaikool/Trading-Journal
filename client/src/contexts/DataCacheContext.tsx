import { createContext, useState, useEffect, useContext, ReactNode, useMemo, useCallback } from 'react';
import { auth, onTradesSnapshot, getUserData } from '@/lib/firebase';
import { debug, logError } from '@/lib/debug';

interface CachedData {
  trades: any[];
  userData: any;
  lastUpdated: number;
  version: number;
}

interface DataCacheContextType {
  trades: any[];
  userData: any;
  isLoading: boolean;
  userId: string | null;
  refreshData: () => void;
  clearCache: () => void;
  isCacheValid: boolean;
  isTradesLoaded: boolean;
  isUserDataLoaded: boolean;
}

const CACHE_EXPIRY_TIME = 10 * 60 * 1000;
const STORAGE_KEY = 'trading_journal_cache';
const CACHE_VERSION = 1;

export const DataCacheContext = createContext<DataCacheContextType | undefined>(undefined);

export function DataCacheProvider({ children }: { children: ReactNode }) {
  const [dataState, setDataState] = useState({
    trades: [] as any[],
    userData: null as any,
    isTradesLoaded: false,
    isUserDataLoaded: false,
    isCacheValid: false
  });
  
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(0);

  const updateCache = useCallback((data: Omit<CachedData, 'version'>) => {
    try {
      if (data.userData && data.trades && data.trades.length > 0) {
        const dataWithVersion: CachedData = {
          ...data,
          version: CACHE_VERSION
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataWithVersion));
        debug('[DataCache] Updated cache');
        
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

  const refreshData = useCallback(() => {
    setLastRefresh(Date.now());
  }, []);

  const clearCache = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      debug('[DataCache] Cache cleared');
      refreshData();
    } catch (error) {
      logError('[DataCache] Error clearing cache:', error);
    }
  }, [refreshData]);

  useEffect(() => {
    const loadFromCache = () => {
      try {
        const cachedDataStr = localStorage.getItem(STORAGE_KEY);
        
        if (cachedDataStr) {
          const cachedData = JSON.parse(cachedDataStr);
          const now = Date.now();
          
          if (cachedData.version === CACHE_VERSION && 
              now - cachedData.lastUpdated < CACHE_EXPIRY_TIME) {
            
            setDataState({
              trades: cachedData.trades || [],
              userData: cachedData.userData || null,
              isCacheValid: true,
              isTradesLoaded: cachedData.trades && cachedData.trades.length > 0,
              isUserDataLoaded: !!cachedData.userData
            });
            
            debug('[DataCache] Loaded data from cache');
          } else {
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
        localStorage.removeItem(STORAGE_KEY);
      }
    };
    
    loadFromCache();
    
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
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

  useEffect(() => {
    if (!userId) return;
    
    const cachedDataStr = localStorage.getItem(STORAGE_KEY);
    let shouldSetLoading = true;
    
    if (cachedDataStr) {
      try {
        const cachedData: CachedData = JSON.parse(cachedDataStr);
        const now = Date.now();
        
        if (now - cachedData.lastUpdated < CACHE_EXPIRY_TIME && lastRefresh === 0) {
          shouldSetLoading = false;
          debug('[DataCache] Using valid cache, skipping loading state');
        }
      } catch (e) {
        logError('[DataCache] Error parsing cache:', e);
      }
    }
    
    if (shouldSetLoading) {
      setIsLoading(true);
    }
    
    const { trades: currentTrades, userData: currentUserData } = dataState;
    
    const fetchUserData = async () => {
      try {
        if (currentUserData && lastRefresh === 0 && dataState.isUserDataLoaded) {
          debug('[DataCache] Using existing userData, avoiding re-fetch');
          return;
        }
        
        const data = await getUserData(userId);
        if (data) {
          setDataState(prevState => ({
            ...prevState,
            userData: data,
            isUserDataLoaded: true
          }));
          
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
    
    let unsubscribed = false;
    
    try {
      debug('[DataCache] Setting up trades snapshot listener');
      const unsubscribe = onTradesSnapshot(
        userId,
        (fetchedTrades) => {
          debug(`[DataCache] Received ${fetchedTrades.length} trades from snapshot`);
          
          setDataState(prevState => {
            const tradesChanged = JSON.stringify(fetchedTrades) !== JSON.stringify(prevState.trades);
            
            if (tradesChanged) {
              debug('[DataCache] Trades changed, updating cache');
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
      return () => {};
    }
  }, [userId, lastRefresh, updateCache, dataState]); 

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