/**
 * Safe Area Manager - Central management for auto-hiding safe areas
 *
 * Handles adding/removing the is-scrolling class to enable auto-hiding safe areas
 * when users scroll, which improves the viewing experience on mobile/PWA
 * 
 * This ensures padding from safe areas is applied only when not scrolling,
 * allowing more content to be visible while scrolling and restoring the
 * safe area when the user stops scrolling.
 */

export const SCROLL_TIMEOUT = 600; // Time in ms to wait before considering scrolling stopped

let scrollTimer: number | null = null;
let isInitialized = false;

/**
 * Set up scroll detection to add/remove is-scrolling class
 */
export function initializeSafeAreaAutoHide(): void {
  if (isInitialized || typeof document === 'undefined') return;
  
  const html = document.documentElement;
  
  // Handler for scroll events
  const handleScroll = () => {
    // Add class while scrolling
    html.classList.add('is-scrolling');
    
    // Clear previous timeout
    if (scrollTimer !== null) {
      window.clearTimeout(scrollTimer);
    }
    
    // Set timeout to remove class when scrolling stops
    scrollTimer = window.setTimeout(() => {
      html.classList.remove('is-scrolling');
    }, SCROLL_TIMEOUT);
  };
  
  // Attach event listener with passive option for better performance
  window.addEventListener('scroll', handleScroll, { passive: true });
  
  // Initial state - not scrolling
  html.classList.remove('is-scrolling');
  
  isInitialized = true;
}

/**
 * Force safe areas to show (e.g., when opening modals)
 */
export function showSafeAreas(): void {
  if (typeof document === 'undefined') return;
  
  const html = document.documentElement;
  html.classList.remove('is-scrolling');
  
  // Clear any pending timer
  if (scrollTimer !== null) {
    window.clearTimeout(scrollTimer);
    scrollTimer = null;
  }
}

/**
 * Force safe areas to hide (e.g., when in fullscreen mode)
 */
export function hideSafeAreas(): void {
  if (typeof document === 'undefined') return;
  
  const html = document.documentElement;
  html.classList.add('is-scrolling');
  
  // Clear any pending timer to prevent automatic showing
  if (scrollTimer !== null) {
    window.clearTimeout(scrollTimer);
    scrollTimer = null;
  }
}

/**
 * Cleanup function to remove event listeners if needed
 */
export function cleanupSafeAreaManager(): void {
  if (!isInitialized || typeof document === 'undefined') return;
  
  // Clean up any pending timers
  if (scrollTimer !== null) {
    window.clearTimeout(scrollTimer);
    scrollTimer = null;
  }
  
  // Note: We intentionally don't remove the scroll event listener
  // as it's meant to live for the lifetime of the app
  
  isInitialized = false;
}
