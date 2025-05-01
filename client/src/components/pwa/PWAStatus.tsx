import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Smartphone, Wifi, WifiOff, Download, CheckCircle2 } from 'lucide-react';
import { isAppInstalled } from '@/lib/pwa-helper';

/**
 * PWA status component that shows the current state of the PWA
 * 
 * This component can be used for testing and debugging PWA functionality
 */
export function PWAStatus() {
  const [status, setStatus] = useState({
    isOnline: navigator.onLine,
    isStandalone: false,
    serviceWorkerActive: false,
    canInstall: false,
  });

  useEffect(() => {
    // Check if the app is running in standalone mode (installed as PWA)
    const isStandalone = isAppInstalled();
    
    // Check if service worker is active
    const hasServiceWorker = 'serviceWorker' in navigator;
    
    // Check if can be installed
    const canInstall = !isStandalone && hasServiceWorker;
    
    setStatus({
      isOnline: navigator.onLine,
      isStandalone,
      serviceWorkerActive: hasServiceWorker,
      canInstall,
    });
    
    // Event listeners for online/offline status
    const handleOnline = () => setStatus(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setStatus(prev => ({ ...prev, isOnline: false }));
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="fixed bottom-20 left-4 z-50 p-3 bg-card rounded-lg shadow-lg border border-muted">
      <div className="flex flex-col gap-2">
        <div className="text-xs font-medium mb-2">PWA Status</div>
        
        <div className="flex items-center gap-2">
          {status.isOnline ? (
            <Badge variant="outline" className="bg-green-100 text-green-800 flex items-center gap-1">
              <Wifi className="h-3 w-3" />
              <span>Online</span>
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-amber-100 text-amber-800 flex items-center gap-1">
              <WifiOff className="h-3 w-3" />
              <span>Offline</span>
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {status.serviceWorkerActive ? (
            <Badge variant="outline" className="bg-green-100 text-green-800 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              <span>Service Worker</span>
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-gray-100 text-gray-800 flex items-center gap-1">
              <span>No Service Worker</span>
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {status.isStandalone ? (
            <Badge variant="outline" className="bg-indigo-100 text-indigo-800 flex items-center gap-1">
              <Smartphone className="h-3 w-3" />
              <span>Installed</span>
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-amber-100 text-amber-800 flex items-center gap-1">
              <Download className="h-3 w-3" />
              <span>Not Installed</span>
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}