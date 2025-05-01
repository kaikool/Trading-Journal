# Forex Trading Journal

Ứng dụng nhật ký giao dịch Forex chuyên nghiệp với phân tích tâm lý và hiệu suất toàn diện, hỗ trợ quản lý và tạo chiến lược giao dịch.

## Công nghệ

- **Frontend**: React.js + TypeScript
- **Backend**: Node.js + Express
- **Xác thực & Lưu trữ**: Firebase Authentication + Firebase Storage
- **Database**: PostgreSQL với Drizzle ORM
- **UI/UX**: Tailwind CSS + Shadcn UI
- **Trực quan hóa dữ liệu**: Recharts
- **PWA**: Service Worker cho khả năng sử dụng offline

## Tính năng chính

- **Quản lý giao dịch**: Ghi lại chi tiết các giao dịch, bao gồm phân tích trực quan
- **Phân tích hiệu suất**: Thống kê và biểu đồ hiệu suất giao dịch theo thời gian, cặp tiền tệ, chiến lược
- **Phân tích tâm lý**: Theo dõi trạng thái cảm xúc và mối tương quan với kết quả giao dịch
- **Quản lý hình ảnh**: Tải lên và lưu trữ ảnh chụp màn hình biểu đồ trước và sau giao dịch
- **Ứng dụng PWA**: Hỗ trợ cài đặt trên thiết bị và sử dụng offline
- **Hệ thống thành tích**: Gamification để tạo động lực giao dịch nhất quán

## Cập nhật mới (30/04/2025)

- Loại bỏ phụ thuộc vào Firebase Functions
- Chuyển sang sử dụng Firebase Storage Web SDK trực tiếp
- Cải thiện hiệu suất và giảm độ trễ khi tải ảnh
- Tối ưu hóa bộ nhớ đệm hình ảnh cho trải nghiệm người dùng tốt hơn
- Chuẩn bị cho phát hành production

## Triển khai

Dự án được triển khai trên Firebase Hosting sử dụng GitHub Actions. 

### GitHub Actions

Để triển khai tự động với GitHub Actions, bạn cần cấu hình các Secret sau trong repository:

- `FIREBASE_TOKEN`: Token của Firebase CI (Tạo bằng lệnh `firebase login:ci`)
- `VITE_FIREBASE_API_KEY`: API Key Firebase
- `VITE_FIREBASE_APP_ID`: Firebase App ID
- `VITE_FIREBASE_PROJECT_ID`: Firebase Project ID
- `VITE_FIREBASE_MESSAGING_SENDER_ID`: Firebase Messaging Sender ID
- `VITE_FIREBASE_MEASUREMENT_ID`: Firebase Measurement ID

Quy trình CI/CD được cấu hình trong file `.github/workflows/build-deploy.yml` và sẽ tự động triển khai khi có commit vào nhánh `main`.

Chi tiết cấu hình và hướng dẫn triển khai thủ công có trong tệp `HƯỚNG_DẪN_TRIỂN_KHAI_THỦ_CÔNG.md`.

## Phát triển

```bash
# Cài đặt dependencies
npm install

# Chạy server phát triển
npm run dev

# Build cho production
npm run build
```

## Cấu hình

Để cấu hình ứng dụng, cần đảm bảo cập nhật các tệp sau:

- `.env.local`: Biến môi trường cho phát triển local
- `public/config.js`: Cấu hình Firebase cho môi trường production
- `firebase.json`: Cấu hình Firebase Hosting và Storage