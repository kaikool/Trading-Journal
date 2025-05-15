import React, { useMemo } from 'react';

/**
 * Device performance evaluation system to optimize user experience
 * 
 * Goal: Automatically detect low-performance devices and adjust UI to improve performance
 */

// Variable to store performance evaluation result
let cachedPerformanceRating: 'high' | 'medium' | 'low' | 'unknown' = 'unknown';

// Evaluation thresholds (ms)
const PERFORMANCE_THRESHOLDS = {
  high: 30, // <= 30ms: High performance
  medium: 80, // 31-80ms: Medium performance
  // > 80ms: Low performance
};

/**
 * Evaluate device performance by running a micro benchmark
 * @returns Device performance rating ('high', 'medium', 'low')
 */
export function evaluateDevicePerformance(): Promise<'high' | 'medium' | 'low'> {
  return new Promise(resolve => {
    // If already evaluated, reuse the result
    if (cachedPerformanceRating !== 'unknown') {
      resolve(cachedPerformanceRating);
      return;
    }

    // Start time
    const startTime = performance.now();
    
    // Run a simple microbenchmark
    let result = 0;
    const iterations = 100000;
    
    for (let i = 0; i < iterations; i++) {
      // Simple operation that isn't optimized by JIT
      result += Math.sqrt((i * 123) % 45678) * Math.cos(i / 45678);
    }
    
    // Prevent elimination by compiler optimization
    if (result === Number.POSITIVE_INFINITY) {
      console.log("This will never happen but prevents optimization");
    }
    
    // Calculate execution time
    const executionTime = performance.now() - startTime;
    
    // Determine device rating
    let rating: 'high' | 'medium' | 'low';
    
    if (executionTime <= PERFORMANCE_THRESHOLDS.high) {
      rating = 'high';
    } else if (executionTime <= PERFORMANCE_THRESHOLDS.medium) {
      rating = 'medium';
    } else {
      rating = 'low';
    }
    
    // Save result for reuse
    cachedPerformanceRating = rating;
    console.log(`Device performance evaluation: ${rating} (${Math.round(executionTime)}ms)`);
    
    resolve(rating);
  });
}

/**
 * Note: This function was previously used to detect reduced motion settings
 * but has been removed as part of code cleanup. App.tsx now uses a custom
 * useReducedMotion hook instead.
 */

/**
 * Return optimal UI configuration based on device performance and user preferences
 */
export async function getOptimalUiConfig() {
  // Get device performance
  const devicePerformance = await evaluateDevicePerformance();
  
  // Get reduced motion preference directly from media query
  const prefersReducedMotion = typeof window !== 'undefined' && 
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  // Configuration for each performance level
  return {
    // Store device performance level for reference elsewhere
    devicePerformance,
    
    // User prefers reduced motion or device has low performance
    animations: prefersReducedMotion || devicePerformance === 'low' ? 'minimal' : 'standard',
    
    // Default number of items to display per page
    pageSize: devicePerformance === 'low' ? 10 : devicePerformance === 'medium' ? 20 : 30,
    
    // Use virtualization for long lists
    useVirtualization: devicePerformance !== 'high',
    
    // Cache time for react-query (extended for single-user application)
    queryCacheTime: 15 * 60 * 1000, // 15 minutes cache time
    
    // Stale time for react-query (extended since data rarely changes for single user)
    queryStaleTime: 5 * 60 * 1000 // 5 minutes stale time
  };
}

/**
 * Consistent memoization helper for React components
 * Wraps React.memo with optional conditional usage based on device performance
 *
 * @param Component - Component to memoize
 * @param propsAreEqual - Optional custom comparison function
 * @param forceEnable - Force memoization regardless of device performance
 * @returns Memoized component
 */
export function memoWithPerf(
  Component: React.ComponentType<any>,
  propsAreEqual?: (prevProps: any, nextProps: any) => boolean,
  forceEnable = false
): React.ComponentType<any> {
  // Memoization is always enabled for low/medium performance devices
  // For high-performance devices, we can be more selective
  const shouldMemoize = forceEnable || cachedPerformanceRating !== 'high';
  
  if (shouldMemoize) {
    return React.memo(Component, propsAreEqual);
  }
  
  // Return the original component if memoization isn't needed
  return Component;
}

/**
 * Hook for memoizing expensive calculations with performance considerations
 * Wraps React's useMemo to add conditional usage based on device performance
 *
 * @param factory - Function that creates the memoized value
 * @param dependencies - Array of dependencies for the useMemo hook
 * @param forceEnable - Force memoization regardless of device performance 
 * @returns Memoized value
 */
export function useMemoWithPerf<T>(
  factory: () => T,
  dependencies: React.DependencyList,
  forceEnable = false
): T {
  // For data transformations that are computationally expensive, always memoize
  // For less expensive operations, only memoize on lower-performance devices
  const shouldMemoize = forceEnable || cachedPerformanceRating !== 'high';
  
  if (shouldMemoize) {
    return useMemo(factory, dependencies);
  }
  
  // If memoization isn't needed, just call the factory directly
  return factory();
}

/**
 * This function was previously used to determine if a list should use virtualization
 * based on device performance and list length.
 * 
 * It has been removed as part of code cleanup since it wasn't being used anywhere
 * in the codebase. The useVirtualization setting in getOptimalUiConfig() is used 
 * directly instead.
 */