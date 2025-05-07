/**
 * Market Price Service
 * 
 * Module này cung cấp các hàm để lấy giá thị trường real-time từ TwelveData API
 * Sử dụng debounce và cache để tránh gọi API quá nhiều
 */

import { debug, logError, logWarning } from './debug';
import axios from 'axios';

// Kiểu dữ liệu trả về từ TwelveData API
interface TwelveDataPrice {
  symbol: string;        // Ví dụ: "EURUSD"
  price: number;         // Ví dụ: 1.0871
  timestamp: number;     // Unix timestamp
}

interface PriceCache {
  [symbol: string]: {
    price: number;
    timestamp: number;   // Thời gian lấy giá
    expiry: number;      // Thời gian hết hạn cache
  }
}

// Cache lưu giá để tránh gọi API quá nhiều
const priceCache: PriceCache = {};

// Thời gian cache (15 giây)
const CACHE_DURATION = 15 * 1000;

// Cấu hình cho axios
const apiClient = axios.create({
  baseURL: 'https://api.twelvedata.com',
  timeout: 5000,
});

/**
 * Lấy giá real-time từ TwelveData API
 * 
 * @param symbol Cặp tiền tệ (vd: "EURUSD")
 * @returns Promise với giá hiện tại
 */
export async function fetchRealTimePrice(symbol: string): Promise<number> {
  try {
    // Chuẩn hóa ký hiệu
    const normalizedSymbol = symbol.toUpperCase();
    
    // Kiểm tra cache
    const now = Date.now();
    const cachedData = priceCache[normalizedSymbol];
    
    if (cachedData && now < cachedData.expiry) {
      debug(`[MarketPrice] Using cached price for ${normalizedSymbol}: ${cachedData.price}`);
      return cachedData.price;
    }
    
    // Nếu không có trong cache hoặc đã hết hạn, gọi API
    debug(`[MarketPrice] Fetching real-time price for ${normalizedSymbol}`);

    // Lấy API key từ biến môi trường hoặc window.ENV
    const apiKey = getApiKey();
    if (!apiKey) {
      throw new Error('TwelveData API key not found');
    }
    
    const response = await apiClient.get('/price', {
      params: {
        symbol: normalizedSymbol,
        apikey: apiKey,
        format: 'JSON'
      }
    });
    
    // Xác thực response
    if (!response.data || !response.data.price) {
      throw new Error(`Invalid response from TwelveData for ${normalizedSymbol}`);
    }
    
    // Chuyển đổi giá từ string sang number
    const price = parseFloat(response.data.price);
    
    // Lưu vào cache
    priceCache[normalizedSymbol] = {
      price,
      timestamp: now,
      expiry: now + CACHE_DURATION
    };
    
    debug(`[MarketPrice] Fetched price for ${normalizedSymbol}: ${price}`);
    return price;
    
  } catch (error) {
    logError(`[MarketPrice] Error fetching price for ${symbol}:`, error);
    
    // Trả về giá trong cache (nếu có), ngay cả khi đã hết hạn
    if (priceCache[symbol]) {
      logWarning(`[MarketPrice] Using expired cache for ${symbol}`);
      return priceCache[symbol].price;
    }
    
    throw new Error(`Cannot fetch price for ${symbol}`);
  }
}

/**
 * Lấy giá real-time từ TwelveData API cho nhiều cặp tiền tệ
 * 
 * @param symbols Mảng các cặp tiền tệ (vd: ["EURUSD", "USDJPY"])
 * @returns Promise với object chứa giá của các cặp
 */
