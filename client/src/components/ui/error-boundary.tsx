import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((props: { error: Error; resetErrorBoundary: () => void }) => ReactNode);
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onReset?: () => void;
  resetKeys?: any[];
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
    // Gọi onError callback nếu được cung cấp
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      errorInfo
    });
  }

  handleRetry = (): void => {
    // Gọi onReset callback nếu được cung cấp
    if (this.props.onReset) {
      this.props.onReset();
    }
    
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

    if (hasError && error) {
      // Nếu có custom fallback UI được cung cấp
      if (fallback) {
        // Xử lý cả trường hợp fallback là component và function
        if (typeof fallback === 'function') {
          return fallback({
            error,
            resetErrorBoundary: this.handleRetry
          });
        }
        return fallback;
      }

      // Fallback UI mặc định
      return (
        <div className="flex items-center justify-center min-h-[150px] w-full">
          <div className="w-full max-w-md mx-auto p-4">
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-5 w-5 mr-2" />
              <AlertTitle>Đã xảy ra lỗi</AlertTitle>
              <AlertDescription>
                {error?.message || 'Có lỗi xảy ra khi tải nội dung này.'}
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

// Type cho fallback component props
export interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

// Type cho withErrorBoundary HOC options
export interface WithErrorBoundaryOptions {
  fallback?: ReactNode | ((props: { error: Error; resetErrorBoundary: () => void }) => ReactNode);
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onReset?: () => void;
}

/**
 * Higher Order Component để bọc một component với ErrorBoundary
 * 
 * @param Component Component cần bọc với ErrorBoundary
 * @param options Các tùy chọn cho ErrorBoundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  options: WithErrorBoundaryOptions = {}
): React.ComponentType<P> {
  const { fallback: rawFallback, onError, onReset } = options;
  
  // Chuyển đổi Component fallback sang function fallback nếu cần
  let fallback = rawFallback;
  if (rawFallback && typeof rawFallback !== 'function' && 'type' in (rawFallback as any)) {
    const FallbackComponent = rawFallback;
    fallback = (props: { error: Error; resetErrorBoundary: () => void }) => 
      React.isValidElement(FallbackComponent) 
        ? React.cloneElement(FallbackComponent as React.ReactElement, props) 
        : FallbackComponent;
  }
  
  // Tạo ra một functional component mới bao bọc Component đầu vào
  const WrappedComponent = (props: P) => {
    return (
      <ErrorBoundary 
        fallback={fallback}
        onError={onError}
        onReset={onReset}
      >
        <Component {...props} />
      </ErrorBoundary>
    );
  };
  
  // Đặt tên cho component để dễ debug
  const displayName = Component.displayName || Component.name || 'Component';
  WrappedComponent.displayName = `withErrorBoundary(${displayName})`;
  
  return WrappedComponent;
}

export default ErrorBoundary;