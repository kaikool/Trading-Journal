# Báo Cáo Hệ Thống Loading

## 1. Tổng Quan

Hệ thống hiển thị trạng thái loading trong ứng dụng Forex Trading Journal được triển khai qua nhiều cơ chế khác nhau. Báo cáo này phân tích chi tiết các kiểu loading, vị trí xuất hiện, cách thức hoạt động và đưa ra đề xuất chuẩn hóa.

## 2. Các Kiểu Loading Hiện Tại

### 2.1. Spinner (Loading Icon)

#### Vị Trí Xuất Hiện:
- Trong component `LoadingFallback` khi `simple={true}`
- Trong hệ thống `React.Suspense` + `React.lazy` cho dynamic imports
- Tại `App.tsx` trong trạng thái loading ban đầu

#### Cách Hoạt Động:
```jsx
<Icons.ui.spinner className="h-6 w-6 animate-spin text-muted-foreground" />
```

Sử dụng CSS animation (`animate-spin`) từ Tailwind để tạo hiệu ứng quay tròn cho icon spinner.

### 2.2. Skeleton Loading

#### Vị Trí Xuất Hiện:
- Component `Skeleton` từ `@/components/ui/skeleton`
- Component `LoadingFallback` khi `simple={false}` (mặc định)
- Các component đặc thù như:
  - `StatCard` skeleton
  - `AccountSummaryCard` skeleton
  - `RecentTradesCard` skeleton
  - `PerformanceChart` skeleton
  - `TabLoadingFallback` trong Analytics
  - Settings page skeleton

#### Cách Hoạt Động:
```jsx
// Base component
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

// Sử dụng để tạo skeleton phức tạp
<div className="space-y-4">
  <div className="flex items-center space-x-4">
    <Skeleton className="h-12 w-12 rounded-full" />
    <div className="space-y-2">
      <Skeleton className="h-4 w-[250px]" />
      <Skeleton className="h-4 w-[200px]" />
    </div>
  </div>
  <Skeleton className="h-4 w-full" />
  <Skeleton className="h-4 w-3/4" />
</div>
```

Sử dụng animation `animate-pulse` từ Tailwind để tạo hiệu ứng nhấp nháy cho skeleton.

### 2.3 Fallback Component (React.Suspense)

#### Vị Trí Xuất Hiện:
- Trong `App.tsx` cho lazy-loaded routes
- Trong component `SafeLazyLoad` cho dynamic components
- Tại page Achievements.tsx

#### Cách Hoạt Động:
```jsx
<Suspense fallback={<LoadingFallback height={300} />}>
  <LazyComponent />
</Suspense>
```

React.Suspense được sử dụng cùng với React.lazy để hiển thị fallback component trong khi lazy component đang được tải.

### 2.4. Placeholder Dạng Text

#### Vị Trí Xuất Hiện:
- Trong các component bị lỗi trong ErrorBoundary
- Trong các phản hồi lỗi API

#### Cách Hoạt Động:
```jsx
// Ví dụ lỗi MIME type trong SafeLazyLoad
<AlertDescription>
  Could not load component due to a MIME type error. This typically happens in PWA mode. 
  {navigator.onLine ? ' Please try refreshing the page.' : ' You appear to be offline.'}
</AlertDescription>
```

### 2.5. Shimmer/Animation Tùy Chỉnh

#### Vị Trí Xuất Hiện:
- Progress bar ở đầu trang khi chuyển route (`App.tsx`)
- CSS classes tùy chỉnh trong `globals.css`

#### Cách Hoạt Động:
```jsx
// App.tsx - Mini loader khi chuyển trang
{!isPageReady && !prefersReducedMotion && (
  <div className="fixed inset-x-0 top-0 z-50 h-0.5 overflow-hidden">
    <div className="w-full h-full bg-primary/10 relative">
      <div className="absolute inset-y-0 left-0 bg-primary animate-indeterminate-progress w-full"></div>
    </div>
  </div>
)}
```

Sử dụng hiệu ứng shimmer (`animate-indeterminate-progress`) cho thanh tiến trình khi chuyển trang.

## 3. Phân Loại Theo Cách Sử Dụng

### 3.1. API Loading (React Query / Network Requests)

- **Hiện trạng**: Sử dụng `isLoading` và `isPending` từ React Query hooks
- **Components**: 
  - `useUserDataQuery`, `useTradesQuery` hooks
  - `useGoalData` và các mutation hooks
  - Các components hiển thị dữ liệu từ API thường có trạng thái loading riêng

