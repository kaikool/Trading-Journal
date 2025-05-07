/**
 * Forex Trade Journal PWA - Service Worker
 * Enhanced for better offline support, caching strategies and PWA experience
 * Last updated: 01/05/2025
 * 
 * CẬP NHẬT: Chuyển từ Firebase Functions sang Firebase Storage Web SDK trực tiếp
 */

const APP_VERSION = 'v2.1.0';
const CACHE_NAME = 'forex-journal-cache-' + APP_VERSION;
const OFFLINE_URL = '/offline.html';
const FALLBACK_IMAGE = '/icons/offline.png';
const OFFLINE_CANVAS_URL = '/icons/blank-chart.svg';

// Static assets to pre-cache during installation
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/config.js',  // Critical for Firebase authentication
  '/favicon.ico',
  '/favicon.svg',
  '/app-icon.svg',
  '/icon-monochrome.svg',
  '/icon-maskable.svg',
  '/icon-maskable-192.png',
  '/icon-maskable-512.png',
  '/icon-72.png',
  '/icon-96.png',
  '/icon-128.png',
  '/icon-144.png',
  '/icon-152.png',
  '/icon-192.png',
  '/icon-384.png',
  '/icon-512.png',
  '/apple-icon-120.png',
  '/apple-icon-152.png',
  '/apple-icon-167.png',
  '/apple-icon-180.png',
  '/apple-icon-192.png',
  '/apple-icon-512.png',
  '/apple-touch-icon.png',
  FALLBACK_IMAGE,
  OFFLINE_CANVAS_URL
];

// iOS splash screens - critical for proper PWA experience on iOS
const IOS_SPLASH_SCREENS = [
  '/apple-splash-640x1136.png',
  '/apple-splash-750x1334.png',
  '/apple-splash-1242x2208.png',
  '/apple-splash-1125x2436.png',
  '/apple-splash-828x1792.png',
  '/apple-splash-1242x2688.png',
  '/apple-splash-1170x2532.png',
  '/apple-splash-1179x2556.png',
  '/apple-splash-1284x2778.png',
  '/apple-splash-1536x2048.png',
  '/apple-splash-1668x2388.png',
  '/apple-splash-2048x2732.png'
];

/**
 * Detect if a request is a route navigation or route navigation asset
 * These should be handled with a Navigation fallback strategy
 */
function isNavigationRequest(request) {
  // HTML navigation
  if (request.mode === 'navigate') {
    return true;
  }
  
  // Route assets in SPA would also be handled specially
  return request.destination === 'document' || 
         (request.headers.get('accept') && request.headers.get('accept').includes('text/html'));
}

/**
 * Detect if we should apply a long-lived caching strategy to this request
 */
function isVersionedAsset(url) {
  // Vite adds hash to versioned assets like /assets/index-a1b2c3d4.js
  return url.includes('/assets/') && 
         (url.includes('.js') || url.includes('.css') || url.includes('.woff2') || 
          url.includes('.png') || url.includes('.svg') || url.includes('.jpg'));
}

/**
 * Installation Event - Pre-cache essential resources
 */
self.addEventListener('install', (event) => {
  self.skipWaiting();  // Ensures that newly registered SW becomes active as soon as possible
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Cache static assets and splash screens
      return cache.addAll([
        ...STATIC_ASSETS,
        ...IOS_SPLASH_SCREENS
      ]).catch(err => {
        console.error('Error caching static assets:', err);
        // Continue even if some assets fail to cache
        return Promise.resolve();
      });
    })
  );
});

/**
 * Activation Event - Clean up old caches when SW version changes
 */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete any cache that isn't the current version
          if (cacheName.startsWith('forex-journal-cache-') && cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Claim clients so the SW is in control immediately
      return self.clients.claim();
    })
  );
});

/**
 * Check if a request is for Firebase - these should always use network
 * as they involve authentication and real-time data
 */
function isFirebaseRequest(url) {
  return url.includes('firebasestorage.googleapis.com') || 
         url.includes('firebaseio.com') || 
         url.includes('firebase') || 
         url.includes('googleapis.com');
}

/**
 * Check if a request is for a static asset we can cache
 */
function isCacheableRequest(url) {
  const fileExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.json', '.map'];
  
  // Detect React lazy-loaded chunks which might not have file extensions
  const isReactChunk = url.pathname.includes('/assets/') && 
                    (url.pathname.includes('chunk-') || 
                     url.pathname.includes('analytics-') || 
                     url.pathname.includes('settings-'));
  
  return fileExtensions.some(ext => url.pathname.endsWith(ext)) || 
         isVersionedAsset(url) || 
         isReactChunk;
}

/**
 * Generate appropriate fallback responses for different types of requests
 */
