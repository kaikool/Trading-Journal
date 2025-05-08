/**
 * Đây là tệp mẫu cho cấu hình biến môi trường client-side trong production
 * 
 * HƯỚNG DẪN SỬ DỤNG:
 * 1. Sao chép tệp này và đổi tên thành config.js
 * 2. Điền các giá trị thực tế vào từ Firebase Console và hướng dẫn triển khai
 * 3. Đặt tệp config.js trong thư mục public/ trước khi build
 * 4. QUAN TRỌNG: Phải thêm <script src="/config.js"></script> vào file index.html
 * 
 * CHÚ Ý CẢNH BÁO:
 * - Tệp này là BẮT BUỘC cho môi trường production
 * - Nếu thiếu file này hoặc không được load đúng cách, ứng dụng sẽ bị lỗi:
 *   "Firebase: Error (auth/api-key-not-valid.-please-pass-a-valid-api-key.)"
 * - Các giá trị Firebase phải chính xác: VITE_FIREBASE_API_KEY, VITE_FIREBASE_APP_ID, VITE_FIREBASE_PROJECT_ID
 * 
 * CẬP NHẬT 08/05/2025: 
 * - Hỗ trợ gọi trực tiếp TwelveData API từ frontend trong môi trường production
 * - Chuyển từ Firebase Functions sang Firebase Storage Web SDK trực tiếp
 * - Hỗ trợ triển khai tự động qua GitHub Actions
 * - Thêm hỗ trợ TwelveData API trong môi trường production với placeholder %TWELVEDATA_API_KEY%
 *   (placeholder này sẽ được tự động thay thế trong quá trình build)
 */

window.ENV = {
  // Firebase configuration - BẮT BUỘC (ứng dụng sẽ bị trắng màn hình nếu thiếu)
  VITE_FIREBASE_PROJECT_ID: "YOUR_PROJECT_ID",           // BẮT BUỘC
  VITE_FIREBASE_API_KEY: "YOUR_API_KEY",                 // BẮT BUỘC
  VITE_FIREBASE_APP_ID: "YOUR_APP_ID",                   // BẮT BUỘC
  VITE_FIREBASE_MEASUREMENT_ID: "YOUR_MEASUREMENT_ID",
  VITE_FIREBASE_MESSAGING_SENDER_ID: "YOUR_SENDER_ID",
  VITE_FIREBASE_STORAGE_BUCKET: "YOUR_PROJECT_ID.firebasestorage.app",
  VITE_FIREBASE_DATABASE_URL: "https://YOUR_PROJECT_ID-default-rtdb.YOUR_REGION.firebasedatabase.app",
  VITE_FIREBASE_AUTH_DOMAIN: "YOUR_PROJECT_ID.firebaseapp.com",
  
  // API Base URL (không còn sử dụng Firebase Functions)
  VITE_API_BASE_URL: "",
  
  // TwelveData API key cho môi trường production - không sử dụng
  // Thay đổi giá trị HARDCODED_API_KEY trong market-price-service.ts
  TWELVEDATA_API_KEY: "%TWELVEDATA_API_KEY%"
};

// Khi triển khai với GitHub Actions, các giá trị sẽ được thay thế bằng các biến môi trường từ CI/CD