export async function fetchMultiplePrices(symbols: string[]): Promise<Record<string, number>> {
  try {
    // Chuẩn hóa ký hiệu
    const normalizedSymbols = symbols.map(s => s.toUpperCase());
    const symbolsStr = normalizedSymbols.join(',');
    
    debug(`[MarketPrice] Fetching prices for multiple symbols: ${symbolsStr}`);
    
    // Lấy API key
    const apiKey = getApiKey();
    if (!apiKey) {
      throw new Error('TwelveData API key not found');
    }
    
    const response = await apiClient.get('/price', {
      params: {
        symbol: symbolsStr,
        apikey: apiKey,
        format: 'JSON'
      }
    });
    
    // Kết quả có thể là object duy nhất hoặc mảng objects tùy vào số lượng symbols
    const results: Record<string, number> = {};
    const now = Date.now();
    
    if (Array.isArray(response.data)) {
      // Nhiều kết quả
      response.data.forEach((item: any) => {
        if (item.symbol && item.price) {
          const symbol = item.symbol.toUpperCase();
          const price = parseFloat(item.price);
          
          results[symbol] = price;
          
          // Cập nhật cache
          priceCache[symbol] = {
            price,
            timestamp: now,
            expiry: now + CACHE_DURATION
          };
        }
      });
    } else if (response.data.symbol && response.data.price) {
      // Một kết quả duy nhất
      const symbol = response.data.symbol.toUpperCase();
      const price = parseFloat(response.data.price);
      
      results[symbol] = price;
      
      // Cập nhật cache
      priceCache[symbol] = {
        price,
        timestamp: now,
        expiry: now + CACHE_DURATION
      };
    }
    
    return results;
    
  } catch (error) {
    logError(`[MarketPrice] Error fetching multiple prices:`, error);
    
    // Trả về giá trong cache cho các cặp có sẵn
    const results: Record<string, number> = {};
    symbols.forEach(symbol => {
      const normalizedSymbol = symbol.toUpperCase();
      if (priceCache[normalizedSymbol]) {
        results[normalizedSymbol] = priceCache[normalizedSymbol].price;
      }
    });
    
    if (Object.keys(results).length > 0) {
      logWarning(`[MarketPrice] Using cached prices for some symbols`);
      return results;
    }
    
    throw error;
  }
}

/**
 * Lấy API key từ environment hoặc window.ENV
 */
function getApiKey(): string | null {
  // Thứ tự ưu tiên: 
  // 1. window.ENV (với prefix VITE_)
  // 2. import.meta.env (với prefix VITE_)
  
  if (typeof window !== 'undefined' && window.ENV && window.ENV.VITE_TWELVEDATA_API_KEY) {
    return window.ENV.VITE_TWELVEDATA_API_KEY;
  }
  
  if (import.meta.env.VITE_TWELVEDATA_API_KEY) {
    return import.meta.env.VITE_TWELVEDATA_API_KEY;
  }
  
  // Fallback: Có thể server đã set API key ở biến môi trường không có prefix VITE_
  if (import.meta.env.TWELVEDATA_API_KEY) {
    return import.meta.env.TWELVEDATA_API_KEY;
  }
  
  return null;
}

/**
 * Chuyển đổi ký hiệu Forex thông thường sang định dạng TwelveData API
 * Ví dụ: "EURUSD" -> "EUR/USD"
 */
export function formatSymbolForAPI(symbol: string): string {
  // Với hàng hóa như XAUUSD (Gold/USD), giữ nguyên
  if (symbol.startsWith('XAU') || symbol.startsWith('XAG')) {
    return symbol;
  }
  
  // Đối với các cặp tiền tệ, thêm dấu '/'
  if (symbol.length === 6) {
    return `${symbol.substring(0, 3)}/${symbol.substring(3, 6)}`;
  }
  
  // Mặc định trả về nguyên ký hiệu
  return symbol;
}

/**
 * Kiểm tra xem ký hiệu có được hỗ trợ bởi TwelveData không
 */
export function isSymbolSupported(symbol: string): boolean {
  // Danh sách các cặp tiền tệ/hàng hóa phổ biến
  const supportedSymbols = [
    'EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'AUDUSD', 'USDCAD', 
    'NZDUSD', 'EURJPY', 'GBPJPY', 'EURGBP', 'XAUUSD', 'XAGUSD'
  ];
  
  return supportedSymbols.includes(symbol.toUpperCase());
}