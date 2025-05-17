# Hướng dẫn chuyển đổi sang Hệ thống Loading Phân cấp mới

Tài liệu này hướng dẫn cách chuyển đổi từ các hệ thống loading riêng lẻ sang hệ thống loading phân cấp tập trung mới. Mỗi mẫu chuyển đổi sẽ giúp bạn hiểu cách áp dụng hệ thống mới một cách hiệu quả.

## Lợi ích của việc chuyển đổi

- **Trải nghiệm người dùng nhất quán**: Thống nhất cách hiển thị loading trong toàn ứng dụng
- **Giảm độ phức tạp**: Quản lý tập trung thay vì mỗi component tự xử lý
- **Dễ bảo trì hơn**: Thay đổi trên một hệ thống tập trung thay vì nhiều nơi khác nhau
- **Kiểm soát tốt hơn**: Phân loại rõ ràng loading theo 3 cấp độ (component, page, app)
- **Tối ưu hóa hiệu suất**: Giảm thiểu việc render lại không cần thiết

## Mẫu chuyển đổi 1: Component với isLoading prop

### Trước khi chuyển đổi:

```tsx
function DataCard({ data, isLoading }) {
  if (isLoading) {
    return (
      <div className="card">
        <div className="skeleton-title" />
        <div className="skeleton-content" />
      </div>
    );
  }
  
  return (
    <div className="card">
      <h3>{data.title}</h3>
      <p>{data.content}</p>
    </div>
  );
}
```

### Sau khi chuyển đổi:

```tsx
import { ComponentLoading } from "@/components/ui/hierarchical-loading";
import { SkeletonLevel } from "@/components/ui/app-skeleton";

function DataCard({ data, isLoading }) {
  // Tạo ID duy nhất cho component
  const componentId = `data-card-${data?.id || Math.random().toString(36).substring(2, 10)}`;
  
  // Nội dung thực của card
  const cardContent = (
    <div className="card">
      <h3>{data?.title}</h3>
      <p>{data?.content}</p>
    </div>
  );
  
  // Áp dụng hệ thống loading mới
  return (
    <ComponentLoading
      id={componentId}
      skeletonLevel={SkeletonLevel.CARD}
      className="card-wrapper"
      skeletonProps={{
        hasTitle: true,
        hasValue: true
      }}
    >
      {cardContent}
    </ComponentLoading>
  );
}
```

> **Lưu ý**: `isLoading` prop sẽ không còn cần thiết vì hệ thống loading tập trung sẽ quản lý trạng thái này. Bạn có thể ghi log và cảnh báo nếu nó vẫn được sử dụng để cảnh báo các nhà phát triển về việc chuyển đổi.

## Mẫu chuyển đổi 2: Thay thế useLoadingState hook

### Trước khi chuyển đổi:

```tsx
import { useLoadingState } from "@/hooks/use-loading-state";

function DataFetcher() {
  const { isLoading, startLoading, stopLoading } = useLoadingState();
  const [data, setData] = useState(null);
  
  const fetchData = async () => {
    startLoading();
    try {
      const response = await fetch('/api/data');
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      stopLoading();
    }
  };
  
  useEffect(() => {
    fetchData();
  }, []);
  
  if (isLoading) {
    return <LoadingSkeleton />;
  }
  
  return <DataDisplay data={data} />;
}
```

### Sau khi chuyển đổi:

```tsx
import { useHierarchicalLoading } from "@/components/ui/hierarchical-loading";
import { ComponentLoading } from "@/components/ui/hierarchical-loading";
import { SkeletonLevel } from "@/components/ui/app-skeleton";

function DataFetcher() {
  const { startComponentLoading, stopComponentLoading } = useHierarchicalLoading();
  const [data, setData] = useState(null);
  const componentId = "data-fetcher";
  
  const fetchData = async () => {
    startComponentLoading(componentId);
    try {
      const response = await fetch('/api/data');
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      stopComponentLoading(componentId);
    }
  };
  
  useEffect(() => {
    fetchData();
  }, []);
  
  return (
    <ComponentLoading
      id={componentId}
      skeletonLevel={SkeletonLevel.CARD}
    >
      <DataDisplay data={data} />
    </ComponentLoading>
  );
}
```

## Mẫu chuyển đổi 3: Tích hợp với React Query

### Trước khi chuyển đổi:

```tsx
import { useQuery } from "@tanstack/react-query";

function ProductList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts
  });
  
  if (isLoading) {
    return <ProductsTableSkeleton />;
  }
  
  if (error) {
    return <ErrorDisplay error={error} />;
  }
  
  return <ProductsTable products={data} />;
}
```

### Sau khi chuyển đổi:

