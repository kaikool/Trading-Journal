import { useEffect, useState } from 'react';
import { Icons } from '@/components/icons/icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PWA_UPDATE_EVENT, PWAUpdateEvent, applyUpdate } from '@/lib/pwa-helper';

/**
 * Component that prompts the user to update the PWA when a new version is available
 * 
 * Using custom PWA events for better coordination across components
 */
export function UpdatePrompt() {
  const [showUpdatePrompt, setShowUpdatePrompt] = useState<boolean>(false);
  const [updateRegistration, setUpdateRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    // Skip if service workers aren't supported
    if (!('serviceWorker' in navigator)) {
      return;
    }
    
    // Listen for the custom update event
    const handleUpdateFound = (event: PWAUpdateEvent) => {
      const { registration } = event.detail;
      setUpdateRegistration(registration);
      setShowUpdatePrompt(true);
    };
    
    // Add event listener for our custom update event
    window.addEventListener(PWA_UPDATE_EVENT, handleUpdateFound as EventListener);
    
    // Legacy direct check for existing updates
    navigator.serviceWorker.getRegistration().then(registration => {
      if (registration?.waiting) {
        setUpdateRegistration(registration);
        setShowUpdatePrompt(true);
      }
    });

    return () => {
      window.removeEventListener(PWA_UPDATE_EVENT, handleUpdateFound as EventListener);
    };
  }, []);

  const handleUpdate = () => {
    if (updateRegistration) {
      // Use our helper function to apply the update
      applyUpdate();
      
      // Hide the update prompt
      setShowUpdatePrompt(false);
    }
  };

  if (!showUpdatePrompt) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icons.ui.refresh className="h-5 w-5" />
            Có bản cập nhật mới
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Phiên bản mới của Forex Trade Journal đã sẵn sàng. Cập nhật ngay để sử dụng các tính năng mới nhất và sửa lỗi.
          </p>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => setShowUpdatePrompt(false)}>
            Để sau
          </Button>
          <Button onClick={handleUpdate}>
            <Icons.ui.refresh className="mr-2 h-4 w-4" />
            Cập nhật ngay
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}