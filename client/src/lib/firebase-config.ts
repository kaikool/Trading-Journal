/**
 * firebase-config.ts
 * 
 * Cấu hình Firebase cho ứng dụng, hỗ trợ cả môi trường development và production
 * Trong production, sử dụng các biến môi trường với tiền tố VITE_ hoặc window.ENV
 */

// Xác định Firebase Project ID - sử dụng biến môi trường hoặc giá trị mặc định
let projectId: string;

// 1. Ưu tiên sử dụng window.ENV (cho runtime config.js) 
if (typeof window !== 'undefined' && window.ENV && window.ENV.VITE_FIREBASE_PROJECT_ID) {
  projectId = window.ENV.VITE_FIREBASE_PROJECT_ID;
}
// 2. Thử dùng Vite environment variables
else if (import.meta.env.VITE_FIREBASE_PROJECT_ID) {
  projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
}
// 3. Fallback về giá trị mặc định cho development
else {
  projectId = "trading-journal-b83e9";
}

// Tạo cấu hình Firebase
const firebaseConfig = {
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

// Log Firebase config for debugging in all environments for now (temporary)
console.log("Firebase config loaded:", {
  projectId: firebaseConfig.projectId, 
  storageBucket: firebaseConfig.storageBucket,
  apiKeySet: !!firebaseConfig.apiKey,
  appIdSet: !!firebaseConfig.appId
});

export default firebaseConfig;