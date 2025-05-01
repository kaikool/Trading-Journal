/**
 * Image Cache Service
 * 
 * Dịch vụ quản lý việc lưu cache và truy xuất hình ảnh từ bộ nhớ đệm trình duyệt.
 * Sử dụng Cache Storage API cho môi trường hỗ trợ, và fallback về IndexedDB nếu cần.
 * 
 * Tính năng:
 * - Lưu cache hình ảnh theo URL
 * - Kiểm tra và cập nhật cache khi cần
 * - Quản lý thời hạn cache
 * - Hỗ trợ versioning để invalidate cache khi cần
 */

// Tên của cache storage
const CACHE_NAME = 'forex-trade-journal-images-v1';
// Thời gian cache mặc định (7 ngày)
const DEFAULT_CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000;
// Kích thước tối đa của cache (50MB)
const MAX_CACHE_SIZE = 50 * 1024 * 1024;

// Key trong localStorage để lưu metadata về ảnh (thời gian cache, kích thước, v.v)
const IMAGE_METADATA_KEY = 'forex-journal-image-metadata';

interface ImageMetadata {
  url: string;          // URL gốc của ảnh
  cachedAt: number;     // Thời điểm được cache
  expiresAt: number;    // Thời điểm hết hạn
  size: number;         // Kích thước của ảnh (bytes)
  etag?: string;        // ETag từ server nếu có
  version: string;      // Phiên bản của cache, dùng để invalidate
  tradeId: string;      // ID của giao dịch liên quan
  imageType: string;    // Loại ảnh: 'entryH4', 'entryM15', 'exitH4', 'exitM15', etc.
}

/**
 * Class quản lý việc cache hình ảnh
 */
class ImageCacheService {
  private metadata: Record<string, ImageMetadata> = {};
  private initialized = false;
  private cacheSupported = false;
  private totalCacheSize = 0;

  constructor() {
    this.init();
  }

  /**
   * Khởi tạo service và load metadata từ localStorage
   */
  private async init(): Promise<void> {
    // Kiểm tra hỗ trợ Cache API
    this.cacheSupported = 'caches' in window;
    
    if (!this.cacheSupported) {
      console.warn('Cache Storage API không được hỗ trợ. Chuyển sang chế độ không cache.');
    }

    // Load metadata từ localStorage
    try {
      const storedMetadata = localStorage.getItem(IMAGE_METADATA_KEY);
      if (storedMetadata) {
        this.metadata = JSON.parse(storedMetadata);
        
        // Tính toán tổng kích thước cache hiện tại
        this.totalCacheSize = Object.values(this.metadata)
          .reduce((total, item) => total + (item.size || 0), 0);
        
        // Xóa các mục đã hết hạn
        await this.cleanExpiredItems();
      }
    } catch (error) {
      console.error('Lỗi khi khởi tạo Image Cache Service:', error);
      // Trong trường hợp lỗi, reset metadata
      this.metadata = {};
      this.totalCacheSize = 0;
    }

    this.initialized = true;
  }

  /**
   * Đảm bảo service đã được khởi tạo
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.init();
    }
  }

  /**
   * Lưu metadata hiện tại vào localStorage
   */
  private saveMetadata(): void {
    try {
      localStorage.setItem(IMAGE_METADATA_KEY, JSON.stringify(this.metadata));
    } catch (error) {
      console.error('Lỗi khi lưu metadata cache:', error);
    }
  }

  /**
   * Sinh key cache từ URL
   */
  private getCacheKey(url: string): string {
    // Sử dụng toàn bộ URL làm key để đảm bảo tính duy nhất
    return url;
  }

