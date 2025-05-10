import { useState, useEffect } from 'react';

export type ScrollDirection = 'up' | 'down' | 'idle';

/**
 * Simplified interface for scroll state
 * Contains only essential information for most UI interactions
 */
interface ScrollState {
  direction: ScrollDirection;
  isAtTop: boolean; 
  isScrolling: boolean;
}

/**
 * Simplified scroll direction hook
 * 
 * This version is highly optimized and only tracks:
 * - Direction of scroll (up/down/idle)
 * - Whether user is at top of page
 * - Whether user is actively scrolling
 * 
 * @param threshold - Threshold for top detection (in pixels)
 */
export function useScrollDirection(threshold = 10): ScrollState {
  const [scrollState, setScrollState] = useState<ScrollState>({
    direction: 'idle',
    isAtTop: true,
    isScrolling: false
  });

  useEffect(() => {
    let lastScrollY = window.scrollY;
    let scrollTimeout: number | null = null;
    
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const isAtTop = scrollY < threshold;
      
      // Determine scroll direction
      const direction = lastScrollY > scrollY ? 'up' : 'down';
      
      // Update state
      setScrollState({
        direction,
        isAtTop,
        isScrolling: true
      });
      
      // Remember current position
      lastScrollY = scrollY;
      
      // Reset scrolling status after inactivity
      if (scrollTimeout) {
        window.clearTimeout(scrollTimeout);
      }
      
      scrollTimeout = window.setTimeout(() => {
        setScrollState(prevState => ({
          ...prevState,
          isScrolling: false
        }));
      }, 150);
    };
    
    // Check immediately
    handleScroll();
    
    // Use passive event listener for better performance
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Cleanup
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeout) {
        window.clearTimeout(scrollTimeout);
      }
    };
  }, [threshold]);

  return scrollState;
}