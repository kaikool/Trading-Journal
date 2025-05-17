# Ví dụ sử dụng Hệ thống Loading Phân cấp

Tài liệu này cung cấp các ví dụ thực tế về cách sử dụng hệ thống loading phân cấp trong các tình huống khác nhau.

## Ví dụ 1: Component cơ bản với Skeleton

```tsx
import { ComponentLoading } from "@/components/ui/hierarchical-loading";
import { SkeletonLevel } from "@/components/ui/app-skeleton";

function StatisticCard({ title, value, icon, isLoading }) {
  // Tạo ID duy nhất cho component, kết hợp với tên component và thông tin xác định
  const componentId = `stat-card-${title?.toLowerCase().replace(/\s+/g, '-') || 'default'}`;
  
  // Nội dung chính của card
  const cardContent = (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
  
  // Sử dụng hệ thống loading tập trung
  return (
    <ComponentLoading
      id={componentId}
      skeletonLevel={SkeletonLevel.STATS}
      height={120}
      skeletonProps={{
        hasTitle: true,
        hasIcon: true,
        hasValue: true
      }}
    >
      {cardContent}
    </ComponentLoading>
  );
}
```

## Ví dụ 2: Danh sách với Lazy Loading

```tsx
import { useEffect } from "react";
import { ComponentLoading } from "@/components/ui/hierarchical-loading";
import { SkeletonLevel } from "@/components/ui/app-skeleton";
import { useHierarchicalLoading } from "@/components/ui/hierarchical-loading";

function LazyLoadedList({ items, onLoadMore, hasMore }) {
  const { startComponentLoading, stopComponentLoading } = useHierarchicalLoading();
  const listId = "items-list";
  
  // Xử lý tải thêm dữ liệu khi cuộn đến cuối
  const handleLoadMore = async () => {
    if (!hasMore) return;
    
    // Bắt đầu loading
    startComponentLoading(listId);
    
    try {
      await onLoadMore();
    } finally {
      // Kết thúc loading sau khi hoàn tất
      stopComponentLoading(listId);
    }
  };
  
  return (
    <div>
      {/* Danh sách các item */}
      {items.map(item => (
        <ListItem key={item.id} data={item} />
      ))}
      
      {/* Phần loading "Tải thêm" ở cuối danh sách */}
      {hasMore && (
        <ComponentLoading
          id={listId}
          skeletonLevel={SkeletonLevel.LIST_ITEM}
          skeletonProps={{ count: 3 }}
        >
          <Button onClick={handleLoadMore}>
            Load More
          </Button>
        </ComponentLoading>
      )}
    </div>
  );
}
```

## Ví dụ 3: Form với xử lý API

```tsx
import { useState } from "react";
import { ComponentLoading } from "@/components/ui/hierarchical-loading";
import { SkeletonLevel } from "@/components/ui/app-skeleton";
import { useHierarchicalLoading } from "@/components/ui/hierarchical-loading";

function UserProfileForm({ userId }) {
  const [formData, setFormData] = useState({});
  const { startComponentLoading, stopComponentLoading } = useHierarchicalLoading();
  const formId = `user-profile-form-${userId}`;
  
  // Tải dữ liệu form từ API
  useEffect(() => {
    const loadUserData = async () => {
      startComponentLoading(formId);
      
      try {
        const data = await fetchUserProfile(userId);
        setFormData(data);
      } catch (error) {
        console.error('Failed to load user data:', error);
      } finally {
        stopComponentLoading(formId);
      }
    };
    
    loadUserData();
  }, [userId]);
  
  // Xử lý submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    startComponentLoading(formId);
    
    try {
      await updateUserProfile(userId, formData);
      // Hiển thị thông báo thành công
    } catch (error) {
      // Hiển thị thông báo lỗi
    } finally {
      stopComponentLoading(formId);
    }
  };
  
  return (
    <ComponentLoading
      id={formId}
      skeletonLevel={SkeletonLevel.FORM}
      skeletonProps={{ count: 5 }}
    >
      <form onSubmit={handleSubmit}>
        {/* Các trường form */}
        <input 
          type="text" 
          value={formData.name || ''} 
          onChange={e => setFormData({...formData, name: e.target.value})} 
        />
        {/* Các trường khác... */}
        <button type="submit">Save Profile</button>
      </form>
    </ComponentLoading>
  );
}
```

## Ví dụ 4: Tích hợp với React Query

```tsx
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useQueryLoading } from "@/hooks/use-query-loading";
import { ComponentLoading } from "@/components/ui/hierarchical-loading";
import { SkeletonLevel } from "@/components/ui/app-skeleton";

function ProductList() {
  const queryClient = useQueryClient();
  
  // Query để lấy danh sách sản phẩm
  const productsQuery = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts
  });
  
  // Kết nối với hệ thống loading (không cần ComponentLoading nữa)
  useQueryLoading(productsQuery, 'products-list');
  
  // Mutation để xóa sản phẩm
  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      // Invalidate query để tải lại dữ liệu
      queryClient.invalidateQueries({ queryKey: ['products'] });
    }
  });
  
  // Sử dụng ComponentLoading để hiển thị skeleton khi đang tải dữ liệu
  return (
    <div>
      <h1>Products</h1>
      
      <ComponentLoading
        id="products-list"
        skeletonLevel={SkeletonLevel.TABLE}
        skeletonProps={{ 
          count: 5,
          showPagination: true 
        }}
      >
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Price</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {productsQuery.data?.map(product => (
              <tr key={product.id}>
                <td>{product.name}</td>
                <td>${product.price}</td>
                <td>
                  <button 
                    onClick={() => deleteMutation.mutate(product.id)}
                    disabled={deleteMutation.isPending}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ComponentLoading>
    </div>
  );
}
```