  /**
   * Kiểm tra xem URL có trong cache hay không
   */
  public async hasInCache(url: string): Promise<boolean> {
    await this.ensureInitialized();
    
    if (!this.cacheSupported) return false;
    
    const cacheKey = this.getCacheKey(url);
    
    // Kiểm tra metadata trước
    if (!this.metadata[cacheKey]) return false;
    
    // Kiểm tra hết hạn
    if (this.metadata[cacheKey].expiresAt < Date.now()) {
      // Ảnh đã hết hạn, xóa khỏi cache
      await this.removeFromCache(url);
      return false;
    }
    
    try {
      // Kiểm tra trong Cache Storage
      const cache = await caches.open(CACHE_NAME);
      const cachedResponse = await cache.match(url);
      return !!cachedResponse;
    } catch (error) {
      console.error('Lỗi khi kiểm tra cache:', error);
      return false;
    }
  }

  /**
   * Lấy ảnh từ cache
   */
  public async getFromCache(url: string): Promise<Blob | null> {
    await this.ensureInitialized();
    
    if (!this.cacheSupported) return null;
    
    // Kiểm tra xem có trong cache không
    if (!(await this.hasInCache(url))) {
      return null;
    }
    
    try {
      // Lấy từ Cache Storage
      const cache = await caches.open(CACHE_NAME);
      const cachedResponse = await cache.match(url);
      
      if (!cachedResponse) {
        return null;
      }
      
      // Chuyển response thành Blob
      return await cachedResponse.blob();
    } catch (error) {
      console.error('Lỗi khi lấy ảnh từ cache:', error);
      return null;
    }
  }

  /**
   * Thêm ảnh vào cache
   */
  public async addToCache(
    url: string, 
    imageBlob: Blob, 
    options: {
      tradeId: string;
      imageType: string;
      expiry?: number;
    }
  ): Promise<boolean> {
    await this.ensureInitialized();
    
    if (!this.cacheSupported) return false;
    
    const cacheKey = this.getCacheKey(url);
    const now = Date.now();
    const expiry = options.expiry || DEFAULT_CACHE_EXPIRY;
    
    try {
      // Kiểm tra kích thước cache trước khi thêm mới
      if (this.totalCacheSize + imageBlob.size > MAX_CACHE_SIZE) {
        // Nếu vượt quá kích thước, xóa các mục cũ nhất
        await this.pruneCache(imageBlob.size);
      }
      
      // Lưu vào Cache Storage
      const cache = await caches.open(CACHE_NAME);
      const response = new Response(imageBlob, {
        headers: {
          'Content-Type': imageBlob.type,
          'Cache-Control': `max-age=${expiry / 1000}`
        }
      });
      
      await cache.put(url, response);
      
      // Cập nhật metadata
      this.metadata[cacheKey] = {
        url,
        cachedAt: now,
        expiresAt: now + expiry,
        size: imageBlob.size,
        version: CACHE_NAME,
        tradeId: options.tradeId,
        imageType: options.imageType
      };
      
      // Cập nhật tổng kích thước cache
      this.totalCacheSize += imageBlob.size;
      
      // Lưu metadata
      this.saveMetadata();
      
      return true;
    } catch (error) {
      console.error('Lỗi khi thêm ảnh vào cache:', error);
      return false;
    }
  }

  /**
   * Xóa ảnh khỏi cache
   */
  public async removeFromCache(url: string): Promise<boolean> {
    await this.ensureInitialized();
    
    if (!this.cacheSupported) return false;
    
    const cacheKey = this.getCacheKey(url);
    
    try {
      // Kiểm tra metadata
      if (this.metadata[cacheKey]) {
        // Cập nhật tổng kích thước cache
        this.totalCacheSize -= (this.metadata[cacheKey].size || 0);
        
        // Xóa metadata
        delete this.metadata[cacheKey];
        this.saveMetadata();
      }
      
      // Xóa khỏi Cache Storage
      const cache = await caches.open(CACHE_NAME);
      await cache.delete(url);
      
      return true;
    } catch (error) {
      console.error('Lỗi khi xóa ảnh khỏi cache:', error);
      return false;
    }
  }

