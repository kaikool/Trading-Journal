/**
 * Market Price Service
 * 
 * Module này cung cấp các hàm để lấy giá thị trường real-time từ TwelveData API
 * Sử dụng thẳng API key hardcoded và gọi trực tiếp tới TwelveData API
 */

import { debug, logError, logWarning } from './debug';
import axios from 'axios';

// Kiểu dữ liệu trả về từ TwelveData API đã được xóa vì không sử dụng

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

// Hardcoded API key - được sử dụng trực tiếp trong code (không lấy từ env hay config)
const HARDCODED_API_KEY = '1b89f469e4fa408d8700380d216f0864';

// API base URL của TwelveData
const API_BASE_URL = 'https://api.twelvedata.com';

// Khởi tạo axios client
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000
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
    
    // Chuyển đổi ký hiệu sang định dạng TwelveData
    const formattedSymbol = formatSymbolForAPI(normalizedSymbol);
    
    debug(`[MarketPrice] Using formatted symbol: ${formattedSymbol}`);
    debug(`[MarketPrice] Calling TwelveData API directly with hardcoded API key`);
    
    // Thực hiện API call với hardcoded key
    const response = await apiClient.get('/price', {
      params: {
        symbol: formattedSymbol,
        format: 'JSON',
        apikey: HARDCODED_API_KEY
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

// Hàm fetchMultiplePrices đã bị loại bỏ vì không được sử dụng

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

