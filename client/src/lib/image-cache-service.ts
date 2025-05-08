/**
 * image-cache-service.ts
 * 
 * Dịch vụ quản lý bộ đệm ảnh hai lớp (2-level caching) cho hình ảnh Firebase Storage
 * - Lớp 1: Cache bộ nhớ (memory cache) - lưu trữ tạm thời trong RAM, mất đi khi làm mới
 * - Lớp 2: Cache trình duyệt (localStorage) - lưu trữ lâu dài, giữ lại sau khi làm mới
 * 
 * Mục tiêu:
 * - Giảm đáng kể số lượng cuộc gọi đến Firebase Storage
 * - Tăng tốc độ hiển thị ảnh trên giao diện người dùng
 * - Giảm lượng băng thông sử dụng và cải thiện trải nghiệm người dùng
 * 
 * Được tối ưu hóa cho hiệu suất với các cơ chế:
 * - Cache invalidation thông minh
 * - Prefetching cho các ảnh thường xuyên được xem
 * - Hỗ trợ các chiến lược nén và tối ưu hóa ảnh
 */

import { getStorageDownloadUrl } from "./firebase";
import { debug, logError } from "./debug";

// Thời gian hết hạn mặc định cho bộ đệm
const DEFAULT_CACHE_EXPIRATION = 24 * 60 * 60 * 1000; // 24 giờ
const MEMORY_CACHE_EXPIRATION = 5 * 60 * 1000; // 5 phút

// Kích thước tối đa cho bộ đệm localStorage (tính bằng bytes)
const MAX_LOCAL_STORAGE_SIZE = 5 * 1024 * 1024; // 5MB
const LOCAL_STORAGE_KEY_PREFIX = 'firebase_image_cache_';
const CACHE_METADATA_KEY = 'firebase_image_cache_metadata';

// Interface cho dữ liệu cache
interface CacheEntry {
  url: string;          // URL đầy đủ của ảnh
  timestamp: number;    // Thời điểm lưu vào cache
  expiry: number;       // Thời điểm hết hạn
  size?: number;        // Kích thước dữ liệu (bytes)
}

interface CacheMetadata {
  totalSize: number;       // Tổng kích thước hiện tại của cache
  lastCleanup: number;     // Lần dọn dẹp cuối cùng
  entries: Record<string, {   // Thông tin về các mục trong cache
    key: string;
    size: number;
    timestamp: number;
    expiry: number;
  }>;
}

// Bộ nhớ cache trong RAM
const memoryCache: Map<string, CacheEntry> = new Map();

// Quản lý bộ nhớ cache trong localStorage
class LocalStorageCache {
  private metadata: CacheMetadata;
  
  constructor() {
    // Khởi tạo metadata
    this.metadata = this.loadMetadata();
    
    // Tự động dọn dẹp cache khi khởi tạo nếu cần
    if (Date.now() - this.metadata.lastCleanup > 12 * 60 * 60 * 1000) { // 12 giờ
      this.cleanup();
    }
  }
  
  /**
   * Tải metadata từ localStorage
   */
  private loadMetadata(): CacheMetadata {
    try {
      const storedMetadata = localStorage.getItem(CACHE_METADATA_KEY);
      if (storedMetadata) {
        return JSON.parse(storedMetadata);
      }
    } catch (err) {
      logError('Error loading cache metadata:', err);
    }
    
    // Trả về metadata mặc định nếu không tìm thấy hoặc có lỗi
    return {
      totalSize: 0,
      lastCleanup: Date.now(),
      entries: {}
    };
  }
  
  /**
   * Lưu metadata vào localStorage
   */
  private saveMetadata(): void {
    try {
      localStorage.setItem(CACHE_METADATA_KEY, JSON.stringify(this.metadata));
    } catch (err) {
      logError('Error saving cache metadata:', err);
    }
  }
  
