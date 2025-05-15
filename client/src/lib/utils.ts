import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, compact = false): string {
  // Sửa lỗi currency không đúng format bằng cách chỉ dùng USD cố định
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: compact ? 0 : 2,
    maximumFractionDigits: 2,
    notation: compact ? "compact" : "standard"
  }).format(value);
}

export function formatPercentage(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
}

// formatNumber function removed - not used in the project

export function formatDate(date: Date | string | number | null): string {
  if (!date) return "N/A";
  
  const dateObj = typeof date === "object" ? date : new Date(date);
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(dateObj);
}

// formatTime function removed - not used in the project

// formatDateTime function removed - not used in the project

// truncateText function removed - not used in the project

export function getRelativeTime(date: Date | string | number | null): string {
  if (!date) return "N/A";
  
  const dateObj = typeof date === "object" ? date : new Date(date);
  const now = new Date();
  
  const seconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (seconds < 60) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  
  return formatDate(dateObj);
}

// getRandomId function removed - not used in the project

// calculateWinRate function removed - not used in the project

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// navigateToSettingsTab function removed - not used in the project
