import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { isAppInstalled } from "@/lib/pwa-helper";

// Interface for BeforeInstallPromptEvent (not included in standard TypeScript types)
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

/**
 * Component that prompts users to install the PWA
 */
export function InstallPrompt() {
  const [installPromptEvent, setInstallPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  // Listen for the beforeinstallprompt event
  useEffect(() => {
    const isInstalled = isAppInstalled();
    
    if (isInstalled) {
      // Already installed, no need to show prompt and make sure it's hidden
      setShowPrompt(false);
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent Chrome 76+ from automatically showing the prompt
      e.preventDefault();
      // Store the event for later use
      setInstallPromptEvent(e as BeforeInstallPromptEvent);
      // Show our custom install button
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Handle the installation process
  const handleInstallClick = useCallback(async () => {
    if (!installPromptEvent) {
      return;
    }

    try {
      // Show the browser's install prompt
      await installPromptEvent.prompt();
      // Wait for the user's choice
      const choiceResult = await installPromptEvent.userChoice;
      
      // Hide our button regardless of outcome
      setShowPrompt(false);
      
      // Log the outcome (for analytics if needed)
      console.log(`User ${choiceResult.outcome} the install prompt`);
    } catch (error) {
      console.error('Error during installation:', error);
    }
  }, [installPromptEvent]);

  // If we shouldn't show the prompt, don't render anything
  if (!showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 p-4 bg-card rounded-lg shadow-lg border border-muted w-72">
      <div className="flex flex-col space-y-3">
        <div className="text-sm font-medium">
          Cài đặt ứng dụng Forex Trade Journal
        </div>
        <div className="text-xs text-muted-foreground">
          Cài đặt ứng dụng vào màn hình chính để có trải nghiệm tốt hơn, sử dụng được khi offline và tải nhanh hơn.
        </div>
        <div className="flex justify-between">
          <Button variant="outline" size="sm" onClick={() => setShowPrompt(false)}>
            Để sau
          </Button>
          <Button size="sm" onClick={handleInstallClick}>
            <Download className="mr-2 h-4 w-4" />
            Cài đặt
          </Button>
        </div>
      </div>
    </div>
  );
}