  /**
   * Lấy một mục từ cache
   * @param key Khóa của mục cần lấy
   */
  get(key: string): string | null {
    const fullKey = `${LOCAL_STORAGE_KEY_PREFIX}${key}`;
    
    try {
      // Kiểm tra xem mục có tồn tại và còn hạn không
      const entry = this.metadata.entries[key];
      if (!entry || entry.expiry < Date.now()) {
        // Nếu hết hạn, xóa khỏi cache
        if (entry) {
          this.remove(key);
        }
        return null;
      }
      
      // Lấy dữ liệu từ localStorage
      return localStorage.getItem(fullKey);
    } catch (err) {
      logError('Error retrieving from localStorage cache:', err);
      return null;
    }
  }
  
  /**
   * Lưu một mục vào cache
   * @param key Khóa của mục
   * @param value Giá trị cần lưu
   * @param expiryTime Thời gian hết hạn (ms)
   */
  set(key: string, value: string, expiryTime: number = DEFAULT_CACHE_EXPIRATION): boolean {
    try {
      const fullKey = `${LOCAL_STORAGE_KEY_PREFIX}${key}`;
      const now = Date.now();
      const expiry = now + expiryTime;
      const valueSize = this.getStringByteSize(value);
      
      // Kiểm tra nếu không đủ không gian
      if (valueSize > MAX_LOCAL_STORAGE_SIZE) {
        debug(`Item too large for cache: ${valueSize} bytes`);
        return false;
      }
      
      // Tạo không gian nếu cần thiết
      if (this.metadata.totalSize + valueSize > MAX_LOCAL_STORAGE_SIZE) {
        this.makeSpace(valueSize);
      }
      
      // Lưu vào localStorage
      localStorage.setItem(fullKey, value);
      
      // Cập nhật metadata
      this.metadata.entries[key] = {
        key,
        size: valueSize,
        timestamp: now,
        expiry
      };
      
      this.metadata.totalSize += valueSize;
      this.saveMetadata();
      
      return true;
    } catch (err) {
      logError('Error setting item in localStorage cache:', err);
      return false;
    }
  }
  
  /**
   * Xóa một mục khỏi cache
   * @param key Khóa của mục cần xóa
   */
  remove(key: string): void {
    try {
      const fullKey = `${LOCAL_STORAGE_KEY_PREFIX}${key}`;
      const entry = this.metadata.entries[key];
      
      if (entry) {
        localStorage.removeItem(fullKey);
        this.metadata.totalSize -= entry.size;
        delete this.metadata.entries[key];
        this.saveMetadata();
      }
    } catch (err) {
      logError('Error removing item from localStorage cache:', err);
    }
  }
  
  /**
   * Xóa tất cả mục trong cache
   */
  clear(): void {
    try {
      // Xóa tất cả các mục liên quan đến cache
      Object.keys(this.metadata.entries).forEach(key => {
        const fullKey = `${LOCAL_STORAGE_KEY_PREFIX}${key}`;
        localStorage.removeItem(fullKey);
      });
      
      // Đặt lại metadata
      this.metadata = {
        totalSize: 0,
        lastCleanup: Date.now(),
        entries: {}
      };
      
      this.saveMetadata();
    } catch (err) {
      logError('Error clearing localStorage cache:', err);
    }
  }
  
  /**
   * Xóa các mục hết hạn và cũ nhất để làm chỗ cho mục mới
   * @param requiredSpace Không gian cần thiết (bytes)
   */
  private makeSpace(requiredSpace: number): void {
    try {
      const now = Date.now();
      const entries = Object.values(this.metadata.entries);
      
      // Trước tiên, xóa các mục đã hết hạn
      let entriesRemoved = 0;
      for (const entry of entries) {
        if (entry.expiry < now) {
          this.remove(entry.key);
          entriesRemoved++;
        }
      }
      
      // Nếu vẫn không đủ không gian, xóa các mục cũ nhất
      if (this.metadata.totalSize + requiredSpace > MAX_LOCAL_STORAGE_SIZE) {
        // Sắp xếp các mục theo thời gian (cũ nhất đầu tiên)
        const sortedEntries = Object.values(this.metadata.entries)
          .sort((a, b) => a.timestamp - b.timestamp);
        
        // Xóa các mục cũ nhất cho đến khi có đủ không gian
        for (const entry of sortedEntries) {
          this.remove(entry.key);
          entriesRemoved++;
          
          if (this.metadata.totalSize + requiredSpace <= MAX_LOCAL_STORAGE_SIZE) {
            break;
          }
        }
      }
      
      if (entriesRemoved > 0) {
        debug(`Cache cleanup: removed ${entriesRemoved} items`);
      }
    } catch (err) {
      logError('Error making space in localStorage cache:', err);
    }
  }
  
