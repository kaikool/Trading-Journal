import { useState, useEffect } from 'react';

export type ScrollDirection = 'up' | 'down' | 'idle';

interface ScrollState {
  direction: ScrollDirection;
  lastScrollTop: number;
  scrollY: number;
  isAtTop: boolean;
  isAtBottom: boolean;
  isScrolling: boolean;
}

export function useScrollDirection(threshold = 5, idleTimeout = 1000): ScrollState {
  const [scrollState, setScrollState] = useState<ScrollState>({
    direction: 'idle',
    lastScrollTop: 0,
    scrollY: 0,
    isAtTop: true,
    isAtBottom: false,
    isScrolling: false
  });

  useEffect(() => {
    let scrollTimer: NodeJS.Timeout | null = null;
    let idleTimer: NodeJS.Timeout | null = null;

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const scrollTop = scrollY || document.documentElement.scrollTop;
      const isAtTop = scrollTop < threshold;
      const isAtBottom = 
        (window.innerHeight + scrollTop) >= (document.documentElement.scrollHeight - threshold);
      
      const direction = scrollState.lastScrollTop > scrollTop ? 'up' : 'down';
      
      if (Math.abs(scrollState.lastScrollTop - scrollTop) > threshold) {
        setScrollState(prev => ({
          ...prev,
          direction: direction,
          lastScrollTop: scrollTop,
          scrollY,
          isAtTop,
          isAtBottom,
          isScrolling: true
        }));

        // Reset scrolling state after timeout
        if (scrollTimer) clearTimeout(scrollTimer);
        scrollTimer = setTimeout(() => {
          setScrollState(prev => ({
            ...prev,
            isScrolling: false
          }));
        }, 100);

        // Reset to idle after inactivity
        if (idleTimer) clearTimeout(idleTimer);
        idleTimer = setTimeout(() => {
          setScrollState(prev => ({
            ...prev,
            direction: 'idle'
          }));
        }, idleTimeout);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimer) clearTimeout(scrollTimer);
      if (idleTimer) clearTimeout(idleTimer);
    };
  }, [threshold, scrollState.lastScrollTop, idleTimeout]);

  return scrollState;
}