async function generateFallbackResponse(request) {
  if (request.destination === 'image' || request.url.includes('.png') || request.url.includes('.jpg')) {
    // For charts, use blank canvas background
    if (request.url.includes('chart')) {
      const cachedCanvas = await caches.match(OFFLINE_CANVAS_URL);
      if (cachedCanvas) return cachedCanvas;
    }
    
    // For other images, use general offline image
    const cachedFallbackImage = await caches.match(FALLBACK_IMAGE);
    if (cachedFallbackImage) return cachedFallbackImage;
  }
  
  if (request.destination === 'document' || isNavigationRequest(request)) {
    // For navigation/html fallback to offline page
    const offlinePage = await caches.match(OFFLINE_URL);
    if (offlinePage) return offlinePage;
    
    // If offline page not in cache, use root cache
    const rootCache = await caches.match('/');
    if (rootCache) return rootCache;
  }
  
  if (request.destination === 'script') {
    // Check if it's an ES module
    const isModule = request.url.includes('type=module') || 
                     request.url.includes('/assets/') || 
                     request.headers.get('Accept')?.includes('text/javascript');
                     
    return new Response('console.log("Offline script fallback");', {
      headers: { 
        'Content-Type': isModule ? 'text/javascript' : 'application/javascript',
        'Cache-Control': 'no-cache' 
      }
    });
  }
  
  if (request.destination === 'style') {
    return new Response('/* Offline style fallback */', {
      headers: { 
        'Content-Type': 'text/css',
        'Cache-Control': 'no-cache' 
      }
    });
  }
  
  // Handle React lazy-loaded chunks specifically
  if (request.url.includes('/assets/') && 
      (request.url.includes('chunk-') || 
       request.url.includes('analytics-') || 
       request.url.includes('settings-'))) {
    return new Response('export default {};', {
      headers: { 
        'Content-Type': 'text/javascript',
        'Cache-Control': 'no-cache' 
      }
    });
  }
  
  // Default fallback
  return new Response('Offline content unavailable', {
    status: 503,
    statusText: 'Service Unavailable',
    headers: { 'Content-Type': 'text/plain' }
  });
}

/**
 * Main fetch event handler with optimized strategies
 */
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);
  
  // Don't intercept non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Don't intercept requests to different origins (except for Firebase Storage)
  if (requestUrl.origin !== self.location.origin && !isFirebaseRequest(requestUrl.href)) {
    return;
  }
  
  // Firebase requests - Network only strategy, don't cache
  if (isFirebaseRequest(requestUrl.href)) {
    event.respondWith(
      fetch(event.request).catch(() => {
        console.log('Firebase request failed', requestUrl.href);
        return generateFallbackResponse(event.request);
      })
    );
    return;
  }
  
  // For navigation requests - Network first with cache fallback
  if (isNavigationRequest(event.request)) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Cache the latest navigation response
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
          return response;
        })
        .catch(async () => {
          // Network failed, try cache
          const cachedResponse = await caches.match(event.request);
          if (cachedResponse) return cachedResponse;
          
          // If not in cache, try the root
          const rootCache = await caches.match('/');
          if (rootCache) return rootCache;
          
          // Lastly, use offline page
          return caches.match(OFFLINE_URL);
        })
    );
    return;
  }
  
  // For long-lived versioned assets - Cache first with network fallback
  if (isVersionedAsset(requestUrl.href)) {
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        if (cachedResponse) {
          // Versioned assets can be served directly from cache
          return cachedResponse;
        }
        
        // Not in cache, get from network and cache for next time
        return fetch(event.request)
          .then(networkResponse => {
            // Cache the fresh version
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
            return networkResponse;
          })
          .catch(() => generateFallbackResponse(event.request));
      })
    );
    return;
  }
  
  // For static cacheable assets - Stale-while-revalidate
  if (isCacheableRequest(requestUrl)) {
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        // Return cached response immediately (if available)
        const fetchPromise = fetch(event.request)
          .then(networkResponse => {
            // Update the cache with newer version
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, networkResponse.clone());
            });
            return networkResponse;
          })
          .catch(() => {
            console.log('Network fetch failed for:', requestUrl.href);
            return cachedResponse || generateFallbackResponse(event.request);
          });
          
        return cachedResponse || fetchPromise;
      })
    );
    return;
  }
  
  // Default fetch strategy - Network with fallback
  event.respondWith(
    fetch(event.request)
      .catch(() => {
        return caches.match(event.request)
          .then(cachedResponse => {
            if (cachedResponse) return cachedResponse;
            return generateFallbackResponse(event.request);
          });
      })
  );
});

/**
 * Handle messages from clients
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CHECK_VERSION') {
    event.ports[0].postMessage({
      version: APP_VERSION
    });
  }
});