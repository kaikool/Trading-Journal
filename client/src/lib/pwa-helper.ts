// PWA Helper functions for Forex Trading Journal
import { debug, logError } from './debug';

// Event name for PWA update events
export const PWA_UPDATE_EVENT = 'pwa-update-available';
export const PWA_NETWORK_STATUS_EVENT = 'pwa-network-status-change';

// Global events for PWA updates and network status
export interface PWAUpdateEvent extends CustomEvent {
  detail: {
    registration: ServiceWorkerRegistration;
  };
}

export interface PWANetworkStatusEvent extends CustomEvent {
  detail: {
    isOnline: boolean;
  };
}

declare global {
  interface WindowEventMap {
    [PWA_UPDATE_EVENT]: PWAUpdateEvent;
    [PWA_NETWORK_STATUS_EVENT]: PWANetworkStatusEvent;
  }
}

/**
 * Registers the service worker for PWA functionality
 * 
 * @returns Promise resolving to the service worker registration or undefined if unsupported
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | undefined> {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/',
        updateViaCache: 'none', // Don't use cache headers for service worker updates
      });
      
      debug('Service Worker registered with scope:', registration.scope);
      
      // Set up update detection
      setupServiceWorkerUpdates(registration);
      
      // Set up network status monitoring
      setupNetworkStatusMonitoring();
      
      return registration;
    } catch (error) {
      logError('Service Worker registration failed:', error);
    }
  } else {
    debug('Service Workers are not supported in this browser');
  }
  
  return undefined;
}

/**
 * Sets up handling for service worker updates
 * 
 * @param registration The ServiceWorkerRegistration object
 */
function setupServiceWorkerUpdates(registration: ServiceWorkerRegistration): void {
  // Check for service worker updates
  setInterval(() => {
    registration.update();
  }, 60 * 60 * 1000); // Check for updates every hour
  
  // When a new service worker is available
  registration.addEventListener('updatefound', () => {
    // Get the installing service worker
    const newWorker = registration.installing;
    
    if (newWorker) {
      // Listen for state changes
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // New service worker is installed but waiting to activate
          notifyUserOfUpdate();
        }
      });
    }
  });
}

/**
 * Sets up monitoring of network status changes
 */
function setupNetworkStatusMonitoring(): void {
  // Initial status
  dispatchNetworkStatusEvent(navigator.onLine);
  
  // Listen for changes
  window.addEventListener('online', () => dispatchNetworkStatusEvent(true));
  window.addEventListener('offline', () => dispatchNetworkStatusEvent(false));
}

/**
 * Dispatches a custom event for network status change
 * 
 * @param isOnline Current online status
 */
function dispatchNetworkStatusEvent(isOnline: boolean): void {
  const event = new CustomEvent(PWA_NETWORK_STATUS_EVENT, {
    detail: { isOnline }
  });
  
  window.dispatchEvent(event);
  debug(`Network status changed: ${isOnline ? 'online' : 'offline'}`);
}

/**
 * Notifies the user that an update is available
 */
function notifyUserOfUpdate(): void {
  // Dispatch custom event that components can listen for
  navigator.serviceWorker.ready.then(registration => {
    const updateEvent = new CustomEvent(PWA_UPDATE_EVENT, {
      detail: { registration }
    });
    
    window.dispatchEvent(updateEvent);
    debug('PWA update available and event dispatched');
  });
}

/**
 * Apply the waiting service worker update
 */
export function applyUpdate(): void {
  navigator.serviceWorker.ready.then(registration => {
    if (registration.waiting) {
      // Tell the service worker to skipWaiting
      registration.waiting.postMessage('SKIP_WAITING');
      
      // Once the service worker updates, reload the page
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        debug('Controller changed, reloading...');
        window.location.reload();
      });
    }
  });
}

/**
 * Checks if the app is installed as a PWA
 * 
 * @returns Boolean indicating if the app is in standalone mode
 */
export function isAppInstalled(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches || 
         // @ts-ignore: Safari specific
         (window.navigator.standalone === true);
}

/**
 * Alias for isAppInstalled to ensure consistent naming across the app
 * This matches the function in use-mobile.tsx
 */
export function isPWA(): boolean {
  return isAppInstalled();
}

/**
 * Shows installation promotion based on browser support
 * 
 * @returns Boolean indicating if installation promotion is available
 */
export function canPromptInstall(): boolean {
  return !isAppInstalled() && 'BeforeInstallPromptEvent' in window;
}