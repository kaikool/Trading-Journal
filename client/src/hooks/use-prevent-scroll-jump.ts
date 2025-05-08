import { useEffect, useRef } from 'react';

/**
 * Hook to prevent page scroll jumps when Radix UI dropdown components open.
 * 
 * This hook works by:
 * 1. Setting up a MutationObserver to detect when Radix UI content is added to the DOM
 * 2. When a dropdown/popup opens, capturing the current scroll position
 * 3. Using preventDefault on scroll events briefly to block automatic scroll behaviors
 * 4. After a small delay, releasing the scroll lock while maintaining position
 * 
 * Works with multiple Radix components including Select, Popover, DropdownMenu, etc.
 * 
 * @param options Configuration options
 * @param options.enabled Whether this hook is active (default: true)
 * @param options.selector CSS selector to match portals/popups to observe (default: '[data-radix-select-content]')
 * @param options.preventDuration How long to block automatic scrolling in ms (default: 400)
 */
export function usePreventScrollJump({
  enabled = true,
  selector = '[data-radix-select-content]',
  preventDuration = 400,
}: {
  enabled?: boolean;
  selector?: string;
  preventDuration?: number;
} = {}) {
  // Store refs to avoid rerenders while maintaining state
  const preventScrollRef = useRef(false);
  const scrollTopRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const observerRef = useRef<MutationObserver | null>(null);
  
  useEffect(() => {
    if (!enabled) return;
    
    // Handler for scroll events - prevents scrolling when activated
    const handleScroll = (e: Event) => {
      if (preventScrollRef.current) {
        // Prevent the default scroll behavior
        e.preventDefault();
        
        // Maintain the scroll position we captured when dropdown opened
        window.scrollTo(0, scrollTopRef.current);
        return false;
      }
      return true;
    };
    
    // Start preventing scroll jumps
    const startPreventingScroll = () => {
      // Capture the current scroll position
      scrollTopRef.current = window.scrollY;
      preventScrollRef.current = true;
      
      // After a delay, allow scrolling again
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      
      timerRef.current = window.setTimeout(() => {
        preventScrollRef.current = false;
      }, preventDuration);
    };
    
    // Setup MutationObserver to watch for Select/Dropdown portals
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // Check if any of the added nodes is a Select content
          mutation.addedNodes.forEach((node) => {
            if (node instanceof Element && node.querySelector?.(selector)) {
              startPreventingScroll();
            } else if (node instanceof Element && node.matches?.(selector)) {
              startPreventingScroll();
            }
          });
        }
      });
    });
    
    // Start observing the document body for all changes
    observer.observe(document.body, { 
      childList: true, 
      subtree: true 
    });
    
    // Save observer to ref for cleanup
    observerRef.current = observer;
    
    // Add capture phase scroll event listener (runs before regular listeners)
    window.addEventListener('scroll', handleScroll, { capture: true, passive: false });
    
    // Cleanup function
    return () => {
      window.removeEventListener('scroll', handleScroll, { capture: true });
      
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [enabled, selector, preventDuration]);
}