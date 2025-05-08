/**
 * Centralized Icon Management System
 * 
 * Quản lý tập trung các icon từ Lucide React để tối ưu hóa kích thước bundle
 * và chuẩn hóa cách sử dụng icon trong toàn bộ ứng dụng.
 */

import { 
  LayoutDashboard, 
  TrendingUp, 
  History, 
  BarChart2,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  ChevronLeft,
  BookOpen,
  Trophy,
  AlertTriangle,
  Info,
  Check,
  AlertCircle,
  Loader2,
  Search,
  Plus,
  Trash,
  Edit,
  Eye,
  Upload,
  Download,
  Calendar,
  Clock,
  ArrowDown,
  ArrowUp,
  Filter,
  MoreVertical,
  Save,
  RefreshCw,
  User,
  LucideIcon
} from 'lucide-react';

// Icon categories
export const dashboardIcons = {
  LayoutDashboard,
  TrendingUp,
  BarChart2,
  Trophy
};

export const navigationIcons = {
  History,
  BookOpen,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  ChevronLeft
};

export const feedbackIcons = {
  AlertTriangle,
  Info,
  Check,
  AlertCircle, 
  Loader2
};

export const actionIcons = {
  Search,
  Plus,
  Trash,
  Edit,
  Eye,
  Upload,
  Download,
  Save,
  RefreshCw,
  MoreVertical,
  Filter
};

export const dataIcons = {
  Calendar,
  Clock,
  ArrowDown,
  ArrowUp,
  User
};

// Type để hỗ trợ đầy đủ props của icon
export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  className?: string;
  color?: string;
}

// Re-export tất cả icons từ Lucide để tương thích với code hiện tại
export {
  LayoutDashboard,
  TrendingUp,
  History,
  BarChart2,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  ChevronLeft,
  BookOpen,
  Trophy,
  AlertTriangle,
  Info,
  Check,
  AlertCircle,
  Loader2,
  Search,
  Plus,
  Trash,
  Edit,
  Eye,
  Upload,
  Download,
  Calendar,
  Clock,
  ArrowDown,
  ArrowUp,
  Filter,
  MoreVertical,
  Save,
  RefreshCw,
  User,
  LucideIcon
};