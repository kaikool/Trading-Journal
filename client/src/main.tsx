import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { registerServiceWorker } from "./lib/pwa-helper";
import { preloadCriticalResources } from "./lib/preload";
import { DataCacheProvider } from './contexts/DataCacheContext';
import { applyRadixSelectFix } from './lib/radix-select-fix';

// Preload critical resources
preloadCriticalResources();

// Áp dụng giải pháp CSS để khắc phục vấn đề cuộn trong Radix UI Select
applyRadixSelectFix();

// Render the application
createRoot(document.getElementById("root")!).render(<App />);

// Register service worker for PWA support
if (import.meta.env.PROD) {
  // Only register in production to avoid caching during development
  registerServiceWorker().catch(error => {
    console.error("Service worker registration failed:", error);
  });
}
