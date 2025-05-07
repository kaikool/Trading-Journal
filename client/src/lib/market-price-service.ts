/**
 * Market Price Service
 * 
 * Module này cung cấp các hàm để lấy giá thị trường real-time từ TwelveData API
 * Sử dụng debounce và cache để tránh gọi API quá nhiều
 */

import { debug, logError, logWarning } from './debug';
import axios from 'axios';
import { auth, db } from './firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

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

// Lấy API key từ Firestore, fallback về localStorage hoặc window.ENV nếu chưa đăng nhập
export async function getApiKeyFromFirebase(): Promise<string | null> {
  try {
    const user = auth.currentUser;
    if (!user) {
      debug('[MarketPrice] No authenticated user, using fallback sources');
      // Ưu tiên sử dụng localStorage trước
      const localKey = localStorage.getItem('twelvedata_api_key');
      if (localKey) {
        return localKey;
      }
      
      // Nếu không có trong localStorage, kiểm tra window.ENV (môi trường production)
      if (typeof window !== 'undefined' && window.ENV?.TWELVEDATA_API_KEY) {
        debug('[MarketPrice] Using API key from window.ENV');
        return window.ENV.TWELVEDATA_API_KEY;
      }
      
      return null;
    }
    
    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists() && userDoc.data().apiSettings?.twelvedataApiKey) {
      debug('[MarketPrice] Using API key from Firebase');
      return userDoc.data().apiSettings.twelvedataApiKey;
    }
    
    // Fallback to localStorage if key not found in Firebase
    debug('[MarketPrice] API key not found in Firebase, using fallback sources');
    const localKey = localStorage.getItem('twelvedata_api_key');
    if (localKey) {
      return localKey;
    }
    
    // Kiểm tra window.ENV (môi trường production)
    if (typeof window !== 'undefined' && window.ENV?.TWELVEDATA_API_KEY) {
      debug('[MarketPrice] Using API key from window.ENV');
      return window.ENV.TWELVEDATA_API_KEY;
    }
    
    return null;
  } catch (error) {
    logError('[MarketPrice] Error getting API key from Firebase:', error);
    
    // Trong trường hợp lỗi, thử các nguồn dự phòng
    const localKey = localStorage.getItem('twelvedata_api_key');
    if (localKey) {
      return localKey;
    }
    
    // Kiểm tra window.ENV (môi trường production)
    if (typeof window !== 'undefined' && window.ENV?.TWELVEDATA_API_KEY) {
      debug('[MarketPrice] Using API key from window.ENV');
      return window.ENV.TWELVEDATA_API_KEY;
    }
    
    return null;
  }
}

// Lấy API key từ tất cả các nguồn có thể
// Sử dụng cho trường hợp đồng bộ, không đợi Promise
export function getApiKey(): string | null {
  // Ưu tiên sử dụng localStorage trước
  const localKey = localStorage.getItem('twelvedata_api_key');
  if (localKey) {
    return localKey;
  }
  
  // Kiểm tra window.ENV (môi trường production)
  if (typeof window !== 'undefined' && window.ENV?.TWELVEDATA_API_KEY) {
    debug('[MarketPrice] Using API key from window.ENV');
    return window.ENV.TWELVEDATA_API_KEY;
  }
  
  return null;
}

// Lưu API key vào Firestore
export async function saveApiKeyToFirebase(apiKey: string): Promise<boolean> {
  try {
    const user = auth.currentUser;
    if (!user) {
      debug('[MarketPrice] No authenticated user, saving to localStorage only');
      localStorage.setItem('twelvedata_api_key', apiKey);
      return false;
    }
    
    const userDocRef = doc(db, "users", user.uid);
    
    // Cập nhật document người dùng với API key
    await updateDoc(userDocRef, {
      "apiSettings.twelvedataApiKey": apiKey,
      "apiSettings.updatedAt": new Date()
    });
    
    // Vẫn lưu vào localStorage để sử dụng trong trường hợp chưa đăng nhập
    localStorage.setItem('twelvedata_api_key', apiKey);
    debug('[MarketPrice] API key saved to Firebase and localStorage');
    
    return true;
  } catch (error) {
    logError('[MarketPrice] Error saving API key to Firebase:', error);
    // Fallback to localStorage
    localStorage.setItem('twelvedata_api_key', apiKey);
    return false;
  }
}

