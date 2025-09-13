/**
 * image-cache-service.ts
 * 
 * Dịch vụ cache hình ảnh 2 tầng (2-level caching)
 * - Tầng 1: Cache bộ nhớ (memory cache) — nhanh, mất khi reload
 * - Tầng 2: Cache trình duyệt (localStorage) — bền, giữ sau reload
 * 
 * Mục tiêu:
 * - Giảm số lần tải ảnh lặp lại
 * - Tăng tốc hiển thị ảnh trong UI
 * - Giảm băng thông
 * 
 * Tối ưu hiệu năng:
 * - Invalidation thông minh
 * - Pre-warm (có thể thêm sau)
 * - Hỗ trợ nén/tối ưu ảnh ở upstream (nếu có)
 */

import { debug, logError } from "./debug";

// TTL mặc định
const DEFAULT_CACHE_EXPIRATION = 24 * 60 * 60 * 1000; // 24h
const MEMORY_CACHE_EXPIRATION  = 5  * 60 * 1000;      // 5m

// Giới hạn localStorage
const MAX_LOCAL_STORAGE_SIZE   = 5 * 1024 * 1024;     // 5MB
const LOCAL_STORAGE_KEY_PREFIX = 'image_cache_';
const CACHE_METADATA_KEY       = 'image_cache_metadata';

interface CacheEntry {
  url: string;
  timestamp: number;
  expiry: number;
  size?: number;
}

interface CacheMetadata {
  totalSize: number;
  lastCleanup: number;
  entries: Record<string, {
    key: string;
    size: number;
    timestamp: number;
    expiry: number;
  }>;
}

// Cache trong RAM
const memoryCache: Map<string, CacheEntry> = new Map();

// Quản lý cache localStorage
class LocalStorageCache {
  private metadata: CacheMetadata;

  constructor() {
    this.metadata = this.loadMetadata();
    // Tự dọn 12h/lần khi khởi tạo
    if (Date.now() - this.metadata.lastCleanup > 12 * 60 * 60 * 1000) {
      this.cleanup();
    }
  }

  private loadMetadata(): CacheMetadata {
    try {
      const stored = localStorage.getItem(CACHE_METADATA_KEY);
      if (stored) return JSON.parse(stored);
    } catch (err) {
      logError('Error loading cache metadata:', err);
    }
    return { totalSize: 0, lastCleanup: Date.now(), entries: {} };
  }

  private saveMetadata(): void {
    try {
      localStorage.setItem(CACHE_METADATA_KEY, JSON.stringify(this.metadata));
    } catch (err) {
      logError('Error saving cache metadata:', err);
    }
  }

  get(key: string): string | null {
    const fullKey = `${LOCAL_STORAGE_KEY_PREFIX}${key}`;
    try {
      const entry = this.metadata.entries[key];
      if (!entry || entry.expiry < Date.now()) {
        if (entry) this.remove(key);
        return null;
      }
      return localStorage.getItem(fullKey);
    } catch (err) {
      logError('Error retrieving from localStorage cache:', err);
      return null;
    }
  }

  set(key: string, value: string, expiryTime: number = DEFAULT_CACHE_EXPIRATION): boolean {
    try {
      const fullKey   = `${LOCAL_STORAGE_KEY_PREFIX}${key}`;
      const now       = Date.now();
      const expiry    = now + expiryTime;
      const valueSize = this.getStringByteSize(value);

      if (valueSize > MAX_LOCAL_STORAGE_SIZE) {
        debug(`Item too large for cache: ${valueSize} bytes`);
        return false;
      }
      if (this.metadata.totalSize + valueSize > MAX_LOCAL_STORAGE_SIZE) {
        this.makeSpace(valueSize);
      }
      localStorage.setItem(fullKey, value);

      this.metadata.entries[key] = { key, size: valueSize, timestamp: now, expiry };
      this.metadata.totalSize += valueSize;
      this.saveMetadata();
      return true;
    } catch (err) {
      logError('Error setting item in localStorage cache:', err);
      return false;
    }
  }

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

  clear(): void {
    try {
      Object.keys(this.metadata.entries).forEach(key => {
        const fullKey = `${LOCAL_STORAGE_KEY_PREFIX}${key}`;
        localStorage.removeItem(fullKey);
      });
      this.metadata = { totalSize: 0, lastCleanup: Date.now(), entries: {} };
      this.saveMetadata();
    } catch (err) {
      logError('Error clearing localStorage cache:', err);
    }
  }