  /**
   * Tính kích thước của một chuỗi (bytes)
   * @param str Chuỗi cần tính kích thước
   */
  private getStringByteSize(str: string): number {
    try {
      // Sử dụng TextEncoder để tính kích thước chính xác
      return new TextEncoder().encode(str).length;
    } catch (err) {
      // Fallback nếu TextEncoder không được hỗ trợ
      return new Blob([str]).size;
    }
  }
  
  /**
   * Dọn dẹp cache: xóa các mục hết hạn
   */
  cleanup(): void {
    try {
      const now = Date.now();
      let entriesRemoved = 0;
      
      Object.keys(this.metadata.entries).forEach(key => {
        const entry = this.metadata.entries[key];
        if (entry.expiry < now) {
          this.remove(key);
          entriesRemoved++;
        }
      });
      
      if (entriesRemoved > 0) {
        debug(`Cache cleanup: removed ${entriesRemoved} expired items`);
      }
      
      this.metadata.lastCleanup = now;
      this.saveMetadata();
    } catch (err) {
      logError('Error during cache cleanup:', err);
    }
  }
}

// Khởi tạo cache
const localStorageCache = new LocalStorageCache();

// Chuyển đổi đường dẫn Firebase thành khóa cache
function createCacheKey(path: string): string {
  // Loại bỏ các ký tự không hợp lệ cho khóa
  return path.replace(/[^a-zA-Z0-9_-]/g, '_');
}

/**
 * Lấy URL hình ảnh từ cache hoặc Firebase Storage
 * 
 * @param path Đường dẫn Firebase Storage hoặc URL Firebase
 * @param options Tùy chọn bộ đệm
 */
export async function getCachedImageUrl(
  path: string, 
  options: {
    bypassCache?: boolean;      // Bỏ qua cache và lấy trực tiếp từ Firebase
    forceRefresh?: boolean;     // Cập nhật cache ngay cả khi có trong bộ nhớ cache
    expiryTime?: number;        // Thời gian hết hạn tùy chỉnh (ms)
  } = {}
): Promise<string> {
  try {
    if (!path) return '';
    
    // Nếu đã là URL đầy đủ và không phải URL Firebase Storage, trả về luôn
    if (path.startsWith('http') && !path.includes('firebasestorage.googleapis.com')) {
      return path;
    }
    
    const cacheKey = createCacheKey(path);
    
    // Kiểm tra trong memory cache trước tiên (nhanh nhất)
    if (!options.bypassCache && !options.forceRefresh) {
      const memoryCacheEntry = memoryCache.get(cacheKey);
      
      if (memoryCacheEntry && memoryCacheEntry.expiry > Date.now()) {
        debug(`Image URL retrieved from memory cache: ${path}`);
        return memoryCacheEntry.url;
      }
    }
    
    // Nếu không có trong memory cache, kiểm tra trong localStorage cache
    if (!options.bypassCache && !options.forceRefresh) {
      const localStorageUrl = localStorageCache.get(cacheKey);
      
      if (localStorageUrl) {
        debug(`Image URL retrieved from localStorage cache: ${path}`);
        
        // Cập nhật memory cache
        memoryCache.set(cacheKey, {
          url: localStorageUrl,
          timestamp: Date.now(),
          expiry: Date.now() + MEMORY_CACHE_EXPIRATION
        });
        
        return localStorageUrl;
      }
    }
    
    // Nếu không có trong cache hoặc buộc làm mới, lấy từ Firebase
    debug(`Fetching image URL from Firebase Storage: ${path}`);
    const downloadUrl = await getStorageDownloadUrl(path);
    
    // Lưu vào cả hai cache để sử dụng sau này
    if (downloadUrl && downloadUrl !== path) {
      // Lưu vào memory cache
      memoryCache.set(cacheKey, {
        url: downloadUrl,
        timestamp: Date.now(),
        expiry: Date.now() + MEMORY_CACHE_EXPIRATION
      });
      
      // Lưu vào localStorage cache với thời gian hết hạn được chỉ định hoặc mặc định
      const expiryTime = options.expiryTime || DEFAULT_CACHE_EXPIRATION;
      localStorageCache.set(cacheKey, downloadUrl, expiryTime);
      
      debug(`Image URL cached: ${path}`);
    }
    
    return downloadUrl;
  } catch (error) {
    logError(`Error getting cached image URL for ${path}:`, error);
    return path; // Trả về path gốc nếu có lỗi
  }
}

