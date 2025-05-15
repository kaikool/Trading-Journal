const ENV = import.meta.env.MODE || 'development';
const IS_PROD = ENV === 'production';

const DEV_API_BASE = 'http://localhost:5000';
const PROD_API_BASE = typeof window !== 'undefined' && window.ENV && window.ENV.VITE_API_BASE_URL !== undefined
  ? window.ENV.VITE_API_BASE_URL
  : ''; 

// Đã xóa kiểm tra FIREBASE_CONFIG - không còn cần thiết

export const API_BASE = IS_PROD ? PROD_API_BASE : DEV_API_BASE;

/**
 * This export was previously used to access API endpoint configuration.
 * It has been removed as part of code cleanup since it wasn't being used
 * anywhere in the codebase. Direct imports of API_BASE are used instead.
 */

