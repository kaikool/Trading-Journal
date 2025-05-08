const ENV = import.meta.env.MODE || 'development';
const IS_PROD = ENV === 'production';

const DEV_API_BASE = 'http://localhost:5000';
const PROD_API_BASE = typeof window !== 'undefined' && window.ENV && window.ENV.VITE_API_BASE_URL !== undefined
  ? window.ENV.VITE_API_BASE_URL
  : ''; 

// Kiểm tra xem có FIREBASE_CONFIG trong window.ENV không (hỗ trợ cả 2 định dạng)
if (typeof window !== 'undefined' && window.ENV) {
  // Đảm bảo FIREBASE_CONFIG tồn tại trong window.ENV
  if (window.ENV.FIREBASE_CONFIG === undefined) {
    window.ENV.FIREBASE_CONFIG = '{}';
  }
}

export const API_BASE = IS_PROD ? PROD_API_BASE : DEV_API_BASE;

export const ApiEndpoints = {
  base: API_BASE,
};

export default ApiEndpoints;