import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

// Kiểm tra trạng thái dark mode để áp dụng đúng màu
const isDarkMode = () => {
  if (typeof window !== 'undefined') {
    return document.documentElement.classList.contains('dark');
  }
  return false;
}

/**
 * Các cấp độ skeleton cho các trường hợp sử dụng khác nhau
 */
export enum SkeletonLevel {
  LIST_ITEM = "list_item",
  CARD = "card",
  FORM = "form",
  PAGE = "page",
  CHART = "chart",
  TABLE = "table",
  STATS = "stats",
  AVATAR = "avatar",
}

interface AppSkeletonProps {
  level: SkeletonLevel;
  className?: string;
  height?: number;
  count?: number;
  customProps?: Record<string, any>;
}

/**
 * Component Skeleton chuẩn hóa cho toàn bộ ứng dụng
 * Cung cấp các mẫu skeleton phổ biến dựa trên level
 */
export function AppSkeleton({ 
  level, 
  className = "", 
  height, 
  count = 1,
  customProps = {}
}: AppSkeletonProps) {
  // Kiểm tra nếu dark mode được force
  const darkModeForced = customProps.forceDark === true;
  const renderContent = () => {
    switch (level) {
      case SkeletonLevel.LIST_ITEM:
        return renderListItemSkeleton();
      
      case SkeletonLevel.CARD:
        return renderCardSkeleton();
        
      case SkeletonLevel.FORM:
        return renderFormSkeleton();
        
      case SkeletonLevel.PAGE:
        return renderPageSkeleton();
        
      case SkeletonLevel.CHART:
        return renderChartSkeleton();
        
      case SkeletonLevel.TABLE:
        return renderTableSkeleton();
        
      case SkeletonLevel.STATS:
        return renderStatsSkeleton();
        
      case SkeletonLevel.AVATAR:
        return renderAvatarSkeleton();
        
      default:
        return <Skeleton className={cn("w-full h-10", className)} />;
    }
  };

  // List Item Skeleton (đơn lẻ hoặc nhóm items)
  const renderListItemSkeleton = () => (
    <div className="space-y-3">
      {Array(count).fill(0).map((_, i) => (
        <div key={i} className="flex items-center justify-between py-3">
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
    </div>
  );

  // Card Skeleton (thông tin tổng hợp)
  const renderCardSkeleton = () => (
    <div 
      className={cn("p-4 border rounded-lg shadow-sm", className)} 
      style={{ height: height || 'auto' }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-6 w-40" />
        </div>
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      
      <div className="space-y-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-5 w-48" />
        </div>
        
        {customProps.showProgress && (
          <div className="w-full h-2 mt-4 rounded-full overflow-hidden">
            <Skeleton className="h-full w-full" />
          </div>
        )}
        
        {customProps.showFooter && (
          <div className="flex justify-between items-center mt-4 pt-2 border-t">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-24 rounded-md" />
          </div>
        )}
      </div>
    </div>
  );

  // Form Skeleton
  const renderFormSkeleton = () => (
    <div className="space-y-4">
      {/* Form header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-24 rounded-md" />
      </div>
      
      {/* Form fields */}
      <div className="space-y-4">
        {Array(count || 5).fill(0).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        ))}
      </div>
      
      {/* Form actions */}
      <div className="flex justify-end gap-2 pt-4 mt-6">
        <Skeleton className="h-10 w-24 rounded-md" />
        <Skeleton className="h-10 w-24 rounded-md" />
      </div>
    </div>
  );

  // Page Skeleton (toàn trang)
  const renderPageSkeleton = () => (
    <div className="space-y-6 px-6 sm:px-8 md:px-10 safe-area-x">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Skeleton className="h-9 w-48 mb-2" />
          <Skeleton className="h-5 w-64" />
        </div>
        <Skeleton className="h-10 w-36 rounded-md" />
      </div>
      
      {/* Page content - có thể là tabs */}
      {customProps.showTabs && (
        <div className="border-b mb-6">
          <div className="flex gap-4 mb-2">
            {Array(customProps.tabCount || 3).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-8 w-24 rounded-md" />
            ))}
          </div>
          <Skeleton className="h-1 w-24 mb-[-1px]" />
        </div>
      )}
      
      {/* Nội dung chính */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {Array(4).fill(0).map((_, i) => (
          <div key={i} className="border rounded-lg p-4 shadow-sm h-[120px]">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24 mb-3" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
            <Skeleton className="h-6 w-20 mt-2 mb-4" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>
      
      {/* Content blocks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array(2).fill(0).map((_, i) => (
          <div key={i} className="border rounded-lg p-5 shadow-sm">
            <Skeleton className="h-5 w-36 mb-2" />
            <Skeleton className="h-3 w-48 mb-6" />
            <Skeleton className="h-40 w-full" />
          </div>
        ))}
      </div>
    </div>
  );

  // Chart Skeleton
  const renderChartSkeleton = () => (
    <div className={cn("border rounded-lg p-5 shadow-sm", className)}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <Skeleton className="h-5 w-36 mb-2" />
          <Skeleton className="h-3 w-48" />
        </div>
        {customProps.showControls && (
          <div className="flex gap-2">
            <Skeleton className="h-8 w-20 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-md" />
          </div>
        )}
      </div>
      <Skeleton className="h-60 w-full mt-4" />
    </div>
  );

  // Table Skeleton
  const renderTableSkeleton = () => (
    <div className="border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-muted/10 p-4 border-b">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-36" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-24 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-md" />
          </div>
        </div>
      </div>
      
      {/* Table header */}
      <div className="grid grid-cols-4 gap-4 p-4 border-b bg-muted/5">
        {Array(4).fill(0).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
      
      {/* Table rows */}
      {Array(count || 5).fill(0).map((_, i) => (
        <div key={i} className="grid grid-cols-4 gap-4 p-4 border-b last:border-0">
          {Array(4).fill(0).map((_, j) => (
            <Skeleton key={j} className="h-4 w-full" />
          ))}
        </div>
      ))}
      
      {/* Pagination */}
      {customProps.showPagination && (
        <div className="flex items-center justify-between p-4 border-t">
          <Skeleton className="h-4 w-32" />
          <div className="flex gap-1">
            {Array(5).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-8 w-8 rounded-md" />
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // Stats Skeleton
  const renderStatsSkeleton = () => (
    <div 
      className={cn("p-4 border rounded-lg shadow-sm", className)}
      style={{ height: height || 138 }}
    >
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-7 w-7 rounded-full" />
      </div>
      <Skeleton className="h-8 w-20 mb-2" />
      {customProps.showProgress && (
        <div className="w-full h-2 mt-4 pt-1 rounded-full overflow-hidden">
          <Skeleton className="h-full w-full" />
        </div>
      )}
      {customProps.showFooterText && (
        <Skeleton className="h-5 w-36 mt-2" />
      )}
    </div>
  );

  // Avatar Skeleton
  const renderAvatarSkeleton = () => (
    <div className="flex items-center space-x-4">
      <Skeleton className={cn("rounded-full", className || "h-12 w-12")} />
      {customProps.showText && (
        <div className="space-y-2">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
      )}
    </div>
  );

  return renderContent();
}