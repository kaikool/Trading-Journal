/**
 * Cấu hình và preset cho framer-motion
 * 
 * File này chứa các cấu hình tập trung cho animation trong toàn bộ ứng dụng
 * Tất cả các animation nên sử dụng các preset được định nghĩa ở đây để đảm bảo:
 * - Tính nhất quán trong trải nghiệm người dùng
 * - Dễ dàng điều chỉnh tập trung
 * - Tối ưu hiệu suất
 * - Tôn trọng thiết lập reduced motion của người dùng
 */

import { useState, useEffect, useCallback } from 'react';
import { Variants, MotionProps } from 'framer-motion';

// Thời gian cơ bản cho các animation
export const durations = {
  ultrafast: 0.1,   // 100ms
  veryfast: 0.15,   // 150ms
  fast: 0.2,        // 200ms
  normal: 0.3,      // 300ms
  slow: 0.5,        // 500ms
  verySlow: 0.7,    // 700ms
};

// Các giá trị easing cơ bản
export const easings = {
  // Các đường cong easing cơ bản
  easeOut: [0.16, 1, 0.3, 1],     // Khởi động mạnh, kết thúc nhẹ nhàng
  easeIn: [0.7, 0, 0.84, 0],      // Khởi động nhẹ nhàng, kết thúc mạnh
  easeInOut: [0.65, 0, 0.35, 1],  // Khởi động và kết thúc nhẹ nhàng
  
  // Đường cong chuyên biệt
  bounce: [0.175, 0.885, 0.32, 1.275], // Có hiệu ứng nảy nhẹ
  spring: [0.34, 1.56, 0.64, 1],       // Hiệu ứng lò xo tự nhiên
  gentle: [0.4, 0.0, 0.2, 1],          // Nhẹ nhàng, phù hợp với UI tinh tế
};

// Staggering (hiệu ứng "domino" cho danh sách các phần tử)
export const staggerConfig = {
  default: 0.05,      // 50ms giữa mỗi phần tử
  fast: 0.02,         // 20ms giữa mỗi phần tử
  slow: 0.08,         // 80ms giữa mỗi phần tử
};

/**
 * Các preset animation variants cho các tình huống phổ biến
 * Mỗi preset định nghĩa các trạng thái: initial, animate, exit
 */

// Fade in/out - hiệu ứng mờ dần
export const fadeVariants: Variants = {
  initial: { opacity: 0 },
  animate: { 
    opacity: 1,
    transition: { 
      duration: durations.normal,
      ease: easings.easeOut 
    }
  },
  exit: { 
    opacity: 0,
    transition: { 
      duration: durations.fast,
      ease: easings.easeIn 
    }
  },
};

// Slide up - hiệu ứng trượt lên từ dưới
export const slideUpVariants: Variants = {
  initial: { 
    opacity: 0, 
    y: 20 
  },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: durations.normal,
      ease: easings.easeOut 
    }
  },
  exit: { 
    opacity: 0, 
    y: 20,
    transition: { 
      duration: durations.fast,
      ease: easings.easeIn 
    }
  },
};

// Slide down - hiệu ứng trượt xuống từ trên
export const slideDownVariants: Variants = {
  initial: { 
    opacity: 0, 
    y: -20 
  },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: durations.normal,
      ease: easings.easeOut 
    }
  },
  exit: { 
    opacity: 0, 
    y: -20,
    transition: { 
      duration: durations.fast,
      ease: easings.easeIn 
    }
  },
};

// Slide in from left - hiệu ứng trượt vào từ trái
export const slideInLeftVariants: Variants = {
  initial: { 
    opacity: 0, 
    x: -20 
  },
  animate: { 
    opacity: 1, 
    x: 0,
    transition: { 
      duration: durations.normal,
      ease: easings.easeOut 
    }
  },
  exit: { 
    opacity: 0, 
    x: -20,
    transition: { 
      duration: durations.fast,
      ease: easings.easeIn 
    }
  },
};

// Slide in from right - hiệu ứng trượt vào từ phải
export const slideInRightVariants: Variants = {
  initial: { 
    opacity: 0, 
    x: 20 
  },
  animate: { 
    opacity: 1, 
    x: 0,
    transition: { 
      duration: durations.normal,
      ease: easings.easeOut 
    }
  },
  exit: { 
    opacity: 0, 
    x: 20,
    transition: { 
      duration: durations.fast,
      ease: easings.easeIn 
    }
  },
};

