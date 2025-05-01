# HƯỚNG DẪN TRIỂN KHAI TRADING JOURNAL

## TỔNG QUAN
Tài liệu này hướng dẫn triển khai Trading Journal lên Firebase Hosting và Firebase Functions. Ứng dụng đã được cấu hình sẵn và chỉ cần một số bước đơn giản để đưa lên môi trường production.

## BƯỚC 1: CHUẨN BỊ MÔI TRƯỜNG

1. **Cài đặt Firebase CLI** (nếu chưa có):
   ```bash
   npm install -g firebase-tools
   firebase login
   ```

2. **Liên kết với dự án Firebase**:
   ```bash
   firebase use trading-journal-b83e9
   ```

## BƯỚC 2: BUILD VÀ TRIỂN KHAI

1. **Kiểm tra file config.js**:
   - Mở `public/config.js` và đảm bảo có đầy đủ thông tin Firebase
   - **QUAN TRỌNG:** Đặt `VITE_USE_RELATIVE_PATHS` thành `"false"` để sử dụng đường dẫn tuyệt đối đến Functions

2. **Build dự án**:
   ```bash
   # Tăng bộ nhớ và build frontend
   export NODE_OPTIONS="--max-old-space-size=2048"
   npm run build
   unset NODE_OPTIONS
   
   # Sao chép config.js vào thư mục build
   cp public/config.js dist/public/
   
   # Build Functions
   cd functions
   npm install
   npm run build
   cd ..
   ```

3. **Cài đặt biến môi trường cho Functions**:
   ```bash
   # QUAN TRỌNG: Cấu hình Functions
   firebase functions:config:set debug.skip_auth="true"
   
   # Xác nhận thông tin cấu hình đã được lưu
   firebase functions:config:get
   ```

4. **Triển khai**:
   ```bash
   # Triển khai toàn bộ
   firebase deploy
   
   # Hoặc triển khai từng phần
   firebase deploy --only functions
   firebase deploy --only hosting
   ```

5. **Kiểm tra triển khai**:
   - Truy cập ứng dụng: `https://trading-journal-b83e9.web.app`
   - Kiểm tra status API: `https://trading-journal-b83e9.web.app/api/health`

## BƯỚC 3: XỬ LÝ SỰ CỐ

1. **Lỗi "Firebase: Error (auth/api-key-not-valid)"**:
   - Kiểm tra `config.js` đã được sao chép vào `dist/public/`
   - Đảm bảo `index.html` có dòng `<script src="/config.js"></script>`

2. **Lỗi Authentication khi gọi Functions**:
   ```bash
   # Cấu hình Functions để bỏ qua xác thực trong môi trường development
   firebase functions:config:set debug.skip_auth="true"
   
   # Đối với production, cần cấu hình quyền truy cập trong Google Cloud Console:
   # 1. Mở Google Cloud Console: https://console.cloud.google.com/
   # 2. Tìm đến Cloud Functions
   # 3. Chọn từng function cần cấu hình
   # 4. Trong tab "Permissions", thêm "allUsers" với vai trò "Cloud Functions Invoker"
   ```

3. **Lỗi "Could not upload image: Server error: 400"**:
   - Kiểm tra logs của Firebase Functions: `firebase functions:log`
   - Xóa và cài đặt lại Functions: `firebase functions:delete uploadMediaV2 --force` rồi deploy lại

4. **Lỗi tải ảnh lên**:
   ```bash
   # Xem logs của Functions để chuẩn đoán
   firebase functions:log
   
   # Thêm thông tin debug để xem rõ hơn trong logs
   firebase functions:config:set debug.enable="true"
   ```

5. **Lỗi 404 khi sử dụng đường dẫn tương đối (/api/...)**:
   - Kiểm tra `firebase.json` có đầy đủ các rewrites cho từng Function
   - Kiểm tra `config.js` đã đặt `VITE_USE_RELATIVE_PATHS` thành `"true"`
   - Chạy lệnh: `firebase deploy --only hosting`

## CHI TIẾT CẤU HÌNH QUAN TRỌNG

### File `public/config.js` (production)