## Ví dụ 5: Splash Screen khi khởi động ứng dụng

```tsx
import { useEffect } from "react";
import { useHierarchicalLoading } from "@/components/ui/hierarchical-loading";

function AppInitializer() {
  const { startAppLoading, stopAppLoading } = useHierarchicalLoading();
  
  useEffect(() => {
    // Hiển thị splash screen
    startAppLoading();
    
    // Thực hiện các tác vụ khởi tạo
    const initApp = async () => {
      try {
        // Tải cấu hình
        await loadAppConfig();
        
        // Kiểm tra phiên đăng nhập
        await checkAuthSession();
        
        // Tải dữ liệu ban đầu
        await preloadInitialData();
      } catch (error) {
        console.error('App initialization error:', error);
      } finally {
        // Ẩn splash screen sau khi hoàn tất (hoặc bị lỗi)
        stopAppLoading();
      }
    };
    
    initApp();
  }, []);
  
  return null; // Component này chỉ để khởi tạo, không render UI
}

// Sử dụng trong App.tsx
function App() {
  return (
    <HierarchicalLoadingProvider>
      <AppInitializer />
      <MainApp />
    </HierarchicalLoadingProvider>
  );
}
```

## Ví dụ 6: Progress Bar khi chuyển trang (SPA)

```tsx
import { useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useHierarchicalLoading } from "@/components/ui/hierarchical-loading";

function AppRoutes() {
  const [location] = useLocation();
  const { 
    startPageLoading, 
    stopPageLoading, 
    updatePageProgress 
  } = useHierarchicalLoading();
  
  // Theo dõi thay đổi route
  useEffect(() => {
    // Bắt đầu loading với progress 10%
    startPageLoading();
    updatePageProgress(10);
    
    // Mô phỏng tải trang
    setTimeout(() => {
      updatePageProgress(30);
      
      setTimeout(() => {
        updatePageProgress(60);
        
        setTimeout(() => {
          updatePageProgress(100);
          stopPageLoading();
        }, 200);
      }, 150);
    }, 100);
    
    // Cuộn lên đầu trang
    window.scrollTo(0, 0);
  }, [location]);
  
  return (
    <div>
      <nav>
        <Link href="/">Home</Link>
        <Link href="/about">About</Link>
        <Link href="/contact">Contact</Link>
      </nav>
      
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/about" component={AboutPage} />
        <Route path="/contact" component={ContactPage} />
      </Switch>
    </div>
  );
}
```

## Ví dụ 7: Lazy loaded component với fallback

```tsx
import { lazy, Suspense } from "react";
import { ComponentLoading } from "@/components/ui/hierarchical-loading";
import { SkeletonLevel } from "@/components/ui/app-skeleton";

// Lazy load component nặng
const HeavyChart = lazy(() => import('./HeavyChart'));

function DashboardPage() {
  const chartId = "dashboard-chart";
  
  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      
      <div className="dashboard-content">
        {/* Các thành phần khác... */}
        
        {/* Chart được lazy load với loading skeleton */}
        <Suspense fallback={
          <ComponentLoading
            id={chartId}
            skeletonLevel={SkeletonLevel.CHART}
            height={300}
            skeletonProps={{ showControls: true }}
          >
            <div style={{ height: 300 }}></div>
          </ComponentLoading>
        }>
          <HeavyChart />
        </Suspense>
      </div>
    </div>
  );
}
```

## Ví dụ 8: Multi-step form với progress

```tsx
import { useState } from "react";
import { useHierarchicalLoading } from "@/components/ui/hierarchical-loading";

function MultiStepForm() {
  const [step, setStep] = useState(1);
  const totalSteps = 4;
  const { updatePageProgress } = useHierarchicalLoading();
  
  // Tính toán tiến độ dựa trên bước hiện tại
  useEffect(() => {
    // Tính phần trăm hoàn thành
    const percentage = (step / totalSteps) * 100;
    updatePageProgress(percentage);
    
    // Đặt lại progress khi component unmount
    return () => {
      updatePageProgress(100); // Dừng progress
    };
  }, [step]);
  
  // Xử lý chuyển bước
  const goToNextStep = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };
  
  const goToPrevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };
  
  return (
    <div className="multi-step-form">
      <div className="progress-indicators">
        {Array.from({ length: totalSteps }).map((_, index) => (
          <div 
            key={index}
            className={`step-indicator ${index + 1 <= step ? 'active' : ''}`}
          />
        ))}
      </div>
      
      {/* Nội dung form theo bước */}
      {step === 1 && <StepOne />}
      {step === 2 && <StepTwo />}
      {step === 3 && <StepThree />}
      {step === 4 && <StepFour />}
      
      <div className="form-actions">
        {step > 1 && (
          <button onClick={goToPrevStep}>Previous</button>
        )}
        
        {step < totalSteps ? (
          <button onClick={goToNextStep}>Next</button>
        ) : (
          <button onClick={handleSubmit}>Submit</button>
        )}
      </div>
    </div>
  );
}
```

Các ví dụ trên minh họa cách sử dụng hệ thống loading phân cấp trong các tình huống thực tế khác nhau. Tùy thuộc vào yêu cầu cụ thể, bạn có thể kết hợp các kỹ thuật này để tạo ra trải nghiệm loading mượt mà và nhất quán trong toàn bộ ứng dụng.