  private makeSpace(requiredSpace: number): void {
    try {
      const now = Date.now();
      const entries = Object.values(this.metadata.entries);
      let removed = 0;

      // Xoá mục hết hạn trước
      for (const entry of entries) {
        if (entry.expiry < now) {
          this.remove(entry.key);
          removed++;
        }
      }
      // Nếu vẫn thiếu chỗ, xoá mục cũ nhất
      if (this.metadata.totalSize + requiredSpace > MAX_LOCAL_STORAGE_SIZE) {
        const sorted = Object.values(this.metadata.entries).sort((a, b) => a.timestamp - b.timestamp);
        for (const entry of sorted) {
          this.remove(entry.key);
          removed++;
          if (this.metadata.totalSize + requiredSpace <= MAX_LOCAL_STORAGE_SIZE) break;
        }
      }
      if (removed > 0) debug(`Cache cleanup: removed ${removed} items`);
    } catch (err) {
      logError('Error making space in localStorage cache:', err);
    }
  }

  private getStringByteSize(str: string): number {
    try {
      return new TextEncoder().encode(str).length;
    } catch {
      return new Blob([str]).size;
    }
  }

  cleanup(): void {
    try {
      const now = Date.now();
      let removed = 0;
      Object.keys(this.metadata.entries).forEach(key => {
        const entry = this.metadata.entries[key];
        if (entry.expiry < now) {
          this.remove(key);
          removed++;
        }
      });
      if (removed > 0) debug(`Cache cleanup: removed ${removed} expired items`);
      this.metadata.lastCleanup = now;
      this.saveMetadata();
    } catch (err) {
      logError('Error during cache cleanup:', err);
    }
  }
}

const localStorageCache = new LocalStorageCache();

function createCacheKey(path: string): string {
  return path.replace(/[^a-zA-Z0-9_-]/g, '_');
}

/**
 * Lấy URL hình ảnh từ cache hoặc trả nguyên path/URL
 * 
 * @param path Đường dẫn ảnh (local) hoặc URL (http/https)
 * @param options 
 */
export async function getCachedImageUrl(
  path: string, 
  options: {
    bypassCache?: boolean;      // Bỏ qua cache
    forceRefresh?: boolean;     // Ghi đè cache hiện có
    expiryTime?: number;        // TTL tùy chỉnh (ms)
  } = {}
): Promise<string> {
  try {
    if (!path) return '';

    // URL đầy đủ → trả ngay
    if (path.startsWith('http')) {
      return path;
    }

    const cacheKey = createCacheKey(path);

    // 1) memory cache
    if (!options.bypassCache && !options.forceRefresh) {
      const entry = memoryCache.get(cacheKey);
      if (entry && entry.expiry > Date.now()) {
        debug(`Image URL from memory cache: ${path}`);
        return entry.url;
      }
    }
    // 2) localStorage cache
    if (!options.bypassCache && !options.forceRefresh) {
      const stored = localStorageCache.get(cacheKey);
      if (stored) {
        debug(`Image URL from localStorage cache: ${path}`);
        memoryCache.set(cacheKey, {
          url: stored,
          timestamp: Date.now(),
          expiry: Date.now() + MEMORY_CACHE_EXPIRATION
        });
        return stored;
      }
    }

    // 3) Không có trong cache → trả nguyên path (local) và cache lại để dùng nhanh lần sau
    debug(`Cache miss → using path directly: ${path}`);
    const urlToUse = path;

    // Lưu vào cache (nếu không bypass)
    if (!options.bypassCache) {
      const ttl = options.expiryTime || DEFAULT_CACHE_EXPIRATION;
      memoryCache.set(cacheKey, {
        url: urlToUse,
        timestamp: Date.now(),
        expiry: Date.now() + MEMORY_CACHE_EXPIRATION
      });
      localStorageCache.set(cacheKey, urlToUse, ttl);
    }

    return urlToUse;
  } catch (error) {
    logError(`Error getting cached image URL for ${path}:`, error);
    return path;
  }
}

/**
 * Invalidate cache cho 1 ảnh
 */
export function invalidateImageCache(path: string): void {
  try {
    const cacheKey = createCacheKey(path);
    memoryCache.delete(cacheKey);
    localStorageCache.remove(cacheKey);
    debug(`Cache invalidated for: ${path}`);
  } catch (error) {
    logError(`Error invalidating cache for ${path}:`, error);
  }
}

/**
 * Dọn cache hết hạn
 */
export function cleanupImageCache(): void {
  try {
    const now = Date.now();
    let expiredMemoryEntries = 0;
    Array.from(memoryCache.keys()).forEach(key => {
      const entry = memoryCache.get(key);
      if (entry && entry.expiry < now) {
        memoryCache.delete(key);
        expiredMemoryEntries++;
      }
    });
    localStorageCache.cleanup();
    if (expiredMemoryEntries > 0) {
      debug(`Cleanup: removed ${expiredMemoryEntries} expired items from memory cache`);
    }
  } catch (error) {
    logError('Error cleaning up image cache:', error);
  }
}

// Tự động dọn dẹp mỗi giờ
setInterval(cleanupImageCache, 60 * 60 * 1000);
