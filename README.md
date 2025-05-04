# Forex Trading Journal

<p align="center">
  <img src="public/app-icon.svg" width="128" height="128" alt="Forex Trading Journal Logo">
</p>

## Giới thiệu

Forex Trading Journal là ứng dụng nhật ký giao dịch chuyên nghiệp dành cho các nhà đầu tư forex. Ứng dụng được thiết kế với trải nghiệm người dùng hiện đại, khả năng phân tích tâm lý giao dịch nâng cao, và hoạt động đầy đủ ngay cả khi không có kết nối internet (PWA - Progressive Web App).

## Tính năng chính

### Quản lý giao dịch
- Theo dõi chi tiết các giao dịch với thông tin đầy đủ về cặp tiền tệ, giá entry/exit, SL/TP
- Tải lên và quản lý hình ảnh biểu đồ cho mỗi giao dịch
- Ghi chú chi tiết về chiến lược, mô hình kỹ thuật, và lý do giao dịch

### Phân tích tâm lý
- Theo dõi trạng thái cảm xúc khi giao dịch (tự tin, lo lắng, hứng khởi...)
- Ghi nhận kỷ luật giao dịch (tuân thủ kế hoạch, giao dịch sớm, revenge trading...)
- Phân tích mối quan hệ giữa trạng thái tâm lý và kết quả giao dịch

### Thống kê và phân tích
- Tính toán tự động tỷ lệ thắng/thua, profit factor, drawdown
- Biểu đồ hiệu suất theo cặp tiền, chiến lược, phiên giao dịch
- Phân tích xu hướng qua thời gian với biểu đồ equity curve

### Hệ thống chiến lược
- Tạo và quản lý các chiến lược giao dịch với các quy tắc cụ thể
- Theo dõi hiệu suất của từng chiến lược riêng biệt
- Thiết lập các chỉ báo và điều kiện giao dịch

### Tính năng PWA (Progressive Web App)
- Hoạt động offline đầy đủ, đồng bộ khi có kết nối
- Cài đặt như ứng dụng native trên desktop và mobile
- Thông báo và cập nhật tự động

## Công nghệ sử dụng

- **Frontend:** React.js, TypeScript, Tailwind CSS
- **Backend:** Firebase (Authentication, Firestore, Storage)
- **State Management:** React Context API, Zustand
- **Styling:** Tailwind CSS với shadcn/ui components
- **Biểu đồ:** Recharts
- **PWA:** Service Workers, Web App Manifest

## Hướng dẫn cài đặt

### Yêu cầu hệ thống
- Node.js phiên bản 18 trở lên
- NPM hoặc Yarn

### Các bước cài đặt

1. Clone repository
```bash
git clone https://github.com/yourusername/forex-trading-journal.git
cd forex-trading-journal
```

2. Cài đặt dependencies
```bash
npm install
# hoặc
yarn install
```

3. Cấu hình Firebase
   - Tạo tệp `.env.local` từ `.env.example`
   - Điền thông tin Firebase API keys của bạn

4. Chạy ứng dụng ở môi trường development
```bash
npm run dev
# hoặc
yarn dev
```

5. Build cho production
```bash
npm run build
# hoặc
yarn build
```

## Cách sử dụng

### Đăng nhập và thiết lập tài khoản
- Đăng ký tài khoản mới hoặc đăng nhập với tài khoản hiện có
- Thiết lập số dư ban đầu và tùy chỉnh cài đặt

### Thêm giao dịch mới
- Nhấn nút "New Trade" trên trang Dashboard
- Điền thông tin giao dịch: cặp tiền, hướng, giá entry/exit, SL/TP...
- Tải lên hình ảnh biểu đồ (tùy chọn)
- Ghi chú về chiến lược và lý do giao dịch

### Xem phân tích
- Truy cập trang Analytics để xem tổng quan về hiệu suất
- Lọc dữ liệu theo khoảng thời gian, cặp tiền, chiến lược...
- Xem biểu đồ hiệu suất và các chỉ số quan trọng

### Quản lý chiến lược
- Tạo chiến lược mới trong phần Settings > Strategies
- Định nghĩa quy tắc entry/exit và các điều kiện giao dịch
- Theo dõi hiệu suất của từng chiến lược

## Đóng góp

Chúng tôi rất hoan nghênh mọi đóng góp vào dự án! Nếu bạn muốn tham gia:

1. Fork repository
2. Tạo branch cho tính năng mới (`git checkout -b feature/amazing-feature`)
3. Commit các thay đổi (`git commit -m 'Add some amazing feature'`)
4. Push lên branch của bạn (`git push origin feature/amazing-feature`)
5. Mở Pull Request

## Giấy phép

Dự án này được phân phối dưới giấy phép [MIT](LICENSE).

## Liên hệ

Nếu bạn có bất kỳ câu hỏi hoặc đề xuất nào, vui lòng liên hệ:

- Email: [your-email@example.com](mailto:your-email@example.com)
- Website: [yourwebsite.com](https://yourwebsite.com)

---

<p align="center">
  <b>Forex Trading Journal</b> - Nâng cao hiệu suất giao dịch với phân tích tâm lý và chiến lược chuyên nghiệp
</p>
