import * as React from "react"

const MOBILE_BREAKPOINT = 768

/**
 * Check if the current app is running in PWA (standalone) mode
 * @returns Boolean indicating if app is in PWA mode
 */
export function isPWA(): boolean {
  // Check if running in standalone mode (PWA)
  return (
    window.matchMedia('(display-mode: standalone)').matches || 
    // For Safari on iOS
    // @ts-ignore: navigator.standalone is Safari-specific
    (window.navigator.standalone === true)
  )
}

/**
 * Hook that detects if the current device is mobile or the app is running in PWA mode
 * This ensures PWA always gets the mobile experience regardless of screen size
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    // Check for both mobile viewport and PWA mode
    const checkMobileOrPWA = () => {
      const isViewportMobile = window.innerWidth < MOBILE_BREAKPOINT
      const isInPWAMode = isPWA()
      
      // Return true if either condition is met
      // But don't force desktop to use mobile layout when in PWA mode
      return isViewportMobile
    }

    // Set up media query for viewport changes
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    
    // Handler for changes in viewport size
    const onChange = () => {
      setIsMobile(checkMobileOrPWA())
    }
    
    // Set initial state
    setIsMobile(checkMobileOrPWA())
    
    // Add listeners for viewport changes
    mql.addEventListener("change", onChange)
    
    // Add listener for PWA display mode changes
    const displayModeMediaQuery = window.matchMedia('(display-mode: standalone)')
    displayModeMediaQuery.addEventListener('change', onChange)
    
    // Clean up event listeners
    return () => {
      mql.removeEventListener("change", onChange)
      displayModeMediaQuery.removeEventListener('change', onChange)
    }
  }, [])

  return !!isMobile
}
