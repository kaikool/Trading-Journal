import { useEffect, useState } from 'react';
import { InstallPrompt } from './InstallPrompt';
import { OfflineIndicator } from './OfflineIndicator';
import { UpdatePrompt } from './UpdatePrompt';
import { PWA_NETWORK_STATUS_EVENT } from '@/lib/pwa-helper';

/**
 * Container for all PWA-related components
 * 
 * This component should be included once at the app root level to provide:
 * - Install prompt for PWA installation
 * - Offline indicator when network is not available
 * - Update prompt when a new version is available
 * - Safe area handling for notch/Dynamic Island devices
 */
export function PWAContainer() {
  // Track network status for PWA
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Dynamically apply theme-color meta tag based on color scheme
  useEffect(() => {
    const applyColorScheme = (event?: MediaQueryListEvent) => {
      const isDarkMode = event 
        ? event.matches 
        : window.matchMedia('(prefers-color-scheme: dark)').matches;
      
      // Update theme-color meta tag for PWA
      const themeColorMeta = document.head.querySelector('meta[name="theme-color"]:not([media])');
      if (themeColorMeta) {
        themeColorMeta.setAttribute(
          'content', 
          isDarkMode ? '#0f172a' : '#f8fafc'
        );
      }
      
      // Add/remove .dark class to html element
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };
    
    // Apply immediately
    applyColorScheme();
    
    // Listen for changes
    const colorSchemeMedia = window.matchMedia('(prefers-color-scheme: dark)');
    colorSchemeMedia.addEventListener('change', applyColorScheme);
    
    return () => {
      colorSchemeMedia.removeEventListener('change', applyColorScheme);
    };
  }, []);
  
  // Setup network status monitoring
  useEffect(() => {
    // Handle network status changes from PWA helper
    const handleNetworkStatus = (event: Event) => {
      const customEvent = event as CustomEvent;
      setIsOnline(customEvent.detail?.isOnline ?? navigator.onLine);
      
      // Add or remove "offline-mode" attribute to body for CSS targeting
      if (customEvent.detail?.isOnline) {
        document.body.removeAttribute('data-offline-mode');
      } else {
        document.body.setAttribute('data-offline-mode', 'true');
        
        // If offline, preload fallback content for lazy components
        // This helps ensure we can provide some UI even when chunks fail to load
        window.setTimeout(() => {
          const preloadLinks = document.querySelectorAll('link[rel="preload"][as="script"]');
          if (preloadLinks.length === 0) {
            console.log('Creating preload links for critical chunks');
            // If no preload links exist, create them for critical paths
            ['dashboard', 'trades'].forEach(page => {
              const link = document.createElement('link');
              link.rel = 'prefetch';
              link.href = `/assets/${page}.chunk.js`;
              document.head.appendChild(link);
            });
          }
        }, 1000);
      }
    };
    
    // Listen for custom PWA network status events
    window.addEventListener(PWA_NETWORK_STATUS_EVENT, handleNetworkStatus);
    
    // Also listen for standard online/offline events as backup
    window.addEventListener('online', () => setIsOnline(true));
    window.addEventListener('offline', () => setIsOnline(false));
    
    return () => {
      window.removeEventListener(PWA_NETWORK_STATUS_EVENT, handleNetworkStatus);
      window.removeEventListener('online', () => setIsOnline(true));
      window.removeEventListener('offline', () => setIsOnline(false));
    };
  }, []);

  // Apply uniform styling that works for both PWA and regular modes
  useEffect(() => {
    // Always ensure viewport-fit=cover is set for proper safe area handling
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    if (viewportMeta) {
      const currentContent = viewportMeta.getAttribute('content') || '';
      if (!currentContent.includes('viewport-fit=cover')) {
        viewportMeta.setAttribute('content', `${currentContent}, viewport-fit=cover`);
      }
    }
    
    // Không còn cần thiết phải thêm class 'pwa-mode' vì:
    // 1. CSS đã có media query (display-mode: standalone) để phát hiện PWA
    // 2. Safe area đã được xử lý tự động thông qua CSS variables
    // 3. Giảm sự phụ thuộc vào JavaScript để xác định PWA mode
    
    // =========================================================================
    // VÔ HIỆU HÓA LOGIC GÂY LỖI - Ngăn việc set safe area toàn cục
    // =========================================================================
    // document.documentElement.setAttribute('data-has-safe-area', 'true');
    
    // return () => {
      // document.documentElement.removeAttribute('data-has-safe-area');
    // };
  }, []);

  return (
    <>
      <InstallPrompt />
      <OfflineIndicator />
      <UpdatePrompt />
    </>
  );
}
