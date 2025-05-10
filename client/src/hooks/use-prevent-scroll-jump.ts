import { useEffect } from 'react';

/**
 * SIMPLIFIED HOOK
 * 
 * This hook previously contained complex scroll jump prevention logic.
 * It has been simplified in favor of using native browser behaviors and better UI design.
 * 
 * Modern library components like those from Radix UI already have built-in
 * functionality to prevent scroll jumps (preventScroll option in focus).
 * 
 * This simplified version only maintains API compatibility with existing code.
 * It does nothing except add a style element for dropdown positioning.
 * 
 * For proper scroll control, we now use:
 * 1. ScrollToTop component for manual scroll control
 * 2. Route-change based auto-scrolling
 * 3. Native browser scrolling behavior
 */
export function usePreventScrollJump({
  enabled = true,
  selector = '[data-radix-select-content]',
  preventDuration = 400,
  disableScrollIntoView = true,
  maintainFocus = true,
}: {
  enabled?: boolean;
  selector?: string;
  preventDuration?: number;
  disableScrollIntoView?: boolean;
  maintainFocus?: boolean;
} = {}) {
  // Simplified implementation that only provides styling for dropdowns
  useEffect(() => {
    if (!enabled) return;
    
    // Create minimal styling for proper dropdown positioning
    if (!document.getElementById('dropdown-positioning-style')) {
      const style = document.createElement('style');
      style.id = 'dropdown-positioning-style';
      style.textContent = `
        /* Ensure dropdowns display correctly */
        [data-radix-select-content],
        [data-radix-popover-content],
        [data-radix-dropdown-content] {
          z-index: 999;
        }
      `;
      document.head.appendChild(style);
    }
    
    // No cleanup needed for this simplified version
    return () => {};
  }, [enabled]);
}