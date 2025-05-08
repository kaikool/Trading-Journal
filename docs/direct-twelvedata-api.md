# Cách sử dụng TwelveData API trong ứng dụng

## Tổng quan

Ứng dụng hiện tại sử dụng TwelveData API để lấy giá thị trường Forex theo thời gian thực. Khác với thiết kế ban đầu sử dụng Firebase Functions làm proxy, phiên bản hiện tại **gọi trực tiếp đến TwelveData API từ frontend** với key API được hardcode trực tiếp trong mã nguồn.

## Cài đặt API key

API key được đặt cứng trong file `client/src/lib/market-price-service.ts`:

```typescript
// Hardcoded API key - được sử dụng trực tiếp trong code (không lấy từ env hay config)
const HARDCODED_API_KEY = '1b89f469e4fa408d8700380d216f0864';
```

## Lý do cho thiết kế này

- **Đơn giản hóa kiến trúc**: Loại bỏ sự phụ thuộc vào Firebase Functions, giảm độ phức tạp của ứng dụng.
- **Giảm chi phí**: Tránh các chi phí liên quan đến Firebase Functions, đặc biệt là khi lưu lượng truy cập cao.
- **Hiệu suất tốt hơn**: Giảm độ trễ bằng cách gọi trực tiếp API từ client thay vì thông qua trung gian.
- **Giải quyết vấn đề CORS**: TwelveData API hỗ trợ CORS, cho phép gọi trực tiếp từ frontend.

## Cấu trúc mã

Module `market-price-service.ts` cung cấp các chức năng để tương tác với TwelveData API:

1. `fetchRealTimePrice(symbol)`: Lấy giá thời gian thực cho một cặp tiền tệ cụ thể
2. `fetchMultiplePrices(symbols)`: Lấy giá cho nhiều cặp tiền tệ cùng lúc
3. `formatSymbolForAPI(symbol)`: Chuyển đổi ký hiệu giao dịch sang định dạng TwelveData API
4. `isSymbolSupported(symbol)`: Kiểm tra xem một ký hiệu giao dịch có được hỗ trợ không

## Cách sử dụng trong ứng dụng

```typescript
import { fetchRealTimePrice } from '@/lib/market-price-service';

// Lấy giá thời gian thực cho EURUSD
const price = await fetchRealTimePrice('EURUSD');
console.log(`Giá EUR/USD hiện tại: ${price}`);
```

## Bộ nhớ đệm (Cache)

Để tránh gọi API quá nhiều và tối ưu hóa hiệu suất, module có tích hợp cơ chế cache:

- Mỗi giá được lưu trong bộ nhớ cache với thời gian sống là 15 giây
- Nếu có lỗi, module sẽ sử dụng giá từ cache (ngay cả khi đã hết hạn)
- Cache được lưu trong bộ nhớ và sẽ bị xóa khi làm mới trang

## Quản lý API key trong môi trường sản xuất

Khi triển khai lên môi trường sản xuất, bạn nên cập nhật giá trị `HARDCODED_API_KEY` trong file `market-price-service.ts` với khóa API thực sự của bạn:

1. Chỉnh sửa file `market-price-service.ts`
2. Thay đổi giá trị của `HARDCODED_API_KEY`
3. Build và triển khai ứng dụng

## Hướng dẫn khắc phục sự cố

Nếu bạn gặp lỗi khi gọi TwelveData API:

1. Kiểm tra xem API key có hợp lệ và còn quota không
2. Kiểm tra logs trong console của trình duyệt để xem thông báo lỗi chi tiết
3. Đảm bảo rằng các ký hiệu bạn đang sử dụng được TwelveData hỗ trợ
4. Xác minh rằng không có sự cố mạng và API endpoint có thể truy cập được

## Giới hạn và lưu ý

- TwelveData có giới hạn số lượng API calls dựa trên gói dịch vụ
- Cần thay đổi API key trong mã nguồn nếu gặp giới hạn hoặc key hết hạn
- Phương pháp này phơi bày API key trong mã nguồn frontend, chấp nhận rủi ro này vì mục đích đơn giản hóa