### 3.2. Component-Level Loading

- **Hiện trạng**: Mỗi component quản lý trạng thái loading riêng
- **Components**:
  - StatCard
  - PerformanceChart
  - RecentTradesCard
  - AccountSummaryCard

### 3.3. Route-Level Loading

- **Hiện trạng**: Sử dụng thanh progress ở đầu trang và animation khi chuyển route
- **Implementation**:
  - Logic trong `App.tsx` sử dụng `isPageReady` flag
  - Mini loader với animation `animate-indeterminate-progress`

### 3.4. Lazy Loading / Suspense

- **Hiện trạng**: Sử dụng React.lazy và Suspense cho code splitting
- **Implementation**:
  - Lazy load tất cả các pages trong `App.tsx`
  - Lazy load các components nặng với `SafeLazyLoad`
  - Hệ thống preload cho các routes phổ biến

## 4. Mức Độ Thống Nhất

### 4.1. Số Lượng Loading Components

- **Spinner**: 1 loại chính (Icons.ui.spinner với animate-spin)
- **Skeleton**: 1 component base (ui/skeleton.tsx) nhưng có nhiều custom implementations
- **Loading Indicators**: 
  - `LoadingFallback` (component chính)
  - Các skeleton tùy chỉnh cho từng component
  - Mini loader cho route changes

### 4.2. Trùng Lặp Logic/Hardcode

- **Trùng lặp**: Có sự trùng lặp trong cách triển khai skeleton UI cho các component khác nhau
- **Hardcode**: 
  - Một số giá trị width/height cho skeleton được hardcode
  - Số lượng skeleton items thường được hardcode (ví dụ: Array(3) trong RecentTradesCard)

### 4.3. Components Thiếu Loading

- Một số component có thể không hiển thị loading state đầy đủ, đặc biệt là các components con khi parent đang loading

## 5. Kiểm Tra Fallback Trong Suspense

### 5.1. Đánh Giá Fallbacks

- **LoadingFallback**: Đang được sử dụng nhất quán làm fallback cho hầu hết Suspense
- **Empty Fallback**: Không tìm thấy fallback rỗng
- **Xử lý lỗi**: SafeLazyLoad có xử lý lỗi khi lazy load thất bại, đặc biệt là lỗi MIME type trong PWA mode

## 6. Đề Xuất Chuẩn Hóa

### 6.1. Chuẩn Hóa Loading Components

1. **Tạo Loading Context**:
   - Quản lý trạng thái loading ở cấp ứng dụng
   - Hỗ trợ nhiều level loading (route, component, API)

2. **Thống Nhất Skeleton System**:
   - Tạo các skeleton variants cho các layout phổ biến
   - Ví dụ: CardSkeleton, TableSkeleton, FormSkeleton

3. **Tách Biệt Loading Logic**:
   - Sử dụng HOC hoặc Custom Hooks để tách biệt logic loading và UI

### 6.2. Cải Thiện UX Khi Loading

1. **Staggered Animation**:
   - Thêm độ trễ cho skeletons để tạo hiệu ứng staggered animation
   
2. **Contextual Placeholders**:
   - Thay thế spinner đơn giản bằng placeholders có ngữ cảnh
   - Ví dụ: "Đang tải lịch sử giao dịch..." thay vì "Đang tải..."

3. **Progress Indicators**:
   - Sử dụng determinate progress khi có thể
   - Thêm thông tin ước tính thời gian khi tải dữ liệu lớn

### 6.3. Tối Ưu Performance

1. **Preload Strategy**:
   - Mở rộng hệ thống preload hiện tại
   - Sử dụng IntersectionObserver để preload khi user gần tới các links

2. **Skeleton Priority**:
   - Ưu tiên hiển thị skeletons cho content-first components
   - Áp dụng content placeholder strategy

## 7. Kết Luận

Hệ thống loading hiện tại đã được triển khai tốt với nhiều cơ chế khác nhau, nhưng có thể được cải thiện thông qua việc chuẩn hóa và tái cấu trúc. Việc tạo một hệ thống loading thống nhất sẽ giúp cải thiện UX và giảm thiểu code trùng lặp.

Ưu tiên hàng đầu nên là việc tạo ra một Loading Context và hệ thống Skeleton Components chuẩn hóa, đồng thời tích hợp chặt chẽ hơn với React Query và React Suspense.