# Forex Trading Journal

Ứng dụng nhật ký giao dịch Forex chuyên nghiệp với phân tích tâm lý và hiệu suất toàn diện cho các nhà giao dịch.

## Tính năng chính

- 📊 Phân tích hiệu suất chuyên sâu
- 📈 Biểu đồ trực quan
- 💼 Quản lý danh mục đầu tư
- 🧠 Theo dõi tâm lý giao dịch
- 🏆 Hệ thống thành tựu và cấp độ
- 📱 Hỗ trợ PWA (Progressive Web App)

## Hướng dẫn triển khai

### 1. Triển khai qua GitHub Actions (Khuyến nghị)

Dự án này đã được cấu hình để triển khai tự động qua GitHub Actions. Để sử dụng phương pháp này:

1. **Tạo repository trên GitHub** và đẩy code lên.

2. **Cấu hình GitHub Secrets**:
   - Đi tới repository > Settings > Secrets and variables > Actions
   - Thêm các secrets sau:
     ```
     FIREBASE_TOKEN
     VITE_FIREBASE_API_KEY
     VITE_FIREBASE_APP_ID
     VITE_FIREBASE_PROJECT_ID
     VITE_FIREBASE_MESSAGING_SENDER_ID
     VITE_FIREBASE_MEASUREMENT_ID
     ```

3. **Chạy workflow**:
   - Khi bạn push code lên nhánh `main`, workflow sẽ tự động chạy.
   - Hoặc bạn có thể kích hoạt thủ công: Actions > "Build and Deploy (Direct Config)" > Run workflow

### 2. Triển khai thủ công

1. **Cấu hình Firebase**:
   - Tạo một tệp `public/config.js` từ mẫu `public/config-template.js`
   - Điền các thông tin từ Firebase Console vào tệp này

2. **Build ứng dụng**:
   ```bash
   npm run build
   ```

3. **Triển khai lên Firebase**:
   ```bash
   firebase deploy
   ```

## Lưu ý quan trọng

- Phiên bản này sử dụng Firebase Storage Web SDK trực tiếp thay vì Firebase Functions.
- Tệp `config.js` là bắt buộc trong thư mục public khi triển khai.
- Đã chuyển đổi tất cả việc xử lý ảnh/tệp sang client-side để giảm chi phí.

## Cấu trúc dự án

```
├── client/              # Mã nguồn frontend
│   ├── src/             # Mã nguồn React
│   │   ├── components/  # Components UI
│   │   ├── contexts/    # Context API
│   │   ├── hooks/       # Custom hooks
│   │   ├── lib/         # Thư viện tiện ích
│   │   ├── pages/       # Các trang chính
│   │   └── types/       # TypeScript types
├── public/              # Tài nguyên công khai
├── scripts/             # Scripts tiện ích
├── server/              # API server
└── shared/              # Mã dùng chung
```

## Công nghệ sử dụng

- React với TypeScript cho frontend
- Firebase cho xác thực và lưu trữ
- Recharts cho biểu đồ phân tích
- Shadcn UI + Tailwind CSS cho thiết kế
- PWA cho khả năng làm việc offline