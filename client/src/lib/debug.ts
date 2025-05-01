/**
 * Logger utility for development environments
 * Controlled via environment variables - logs are automatically suppressed in production
 * 
 * Cải thiện hiệu suất:
 * - Tắt debug logs trong môi trường production
 * - Sử dụng các flag để kiểm soát chi tiết hơn
 */

const isProduction = import.meta.env.PROD === true;
const isDevelopment = !isProduction;

// Thêm các flags để kiểm soát chi tiết hơn việc logging
// Có thể thay đổi trực tiếp từ console trong development
interface DebugConfig {
  enabled: boolean;
  level: 'verbose' | 'normal' | 'minimal';
  categories: {
    [key: string]: boolean;
  };
}

// Cấu hình mặc định
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
  // Fast-path cho production - tránh xử lý không cần thiết
  if (isProduction) return;
  
  // Kiểm tra xem debug có được bật không
  if (!DEBUG_CONFIG.enabled) return;
  
  // Kiểm tra category nếu msg là string và có định dạng "[Category]"
  if (typeof msg === 'string' && msg.startsWith('[') && msg.includes(']')) {
    const categoryMatch = msg.match(/\[(.*?)\]/);
    if (categoryMatch && categoryMatch[1]) {
      const category = categoryMatch[1].toLowerCase();
      // Nếu category bị tắt, không log
      if (DEBUG_CONFIG.categories[category] === false) {
        return;
      }
    }
  }
  
  // Log với format thích hợp
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
