/**
 * Cấu hình và variants cho Framer Motion trong ứng dụng
 * 
 * File này chứa các cấu hình animation nhất quán để sử dụng toàn bộ ứng dụng
 * Tuân thủ tính năng "prefers-reduced-motion" của người dùng.
 */

import { useReducedMotion } from "framer-motion";
import { detectReducedMotion } from "./performance";

// Type definitions
export type TransitionConfig = {
  type?: "tween" | "spring" | "keyframes";
  stiffness?: number;
  damping?: number;
  mass?: number;
  duration?: number;
  ease?: string;
  delay?: number;
};

type VariantProps = {
  duration?: number;
  delay?: number;
  ease?: string;
};

// Base transition configurations
export const baseTransition: TransitionConfig = {
  type: "spring",
  stiffness: 300,
  damping: 30,
  mass: 1
};

export const smoothTransition: TransitionConfig = {
  type: "tween",
  duration: 0.25,
  ease: "easeInOut"
};

export const popTransition: TransitionConfig = {
  type: "spring",
  stiffness: 400,
  damping: 15,
  mass: 1
};

// Fade variants
export const fadeVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 }
};

// Scale variants
export const scaleVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: { scale: 1, opacity: 1 }
};

// Slide variants
export const slideUpVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 }
};

export const slideDownVariants = {
  hidden: { y: -20, opacity: 0 },
  visible: { y: 0, opacity: 1 }
};

export const slideLeftVariants = {
  hidden: { x: 20, opacity: 0 },
  visible: { x: 0, opacity: 1 }
};

export const slideRightVariants = {
  hidden: { x: -20, opacity: 0 },
  visible: { x: 0, opacity: 1 }
};

// Tab variants
export const tabVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 }
};

// Dialog/Modal variants
export const dialogVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  visible: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, y: 10 }
};

// Toast variants
export const toastVariants = {
  hidden: { opacity: 0, x: 20, scale: 0.95 },
  visible: { opacity: 1, x: 0, scale: 1 },
  exit: { opacity: 0, x: 20, scale: 0.95 }
};

// Popup overlay variants
export const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 }
};

// Achievement popup variants
export const achievementVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.9, y: 20 }
};

// Staggered children variants
export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

export const staggerItem = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
};

/**
 * Custom hook to get appropriate motion configuration based on user preferences
 */
export function useMotionConfig() {
  const prefersReducedMotion = useReducedMotion();
  const shouldReduceMotion = prefersReducedMotion || detectReducedMotion();
  
  // Return minimal transitions when reduced motion is preferred
  if (shouldReduceMotion) {
    return {
      enabled: false,
      transition: { duration: 0 },
      variants: {
        fade: { hidden: { opacity: 0 }, visible: { opacity: 1 } },
        scale: { hidden: { opacity: 0 }, visible: { opacity: 1 } },
        slide: { hidden: { opacity: 0 }, visible: { opacity: 1 } },
        dialog: { hidden: { opacity: 0 }, visible: { opacity: 1 } }
      }
    };
  }
  
  // Otherwise return normal motion settings
  return {
    enabled: true,
    transition: baseTransition,
    variants: {
      fade: fadeVariants,
      scale: scaleVariants,
      slideUp: slideUpVariants,
      slideDown: slideDownVariants,
      dialog: dialogVariants,
      tab: tabVariants,
      toast: toastVariants,
      overlay: overlayVariants,
      achievement: achievementVariants
    }
  };
}

/**
 * Factory functions to create variants with custom properties
 */
export function createFadeVariants(props?: VariantProps) {
  return {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        duration: props?.duration || 0.25, 
        delay: props?.delay || 0,
        ease: props?.ease || "easeInOut"
      }
    },
    exit: { 
      opacity: 0,
      transition: { 
        duration: (props?.duration || 0.25) * 0.75,
        ease: props?.ease || "easeInOut"
      }
    }
  };
}

export function createSlideVariants(direction: "up" | "down" | "left" | "right", props?: VariantProps & { distance?: number }) {
  const distance = props?.distance || 20;
  const axis = direction === "up" || direction === "down" ? "y" : "x";
  const sign = direction === "up" || direction === "left" ? 1 : -1;
  
  return {
    hidden: { 
      opacity: 0, 
      [axis]: sign * distance 
    },
    visible: { 
      opacity: 1, 
      [axis]: 0,
      transition: { 
        duration: props?.duration || 0.25, 
        delay: props?.delay || 0,
        ease: props?.ease || "easeOut"
      }
    },
    exit: { 
      opacity: 0, 
      [axis]: sign * -distance,
      transition: { 
        duration: (props?.duration || 0.25) * 0.75,
        ease: props?.ease || "easeIn" 
      }
    }
  };
}