// Cấu hình cho axios - sử dụng proxy server local
const apiClient = axios.create({
  baseURL: '/api/twelvedata',  // Sử dụng proxy server local
  timeout: 5000,
});

/**
 * Lấy giá real-time từ TwelveData API qua proxy server
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
    
    // Chuyển đổi ký hiệu sang định dạng TwelveData
    const formattedSymbol = formatSymbolForAPI(normalizedSymbol);
    
    debug(`[MarketPrice] Using formatted symbol: ${formattedSymbol}`);
    
    // Ưu tiên lấy API key từ Firebase nếu đã đăng nhập
    let userApiKey = getApiKey(); // Lấy từ localStorage để phản hồi nhanh
    
    try {
      // Thử lấy API key từ Firebase nếu đã đăng nhập 
      if (auth.currentUser) {
        const firebaseApiKey = await getApiKeyFromFirebase();
        if (firebaseApiKey) {
          userApiKey = firebaseApiKey;
          // Cập nhật localStorage để lần sau không cần truy vấn Firebase
          localStorage.setItem('twelvedata_api_key', firebaseApiKey);
        }
      }
    } catch (error) {
      // Lỗi khi lấy từ Firebase, tiếp tục sử dụng key từ localStorage
      logError('[MarketPrice] Error getting API key from Firebase:', error);
    }
    
    const headers = userApiKey ? { 'X-API-KEY': userApiKey } : undefined;
    
    // Gọi API thông qua proxy server
    const response = await apiClient.get('/price', {
      params: {
        symbol: formattedSymbol,
        format: 'JSON'
      },
      headers
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
    
    // Định dạng mảng các ký hiệu theo TwelveData API
    const formattedSymbols = normalizedSymbols.map(s => formatSymbolForAPI(s));
    const formattedSymbolsStr = formattedSymbols.join(',');
    
    debug(`[MarketPrice] Using formatted symbols: ${formattedSymbolsStr}`);
    
    // Ưu tiên lấy API key từ Firebase nếu đã đăng nhập
    let userApiKey = getApiKey(); // Lấy từ localStorage để phản hồi nhanh
    
    try {
      // Thử lấy API key từ Firebase nếu đã đăng nhập 
      if (auth.currentUser) {
        const firebaseApiKey = await getApiKeyFromFirebase();
        if (firebaseApiKey) {
          userApiKey = firebaseApiKey;
          // Cập nhật localStorage để lần sau không cần truy vấn Firebase
          localStorage.setItem('twelvedata_api_key', firebaseApiKey);
        }
      }
    } catch (error) {
      // Lỗi khi lấy từ Firebase, tiếp tục sử dụng key từ localStorage
      logError('[MarketPrice] Error getting API key from Firebase:', error);
    }
    
    const headers = userApiKey ? { 'X-API-KEY': userApiKey } : undefined;
    
    // Gọi API thông qua proxy server
    const response = await apiClient.get('/price', {
      params: {
        symbol: formattedSymbolsStr,
        format: 'JSON'
      },
      headers
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
 * Chuyển đổi ký hiệu Forex thông thường sang định dạng TwelveData API
 * Ví dụ: "EURUSD" -> "EUR/USD"
 */
export function formatSymbolForAPI(symbol: string): string {
  if (!symbol) return "";
  
  // Ký hiệu đã đúng định dạng TwelveData API
  if (symbol.includes('/')) {
    return symbol;
  }
  
  // Xử lý đặc biệt cho XAUUSD (Gold) -> 'XAU/USD'
  if (symbol.toUpperCase() === 'XAUUSD') {
    return 'XAU/USD';
  }
  
  // Xử lý đặc biệt cho XAGUSD (Silver) -> 'XAG/USD'
  if (symbol.toUpperCase() === 'XAGUSD') {
    return 'XAG/USD';
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