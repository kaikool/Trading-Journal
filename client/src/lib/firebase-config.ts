/**
 * firebase-config.ts
 * 
 * Cấu hình Firebase cho ứng dụng, hỗ trợ cả môi trường development và production
 * Trong production, sử dụng các biến môi trường với tiền tố VITE_ hoặc window.ENV
 */

// PERFORMANCE OPTIMIZATION: Memoize config để tránh tính toán lại nhiều lần
let cachedConfig: any = null;

function getFirebaseConfig() {
  // Trả về cache nếu đã có
  if (cachedConfig) return cachedConfig;
  
  // Xác định Firebase Project ID - sử dụng biến môi trường hoặc giá trị mặc định
  let projectId: string = "trading-journal-b83e9"; // Default value
  
  // Ưu tiên sử dụng window.ENV (cho runtime config.js) 
  if (typeof window !== 'undefined' && window.ENV && window.ENV.VITE_FIREBASE_PROJECT_ID) {
    projectId = window.ENV.VITE_FIREBASE_PROJECT_ID;
  }
  // Thử dùng Vite environment variables
  else if (import.meta.env.VITE_FIREBASE_PROJECT_ID) {
    projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  }
  
  // Tạo cấu hình Firebase
  cachedConfig = {
    // API Key - ưu tiên biến môi trường, không có giá trị mặc định cho production
    apiKey: (typeof window !== 'undefined' && window.ENV?.VITE_FIREBASE_API_KEY) || 
            import.meta.env.VITE_FIREBASE_API_KEY || 
            "",
    
    // Auth Domain - luôn dựa trên Project ID
    authDomain: `${projectId}.firebaseapp.com`,
    
    // Project ID - từ cấu hình ở trên
    projectId: projectId,
    
    // Storage Bucket - ưu tiên biến môi trường, nếu không có thì dựa trên Project ID
    storageBucket: (typeof window !== 'undefined' && window.ENV?.VITE_FIREBASE_STORAGE_BUCKET) || 
                  import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 
                  `${projectId}.appspot.com`,
    
    // App ID - ưu tiên biến môi trường, không có giá trị mặc định cho production
    appId: (typeof window !== 'undefined' && window.ENV?.VITE_FIREBASE_APP_ID) || 
          import.meta.env.VITE_FIREBASE_APP_ID || 
          "",
    
    // Sender ID - ưu tiên biến môi trường, nếu không có thì dùng giá trị mặc định
    messagingSenderId: (typeof window !== 'undefined' && window.ENV?.VITE_FIREBASE_MESSAGING_SENDER_ID) || 
                      import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || 
                      "721483185057",
                      
    // Database URL - ưu tiên biến môi trường (tuỳ chọn)
    databaseURL: (typeof window !== 'undefined' && window.ENV?.VITE_FIREBASE_DATABASE_URL) || 
                import.meta.env.VITE_FIREBASE_DATABASE_URL,
                
    // Measurement ID - ưu tiên biến môi trường (tuỳ chọn)
    measurementId: (typeof window !== 'undefined' && window.ENV?.VITE_FIREBASE_MEASUREMENT_ID) || 
                  import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
  };
  
  return cachedConfig;
}

// Xuất cấu hình Firebase hiệu năng cao
const firebaseConfig = getFirebaseConfig();

export default firebaseConfig;