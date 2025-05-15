import { AppSkeleton, SkeletonLevel } from '@/components/ui/app-skeleton';

interface LoadingFallbackProps {
  height?: number;
  className?: string;
  simple?: boolean;
  showSpinner?: boolean; // Giữ lại cho backward compatibility
  level?: SkeletonLevel; // Cấp độ skeleton mới
}

/**
 * Component Fallback cho Suspense và lazy loading
 * Đã chuẩn hóa: toàn bộ đều sử dụng Skeleton, không dùng spinner
 */
export function LoadingFallback({ 
  height = 200, 
  className = '', 
  simple = false, 
  level
}: LoadingFallbackProps) {
  // Nếu được chỉ định level cụ thể, sử dụng level đó
  if (level) {
    return (
      <AppSkeleton 
        level={level} 
        className={className}
        height={height}
        customProps={{ showText: true }}
      />
    );
  }
  
  // Nếu simple=true, sử dụng skeleton đơn giản thay vì spinner
  if (simple) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height: `${height}px` }}>
        <AppSkeleton 
          level={SkeletonLevel.AVATAR} 
          className="h-10 w-10" 
        />
      </div>
    );
  }

  // Trường hợp mặc định: skeleton cho nội dung chung
  return (
    <div className={className} style={{ minHeight: `${height}px` }}>
      <AppSkeleton 
        level={SkeletonLevel.AVATAR} 
        className=""
        customProps={{ showText: true }} 
      />
      <div className="mt-4 space-y-3">
        <AppSkeleton level={SkeletonLevel.LIST_ITEM} count={3} />
      </div>
    </div>
  );
}