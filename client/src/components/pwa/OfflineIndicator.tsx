import { useEffect, useState } from 'react';
import { Icons } from '@/components/icons/icons';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { PWA_NETWORK_STATUS_EVENT, PWANetworkStatusEvent } from '@/lib/pwa-helper';

/**
 * Component that shows an indicator when the user is offline
 * 
 * Using custom PWA events for better coordination across components
 */
export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState<boolean>(false);

  useEffect(() => {
    // Set initial state
    setIsOffline(!navigator.onLine);

    // Event listeners for online/offline status - fallback method
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    // Custom PWA network status event handler
    const handleNetworkStatusChange = (event: PWANetworkStatusEvent) => {
      const { isOnline } = event.detail;
      setIsOffline(!isOnline);
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener(PWA_NETWORK_STATUS_EVENT, handleNetworkStatusChange as EventListener);

    // Clean up
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener(PWA_NETWORK_STATUS_EVENT, handleNetworkStatusChange as EventListener);
    };
  }, []);

  if (!isOffline) {
    return null;
  }

  return (
    <Alert variant="destructive" className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-11/12 max-w-md shadow-lg">
      <Icons.pwa.wifiOff className="h-4 w-4" />
      <AlertTitle>Mất kết nối mạng</AlertTitle>
      <AlertDescription>
        Bạn đang sử dụng ứng dụng ở chế độ ngoại tuyến. Một số chức năng có thể không hoạt động cho đến khi kết nối mạng được khôi phục.
      </AlertDescription>
    </Alert>
  );
}