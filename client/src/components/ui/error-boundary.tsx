import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * ErrorBoundary component for catching and displaying errors gracefully
 * 
 * Được thiết kế để phát hiện lỗi trong quá trình tải lazy-loaded components
 * và các lỗi rendering khác, hiển thị UI thân thiện thay vì crash ứng dụng.
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Cập nhật state để hiển thị fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Có thể log error đến service ở đây
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      errorInfo
    });
  }

  handleRetry = (): void => {
    // Reset state và render lại children
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  }

  render(): ReactNode {
    const { hasError, error } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      // Nếu có custom fallback UI được cung cấp, sử dụng nó
      if (fallback) {
        return fallback;
      }

      // Fallback UI mặc định
      return (
        <div className="flex items-center justify-center min-h-[70vh]">
          <div className="w-full max-w-md mx-auto p-4">
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-5 w-5 mr-2" />
              <AlertTitle>Đã xảy ra lỗi</AlertTitle>
              <AlertDescription>
                {error?.message || 'Có lỗi xảy ra khi tải trang này.'}
              </AlertDescription>
            </Alert>
            
            <div className="flex justify-center mt-4">
              <Button onClick={this.handleRetry} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Thử lại
              </Button>
            </div>
          </div>
        </div>
      );
    }

    // Nếu không có lỗi, render children bình thường
    return children;
  }
}

/**
 * Higher Order Component để bọc một component với ErrorBoundary
 * Dùng cho các component nằm ngoài Suspense/Switch trong App.tsx
 * 
 * @param Component Component cần bọc với ErrorBoundary
 * @param fallbackUI UI hiển thị khi có lỗi (tùy chọn)
 */
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallbackUI?: React.ReactNode
) => {
  // Tạo ra một functional component mới bao bọc Component đầu vào
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallbackUI}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  // Đặt tên cho component để dễ debug
  const displayName = Component.displayName || Component.name || 'Component';
  WrappedComponent.displayName = `withErrorBoundary(${displayName})`;
  
  return WrappedComponent;
};

export default ErrorBoundary;