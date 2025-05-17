# Hệ thống Loading Phân cấp

## Giới thiệu

Hệ thống loading phân cấp là một giải pháp tổ chức, quản lý và hiển thị các trạng thái loading trong ứng dụng React một cách thống nhất và rõ ràng. Thay vì mỗi component tự quản lý trạng thái loading riêng, hệ thống này cung cấp một cơ chế tập trung để kiểm soát và hiển thị các chỉ báo loading phù hợp tại mỗi cấp độ của ứng dụng.

## Cấp độ Loading

Hệ thống này chia trạng thái loading thành 3 cấp độ chính:

1. **Component Level (Skeleton)**: Hiển thị skeleton khi một thành phần UI đang tải dữ liệu.
2. **Page Level (Top Progress Bar)**: Hiển thị thanh tiến trình ở đầu trang khi chuyển trang hoặc tải dữ liệu cho toàn trang.
3. **App Level (Splash Screen)**: Hiển thị màn hình loading toàn màn hình với logo khi ứng dụng khởi động hoặc thực hiện các thao tác lớn.

## Cách sử dụng

### 1. Component Level Loading

```tsx
import { ComponentLoading } from "@/components/ui/hierarchical-loading";
import { SkeletonLevel } from "@/components/ui/app-skeleton";

function MyComponent() {
  // Tạo ID duy nhất cho component
  const componentId = "my-unique-component-id";
  
  return (
    <ComponentLoading
      id={componentId}
      skeletonLevel={SkeletonLevel.CARD}
      height={200}
      skeletonProps={{ 
        showProgress: true,
        hasTitle: true 
      }}
    >
      {/* Nội dung component */}
      <div>Your component content</div>
    </ComponentLoading>
  );
}
```

**Các tham số của ComponentLoading:**
- `id`: ID duy nhất cho component (cần thiết để theo dõi trạng thái loading)
- `skeletonLevel`: Loại skeleton sẽ được hiển thị (CARD, LIST_ITEM, FORM, PAGE, CHART, TABLE, STATS, AVATAR)
- `height`: Chiều cao của skeleton (tùy chọn)
- `className`: CSS classes (tùy chọn)
- `skeletonProps`: Các thuộc tính bổ sung cho skeleton (tùy chọn)

### 2. Page Level Loading

Page loading được quản lý tự động trong quá trình chuyển trang. Tuy nhiên, bạn có thể kiểm soát nó theo cách thủ công:

```tsx
import { useHierarchicalLoading } from "@/components/ui/hierarchical-loading";

function MyPageComponent() {
  const { 
    startPageLoading, 
    stopPageLoading, 
    updatePageProgress 
  } = useHierarchicalLoading();
  
  async function loadPageData() {
    startPageLoading();
    updatePageProgress(20);
    
    try {
      // Thực hiện các công việc tải dữ liệu
      updatePageProgress(50);
      await fetchSomeData();
      updatePageProgress(80);
      await fetchMoreData();
      updatePageProgress(100);
    } finally {
      stopPageLoading();
    }
  }
  
  return <div>Page content</div>;
}
```

### 3. App Level Loading

App loading được sử dụng trong các tình huống cần hiển thị loading toàn màn hình, như khi ứng dụng khởi động:

```tsx
import { useHierarchicalLoading } from "@/components/ui/hierarchical-loading";

function AppInitializer() {
  const { startAppLoading, stopAppLoading } = useHierarchicalLoading();
  
  useEffect(() => {
    // Bắt đầu loading cấp độ app
    startAppLoading();
    
    // Thực hiện khởi tạo ứng dụng...
    initializeApp().finally(() => {
      // Khi hoàn tất, dừng loading
      stopAppLoading();
    });
  }, []);
  
  return null;
}
```

### 4. Tích hợp với React Query

Sử dụng hook `useQueryLoading` để kết nối trạng thái loading của React Query với hệ thống loading phân cấp:

