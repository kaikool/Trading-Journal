import { Icons } from '@/components/icons/icons';
import { Skeleton } from '@/components/ui/skeleton';

interface LoadingFallbackProps {
  height?: number;
  className?: string;
  simple?: boolean;
  showSpinner?: boolean;
}

export function LoadingFallback({ height = 200, className = '', simple = false, showSpinner = true }: LoadingFallbackProps) {
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