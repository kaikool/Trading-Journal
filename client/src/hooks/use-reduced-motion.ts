/**
 * Hook để kiểm tra thiết lập prefers-reduced-motion của người dùng
 * Tuân thủ thiết lập accessibility của người dùng để cải thiện trải nghiệm
 */

import { useState, useEffect, useCallback } from 'react';

/**
 * Kiểm tra xem người dùng có thiết lập prefers-reduced-motion không
 * @returns Boolean cho biết người dùng có muốn giảm animation hay không
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false);
  
  // Tạo event handler với useCallback để tránh tạo hàm mới mỗi lần render
  const handleChange = useCallback((event: MediaQueryListEvent) => {
    setPrefersReducedMotion(event.matches);
  }, []);
  
  useEffect(() => {
    // Kiểm tra xem MediaQuery API có được hỗ trợ không
    if (typeof window === 'undefined') return;
    
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    // Thiết lập giá trị ban đầu
    setPrefersReducedMotion(mediaQuery.matches);
    
    // Sử dụng passive event listener khi có thể để tối ưu hiệu suất
    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange, { passive: true });
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      // Fallback cho các trình duyệt cũ
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, [handleChange]);
  
  return prefersReducedMotion;
}