```javascript
window.ENV = {
  // Firebase configuration
  VITE_FIREBASE_PROJECT_ID: "trading-journal-b83e9",
  VITE_FIREBASE_API_KEY: "AIzaSyAaCrPin2y3yfQGGzEZeQ2Ij2aMFzElHMc",
  VITE_FIREBASE_APP_ID: "1:721483185057:web:0744342c3a2a506c9e29e0",
  VITE_FIREBASE_AUTH_DOMAIN: "trading-journal-b83e9.firebaseapp.com",
  VITE_FIREBASE_STORAGE_BUCKET: "trading-journal-b83e9.firebasestorage.app",
  VITE_FIREBASE_DATABASE_URL: "https://trading-journal-b83e9-default-rtdb.asia-southeast1.firebasedatabase.app",
  
  // API URLs - ĐỔI GIÁ TRỊ NÀY theo môi trường
  VITE_USE_RELATIVE_PATHS: "false",
  
  // Firebase Functions Config - Đường dẫn đầy đủ đến các Functions
  VITE_UPLOAD_MEDIA_URL: "https://us-central1-trading-journal-b83e9.cloudfunctions.net/uploadMediaV2",
  VITE_DELETE_MEDIA_URL: "https://us-central1-trading-journal-b83e9.cloudfunctions.net/deleteMedia",
  VITE_API_FUNCTION_URL: "https://us-central1-trading-journal-b83e9.cloudfunctions.net/api",
  VITE_STATUS_FUNCTION_URL: "https://us-central1-trading-journal-b83e9.cloudfunctions.net/status",
  
  // KHÔNG đặt thông tin nhạy cảm trong config.js!
  
  // Cấu hình Firebase Cloud Functions Region
  VITE_FIREBASE_FUNCTIONS_REGION: "us-central1"
};
```

### Sử dụng Callable Functions thay vì HTTP Functions

Từ phiên bản mới nhất, ứng dụng đã được cập nhật để sử dụng Firebase Callable Functions, giúp:

1. **Tự động xác thực người dùng**: Không cần thủ công gửi token JWT
2. **Tự động xử lý CORS**: Không cần thiết lập CORS headers
3. **Định dạng dữ liệu nhất quán**: Dữ liệu được biến đổi tự động giữa client và server
4. **Xử lý lỗi tốt hơn**: Lỗi được serialize và chuyển tiếp tới client

Các functions được gọi như sau từ phía client:

```javascript
import { getFunctions, httpsCallable } from "firebase/functions";

const functions = getFunctions();
const apiCall = httpsCallable(functions, 'api');

// Gọi function
const result = await apiCall({ endpoint: "trades", method: "GET" });
console.log(result.data); // Kết quả trả về
```

### Khắc phục vấn đề truy cập Functions trên production

Từ phiên bản Firebase CLI 7.7.0 trở lên, các Functions cần phải được cấu hình rõ ràng để cho phép truy cập công khai. Đây là cách khắc phục:

1. **Sử dụng Google Cloud Console**:
   - Truy cập [Google Cloud Console](https://console.cloud.google.com)
   - Chọn project của bạn (`trading-journal-b83e9`)
   - Điều hướng đến Cloud Functions
   - Đối với mỗi function (api, uploadMediaV2, deleteMedia, status):
     - Nhấp vào function → Permissions
     - Thêm principal mới: `allUsers`
     - Gán role: `Cloud Functions Invoker`
     - Lưu lại

2. **Sử dụng Google Cloud CLI** (cách thay thế):
   ```bash
   gcloud functions add-iam-policy-binding [function-name] \
     --member="allUsers" \
     --role="roles/cloudfunctions.invoker" \
     --region=us-central1 \
     --project=trading-journal-b83e9
   ```

3. **Kiểm tra quyền truy cập**:
   - Thử truy cập trực tiếp vào URL của function:
   ```
   https://us-central1-trading-journal-b83e9.cloudfunctions.net/status
   ```
   - Nếu nhận được lỗi JSON thay vì "Forbidden", quyền đã được thiết lập đúng

### Firebase.json - Cấu hình rewrites đầy đủ

```json
"rewrites": [
  {
    "source": "/api/upload/chart",
    "function": "uploadMediaV2"
  },
  {
    "source": "/api/trades/upload",
    "function": "uploadMediaV2"
  },
  {
    "source": "/api/images/delete",
    "function": "deleteMedia"
  },
  {
    "source": "/api/health",
    "function": "status"
  },
  {
    "source": "/api/**",
    "function": "api"
  },
  {
    "source": "**",
    "destination": "/index.html"
  }
]
```

## ĐỀ XUẤT KẾT NỐI API TRONG PRODUCTION

Ứng dụng có hai cách kết nối với Firebase Functions:

1. **Cách 1: URL tương đối với rewrites**
   - Đặt `VITE_USE_RELATIVE_PATHS: "true"` trong `config.js`
   - Tất cả API calls sẽ đi qua đường dẫn `/api/...`
   - Ưu điểm: Tránh lỗi CORS, dễ bảo trì, linh hoạt khi chuyển môi trường

2. **Cách 2 (đề xuất cho phiên bản hiện tại): URL tuyệt đối**
   - Đặt `VITE_USE_RELATIVE_PATHS: "false"` trong `config.js`
   - API calls sẽ đi đến các URL dạng `https://us-central1-trading-journal-b83e9.cloudfunctions.net/...`
   - Phù hợp với cấu trúc hiện tại của ứng dụng