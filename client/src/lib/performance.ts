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
 * Detect if user has enabled reduced motion setting
 */
export function detectReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Return optimal UI configuration based on device performance and user preferences
 */
export async function getOptimalUiConfig() {
  const prefersReducedMotion = detectReducedMotion();
  const devicePerformance = await evaluateDevicePerformance();
  
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