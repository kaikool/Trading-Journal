# Hệ Thống Skeleton Loading UI

## Giới thiệu

Tài liệu này mô tả việc áp dụng và sử dụng hệ thống Skeleton Loading UI chuẩn hóa trong ứng dụng Forex Trading Journal. Hệ thống này được thiết kế để thay thế tất cả các loại loading indicators hiện có bằng một giải pháp nhất quán, dễ bảo trì và cải thiện trải nghiệm người dùng.

## Tổng quan về hệ thống

### AppSkeleton Component

`AppSkeleton` là component trung tâm của hệ thống loading mới. Nó cung cấp một giao diện thống nhất cho tất cả các trường hợp loading UI trong ứng dụng.

Các đặc điểm chính:
- **Enum-based level system**: Cung cấp các skeleton khác nhau cho các ngữ cảnh khác nhau
- **Consistent styling**: Sử dụng Tailwind CSS với animation chuẩn hóa
- **Customizable**: Hỗ trợ tùy chỉnh kích thước, số lượng và các thuộc tính khác
- **Contextual**: Mỗi level skeleton được thiết kế phù hợp với loại nội dung cụ thể

### Các level skeleton hiện có

```tsx
export enum SkeletonLevel {
  LIST_ITEM = "list_item",  // Cho các item trong danh sách
  CARD = "card",            // Cho các card UI
  FORM = "form",            // Cho các form dữ liệu
  PAGE = "page",            // Cho toàn trang
  CHART = "chart",          // Cho biểu đồ và đồ thị
  TABLE = "table",          // Cho bảng dữ liệu
  STATS = "stats",          // Cho thống kê số liệu
  AVATAR = "avatar",        // Cho avatar và hình ảnh profile
}
```

## Hướng dẫn sử dụng

### Cách triển khai cơ bản

```tsx
import { AppSkeleton, SkeletonLevel } from "@/components/ui/app-skeleton";

// Trong component của bạn
function MyComponent() {
  const { data, isLoading } = useQuery({ ... });
  
  if (isLoading) {
    return <AppSkeleton level={SkeletonLevel.CARD} />;
  }
  
  return (
    // Nội dung thực
  );
}
```

### Sử dụng với Suspense

```tsx
import { Suspense } from "react";
import { AppSkeleton, SkeletonLevel } from "@/components/ui/app-skeleton";

// Trong component cha
function ParentComponent() {
  return (
    <Suspense fallback={<AppSkeleton level={SkeletonLevel.PAGE} />}>
      <LazyLoadedComponent />
    </Suspense>
  );
}
```

### Tùy chỉnh skeleton

```tsx
// Đặt chiều cao cụ thể
<AppSkeleton level={SkeletonLevel.CHART} height={400} />

// Hiển thị nhiều items
<AppSkeleton level={SkeletonLevel.LIST_ITEM} count={5} />

// Thêm class CSS
<AppSkeleton level={SkeletonLevel.CARD} className="border-2 rounded-xl" />

// Các tùy chọn nâng cao
<AppSkeleton 
  level={SkeletonLevel.PAGE} 
  customProps={{ 
    showTabs: true, 
    tabCount: 3,
    showControls: true 
  }} 
/>
```

## Các Pattern loading phổ biến

### 1. Component loading với React Query

```tsx
function DataComponent() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['data'],
    queryFn: fetchData
  });
  
  if (isLoading) {
    return <AppSkeleton level={SkeletonLevel.CARD} />;
  }
  
  if (error) {
    return <ErrorComponent error={error} />;
  }
  
  return <DataDisplay data={data} />;
}
```

### 2. Form loading

```tsx
function MyForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  if (isSubmitting) {
    return <AppSkeleton level={SkeletonLevel.FORM} count={3} />;
  }
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
}
```

### 3. Lazy loading

```tsx
const LazyComponent = lazy(() => import('./HeavyComponent'));

function MyComponent() {
  return (
    <Suspense fallback={<AppSkeleton level={SkeletonLevel.PAGE} />}>
      <LazyComponent />
    </Suspense>
  );
}
```

### 4. Conditionally show skeleton dựa trên dữ liệu

```tsx
function DataList({ data, isLoading }) {
  // Showing skeleton when loading or when data is empty
  if (isLoading || !data || data.length === 0) {
    return <AppSkeleton level={SkeletonLevel.LIST_ITEM} count={5} />;
  }
  
  return (
    <ul>
      {data.map(item => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
}
```

## Các trường hợp đặc biệt

### Progress indicators

Trong một số trường hợp, progress indicator vẫn có giá trị hơn skeleton:

```tsx
function FileUploader() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  
  if (isUploading) {
    return (
      <div>
        <Progress value={progress} max={100} />
        <p>Uploading: {progress}%</p>
      </div>
    );
  }
  
  return <UploadForm onUpload={handleUpload} />;
}
```

### Form submit button loading

Trạng thái loading trong button nên giữ lại để cung cấp phản hồi trực tiếp:

```tsx
function SubmitButton({ isSubmitting }) {
  return (
    <Button disabled={isSubmitting}>
      {isSubmitting ? (
        <>
          <Icons.ui.spinner className="mr-2 h-4 w-4 animate-spin" />
          Submitting...
        </>
      ) : (
        "Submit"
      )}
    </Button>
  );
}
```

## Hướng dẫn chuyển đổi từ loading indicators hiện tại

### Thay thế LoadingFallback

**Trước đây:**
```tsx
import { LoadingFallback } from '@/components/dynamic/LoadingFallback';

if (isLoading) {
  return <LoadingFallback height={400} />;
}
```

**Hiện tại:**
```tsx
import { AppSkeleton, SkeletonLevel } from '@/components/ui/app-skeleton';

if (isLoading) {
  return <AppSkeleton level={SkeletonLevel.PAGE} height={400} />;
}
```

### Thay thế Spinner

**Trước đây:**
```tsx
if (isLoading) {
  return (
    <div className="flex items-center justify-center h-40">
      <Icons.ui.spinner className="h-6 w-6 animate-spin" />
    </div>
  );
}
```

**Hiện tại:**
```tsx
if (isLoading) {
  return <AppSkeleton level={SkeletonLevel.CARD} height={160} />;
}
```

### Thay thế Custom Skeleton

**Trước đây:**
```tsx
if (isLoading) {
  return (
    <div className="space-y-4">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-4 w-[200px]" />
      </div>
    </div>
  );
}
```

**Hiện tại:**
```tsx
if (isLoading) {
  return <AppSkeleton level={SkeletonLevel.AVATAR} customProps={{ showText: true }} />;
}
```

## Kết luận

Hệ thống AppSkeleton cung cấp một phương pháp chuẩn hóa và nhất quán để hiển thị loading states trong ứng dụng. Với tư duy "component đầu tiên", mỗi skeleton được thiết kế để phản ánh cấu trúc thực của dữ liệu sẽ được hiển thị, giảm thiểu layout shift và cải thiện trải nghiệm người dùng.

Mục tiêu cuối cùng là đạt được sự nhất quán hoàn toàn trong toàn bộ ứng dụng, giúp người dùng cảm thấy ứng dụng load nhanh hơn và phản hồi tốt hơn, ngay cả khi thời gian tải thực tế không thay đổi.