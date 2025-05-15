/**
 * Hook để lấy và quản lý giá real-time từ TwelveData API
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchRealTimePrice } from '@/lib/market-price-service';
import { debug } from '@/lib/debug';
import { toast } from '@/hooks/use-toast';

interface UseMarketPriceOptions {
  symbol: string;
  autoFetch?: boolean;   // Tự động fetch khi symbol thay đổi
  onSuccess?: (price: number) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook React để lấy giá thị trường real-time
 */
export function useMarketPrice({
  symbol,
  autoFetch = false,
  onSuccess,
  onError
}: UseMarketPriceOptions) {
  const [price, setPrice] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  // Sử dụng useRef để theo dõi nếu component vẫn đang mount
  const isMountedRef = useRef<boolean>(true);
  
  // Hàm fetch giá với debounce để tránh quá nhiều request
  const fetchPriceWithDebounce = useCallback(() => {
    if (!symbol) return;
    
    setIsLoading(true);
    setError(null);
    
    const controller = new AbortController();
    const fetchTimeout = setTimeout(() => controller.abort(), 8000); // Timeout sau 8 giây
    
    debug(`[useMarketPrice] Fetching price for ${symbol}`);
    
    fetchRealTimePrice(symbol)
      .then(fetchedPrice => {
        if (isMountedRef.current) {
          setPrice(fetchedPrice);
          setLastUpdated(new Date());
          setIsLoading(false);
          
          if (onSuccess) {
            onSuccess(fetchedPrice);
          }
        }
      })
      .catch(err => {
        if (isMountedRef.current) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to fetch price';
          const error = new Error(errorMessage);
          
          setError(error);
          setIsLoading(false);
          
          if (onError) {
            onError(error);
          } else {
            // Mặc định sẽ hiển thị toast nếu không có onError callback
            toast({
              title: "Error fetching price",
              description: errorMessage,
              variant: "destructive",
              duration: 3000
            });
          }
        }
      })
      .finally(() => {
        clearTimeout(fetchTimeout);
      });
  }, [symbol, onSuccess, onError]);
  
  // Hàm fetch giá được export ra ngoài để sử dụng
  const fetchPrice = useCallback(() => {
    if (isLoading) return; // Không fetch nếu đang loading
    fetchPriceWithDebounce();
  }, [fetchPriceWithDebounce, isLoading]);
  
  // Auto fetch khi symbol thay đổi nếu autoFetch = true
  useEffect(() => {
    if (autoFetch && symbol) {
      fetchPrice();
    }
  }, [symbol, autoFetch, fetchPrice]);
  
  // Cleanup khi unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  return {
    price,
    isLoading,
    error,
    lastUpdated,
    fetchPrice
  };
}

// Hook đơn giản hơn nếu chỉ muốn lấy giá một lần
export function useFetchPrice(symbol: string) {
  const [price, setPrice] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  
  const fetchPrice = useCallback(async () => {
    if (!symbol) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const fetchedPrice = await fetchRealTimePrice(symbol);
      setPrice(fetchedPrice);
      return fetchedPrice;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch price';
      const error = new Error(errorMessage);
      setError(error);
      throw error;
      
    } finally {
      setIsLoading(false);
    }
  }, [symbol]);
  
  return { price, isLoading, error, fetchPrice };
}