// Scale - hiệu ứng co giãn
export const scaleVariants: Variants = {
  initial: { 
    opacity: 0, 
    scale: 0.95 
  },
  animate: { 
    opacity: 1, 
    scale: 1,
    transition: { 
      duration: durations.normal,
      ease: easings.spring 
    }
  },
  exit: { 
    opacity: 0, 
    scale: 0.95,
    transition: { 
      duration: durations.fast,
      ease: easings.easeIn 
    }
  },
};

// Hiệu ứng card hover
export const cardHoverVariants: Variants = {
  initial: { 
    scale: 1,
    y: 0,
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
  },
  hover: { 
    scale: 1.02,
    y: -5,
    boxShadow: "0 10px 20px rgba(0,0,0,0.1)",
    transition: { 
      duration: durations.fast,
      ease: easings.spring 
    }
  },
  tap: { 
    scale: 0.98,
    transition: { 
      duration: durations.ultrafast
    }
  }
};

// Hiệu ứng cho list items với staggered children
export const listContainerVariants: Variants = {
  initial: { 
    opacity: 0 
  },
  animate: { 
    opacity: 1,
    transition: { 
      when: 'beforeChildren',
      staggerChildren: staggerConfig.default
    }
  },
  exit: { 
    opacity: 0,
    transition: { 
      when: 'afterChildren',
      staggerChildren: staggerConfig.fast,
      staggerDirection: -1
    }
  },
};

// Variant cho từng item trong list
export const listItemVariants: Variants = {
  initial: { 
    opacity: 0, 
    y: 10 
  },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: durations.fast,
      ease: easings.easeOut 
    }
  },
  exit: { 
    opacity: 0, 
    y: 10,
    transition: { 
      duration: durations.fast,
      ease: easings.easeIn 
    }
  },
};

// Hiệu ứng cho dialog/modal
export const dialogVariants: Variants = {
  initial: { 
    opacity: 0, 
    scale: 0.95,
    y: 10
  },
  animate: { 
    opacity: 1, 
    scale: 1,
    y: 0,
    transition: { 
      duration: durations.normal,
      ease: easings.spring 
    }
  },
  exit: { 
    opacity: 0, 
    scale: 0.95,
    y: 10,
    transition: { 
      duration: durations.fast,
      ease: easings.easeIn 
    }
  },
};

// Hiệu ứng cho mobile bottom sheet
export const bottomSheetVariants: Variants = {
  initial: { 
    opacity: 0, 
    y: '100%'
  },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: durations.normal,
      ease: easings.easeOut 
    }
  },
  exit: { 
    opacity: 0, 
    y: '100%',
    transition: { 
      duration: durations.fast,
      ease: easings.easeIn 
    }
  },
};

// Backdrop cho modals & sheets
export const backdropVariants: Variants = {
  initial: { 
    opacity: 0 
  },
  animate: { 
    opacity: 1,
    transition: { 
      duration: durations.normal,
      ease: easings.easeOut 
    }
  },
  exit: { 
    opacity: 0,
    transition: { 
      duration: durations.fast,
      ease: easings.easeIn,
      delay: 0.1 // Lưu ý: có độ trễ nhỏ để đảm bảo backdrop biến mất sau nội dung
    }
  },
};

// Hiệu ứng toast thông báo
export const toastVariants: Variants = {
  initial: { 
    opacity: 0, 
    y: -20,
    scale: 0.9
  },
  animate: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: { 
      duration: durations.fast,
      ease: easings.spring 
    }
  },
  exit: { 
    opacity: 0, 
    scale: 0.9,
    transition: { 
      duration: durations.fast,
      ease: easings.easeIn 
    }
  },
};

