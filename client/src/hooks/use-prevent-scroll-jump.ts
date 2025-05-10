/**
 * @deprecated EMPTY HOOK - KEPT FOR API COMPATIBILITY
 * 
 * This hook previously contained complex scroll jump prevention logic but is no longer needed.
 * With the latest version of RadixUI, this functionality is built-in through their components.
 * 
 * This empty version is kept for API compatibility only and can be safely removed when no longer referenced.
 * 
 * For proper scroll control, we now use:
 * 1. RadixUI's built-in preventScroll functionality
 * 2. ScrollToTop component for manual scroll control
 * 3. Route-change based auto-scrolling in App.tsx
 */
export function usePreventScrollJump(_options = {}) {
  // Intentionally empty - this hook no longer does anything
  return;
}