```tsx
import { useQuery } from "@tanstack/react-query";
import { useQueryLoading } from "@/hooks/use-query-loading";

function DataComponent() {
  // Sử dụng React Query như bình thường
  const query = useQuery({
    queryKey: ['data'],
    queryFn: fetchData
  });
  
  // Kết nối với hệ thống loading
  useQueryLoading(query, "data-component");
  
  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }
  
  return (
    <div>
      {/* Không cần kiểm tra query.isLoading, 
          hệ thống loading sẽ tự động hiển thị skeleton */}
      <DataDisplay data={query.data} />
    </div>
  );
}
```

Hoặc cho loading cấp độ page:

```tsx
import { usePageQueryLoading } from "@/hooks/use-query-loading";

function PageWithData() {
  const query = useQuery({
    queryKey: ['page-data'],
    queryFn: fetchPageData
  });
  
  // Kết nối với page loading
  usePageQueryLoading(query, "page-data");
  
  return <div>{/* Page content */}</div>;
}
```

## Các SkeletonLevel và Tùy chỉnh

Hệ thống cung cấp nhiều loại skeleton cho các trường hợp sử dụng khác nhau:

- `SkeletonLevel.CARD`: Cho card, panel, khung thông tin
- `SkeletonLevel.LIST_ITEM`: Cho các item trong danh sách
- `SkeletonLevel.FORM`: Cho biểu mẫu với nhiều field
- `SkeletonLevel.PAGE`: Cho layout toàn trang
- `SkeletonLevel.CHART`: Cho biểu đồ và thành phần dữ liệu
- `SkeletonLevel.TABLE`: Cho bảng dữ liệu
- `SkeletonLevel.STATS`: Cho thẻ thống kê nhỏ
- `SkeletonLevel.AVATAR`: Cho hình ảnh người dùng và avatar

Mỗi loại skeleton có thể được tùy chỉnh thêm thông qua `skeletonProps`:

```tsx
<ComponentLoading
  id="custom-card"
  skeletonLevel={SkeletonLevel.CARD}
  skeletonProps={{
    showProgress: true,      // Hiển thị thanh tiến trình
    hasTitle: true,          // Bao gồm tiêu đề
    hasIcon: true,           // Bao gồm icon
    hasValue: true,          // Bao gồm giá trị
    hasProgressBar: true,    // Bao gồm thanh tiến trình
    hasSupportingText: true, // Bao gồm văn bản bổ sung
    showFooter: true,        // Hiển thị footer
    hasActions: true,        // Hiển thị vùng actions
    hasSubValue: true,       // Hiển thị giá trị phụ
    showTabs: true,          // Hiển thị tab bar
    tabCount: 3,             // Số lượng tab
    showPagination: true,    // Hiển thị phân trang
    showControls: true       // Hiển thị nút điều khiển
  }}
>
  {/* Content */}
</ComponentLoading>
```

## Best Practices

1. **Sử dụng ID nhất quán**: Sử dụng ID có ý nghĩa và nhất quán cho mỗi component để tránh xung đột.

2. **Xử lý lifecycle**: Đảm bảo dừng loading khi component unmount để tránh memory leak.

3. **Layer phù hợp**: Chọn cấp độ loading phù hợp với quy mô của thao tác - không nên hiển thị splash screen cho thao tác nhỏ.

4. **Skeleton tương ứng**: Sử dụng skeleton phù hợp với loại nội dung để tạo trải nghiệm mượt mà.

5. **Tích hợp React Query**: Luôn sử dụng `useQueryLoading` hoặc `usePageQueryLoading` thay vì tự quản lý trạng thái.

## Giải quyết vấn đề

**Q: Skeleton không hiển thị dù component đang loading?**  
A: Kiểm tra ID được sử dụng, đảm bảo ID là duy nhất và đúng cú pháp.

**Q: Progress bar không biến mất sau khi hoàn tất?**  
A: Cần gọi `stopPageLoading()` để kết thúc loading.

**Q: Splash screen hiển thị quá lâu?**  
A: Kiểm tra xem `stopAppLoading()` đã được gọi khi khởi tạo hoàn tất chưa.

**Q: Nên dùng cấp độ loading nào?**  
A: Sử dụng loading cấp component cho UI elements riêng lẻ, page loading cho chuyển trang/tải dữ liệu toàn trang, app loading cho khởi động ứng dụng hoặc thay đổi lớn.