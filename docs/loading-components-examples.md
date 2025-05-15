# Ví Dụ Code Các Component Loading

Tài liệu này cung cấp mã nguồn và ví dụ cụ thể của các thành phần loading trong ứng dụng để dễ dàng tham khảo.

## 1. Spinner Component

```jsx
// Trong Icons component
export const Icons = {
  ui: {
    spinner: (props: LucideProps) => (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
      >
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      </svg>
    ),
    // ... các icon khác
  },
  // ... các nhóm icon khác
};

// Cách sử dụng
<Icons.ui.spinner className="h-6 w-6 animate-spin text-muted-foreground" />
```

## 2. Skeleton Component

### Base Component

```jsx
// @/components/ui/skeleton.tsx
import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

export { Skeleton }
```

### LoadingFallback Component

```jsx
// @/components/dynamic/LoadingFallback.tsx
import { Icons } from '@/components/icons/icons';
import { Skeleton } from '@/components/ui/skeleton';

interface LoadingFallbackProps {
  height?: number;
  className?: string;
  simple?: boolean;
  showSpinner?: boolean;
}

export function LoadingFallback({ 
  height = 200, 
  className = '', 
  simple = false, 
  showSpinner = true 
}: LoadingFallbackProps) {
  if (simple) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height: `${height}px` }}>
        {showSpinner && <Icons.ui.spinner className="h-6 w-6 animate-spin text-muted-foreground" />}
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`} style={{ minHeight: `${height}px` }}>
      <div className="flex items-center space-x-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <div className="pt-4">
        <Skeleton className="h-10 w-[180px]" />
      </div>
    </div>
  );
}
```

### Card Skeleton Examples

```jsx
// StatCard Skeleton
if (isLoading) {
  return (
    <Card className="border shadow-sm h-[138px]">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="h-5 w-24 bg-muted/60 rounded-md" />
          <div className="h-7 w-7 bg-muted/60 rounded-full" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-8 w-20 bg-muted/60 rounded-md mb-2" />
        {progressValue !== undefined && (
          <div className="relative z-10 mt-4 pt-1">
            <div className="w-full bg-muted/60 rounded-full h-2" />
          </div>
        )}
        {supportingText && (
          <div className="h-5 w-36 bg-muted/60 rounded-md mt-2" />
        )}
      </CardContent>
    </Card>
  );
}

