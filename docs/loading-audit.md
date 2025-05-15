# Báo Cáo Rà Soát Hệ Thống Loading UI

## Mục đích
Tài liệu này tổng hợp kết quả rà soát toàn bộ hệ thống Loading UI trên ứng dụng, xác định các cơ chế hiển thị trạng thái loading, fallback và suspense đang tồn tại, nhằm chuẩn bị hợp nhất về một cơ chế duy nhất (skeleton).

## Tóm tắt chung
Ứng dụng hiện tại đang sử dụng nhiều cơ chế loading khác nhau, bao gồm:
- Spinner (loading icon xoay)
- Skeleton UI (khung nội dung mờ)
- Text placeholders (vd: "Loading...")
- State conditionals (hiển thị/ẩn nội dung dựa trên `isLoading`)
- Suspense fallback (React.Suspense)

Việc sử dụng nhiều cơ chế khác nhau tạo ra trải nghiệm không nhất quán và khó bảo trì.

## Phân loại và chi tiết

### 1. Các trang (Pages)

#### 1.1. Dashboard
**Component**: `Dashboard.tsx`  
**Cơ chế loading**:
- Sử dụng conditional rendering với AppSkeleton mới
- Suspense fallback cho LazyPerformanceChart và LazyRecentTradesCard
- isLoading prop được truyền vào từng component con

**Vấn đề**:
- Đã được cập nhật sang AppSkeleton, hoạt động tốt

#### 1.2. Analytics
**Component**: `Analytics.tsx`  
**Cơ chế loading**:
- Sử dụng AppSkeleton cho main content loading
- TabLoadingFallback component riêng với AppSkeleton
- Multiple Suspense fallbacks cho các tab

**Vấn đề**:
- TabLoadingFallback dùng cách tiếp cận khác với AppSkeleton, nên hợp nhất

#### 1.3. TradeHistory
**Component**: `TradeHistory.tsx`  
**Cơ chế loading**:
- Spinner trực tiếp trong JSX khi `isLoading === true`
- Text "Loading trades..." kết hợp với spinner
- Dùng useTradesQuery với pagination

**Vấn đề**:
- Spinner hiển thị không phù hợp với kích thước danh sách
- Layout shift khi data load xong
- Cần chuyển sang LIST_ITEM skeleton

#### 1.4. TradeDetail
**Component**: `TradeDetail.tsx`  
**Cơ chế loading**:
- Text "Loading trade details..."
- Spinner component khi `isLoading === true`
- Không làm trống vị trí, khiến UI bị nhảy layout

**Vấn đề**:
- Layout shift nghiêm trọng
- Spinner nhỏ không phản ánh đúng kích thước thật của nội dung

#### 1.5. Achievements
**Component**: `Achievements.tsx`  
**Cơ chế loading**:
- Đã sử dụng AppSkeleton
- Suspense fallback với AppSkeleton ở level LIST_ITEM

**Vấn đề**:
- Đã được cập nhật, đang hoạt động tốt

#### 1.6. Strategies
**Component**: `Strategies.tsx`  
**Cơ chế loading**:
- Đã sử dụng AppSkeleton
- Suspense fallback với AppSkeleton level CARD

**Vấn đề**:
- Đã được cập nhật, đang hoạt động tốt

### 2. Components cấp thấp

#### 2.1. ChartComponents
**Component**: `components/dynamic/chart-components.tsx`  
**Cơ chế loading**:
- Đã sử dụng AppSkeleton level CHART trong Suspense fallback

**Vấn đề**:
- Đã được cập nhật, đang hoạt động tốt

#### 2.2. TradeForm
**Component**: `components/trades/TradeForm.tsx`  
**Cơ chế loading**:
- Spinner khi form đang submit
- Disable inputs và buttons khi loading
- Không có placeholder rõ ràng cho việc loading form data

**Vấn đề**:
- Người dùng không thấy rõ form đang load
- Cần chuyển sang skeleton cho form fields

#### 2.3. TradeImageManager
**Component**: `components/trades/TradeImageManager.tsx`  
**Cơ chế loading**:
- Spinner khi đang upload ảnh
- "Uploading..." text khi upload
- Không có placeholder cho ảnh đang tải

**Vấn đề**:
- Image placeholder không rõ ràng
- Cần skeleton cho vùng chứa ảnh

#### 2.4. PriceChart
**Component**: `components/PriceChart.tsx`  
**Cơ chế loading**:
- Spinner nhỏ trong giữa khu vực biểu đồ
- Text "Loading market data..."
- Spinner kết hợp với text

**Vấn đề**:
- Layout shift khi biểu đồ hiển thị
- Cần skeleton cho biểu đồ

### 3. Các hooks và providers

#### 3.1. useTradesQuery
**Hook**: `hooks/use-trades-query.ts`  
**Cơ chế loading**:
- React Query's isLoading/isFetching
- Trả về state loading, không có UI trực tiếp

**Vấn đề**:
- Việc xử lý loading được ủy thác cho component gọi hook

#### 3.2. useUserDataQuery
**Hook**: `hooks/use-user-data-query.ts`  
**Cơ chế loading**:
- React Query's isLoading
- Không có skeleton/placeholder cho user data

**Vấn đề**:
- Cần kết hợp nối với AppSkeleton tại điểm sử dụng

#### 3.3. useMarketPrice
**Hook**: `hooks/use-market-price.ts`  
**Cơ chế loading**:
- Simple boolean loading state
- Không có UI loading trực tiếp

**Vấn đề**:
- Component sử dụng hook này cần xử lý loading riêng

## Các khu vực loading nhiều nhất

1. **CRUD Trade Operations**:
   - TradeForm, TradeHistory, TradeDetail
   - Nhiều API calls đồng thời khi tạo/sửa giao dịch
   - Upload ảnh đến Firebase Storage

2. **Dashboard và Analytics**:
   - Tải nhiều dữ liệu cùng lúc
   - Lazy-loaded charts và components
   - Tính toán phức tạp từ dữ liệu

3. **User Authentication**:
   - Login/Signup forms
   - Profile loading
   - Session management

## Đề xuất chuyển sang Skeleton

### Nguyên tắc chung
1. Sử dụng AppSkeleton component thống nhất cho tất cả trường hợp loading
2. Sử dụng SkeletonLevel phù hợp với loại nội dung
3. Loại bỏ hoàn toàn spinners, text fallbacks, và các cơ chế loading khác
4. Đảm bảo skeleton có kích thước tương đương với nội dung thật

### Ưu tiên cập nhật
1. **Ưu tiên cao**:
   - TradeHistory và TradeDetail (tần suất sử dụng cao)
   - TradeForm (UX quan trọng)
   - PriceChart (hiển thị dữ liệu quan trọng)

2. **Ưu tiên trung bình**:
   - Các hooks cần tích hợp với AppSkeleton
   - Login/Signup forms

3. **Ưu tiên thấp**:
   - Các components đã được cập nhật một phần
   - Các phần ít hiển thị loading

## Kết luận
Hệ thống loading UI hiện tại không nhất quán và sử dụng nhiều cơ chế khác nhau. Việc chuyển sang một hệ thống skeleton thống nhất sẽ cải thiện đáng kể trải nghiệm người dùng và tính bảo trì của code.

Việc AppSkeleton đã được triển khai ở một số nơi quan trọng là bước tiến tốt, cần tiếp tục mở rộng sang các khu vực còn lại.