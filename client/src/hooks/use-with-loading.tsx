import React, { ComponentType, useState, useEffect } from 'react';
import { useLoadingStore, LoadingLevel } from './use-loading-store';

/**
 * HOC (Higher Order Component) để bọc các component hiện tại với tính năng loading
 * Tự động xử lý trạng thái loading và cung cấp các props loading phù hợp
 * 
 * @param Component - Component cần bọc với tính năng loading
 * @param options - Các tùy chọn chỉ định cách xử lý loading
 * @returns Component mới với tính năng loading đã được tích hợp
 */
export function withLoading<P extends object>(
  Component: ComponentType<P>,
  options: {
    loadingId?: string;
    level?: LoadingLevel;
    trackProps?: Array<keyof P>;
  } = {}
) {
  // Tạo tên loading ID dựa trên tên Component hoặc dùng ID được chỉ định
  const loadingId = options.loadingId || `loading-${Component.displayName || Component.name || 'component'}`;
  const level = options.level || LoadingLevel.COMPONENT;
  
  // Component mới với tính năng loading
  const WithLoadingComponent = (props: P) => {
    const startLoading = useLoadingStore(state => state.startLoading);
    const stopLoading = useLoadingStore(state => state.stopLoading);
    const isLoading = useLoadingStore(state => state.isLoading(loadingId, level));
    
    // Kiểm tra các props có giá trị isLoading để theo dõi
    const [propsLoading, setPropsLoading] = useState(false);
    
    // Theo dõi các props chỉ định để cập nhật trạng thái loading
    useEffect(() => {
      if (options.trackProps && options.trackProps.length > 0) {
        // Kiểm tra nếu có prop nào đang trong trạng thái loading
        const isAnyPropLoading = options.trackProps.some(propName => {
          const propValue = props[propName];
          return propValue === true || (
            typeof propValue === 'object' && 
            propValue !== null && 
            ('isLoading' in propValue || 'isPending' in propValue)
          );
        });
        
        setPropsLoading(isAnyPropLoading);
      }
    }, [props, options.trackProps]);
    
    // Cập nhật trạng thái loading dựa trên props
    useEffect(() => {
      if (propsLoading) {
        startLoading(loadingId, level);
      } else {
        stopLoading(loadingId, level);
      }
      
      return () => {
        stopLoading(loadingId, level);
      };
    }, [propsLoading, startLoading, stopLoading]);
    
    // Truyền prop isLoading vào component gốc
    return <Component {...props} isLoading={isLoading} />;
  };
  
  // Đặt tên displayName để dễ debug
  WithLoadingComponent.displayName = `WithLoading(${Component.displayName || Component.name || 'Component'})`;
  
  return WithLoadingComponent;
}