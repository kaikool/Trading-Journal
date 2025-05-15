# Hệ Thống Skeleton Loading Chuẩn Hóa

## 1. Giới thiệu

Tài liệu này mô tả về hệ thống loading mới dựa trên Skeleton đã được chuẩn hóa trong Forex Trading Journal. Hệ thống được thiết kế để loại bỏ việc sử dụng nhiều loại loading (spinner, text, shimmer...) khác nhau và thống nhất trải nghiệm người dùng khi loading.

## 2. Nguyên tắc thiết kế

1. **Thống nhất**: Chỉ sử dụng Skeleton component, loại bỏ hoàn toàn spinner, text "Loading..." và các animation khác không nhất quán.
2. **Cấu trúc**: Sử dụng các cấp độ skeleton (levels) để phù hợp với từng use case.
3. **Tái sử dụng**: Thiết kế để có thể tái sử dụng tối đa, hạn chế việc tạo skeleton riêng cho từng component.
4. **Tính linh hoạt**: Hỗ trợ tùy chỉnh qua props, cho phép điều chỉnh theo ngữ cảnh.
5. **UX/UI**: Skeleton giữ layout và spacing đúng với thiết kế, tránh shift layout khi chuyển từ skeleton sang dữ liệu thực.

## 3. Cấu trúc hệ thống

### 3.1. Core Components

- **Skeleton (base)**: Component cơ bản từ UI library, sử dụng animation `animate-pulse`.
- **AppSkeleton**: Component chuẩn hóa, hỗ trợ các cấp độ skeleton khác nhau.

### 3.2. Cấp độ Skeleton (SkeletonLevel)

Hệ thống sử dụng một enum để xác định cấp độ skeleton:

```typescript
export enum SkeletonLevel {
  LIST_ITEM = "list_item",  // Dành cho item trong danh sách 
  CARD = "card",            // Dành cho card hoặc component nhỏ
  FORM = "form",            // Dành cho form
  PAGE = "page",            // Dành cho toàn trang
  CHART = "chart",          // Dành cho biểu đồ
  TABLE = "table",          // Dành cho bảng dữ liệu
  STATS = "stats",          // Dành cho thống kê
  AVATAR = "avatar",        // Dành cho avatar và hình ảnh
}
```

### 3.3. Cách sử dụng

```jsx
// Cơ bản với cấp độ
<AppSkeleton level={SkeletonLevel.CARD} />

// Với tùy chỉnh chiều cao
<AppSkeleton level={SkeletonLevel.PAGE} height={600} />

// Với các tùy chỉnh đặc thù cho loại skeleton
<AppSkeleton 
  level={SkeletonLevel.CHART} 
  customProps={{ 
    showControls: true 
  }} 
/>

// Với số lượng items (cho LIST_ITEM và TABLE)
<AppSkeleton 
  level={SkeletonLevel.LIST_ITEM} 
  count={5} 
/>
```

## 4. Use Cases và Best Practices

### 4.1. React Query Loading

```jsx
// Trong component sử dụng React Query
function MyComponent() {
  const { data, isLoading } = useQuery({ ... });
  
  if (isLoading) {
    return <AppSkeleton level={SkeletonLevel.CARD} />;
  }
  
  return <div>{data}</div>;
}
```

### 4.2. Route-Level Loading

```jsx
// Trong App.tsx
<Suspense fallback={
  <div className="container max-w-7xl mx-auto px-4 sm:px-6 mt-8">
    <AppSkeleton level={SkeletonLevel.PAGE} />
  </div>
}>
  <Route ... />
</Suspense>
```

### 4.3. Lazy Loading Components

```jsx
// Với React.lazy và Suspense
const LazyComponent = lazy(() => import('./MyComponent'));

function MyContainer() {
  return (
    <Suspense fallback={
      <AppSkeleton level={SkeletonLevel.CARD} height={300} />
    }>
      <LazyComponent />
    </Suspense>
  );
}
```

### 4.4. Form Loading

```jsx
// Trong form khi submitting
{isSubmitting && (
  <AppSkeleton 
    level={SkeletonLevel.FORM} 
    count={formFieldCount} 
  />
)}
```

## 5. Chuyển Đổi từ Hệ Thống Cũ

### 5.1. Từ Spinner sang Skeleton

**Trước:**
```jsx
{isLoading && (
  <div className="flex items-center justify-center">
    <Icons.ui.spinner className="h-6 w-6 animate-spin" />
    <span>Loading...</span>
  </div>
)}
```

**Sau:**
```jsx
{isLoading && (
  <AppSkeleton level={SkeletonLevel.CARD} />
)}
```

### 5.2. Từ LoadingFallback sang AppSkeleton

**Trước:**
```jsx
<LoadingFallback simple={true} height={200} />
```

**Sau:**
```jsx
<AppSkeleton level={SkeletonLevel.AVATAR} height={200} />
```

### 5.3. Từ Custom Skeleton sang AppSkeleton

**Trước:**
```jsx
<div className="animate-pulse space-y-4">
  <div className="h-4 w-24 bg-muted rounded"></div>
  <div className="h-10 w-full bg-muted rounded"></div>
  <div className="h-20 w-full bg-muted rounded"></div>
</div>
```

**Sau:**
```jsx
<AppSkeleton level={SkeletonLevel.FORM} count={3} />
```

## 6. Hiệu năng và Accessibility

- Animation được thiết kế để hoạt động tốt trên cả thiết bị yếu.
- Hỗ trợ `prefers-reduced-motion` để tăng tính truy cập.
- Tất cả skeleton đều có các thuộc tính ARIA phù hợp để screen readers có thể đọc.

## 7. Kiểm tra và QA

Đảm bảo kiểm tra các trường hợp sau:
- Loading ban đầu của trang
- Chuyển đổi giữa các route
- Lazy loading components
- Submitting forms
- API calls với React Query

## 8. Tổng kết

Hệ thống Skeleton Loading chuẩn hóa giúp tạo ra trải nghiệm nhất quán và chuyên nghiệp hơn cho người dùng trong khi giữ cho codebase dễ bảo trì và mở rộng. Việc sử dụng một hệ thống thống nhất giảm thiểu code trùng lặp và làm cho ứng dụng dễ dự đoán hơn.