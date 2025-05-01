/**
 * Logger utility for development environments
 * Controlled via environment variables - logs are automatically suppressed in production
 * 
 * Performance improvements:
 * - Disable debug logs in production environment
 * - Use flags for more detailed control
 */

const isProduction = import.meta.env.PROD === true;
const isDevelopment = !isProduction;

// Add flags to control logging in more detail
// Can be changed directly from console in development
interface DebugConfig {
  enabled: boolean;
  level: 'verbose' | 'normal' | 'minimal';
  categories: {
    [key: string]: boolean;
  };
}

// Default configuration
const DEBUG_CONFIG: DebugConfig = {
  enabled: isDevelopment,
  level: isDevelopment ? 'normal' : 'minimal',
  categories: {
    data: true,      // Data loading/processing
    navigation: true, // Navigation/routing
    render: false,   // Component rendering (verbose)
    auth: true,      // Authentication
    api: true,       // API calls
    cache: true,     // Caching operations
    performance: true, // Performance metrics
  }
};

// Expose config to window for development override
if (isDevelopment && typeof window !== 'undefined') {
  (window as any).__DEBUG_CONFIG = DEBUG_CONFIG;
}

/**
 * Debug function that only logs in development environment
 * @param msg - Message or data to log
 * @param args - Optional additional data (rest parameters)
 */
const debug = (msg: unknown, ...args: unknown[]) => {
  // Fast-path for production - avoid unnecessary processing
  if (isProduction) return;
  
  // Check if debug is enabled
  if (!DEBUG_CONFIG.enabled) return;
  
  // Check category if msg is a string with format "[Category]"
  if (typeof msg === 'string' && msg.startsWith('[') && msg.includes(']')) {
    const categoryMatch = msg.match(/\[(.*?)\]/);
    if (categoryMatch && categoryMatch[1]) {
      const category = categoryMatch[1].toLowerCase();
      // If category is disabled, don't log
      if (DEBUG_CONFIG.categories[category] === false) {
        return;
      }
    }
  }
  
  // Log with appropriate format
  if (args.length > 0) {
    console.log('[DEBUG]', msg, ...args);
  } else {
    console.log('[DEBUG]', msg);
  }
};

/**
 * Error logger that works in both development and production
 * Use this only for actual errors that need attention
 */
const logError = (msg: unknown, error?: unknown) => {
  if (error) {
    console.error('[ERROR]', msg, error);
  } else {
    console.error('[ERROR]', msg);
  }
};

/**
 * Warning logger that works in both development and production
 * Use for important warnings that don't break functionality
 */
const logWarning = (msg: unknown, data?: unknown) => {
  if (data) {
    console.warn('[WARNING]', msg, data);
  } else {
    console.warn('[WARNING]', msg);
  }
};

export { debug, logError, logWarning };