```tsx
import { useQuery } from "@tanstack/react-query";
import { useQueryLoading } from "@/hooks/use-query-loading";
import { ComponentLoading } from "@/components/ui/hierarchical-loading";
import { SkeletonLevel } from "@/components/ui/app-skeleton";

function ProductList() {
  // Giữ nguyên useQuery
  const query = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts
  });
  
  // Kết nối với hệ thống loading
  useQueryLoading(query, 'products-list');
  
  // Vẫn xử lý lỗi như trước
  if (query.error) {
    return <ErrorDisplay error={query.error} />;
  }
  
  // ComponentLoading sẽ tự động hiển thị skeleton khi cần
  return (
    <ComponentLoading
      id="products-list"
      skeletonLevel={SkeletonLevel.TABLE}
      skeletonProps={{ 
        count: 5,
        showPagination: true 
      }}
    >
      <ProductsTable products={query.data} />
    </ComponentLoading>
  );
}
```

## Mẫu chuyển đổi 4: Thay thế CSS-based loaders

### Trước khi chuyển đổi:

```tsx
function Dashboard() {
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Mô phỏng tải dữ liệu
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  }, []);
  
  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      
      <div className="dashboard-content">
        {isLoading ? (
          <div className="loader-container">
            <div className="spinner"></div>
            <p>Loading dashboard data...</p>
          </div>
        ) : (
          <DashboardContent />
        )}
      </div>
    </div>
  );
}
```

### Sau khi chuyển đổi:

```tsx
import { useEffect } from "react";
import { useHierarchicalLoading } from "@/components/ui/hierarchical-loading";
import { ComponentLoading } from "@/components/ui/hierarchical-loading";
import { SkeletonLevel } from "@/components/ui/app-skeleton";

function Dashboard() {
  const { startPageLoading, stopPageLoading } = useHierarchicalLoading();
  const dashboardId = "main-dashboard";
  
  useEffect(() => {
    // Bắt đầu loading cấp độ page
    startPageLoading();
    
    // Mô phỏng tải dữ liệu
    setTimeout(() => {
      stopPageLoading();
    }, 2000);
    
    return () => {
      // Đảm bảo dừng loading khi component unmount
      stopPageLoading();
    };
  }, []);
  
  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      
      <div className="dashboard-content">
        <ComponentLoading
          id={dashboardId}
          skeletonLevel={SkeletonLevel.PAGE}
          skeletonProps={{ 
            showTabs: true,
            tabCount: 3
          }}
        >
          <DashboardContent />
        </ComponentLoading>
      </div>
    </div>
  );
}
```

## Mẫu chuyển đổi 5: Từ ContentLoadingWrapper sang hệ thống mới

### Trước khi chuyển đổi:

```tsx
import { ContentLoadingWrapper } from "@/components/ui/content-loading-wrapper";

function ProfileSection({ userData, isLoading }) {
  return (
    <ContentLoadingWrapper
      isLoading={isLoading}
      skeletonType="card"
      height={200}
      skeletonProps={{ showProgress: true }}
    >
      <div className="profile-card">
        <img src={userData.avatar} alt="Profile" />
        <h3>{userData.name}</h3>
        <p>{userData.bio}</p>
      </div>
    </ContentLoadingWrapper>
  );
}
```

### Sau khi chuyển đổi:

```tsx
import { ComponentLoading } from "@/components/ui/hierarchical-loading";
import { SkeletonLevel } from "@/components/ui/app-skeleton";

function ProfileSection({ userData, isLoading }) {
  const componentId = `profile-section-${userData?.id || 'default'}`;
  
  return (
    <ComponentLoading
      id={componentId}
      skeletonLevel={SkeletonLevel.CARD}
      height={200}
      skeletonProps={{ 
        showProgress: true,
        hasTitle: true,
        hasValue: true,
        hasIcon: true
      }}
    >
      <div className="profile-card">
        <img src={userData?.avatar} alt="Profile" />
        <h3>{userData?.name}</h3>
        <p>{userData?.bio}</p>
      </div>
    </ComponentLoading>
  );
}
```

## Mẫu chuyển đổi 6: Loading toàn trang

### Trước khi chuyển đổi:

```tsx
import { useState, useEffect } from "react";

function AppBootstrap() {
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    async function initializeApp() {
      // Khởi tạo ứng dụng
      await Promise.all([
        loadConfiguration(),
        authenticateUser(),
        preloadCriticalData()
      ]);
      
      setIsLoading(false);
    }
    
    initializeApp();
  }, []);
  
  if (isLoading) {
    return (
      <div className="app-splash-screen">
        <img src="/logo.svg" alt="App Logo" />
        <div className="loading-spinner"></div>
        <p>Loading application...</p>
      </div>
    );
  }
  
  return <MainApp />;
}
```

### Sau khi chuyển đổi:

```tsx
import { useEffect } from "react";
import { useHierarchicalLoading } from "@/components/ui/hierarchical-loading";

function AppBootstrap() {
  const { startAppLoading, stopAppLoading } = useHierarchicalLoading();
  
  useEffect(() => {
    // Bắt đầu loading cấp độ app - hiển thị splash screen
    startAppLoading();
    
    async function initializeApp() {
      try {
        // Khởi tạo ứng dụng
        await Promise.all([
          loadConfiguration(),
          authenticateUser(),
          preloadCriticalData()
        ]);
      } catch (error) {
        console.error('Failed to initialize app:', error);
      } finally {
        // Luôn đảm bảo dừng loading
        stopAppLoading();
      }
    }
    
    initializeApp();
    
    return () => {
      // Đảm bảo dừng loading khi component unmount
      stopAppLoading();
    };
  }, []);
  
  // SplashScreen component sẽ được hiển thị tự động bởi LoadingContainer
  return <MainApp />;
}

// Trong App.tsx
function App() {
  return (
    <LoadingContainer>
      <AppBootstrap />
    </LoadingContainer>
  );
}
```

## Các vấn đề thường gặp khi chuyển đổi

### 1. Hiệu ứng nhấp nháy

**Vấn đề:** Khi chuyển đổi, có thể xảy ra hiệu ứng loading nhấp nháy nhanh khi dữ liệu được tải gần như ngay lập tức.

**Giải pháp:** Sử dụng thuộc tính `minDuration` trong hệ thống loading để đảm bảo thời gian tối thiểu hiển thị skeleton:

```tsx
// Đảm bảo skeleton hiển thị ít nhất 300ms để tránh nhấp nháy
useQueryLoading(query, 'component-id', { minDuration: 300 });
```

### 2. ID trùng lặp

**Vấn đề:** Nếu hai component sử dụng cùng một ID, trạng thái loading có thể bị xung đột.

**Giải pháp:** 
- Luôn tạo ID duy nhất, kết hợp tên component với thông tin nhận dạng (ví dụ: ID của dữ liệu)
- Sử dụng ID có tiền tố theo từng phần của ứng dụng (ví dụ: "dashboard/stats/user-count")

### 3. Loading không kết thúc

**Vấn đề:** Đôi khi loading không kết thúc nếu `stopLoading` không được gọi trong tất cả các trường hợp.

**Giải pháp:** Luôn sử dụng try/finally hoặc dọn dẹp trong useEffect để đảm bảo stopLoading được gọi:

```tsx
useEffect(() => {
  startLoading();
  
  const fetchData = async () => {
    try {
      await getData();
    } finally {
      stopLoading();
    }
  };
  
  fetchData();
  
  // Dọn dẹp khi component unmount
  return () => stopLoading();
}, []);
```

### 4. Quản lý nhiều trạng thái loading cùng lúc

**Vấn đề:** Trong một component phức tạp, có thể cần nhiều trạng thái loading khác nhau.

**Giải pháp:** Sử dụng nhiều ID khác nhau theo từng phần của UI:

```tsx
function ComplexDashboard() {
  const { startComponentLoading, stopComponentLoading } = useHierarchicalLoading();
  
  useEffect(() => {
    // Loading cho biểu đồ
    startComponentLoading('dashboard-chart');
    loadChartData().finally(() => stopComponentLoading('dashboard-chart'));
    
    // Loading cho bảng
    startComponentLoading('dashboard-table');
    loadTableData().finally(() => stopComponentLoading('dashboard-table'));
    
    // Loading cho thống kê
    startComponentLoading('dashboard-stats');
    loadStatsData().finally(() => stopComponentLoading('dashboard-stats'));
  }, []);
  
  return (
    <div>
      <ComponentLoading id="dashboard-chart" skeletonLevel={SkeletonLevel.CHART}>
        <Chart />
      </ComponentLoading>
      
      <ComponentLoading id="dashboard-table" skeletonLevel={SkeletonLevel.TABLE}>
        <Table />
      </ComponentLoading>
      
      <ComponentLoading id="dashboard-stats" skeletonLevel={SkeletonLevel.STATS}>
        <Stats />
      </ComponentLoading>
    </div>
  );
}
```

## Chiến lược chuyển đổi từng bước

1. **Bắt đầu từ các component quan trọng nhất**: Ưu tiên các component được sử dụng nhiều và hiển thị tức thì với người dùng
2. **Cập nhật các hooks**: Chuyển đổi các hooks loading tùy chỉnh sang hệ thống mới
3. **Tích hợp React Query**: Ưu tiên cập nhật các component sử dụng React Query để tận dụng tính năng tích hợp
4. **Thêm loading hiệu ứng chuyển trang**: Cập nhật router để sử dụng page-level loading
5. **Thêm splash screen**: Cuối cùng, triển khai app-level loading cho khởi động ứng dụng

Bằng cách tuân thủ các mẫu và chiến lược chuyển đổi này, bạn có thể từng bước chuyển sang hệ thống loading phân cấp mới mà không gặp phải vấn đề lớn.