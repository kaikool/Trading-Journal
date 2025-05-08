# Firebase Functions Configuration Guide

## Cấu hình Firebase Functions cho TwelveData API

Khi triển khai ứng dụng lên Firebase, bạn cần cấu hình Firebase Functions để sử dụng TwelveData API đúng cách.

### 1. Định dạng khóa 2 phần (2-part key)

Firebase Functions yêu cầu các biến môi trường phải ở định dạng khóa 2 phần, ví dụ:

```
twelvedata.apikey
```

Thay vì định dạng thông thường:

```
TWELVEDATA_API_KEY
```

### 2. Cách cấu hình trong Firebase

```bash
# Đảm bảo đã cài đặt Firebase CLI và đăng nhập
npm install -g firebase-tools
firebase login

# Thiết lập cấu hình Firebase Functions với TwelveData API key
firebase functions:config:set twelvedata.apikey="YOUR_API_KEY_HERE"

# Kiểm tra cấu hình hiện tại
firebase functions:config:get
```

### 3. Trong GitHub Actions

GitHub Actions workflow đã được cấu hình để tự động thiết lập cấu hình này trong quá trình triển khai:

```yaml
- name: Configure Firebase Functions Config
  run: |
    npx firebase functions:config:set twelvedata.apikey="${{ secrets.TWELVEDATA_API_KEY }}" --project ${{ secrets.VITE_FIREBASE_PROJECT_ID }} --token ${{ secrets.FIREBASE_TOKEN }}
```

### 4. Cấu hình client-side

File `config.js` trong môi trường production đã bao gồm định dạng Firebase Functions config:

```javascript
window.ENV = {
  // ... các cấu hình khác ...
  
  // TwelveData API key cho production
  TWELVEDATA_API_KEY: "YOUR_API_KEY",
  
  // Firebase Functions config hỗ trợ định dạng 2-part key
  FIREBASE_CONFIG: '{"twelvedata":{"apikey":"YOUR_API_KEY"}}'
};
```

Mã nguồn của ứng dụng đã được cập nhật để kiểm tra và sử dụng cả hai định dạng, đảm bảo khả năng tương thích ngược với các phiên bản cũ.

### 5. Kiểm tra cấu hình

Để kiểm tra xem cấu hình đã được thiết lập đúng cách trên môi trường production, bạn có thể gọi API endpoint sau trong console của trình duyệt:

```javascript
fetch('/api/twelvedata/price?symbol=EURUSD&format=JSON')
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));
```

Nếu kết quả trả về giá trị giá cả thay vì lỗi 401, cấu hình đã hoạt động đúng.