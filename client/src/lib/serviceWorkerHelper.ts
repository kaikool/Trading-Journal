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
 * Kiểm tra xem service worker có đang hoạt động không
 * @returns Promise<boolean> - true nếu service worker đang hoạt động
 */
export async function isServiceWorkerActive(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    return false;
  }
  
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    return !!registration && !!registration.active;
  } catch (error) {
    console.error('Error checking service worker status:', error);
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

/**
 * Kiểm tra và lấy phiên bản hiện tại của service worker
 * @returns Promise<string|null> - phiên bản của service worker hoặc null
 */
export async function getServiceWorkerVersion(): Promise<string | null> {
  if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) {
    return null;
  }
  
  return new Promise((resolve) => {
    // Tạo channel để nhận phản hồi từ service worker
    const messageChannel = new MessageChannel();
    
    // Xử lý phản hồi
    messageChannel.port1.onmessage = (event) => {
      if (event.data && event.data.version) {
        resolve(event.data.version);
      } else {
        resolve(null);
      }
    };
    
    // Gửi yêu cầu đến service worker
    const controller = navigator.serviceWorker.controller;
    if (controller) {
      controller.postMessage(
        {
          type: 'CHECK_VERSION',
          timestamp: Date.now()
        }, 
        [messageChannel.port2]
      );
    } else {
      resolve(null);
    }
    
    // Timeout sau 2 giây
    setTimeout(() => resolve(null), 2000);
  });
}

/**
 * Yêu cầu service worker cập nhật và kích hoạt ngay lập tức
 */
export function updateServiceWorker(): Promise<void> {
  if (!('serviceWorker' in navigator)) {
    return Promise.resolve();
  }
  
  return navigator.serviceWorker.getRegistration()
    .then(registration => {
      if (registration) {
        // Kiểm tra cập nhật
        return registration.update()
          .then(() => {
            if (registration.waiting) {
              // Nếu có phiên bản mới đang chờ, kích hoạt nó
              registration.waiting.postMessage({ type: 'SKIP_WAITING' });
            }
          });
      }
    })
    .catch(error => {
      console.error('Error updating service worker:', error);
    });
}