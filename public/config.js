/**
 * Cấu hình biến môi trường client-side cho production
 * 
 * QUAN TRỌNG: File này phải được tải trong index.html qua script tag:
 * <script src="/config.js"></script>
 * 
 * Nếu thiếu file này, ứng dụng sẽ hiển thị lỗi:
 * "Firebase: Error (auth/api-key-not-valid.-please-pass-a-valid-api-key.)"
 */
window.ENV = {
  // Firebase configuration - UPDATED with correct values (BẮT BUỘC)
  VITE_FIREBASE_PROJECT_ID: "trading-journal-b83e9",
  VITE_FIREBASE_API_KEY: "AIzaSyAaCrPin2y3yfQGGzEZeQ2Ij2aMFzElHMc",
  VITE_FIREBASE_APP_ID: "1:721483185057:web:0744342c3a2a506c9e29e0",
  VITE_FIREBASE_MEASUREMENT_ID: "G-FJDLZ1NF69",
  VITE_FIREBASE_MESSAGING_SENDER_ID: "721483185057",
  VITE_FIREBASE_STORAGE_BUCKET: "trading-journal-b83e9.appspot.com",
  VITE_FIREBASE_DATABASE_URL: "https://trading-journal-b83e9-default-rtdb.asia-southeast1.firebasedatabase.app",
  VITE_FIREBASE_AUTH_DOMAIN: "trading-journal-b83e9.firebaseapp.com",
  
  // TwelveData API key cho môi trường production
  TWELVEDATA_API_KEY: "%TWELVEDATA_API_KEY%"
};
