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
    
    const fetchUserData = async () => {
      try {
        // Using a functional update to always get the latest state
        setDataState(prevState => {
          // First check if we can use existing userData
          if (prevState.userData && lastRefresh === 0 && prevState.isUserDataLoaded) {
            debug('[DataCache] Using existing userData, avoiding re-fetch');
            return prevState; // No change needed
          }
          
          // Otherwise, fetch the new data
          getUserData(userId).then(data => {
            if (data) {
              // Update with the fetched data
              // Call setDataState and updateCache in sequence with prevState
              setDataState(currState => {
                // Use latest state from callback to ensure we have current data
                const updatedState = {
                  ...currState,
                  userData: data,
                  isUserDataLoaded: true
                };
                
                // Also update the cache with latest trades and new userData
                updateCache({ 
                  trades: updatedState.trades, 
                  userData: data, 
                  lastUpdated: Date.now()
                });
                
                return updatedState;
              });
            }
          }).catch(error => {
            logError("[DataCache] Error fetching user data:", error);
          });
          
          // Return unchanged state initially
          return prevState;
        });
      } catch (error) {
        logError("[DataCache] Error in fetchUserData outer block:", error);
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
            // PERFORMANCE OPTIMIZATION: Avoid expensive JSON.stringify for deep comparison
            // Instead use a simpler length check with sample validation
            let tradesChanged = fetchedTrades.length !== prevState.trades.length;
            
            // If lengths are the same, only check a few key trades
            if (!tradesChanged && fetchedTrades.length > 0) {
              // Check the first trade which is usually the most recent
              if (fetchedTrades[0]?.id !== prevState.trades[0]?.id) {
                tradesChanged = true;
              }
              // Check another random trade if we have at least 3
              else if (fetchedTrades.length >= 3) {
                const randomIndex = Math.floor(Math.random() * fetchedTrades.length);
                const newTrade = fetchedTrades[randomIndex];
                const oldTrade = prevState.trades.find(t => t.id === newTrade.id);
                
                // If we can't find the trade or its timestamp changed
                // Safely check for Firestore Timestamp objects vs serialized dates
                if (!oldTrade || 
                    // Handle both Firestore Timestamp and serialized dates
                    (typeof newTrade.updatedAt?.toDate === 'function' && 
                     typeof oldTrade.updatedAt?.toDate !== 'function') ||
                    // Handle string comparison for cache objects
                    (typeof newTrade.updatedAt === 'string' && 
                     newTrade.updatedAt !== oldTrade.updatedAt)) {
                  tradesChanged = true;
                }
              }
            }
            
            // Check if any trades were closed in this update (for debugging)
            const newlyClosedTrades = fetchedTrades.filter(newTrade => {
              // Find corresponding trade in previous state
              const oldTrade = prevState.trades.find(t => t.id === newTrade.id);
              
              // Check if trade was just closed (isOpen changed from true to false)
              return oldTrade && 
                     oldTrade.isOpen === true && 
                     newTrade.isOpen === false;
            });
            
            // Log closed trades for debugging
            if (newlyClosedTrades.length > 0) {
              debug(`[DataCache] Detected ${newlyClosedTrades.length} newly closed trades`);
            }
            
            if (tradesChanged) {
              debug('[DataCache] Trades changed, updating cache');
              // Use queueMicrotask instead of setTimeout for better performance
              queueMicrotask(() => {
                updateCache({ 
                  trades: fetchedTrades, 
                  userData: prevState.userData, 
                  lastUpdated: Date.now()
                });
                
                // Cache updated, can add logic here if needed
              });
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
  }, [userId, lastRefresh, updateCache]); // Removed dataState dependency to prevent infinite loops

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