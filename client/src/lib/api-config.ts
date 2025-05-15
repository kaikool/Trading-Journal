const ENV = import.meta.env.MODE || 'development';
const IS_PROD = ENV === 'production';

const DEV_API_BASE = 'http://localhost:5000';
const PROD_API_BASE = typeof window !== 'undefined' && window.ENV && window.ENV.VITE_API_BASE_URL !== undefined
  ? window.ENV.VITE_API_BASE_URL
  : ''; 

// Đã xóa kiểm tra FIREBASE_CONFIG - không còn cần thiết

export const API_BASE = IS_PROD ? PROD_API_BASE : DEV_API_BASE;

export const ApiEndpoints = {
  base: API_BASE,
};

