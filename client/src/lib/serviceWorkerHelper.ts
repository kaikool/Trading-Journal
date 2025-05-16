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