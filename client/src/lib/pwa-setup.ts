/**
 * PWA Setup Utilities
 * 
 * This file contains utilities for setting up the PWA environment
 * and handling PWA-specific CSS variables and behaviors
 */

/**
 * Setup PWA environment variables and behaviors
 * Call this function at the application startup
 */
export function setupPWAEnvironment() {
  // Detect if running as PWA
  const isPWA = 
    window.matchMedia('(display-mode: standalone)').matches || 
    window.matchMedia('(display-mode: fullscreen)').matches ||
    (window.navigator as any).standalone === true;
  
  if (isPWA) {
    console.log('[PWA] Running in standalone mode');
    
    // Add PWA class to html element
    document.documentElement.classList.add('pwa-standalone');
    
    // Set CSS variables for PWA
    document.documentElement.style.setProperty('--pwa-enabled', '1');
    
    // Ensure safe areas are properly registered
    setupSafeAreas();
    
    // Fix iOS scrolling issues
    fixIOSScrolling();
    
    // Setup viewport height
    setupViewportHeight();
    
    // Force hardware acceleration
    forceHardwareAcceleration();
  } else {
    console.log('[PWA] Running in browser mode');
    document.documentElement.style.setProperty('--pwa-enabled', '0');
  }
  
  // Watch for display mode changes
  const mediaQueryList = window.matchMedia('(display-mode: standalone)');
  mediaQueryList.addEventListener('change', (e) => {
    if (e.matches) {
      console.log('[PWA] Changed to standalone mode');
      document.documentElement.classList.add('pwa-standalone');
      document.documentElement.style.setProperty('--pwa-enabled', '1');
      
      // Refresh page to ensure all PWA settings are applied
      window.location.reload();
    } else {
      console.log('[PWA] Changed to browser mode');
      document.documentElement.classList.remove('pwa-standalone');
      document.documentElement.style.setProperty('--pwa-enabled', '0');
    }
  });
  
  // Return current PWA status
  return { isPWA };
}

/**
 * Setup CSS variables for safe areas
 */
function setupSafeAreas() {
  // Set CSS variables for safe areas
  document.documentElement.style.setProperty(
    '--safe-top', 
    getComputedStyle(document.documentElement).getPropertyValue('env(safe-area-inset-top, 0px)')
  );
  
  document.documentElement.style.setProperty(
    '--safe-bottom', 
    getComputedStyle(document.documentElement).getPropertyValue('env(safe-area-inset-bottom, 0px)')
  );
  
  document.documentElement.style.setProperty(
    '--safe-left', 
    getComputedStyle(document.documentElement).getPropertyValue('env(safe-area-inset-left, 0px)')
  );
  
  document.documentElement.style.setProperty(
    '--safe-right', 
    getComputedStyle(document.documentElement).getPropertyValue('env(safe-area-inset-right, 0px)')
  );
}

/**
 * Fix iOS scrolling issues in PWA mode
 */
function fixIOSScrolling() {
  // Create style element
  const style = document.createElement('style');
  style.innerHTML = `
    /* Force smooth scrolling behavior */
    html, body {
      -webkit-overflow-scrolling: touch;
    }
    
    /* Prevent pull-to-refresh behavior */
    html {
      overscroll-behavior-y: none;
      height: 100%;
      overflow: auto;
      position: fixed;
      width: 100%;
      overflow-y: scroll;
    }
    
    /* Ensure content can be scrolled */
    body {
      height: 100%;
      overflow: auto;
    }
    
    /* Fix for PWA modals and popovers visibility */
    html.pwa-standalone [data-radix-popper-content-wrapper],
    html.pwa-standalone [role="dialog"],
    html.pwa-standalone [role="alertdialog"] {
      z-index: 9999 !important;
      visibility: visible !important;
      opacity: 1 !important;
      display: block !important;
    }
  `;
  
  // Add style to head
  document.head.appendChild(style);
}

/**
 * Setup viewport height CSS variable
 * This is used to handle the iOS safari viewport height issues
 */
function setupViewportHeight() {
  const setVHVariable = () => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  };
  
  // Set initial value
  setVHVariable();
  
  // Update on resize
  window.addEventListener('resize', setVHVariable);
}

/**
 * Force hardware acceleration for smoother animations
 */
function forceHardwareAcceleration() {
  document.body.style.transform = 'translateZ(0)';
  document.body.style.backfaceVisibility = 'hidden';
  
  // Apply vendor prefixes
  const body = document.body as any;
  if (body.style && typeof body.style.webkitBackfaceVisibility !== 'undefined') {
    body.style.webkitBackfaceVisibility = 'hidden';
  }
}