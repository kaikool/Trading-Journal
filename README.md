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

## Cập nhật mới (01/05/2025)

- Loại bỏ phụ thuộc vào Firebase Functions
- Chuyển sang sử dụng Firebase Storage Web SDK trực tiếp
- Cải thiện hiệu suất và giảm độ trễ khi tải ảnh
- Tối ưu hóa bộ nhớ đệm hình ảnh cho trải nghiệm người dùng tốt hơn
- Hoàn thiện cấu hình GitHub Actions để triển khai tự động
- Nâng cấp DataCacheContext với quản lý phiên bản và trạng thái tải tinh chỉnh hơn
- Sửa lỗi "To run this command, you need to specify a project" khi triển khai Firebase Hosting
- Cập nhật cấu trúc thư mục dist phù hợp với firebase.json
- Sửa lỗi TypeScript trong các component biểu đồ Recharts

## Triển khai GitHub

### 1. Đẩy code lên GitHub

```bash
# Đã cấu hình Git repository
git remote add origin https://github.com/USERNAME/trading-journal.git

# Đẩy code lên GitHub sử dụng Personal Access Token
git push -u origin master
```

### 2. Cấu hình GitHub Actions

Để triển khai tự động với GitHub Actions, bạn cần cấu hình các Secret sau trong repository:

- `FIREBASE_TOKEN`: Token của Firebase CI (Tạo bằng lệnh `firebase login:ci`)
- `VITE_FIREBASE_API_KEY`: API Key từ Firebase Console
- `VITE_FIREBASE_APP_ID`: Firebase App ID
- `VITE_FIREBASE_PROJECT_ID`: Firebase Project ID (trading-journal-b83e9)
- `VITE_FIREBASE_MESSAGING_SENDER_ID`: Firebase Messaging Sender ID
- `VITE_FIREBASE_MEASUREMENT_ID`: Firebase Measurement ID

Quy trình CI/CD được cấu hình trong file `.github/workflows/build-deploy.yml` và sẽ tự động triển khai khi có commit vào nhánh `main`.

### 3. Kích hoạt Workflow

Sau khi cấu hình các Secrets:
1. Vào tab Actions trong GitHub repository
2. Chọn workflow "Build and Deploy"
3. Nhấn "Run workflow" và chọn nhánh tương ứng

## Phát triển

```bash
# Cài đặt dependencies
npm install

# Chạy server phát triển
npm run dev

# Build cho production
npm run build
```

## Cấu hình quan trọng

Để cấu hình ứng dụng, cần đảm bảo cập nhật các tệp sau:

- `.env.local`: Biến môi trường cho phát triển local
- `public/config.js`: Cấu hình Firebase cho môi trường production (được tạo tự động từ template)
- `firebase.json`: Cấu hình Firebase Hosting và Storage

## Hướng dẫn triển khai với Personal Access Token

Nếu gặp vấn đề xác thực khi push lên GitHub, hãy sử dụng Personal Access Token:

```bash
git remote add origin https://USERNAME:PERSONAL_ACCESS_TOKEN@github.com/USERNAME/REPO_NAME.git
```

GitHub sẽ sử dụng token này thay vì yêu cầu mật khẩu. Đảm bảo token có đủ quyền với scope "repo".