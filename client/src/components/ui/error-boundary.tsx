import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RefreshCw, AlertTriangle } from 'lucide-react';

// Props cho ErrorBoundary component
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((props: { error: Error; resetErrorBoundary: () => void }) => ReactNode);
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onReset?: () => void;
  resetKeys?: any[];
}

// State cho ErrorBoundary component
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * ErrorBoundary component cho việc bắt và hiển thị lỗi một cách thân thiện
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
    // Log lỗi vào console và gọi callback onError nếu được cung cấp
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
    
    this.setState({ 
      errorInfo 
    });
    
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = (): void => {
    // Reset state để cố gắng render lại
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
    
    // Gọi callback onReset nếu được cung cấp
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render(): ReactNode {
    const { hasError, error } = this.state;
    const { children, fallback } = this.props;

    if (hasError && error) {
      // Nếu có fallback được truyền vào, sử dụng nó
      if (fallback) {
        // Nếu fallback là một function, gọi nó với error và resetErrorBoundary
        if (typeof fallback === 'function') {
          return fallback({ 
            error, 
            resetErrorBoundary: this.handleRetry 
          });
        }
        // Nếu không, render fallback trực tiếp
        return fallback;
      }

      // Fallback mặc định nếu không có fallback nào được cung cấp
      return (
        <Alert variant="destructive" className="my-4">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle className="ml-2">Đã xảy ra lỗi</AlertTitle>
          <AlertDescription className="mt-2">
            <div className="text-sm mb-3">{error.message}</div>
            <Button 
              onClick={this.handleRetry}
              variant="secondary"
              size="sm"
              className="mt-2"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Thử lại
            </Button>
          </AlertDescription>
        </Alert>
      );
    }

    // Nếu không có lỗi, render children bình thường
    return children;
  }
}

// Props cho ErrorFallback component
export interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

// Default ErrorFallback component
export const DefaultErrorFallback = ({ error, resetErrorBoundary }: ErrorFallbackProps) => (
  <div className="p-4 border border-red-500 rounded-md bg-red-50 dark:bg-red-900/20 my-4">
    <h2 className="text-lg font-semibold text-red-800 dark:text-red-300 mb-2">Lỗi Tải Phần Tử UI</h2>
    <p className="text-sm text-red-600 dark:text-red-400 mb-4">{error.message}</p>
    <button
      className="px-3 py-1 bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-300 rounded-md hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
      onClick={resetErrorBoundary}
    >
      Thử Lại
    </button>
  </div>
);

// Options cho withErrorBoundary HOC
export interface WithErrorBoundaryOptions {
  fallback?: ReactNode | ((props: { error: Error; resetErrorBoundary: () => void }) => ReactNode);
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onReset?: () => void;
}

/**
 * Higher Order Component để bọc một component với ErrorBoundary
 * 
 * @param Component Component cần bọc với ErrorBoundary
 * @param options Tùy chọn cho ErrorBoundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  options: WithErrorBoundaryOptions = {}
): React.ComponentType<P> {
  const { fallback, onError, onReset } = options;
  
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
  
  // Set display name for easier debugging
  const displayName = Component.displayName || Component.name || 'Component';
  WrappedComponent.displayName = `withErrorBoundary(${displayName})`;
  
  return WrappedComponent;
}

export default ErrorBoundary;