import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { registerServiceWorker } from "./lib/pwa-helper";
import { preloadCriticalResources } from "./lib/preload";
import { setupPWAEnvironment } from "./lib/pwa-setup";
import { DataCacheProvider } from './contexts/DataCacheContext';

// Setup PWA environment
const { isPWA } = setupPWAEnvironment();
console.log("PWA Status:", isPWA ? "Running as PWA" : "Running in browser");

// Fix for iOS PWA viewport height (to help fix the content visibility issue)
if (isPWA) {
  // Create a fixed viewport height fix
  const setViewportHeight = () => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  };
  
  setViewportHeight(); // Set initial value
  window.addEventListener('resize', setViewportHeight); // Update on resize
  
  // Apply PWA debugging styles - will remove these once fixed
  const debugStyle = document.createElement('style');
  debugStyle.textContent = `
    /* PWA DEBUG STYLES - TEMPORARY */
    #pwa-root {
      background-color: white;
      min-height: calc(var(--vh, 1vh) * 100);
    }
    
    [data-radix-popper-content-wrapper],
    .radix-dropdown-menu,
    .radix-popover,
    [role="dialog"],
    [role="alertdialog"] {
      z-index: 9999 !important;
      visibility: visible !important;
      opacity: 1 !important;
      display: block !important;
    }
  `;
  document.head.appendChild(debugStyle);
}

// Preload critical resources
preloadCriticalResources();

// Render the application
createRoot(document.getElementById("root")!).render(<App />);

// Register service worker for PWA support
if (import.meta.env.PROD) {
  // Only register in production to avoid caching during development
  registerServiceWorker().catch(error => {
    console.error("Service worker registration failed:", error);
  });
}