/**
 * Optimized hook to detect reduced motion preference
 * Based on App.tsx implementation
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  
  // Create event handler with useCallback to avoid creating new function on re-render
  const handleChange = useCallback((event: MediaQueryListEvent) => {
    setPrefersReducedMotion(event.matches);
  }, []);
  
  useEffect(() => {
    // Check MediaQuery API compatibility
    if (typeof window === 'undefined') return;
    
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    // Set initial value
    setPrefersReducedMotion(mediaQuery.matches);
    
    // Use passive event listener when possible
    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange, { passive: true });
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, [handleChange]);
  
  return prefersReducedMotion;
}

/**
 * Custom hook để cung cấp props motion phù hợp với thiết lập reduced motion của người dùng
 * Sử dụng hook này để tuân thủ accessibility tốt hơn
 */
export function useMotionPreset(
  preset: Variants,
  options: {
    shouldReduceMotion?: boolean; // Nếu component muốn tự kiểm soát việc giảm motion
    enableExit?: boolean;         // Bật/tắt animation exit
  } = {}
): MotionProps {
  // Sử dụng hook có sẵn hoặc giá trị được truyền vào
  const prefersReducedMotion = useReducedMotion();
  const shouldReduceMotion = options.shouldReduceMotion ?? prefersReducedMotion;
  
  // Tạo props với các trạng thái animation
  const motionProps: MotionProps = {
    initial: "initial",
    animate: "animate",
    ...(options.enableExit && { exit: "exit" }),
  };
  
  // Nếu người dùng muốn giảm animation, chỉ sử dụng opacity để transition nhẹ nhàng
  if (shouldReduceMotion) {
    return {
      ...motionProps,
      variants: {
        initial: { opacity: 0 },
        animate: { 
          opacity: 1,
          transition: { duration: durations.fast }
        },
        ...(options.enableExit && { 
          exit: { 
            opacity: 0,
            transition: { duration: durations.fast }
          } 
        }),
      },
    };
  }
  
  // Nếu không, sử dụng preset đầy đủ
  return {
    ...motionProps,
    variants: preset,
  };
}

/**
 * Custom hook để tạo các props motion cho các thành phần danh sách
 */
export function useListMotion(
  itemCount: number,
  options: {
    staggerDelay?: number;
    shouldReduceMotion?: boolean;
    enableExit?: boolean;
  } = {}
): {
  containerProps: MotionProps;
  getItemProps: (index?: number) => MotionProps;
} {
  const prefersReducedMotion = useReducedMotion();
  const shouldReduceMotion = options.shouldReduceMotion ?? prefersReducedMotion;
  const staggerDelay = options.staggerDelay ?? staggerConfig.default;
  
  // Tạo prop cho container
  const containerProps: MotionProps = useMotionPreset(
    {
      ...listContainerVariants,
      animate: {
        ...listContainerVariants.animate,
        transition: {
          ...listContainerVariants.animate.transition as any,
          staggerChildren: shouldReduceMotion ? 0 : staggerDelay
        }
      }
    },
    {
      shouldReduceMotion,
      enableExit: options.enableExit
    }
  );
  
  // Tạo factory function để tạo props cho mỗi item
  const getItemProps = (index = 0): MotionProps => {
    // Nếu người dùng muốn giảm animation, chỉ fade đơn giản
    if (shouldReduceMotion) {
      return {
        initial: { opacity: 0 },
        animate: { 
          opacity: 1,
          transition: { duration: durations.fast }
        },
        ...(options.enableExit && { 
          exit: { 
            opacity: 0,
            transition: { duration: durations.fast }
          } 
        }),
      };
    }
    
    // Tính toán độ trễ dựa trên index (tùy chọn cho hiệu ứng phức tạp hơn)
    const delay = index * staggerDelay;
    
    return {
      variants: listItemVariants,
      custom: { delay },
    };
  };
  
  return { containerProps, getItemProps };
}

/**
 * Custom hook để tạo props motion cho page transitions
 */
export function usePageTransition(
  direction: 'forward' | 'backward' = 'forward',
  options: {
    shouldReduceMotion?: boolean;
  } = {}
): MotionProps {
  const prefersReducedMotion = useReducedMotion();
  const shouldReduceMotion = options.shouldReduceMotion ?? prefersReducedMotion;
  
  // Chọn preset dựa trên hướng chuyển trang
  const pagePreset = direction === 'forward' 
    ? slideInRightVariants 
    : slideInLeftVariants;
  
  return useMotionPreset(pagePreset, {
    shouldReduceMotion,
    enableExit: true
  });
}