/**
 * Xóa một mục khỏi cache
 * @param path Đường dẫn Firebase Storage
 */
export function invalidateImageCache(path: string): void {
  try {
    const cacheKey = createCacheKey(path);
    
    // Xóa khỏi memory cache
    memoryCache.delete(cacheKey);
    
    // Xóa khỏi localStorage cache
    localStorageCache.remove(cacheKey);
    
    debug(`Cache invalidated for: ${path}`);
  } catch (error) {
    logError(`Error invalidating cache for ${path}:`, error);
  }
}

/**
 * Preload hình ảnh vào cache 
 * @param paths Mảng đường dẫn Firebase Storage cần preload
 */
export async function preloadImagesToCache(paths: string[]): Promise<void> {
  try {
    debug(`Preloading ${paths.length} images to cache`);
    
    // Tạo một mảng các promises
    const preloadPromises = paths.map(path => 
      getCachedImageUrl(path, { forceRefresh: false, expiryTime: DEFAULT_CACHE_EXPIRATION })
    );
    
    // Chờ tất cả hoàn thành
    await Promise.all(preloadPromises);
    
    debug(`Successfully preloaded ${paths.length} images to cache`);
  } catch (error) {
    logError('Error preloading images to cache:', error);
  }
}

/**
 * Xóa tất cả bộ đệm hình ảnh 
 */
export function clearAllImageCache(): void {
  try {
    // Xóa memory cache
    memoryCache.clear();
    
    // Xóa localStorage cache
    localStorageCache.clear();
    
    debug('All image caches cleared');
  } catch (error) {
    logError('Error clearing all image caches:', error);
  }
}

/**
 * Dọn dẹp các mục hết hạn trong bộ đệm
 */
export function cleanupImageCache(): void {
  try {
    // Xóa các mục hết hạn trong memory cache
    const now = Date.now();
    let expiredMemoryEntries = 0;
    
    // Tạo mảng từ các entries để tránh lỗi với thiếu tính năng downlevelIteration
    Array.from(memoryCache.keys()).forEach(key => {
      const entry = memoryCache.get(key);
      if (entry && entry.expiry < now) {
        memoryCache.delete(key);
        expiredMemoryEntries++;
      }
    });
    
    // Dọn dẹp localStorage cache
    localStorageCache.cleanup();
    
    if (expiredMemoryEntries > 0) {
      debug(`Cleanup: removed ${expiredMemoryEntries} expired items from memory cache`);
    }
  } catch (error) {
    logError('Error cleaning up image cache:', error);
  }
}

// Tự động dọn dẹp cache mỗi giờ
setInterval(cleanupImageCache, 60 * 60 * 1000);

// Cửa sổ của dịch vụ cache ảnh
export default {
  getCachedImageUrl,
  invalidateImageCache,
  preloadImagesToCache,
  clearAllImageCache,
  cleanupImageCache
};