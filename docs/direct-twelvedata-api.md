# Hướng dẫn sử dụng TwelveData API trực tiếp từ frontend

## Giới thiệu

Tài liệu này hướng dẫn cách cấu hình ứng dụng Forex Trade Journal để sử dụng TwelveData API trực tiếp từ frontend trong môi trường production, bao gồm cả việc hardcode API key.

## Lợi ích của việc gọi API trực tiếp

1. **Tốc độ nhanh hơn**: Loại bỏ một bước trung gian qua proxy server
2. **Đơn giản hơn**: Không cần thiết lập Firebase Functions
3. **Dễ bảo trì**: Giảm thiểu các điểm lỗi tiềm ẩn

## Cấu hình API key hardcoded

### 1. Trong file `client/src/lib/market-price-service.ts`

Khi bạn triển khai ứng dụng, thay đổi giá trị `HARDCODED_API_KEY` thành API key thực tế của bạn:

```typescript
// Hardcoded API key cho production - thay đổi giá trị này khi triển khai
const HARDCODED_API_KEY = 'YOUR_ACTUAL_TWELVEDATA_API_KEY';
```

### 2. Cơ chế độ ưu tiên API key

Hệ thống được thiết kế để sử dụng API key theo thứ tự ưu tiên sau:
1. API key từ tài khoản người dùng (nếu đã đăng nhập và đã lưu API key)
2. API key từ localStorage (nếu người dùng đã nhập trước đó)
3. API key từ cấu hình môi trường (window.ENV)
4. Hardcoded API key trong mã nguồn

### 3. Khi nào sử dụng API trực tiếp

Ứng dụng sẽ tự động sử dụng gọi API trực tiếp khi:
- Đang chạy trong môi trường production (import.meta.env.PROD === true)

## Các lưu ý bảo mật

Khi hardcode API key trong mã nguồn frontend:

1. API key sẽ hiển thị trong mã nguồn JavaScript có thể truy cập được 
2. Cân nhắc sử dụng API key có giới hạn hoặc gói miễn phí cho triển khai này
3. Có thể thiết lập giới hạn domain cho API key trong TwelveData dashboard

## Khuyến nghị

- Đối với các triển khai thử nghiệm hoặc demo: Có thể sử dụng hardcoded API key
- Đối với các triển khai production chính thức: Nên sử dụng proxy server hoặc backend service để bảo vệ API key