// RecentTradesCard Skeleton
if (isLoading) {
  return (
    <Card className="h-full flex flex-col relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-6 w-40" />
          </div>
          <Skeleton className="h-4 w-56 mt-2" />
        </div>
      </CardHeader>
      
      <CardContent className="py-2 flex-grow">
        {Array(3).fill(0).map((_, index) => (
          <div key={index} className="flex items-center justify-between py-3 border-b border-border/30 last:border-0">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded-full" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-3.5 w-32" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-16 rounded-md" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// AccountSummaryCard Skeleton
if (isLoading) {
  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="balance-skeleton-container">
          <Skeleton className="balance-skeleton-amount" />
          <Skeleton className="balance-skeleton-subtitle" />
          <Skeleton className="balance-skeleton-bar mt-4" />
        </div>
      </CardContent>
    </Card>
  );
}
```

### Page-Level Skeleton Examples

```jsx
// Settings Page Skeleton
if (isLoading) {
  return (
    <div className="container max-w-7xl mx-auto px-4 sm:px-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Skeleton className="h-9 w-48 mb-2" />
          <Skeleton className="h-5 w-64" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>
      
      <Skeleton className="h-12 w-full mb-8" />
      
      {Array(3).fill(0).map((_, i) => (
        <Card key={i} className="mb-6 shadow-sm border border-border/40">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div>
                <Skeleton className="h-6 w-40 mb-1" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="pt-6">
            {/* Content skeleton */}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Analytics TabLoadingFallback
const TabLoadingFallback = () => (
  <div className="space-y-6">
    {/* KPI Row Skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="border rounded-lg p-4 shadow-sm h-[120px] animate-pulse">
          <div className="flex items-center justify-between">
            <div className="h-4 w-24 bg-muted rounded mb-3"></div>
            <div className="h-8 w-8 rounded-full bg-muted"></div>
          </div>
          <div className="h-6 w-20 bg-muted rounded mt-2 mb-4"></div>
          <div className="h-3 w-32 bg-muted/50 rounded"></div>
        </div>
      ))}
    </div>
    
    {/* Chart Skeletons */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="border rounded-lg p-5 shadow-sm animate-pulse">
        <div className="h-5 w-36 bg-muted rounded mb-2"></div>
        <div className="h-3 w-48 bg-muted/50 rounded mb-6"></div>
        <div className="h-40 w-full bg-muted/30 rounded"></div>
      </div>
      <div className="border rounded-lg p-5 shadow-sm animate-pulse">
        <div className="h-5 w-36 bg-muted rounded mb-2"></div>
        <div className="h-3 w-48 bg-muted/50 rounded mb-6"></div>
        <div className="h-40 w-full bg-muted/30 rounded"></div>
      </div>
    </div>
  </div>
);
```

## 3. React Suspense và Lazy Loading

### Lazy Route Loading (App.tsx)

```jsx
// App.tsx - Lazy loading routes
const TradeForm = lazy(() => import("@/pages/trade"));
const ViewTrade = lazy(() => import("@/pages/ViewTradeOptimized"));
const Analytics = lazy(() => import("@/pages/Analytics"));
const Settings = lazy(() => import("@/pages/Settings"));
const Strategies = lazy(() => import("@/pages/Strategies"));
const Achievements = lazy(() => import("@/pages/Achievements"));
const Goals = lazy(() => import("@/pages/Goals"));

// Sử dụng trong routes
function MainContent() {
  return (
    <Suspense fallback={<LoadingFallback height={500} />}>
      <Switch>
        <Route path="/dashboard">
          <Dashboard />
        </Route>
        <Route path="/trade/new">
          <TradeForm />
        </Route>
        {/* ... các routes khác */}
      </Switch>
    </Suspense>
  );
}
```

### SafeLazyLoad Component

```jsx
// @/components/dynamic/SafeLazyLoad.tsx
import React, { lazy, Suspense, useState, useEffect } from 'react';
import { LoadingFallback } from './LoadingFallback';
import ErrorBoundary from '@/components/ui/error-boundary';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons/icons';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { debug } from '@/lib/debug';
import { isPwaMode, clearAssetsCache } from '@/lib/serviceWorkerHelper';

interface SafeLazyLoadProps {
  loadComponent: () => Promise<any>;
  componentProps?: any;
  height?: number | string;
  fallback?: React.ReactNode;
  retryOnError?: boolean;
}

function isMIMETypeError(error: any): boolean {
  const errorStr = String(error);
  return errorStr.includes('MIME type') || 
         errorStr.includes('module is not defined') ||
         errorStr.includes('Failed to fetch dynamically imported module');
}

export function SafeLazyLoad({ 
  loadComponent, 
  componentProps = {}, 
  height, 
  fallback,
  retryOnError = true
}: SafeLazyLoadProps) {
  const [Component, setComponent] = useState<React.ComponentType<any> | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    setLoading(true);
    setError(null);
    
    loadComponent()
      .then(module => {
        // Hỗ trợ cả default export và named exports
        const LoadedComponent = module.default || module;
        setComponent(() => LoadedComponent);
        setLoading(false);
      })
      .catch(err => {
        debug('SafeLazyLoad error:', err);
        setError(err);
        setLoading(false);
      });
      
  }, [loadComponent]);
  
  // Đã load thành công
  if (Component) {
    return <Component {...componentProps} />;
  }
  
  // Nếu đang loading
  if (loading) {
    return fallback || <LoadingFallback height={typeof height === 'number' ? height : 300} showSpinner={true} />;
  }
  
  // Nếu có lỗi
  if (error) {
    // ...Xử lý lỗi và hiển thị UI thích hợp
  }
  
  // Fallback cuối cùng nếu không có gì được render
  return <LoadingFallback simple height={150} />
}
```

## 4. Route-Level Loading và Animation

### App.tsx - Loading Indicator

```jsx
// App.tsx - Mini loader khi chuyển trang
{!isPageReady && !prefersReducedMotion && (
  <div className="fixed inset-x-0 top-0 z-50 h-0.5 overflow-hidden">
    <div className="w-full h-full bg-primary/10 relative">
      <div className="absolute inset-y-0 left-0 bg-primary animate-indeterminate-progress w-full"></div>
    </div>
  </div>
)}

// Initial loading screen
if (loading) {
  return (
    <div className="h-screen w-full flex items-center justify-center">
      <div className="animate-pulse flex flex-col items-center">
        <div className="w-16 h-16 rounded-full bg-primary/20 mb-4"></div>
        <div className="h-4 w-24 bg-muted rounded"></div>
      </div>
    </div>
  );
}
```

### CSS Animations

```css
/* globals.css - Shimmer animation & custom skeleton classes */
@keyframes indeterminate-progress {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.animate-indeterminate-progress {
  animation: indeterminate-progress 1.5s infinite ease-out;
}

/* Placeholder styles */
.placeholder-shimmer {
  background: linear-gradient(to right, 
    hsl(var(--muted) / 0.1) 0%, 
    hsl(var(--muted) / 0.3) 20%, 
    hsl(var(--muted) / 0.1) 40%
  );
  background-size: 1000px 100%;
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  border: 1px solid hsl(var(--border) / 0.2);
}

.placeholder-circle {
  width: 2rem;
  height: 2rem;
  border-radius: 9999px;
  background-color: hsl(var(--muted) / 0.6);
}

/* ... custom skeleton classes ... */
```

## 5. React Query Loading States

### useUserDataQuery Hook

```tsx
// @/hooks/use-user-data-query.ts
export function useUserDataQuery() {
  const { userId } = useAuth();
  
  const { data: userData, isLoading, error } = useQuery({
    queryKey: [`/users/${userId}`],
    queryFn: async () => {
      if (!userId) return null;
      
      debug(`Fetching user data for ${userId}`);
      return await getUserData(userId);
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  return {
    userData,
    isLoading,
    error
  };
}
```

### Mutation Loading States (Example)

```tsx
// use-goal-data.ts (excerpt)
const createGoalMutation = useMutation({
  mutationFn: async (goalData: any) => {
    if (!firebaseUserId) throw new Error("User is not logged in");
    return addGoal(firebaseUserId, goalData);
  },
  onSuccess: () => {
    // ...success handling
  },
  onError: (error: any) => {
    // ...error handling
  },
});

// Exposing mutation states
return {
  // ...other states and functions
  isCreatingGoal: createGoalMutation.isPending,
  isUpdatingGoal: updateGoalMutation.isPending,
  isDeletingGoal: deleteGoalMutation.isPending,
};
```