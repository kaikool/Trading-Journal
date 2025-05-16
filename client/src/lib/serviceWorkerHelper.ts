/**
 * Helper functions for service worker management and PWA functionality
 */

/**
 * Kiểm tra xem ứng dụng có đang chạy trong chế độ PWA (standalone) hay không
 * @returns boolean - true nếu ứng dụng đang chạy trong chế độ PWA
 */
export function isPwaMode(): boolean {
  // Check if app is running in PWA mode (standalone)
  return window.matchMedia('(display-mode: standalone)').matches || 
         (window.navigator as any).standalone === true || 
         document.referrer.includes('android-app://');
}

/**
 * Khắc phục lỗi MIME type cho các trang lazy-loaded khi gặp vấn đề.
 * Nên được gọi trong component ErrorBoundary hoặc khi gặp lỗi MIME.
 * @param routePath - Đường dẫn của trang đang gặp vấn đề (ví dụ: '/trade/history')
 * @returns Promise<boolean> - true nếu xử lý thành công
 */
export async function fixMimeTypeIssue(routePath?: string): Promise<boolean> {
  // Ghi log sự cố để debug
  console.log(`[MIME Type Fix] Attempting to fix MIME type issue for path: ${routePath || 'all routes'}`);
  
  try {
    // 1. Xóa cache JavaScript assets
    const cacheCleared = await clearAssetsCache();
    
    // 2. Thêm một tham số động để tránh cache từ browser
    const timestamp = Date.now();
    const newUrl = window.location.pathname + 
                  (window.location.search ? window.location.search + '&_t=' + timestamp : '?_t=' + timestamp) + 
                  window.location.hash;
                  
    // 3. Tải lại trang nếu cần
    if (cacheCleared) {
      console.log('[MIME Type Fix] Cache cleared successfully, reloading page');
      window.location.href = newUrl;
      return true;
    }
    
    // 4. Nếu không thể xóa cache qua Service Worker, thử reload trực tiếp
    console.log('[MIME Type Fix] Cache clearing failed, trying direct reload');
    window.location.href = newUrl;
    return true;
  } catch (error) {
    console.error('[MIME Type Fix] Error fixing MIME type issue:', error);
    return false;
  }
}



/**
 * Gửi yêu cầu xóa cache cho các tài nguyên JavaScript
 * @returns Promise<boolean> - true nếu gửi thành công
 */
export async function clearAssetsCache(): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) {
    return false;
  }
  
  return new Promise((resolve) => {
    // Tạo channel để nhận phản hồi từ service worker
    const messageChannel = new MessageChannel();
    
    // Xử lý phản hồi
    messageChannel.port1.onmessage = (event) => {
      if (event.data && event.data.success) {
        resolve(true);
      } else {
        resolve(false);
      }
    };
    
    // Gửi yêu cầu đến service worker
    const controller = navigator.serviceWorker.controller;
    if (controller) {
      controller.postMessage(
        {
          type: 'CLEAR_ASSETS_CACHE',
          timestamp: Date.now()
        }, 
        [messageChannel.port2]
      );
    } else {
      resolve(false);
    }
    
    // Timeout sau 3 giây
    setTimeout(() => resolve(false), 3000);
  });
}



// updateServiceWorker function was removed during cleanup - replaced by applyUpdate in pwa-helper.ts