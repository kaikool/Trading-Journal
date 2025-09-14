import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { registerServiceWorker } from "./lib/pwa-helper";
import { preloadCriticalResources } from "./lib/preload";

// Temporarily commented out to avoid startup issues
// preloadCriticalResources();

// Clear any existing service workers and caches in development mode
if (!import.meta.env.PROD && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => 
    registrations.forEach(registration => registration.unregister())
  );
  if ('caches' in window) {
    caches.keys().then(keys => keys.forEach(key => caches.delete(key)));
  }
  console.log("Development mode: Cleared service workers and caches");
}

// Render the application
createRoot(document.getElementById("root")!).render(<App />);

// Register service worker for PWA support
if (import.meta.env.PROD) {
  // Only register in production to avoid caching during development
  registerServiceWorker().catch(error => {
    console.error("Service worker registration failed:", error);
  });
}
