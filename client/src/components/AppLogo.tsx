import React from 'react';
import { cn } from "@/lib/utils";

// Import directly from public directory
const APP_ICON_LIGHT = '/app-icon.svg';
const APP_ICON_DARK = '/app-icon.svg';
const APP_ICON_DEFAULT = '/app-icon.svg';

interface AppLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'light' | 'dark';
}

/**
 * AppLogo Component
 * 
 * A consistent app logo component that handles different sizes and themes.
 * 
 * @param className - Additional CSS classes
 * @param size - Logo size: xs (16px), sm (20px), md (24px), lg (32px), xl (48px)
 * @param variant - Logo theme: default, light (for dark backgrounds), dark (for light backgrounds)
 */
export function AppLogo({ 
  className, 
  size = 'md', 
  variant = 'default' 
}: AppLogoProps) {
  // Size map to component dimensions
  const sizeMap = {
    xs: 'h-4 w-4',
    sm: 'h-5 w-5',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12',
  };

  // Choose the appropriate icon based on variant
  const getIconSrc = () => {
    switch (variant) {
      case 'light':
        return APP_ICON_LIGHT;
      case 'dark':
        return APP_ICON_DARK;
      default:
        return APP_ICON_DEFAULT;
    }
  };

  return (
    <div 
      className={cn(
        sizeMap[size], 
        'relative flex-shrink-0 overflow-hidden', 
        className
      )}
      aria-hidden="true"
    >
      <img 
        src={getIconSrc()}
        alt="Forex Trade Journal Logo"
        className="h-full w-full object-contain"
        loading="eager"
      />
    </div>
  );
}

export default AppLogo;