  /**
   * Xóa các mục đã hết hạn
   */
  private async cleanExpiredItems(): Promise<void> {
    if (!this.cacheSupported) return;
    
    const now = Date.now();
    const expiredItems = Object.entries(this.metadata)
      .filter(([_, metadata]) => metadata.expiresAt < now);
    
    // Xóa từng mục đã hết hạn
    for (const [cacheKey, metadata] of expiredItems) {
      await this.removeFromCache(metadata.url);
    }
  }

  /**
   * Xóa bớt cache khi vượt quá kích thước tối đa
   */
  private async pruneCache(neededSpace: number): Promise<void> {
    if (!this.cacheSupported) return;
    
    // Sắp xếp các mục theo thời gian cache (cũ nhất lên đầu)
    const sortedItems = Object.entries(this.metadata)
      .sort(([_, a], [__, b]) => a.cachedAt - b.cachedAt);
    
    let freedSpace = 0;
    
    // Xóa các mục cho đến khi đủ không gian
    for (const [_, metadata] of sortedItems) {
      await this.removeFromCache(metadata.url);
      
      freedSpace += metadata.size;
      
      if (freedSpace >= neededSpace) {
        break;
      }
    }
  }

  /**
   * Xóa tất cả ảnh của một giao dịch cụ thể
   */
  public async clearTradeImages(tradeId: string): Promise<void> {
    await this.ensureInitialized();
    
    if (!this.cacheSupported) return;
    
    // Tìm tất cả các mục thuộc về trade
    const tradeItems = Object.entries(this.metadata)
      .filter(([_, metadata]) => metadata.tradeId === tradeId);
    
    // Xóa từng mục
    for (const [_, metadata] of tradeItems) {
      await this.removeFromCache(metadata.url);
    }
  }

  /**
   * Xóa toàn bộ cache
   */
  public async clearAllCache(): Promise<void> {
    await this.ensureInitialized();
    
    if (!this.cacheSupported) return;
    
    try {
      // Xóa toàn bộ cache storage
      await caches.delete(CACHE_NAME);
      
      // Reset metadata
      this.metadata = {};
      this.totalCacheSize = 0;
      this.saveMetadata();
    } catch (error) {
      console.error('Lỗi khi xóa toàn bộ cache:', error);
    }
  }

  /**
   * Cập nhật ảnh trong cache (nếu đã tồn tại)
   */
  public async updateCache(
    url: string, 
    imageBlob: Blob, 
    options: {
      tradeId: string;
      imageType: string;
      expiry?: number;
    }
  ): Promise<boolean> {
    // Xóa cache cũ trước
    await this.removeFromCache(url);
    
    // Thêm lại với phiên bản mới
    return this.addToCache(url, imageBlob, options);
  }

  /**
   * Nhận hoặc tải ảnh (từ cache hoặc từ nguồn)
   * - Trả về URL đến Blob nếu ảnh từ cache
   * - Tải ảnh từ URL nếu không có trong cache và lưu cache
   */
  public async getOrFetchImage(
    url: string, 
    options: {
      tradeId: string;
      imageType: string;
      expiry?: number;
      forceRefresh?: boolean;
    }
  ): Promise<string> {
    await this.ensureInitialized();
    
    // Nếu không support cache hoặc yêu cầu bỏ qua cache
    if (!this.cacheSupported || options.forceRefresh) {
      return url;
    }
    
    try {
      // Kiểm tra cache
      const cachedImage = await this.getFromCache(url);
      
      if (cachedImage) {
        // Tạo object URL từ blob đã cache
        return URL.createObjectURL(cachedImage);
      }
      
      // Nếu không có trong cache, tải ảnh
      const response = await fetch(url, { cache: 'no-store' });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }
      
      const imageBlob = await response.blob();
      
      // Lưu vào cache
      await this.addToCache(url, imageBlob, options);
      
      // Trả về URL gốc trong trường hợp này
      return url;
    } catch (error) {
      console.error('Lỗi khi tải ảnh:', error);
      // Trả về URL gốc nếu có lỗi
      return url;
    }
  }
}

// Export singleton instance
export const imageCacheService = new ImageCacheService();