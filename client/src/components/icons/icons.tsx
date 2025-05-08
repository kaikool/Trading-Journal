import React from 'react';
import { LucideProps } from 'lucide-react';

// Import tất cả icon được sử dụng từ lucide-react
import {
  // Navigation/Layout icons
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
  
  // Auth/User icons
  User,
  Lock,
  Eye,
  EyeOff,
  Shield,
  ShieldCheck,
  Mail,
  
  // Trading/Finance icons
  CreditCard,
  DollarSign,
  CircleDollarSign,
  Wallet,
  BarChart3,
  BarChart4,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  ArrowUp,
  ArrowDown,
  
  // Status icons
  CheckCircle2,
  CircleCheck,
  CircleX,
  CircleDot,
  CircleDashed,
  Check,
  Ban,
  AlertTriangle,
  AlertCircle,
  Hand,
  
  // UI/Action icons
  Save,
  Plus,
  Loader2,
  RefreshCw,
  Filter,
  FilterX,
  SlidersHorizontal,
  Bell,
  Calendar,
  CalendarDays,
  ChevronsUpDown,
  MoreHorizontal,
  
  // Theme icons
  Moon,
  Sun,
  Monitor,
  Palette,
  
  // Misc icons
  Brain,
  LineChart,
  Rocket,
  Smartphone,
  CloudOff,
  Badge,
  Lightbulb,
  Heart,
  Clock,
  TimerOff,
  Repeat,
  MoveRight,
  FileX,
  Newspaper,
  Link,
  Link2Off,
  Github,
  
  // Achievement icons
  Target,
  Sword,
  Coffee,
  HeartHandshake,
  Hourglass,
  CheckCheck,
  Medal,
  Award,
  Globe,
  Crown,
  Sparkles,
} from 'lucide-react';

// Kiểu dữ liệu cho icon props
export interface IconProps extends Omit<LucideProps, 'ref'> {
  name: IconName;
}

// Danh sách các tên icon được hỗ trợ
export type IconName =
  // Navigation/Layout icons
  | 'layout-dashboard'
  | 'trending-up'
  | 'history'
  | 'bar-chart-2'
  | 'settings'
  | 'log-out'
  | 'menu'
  | 'x'
  | 'chevron-right'
  | 'chevron-left'
  | 'book-open'
  | 'trophy'
  
  // Auth/User icons
  | 'user'
  | 'lock'
  | 'eye'
  | 'eye-off'
  | 'shield'
  | 'shield-check'
  | 'mail'
  
  // Trading/Finance icons
  | 'credit-card'
  | 'dollar-sign'
  | 'circle-dollar-sign'
  | 'wallet'
  | 'bar-chart-3'
  | 'bar-chart-4'
  | 'trending-down'
  | 'arrow-up-right'
  | 'arrow-down-right'
  | 'arrow-up'
  | 'arrow-down'
  
  // Status icons
  | 'check-circle-2'
  | 'circle-check'
  | 'circle-x'
  | 'circle-dot'
  | 'circle-dashed'
  | 'check'
  | 'ban'
  | 'alert-triangle'
  | 'alert-circle'
  | 'hand'
  
  // UI/Action icons
  | 'save'
  | 'plus'
  | 'loader-2'
  | 'refresh-cw'
  | 'filter'
  | 'filter-x'
  | 'sliders-horizontal'
  | 'bell'
  | 'calendar'
  | 'calendar-days'
  | 'chevrons-up-down'
  | 'more-horizontal'
  
  // Theme icons
  | 'moon'
  | 'sun'
  | 'monitor'
  | 'palette'
  
  // Misc icons
  | 'brain'
  | 'line-chart'
  | 'rocket'
  | 'smartphone'
  | 'cloud-off'
  | 'badge'
  | 'lightbulb'
  | 'heart'
  | 'clock'
  | 'timer-off'
  | 'repeat'
  | 'move-right'
  | 'file-x'
  | 'newspaper'
  | 'link'
  | 'link-2-off'
  | 'github'
  
  // Achievement icons
  | 'target'
  | 'sword'
  | 'coffee'
  | 'heart-handshake'
  | 'hourglass'
  | 'check-check'
  | 'medal'
  | 'award'
  | 'globe'
  | 'crown'
  | 'sparkles';

// Mapping từ tên icon sang component tương ứng
const iconMap: Record<IconName, React.FC<LucideProps>> = {
  // Navigation/Layout icons
  'layout-dashboard': LayoutDashboard,
  'trending-up': TrendingUp,
  'history': History,
  'bar-chart-2': BarChart2,
  'settings': Settings,
  'log-out': LogOut,
  'menu': Menu,
  'x': X,
  'chevron-right': ChevronRight,
  'chevron-left': ChevronLeft,
  'book-open': BookOpen,
  'trophy': Trophy,
  
  // Auth/User icons
  'user': User,
  'lock': Lock,
  'eye': Eye,
  'eye-off': EyeOff,
  'shield': Shield,
  'shield-check': ShieldCheck,
  'mail': Mail,
  
  // Trading/Finance icons
  'credit-card': CreditCard,
  'dollar-sign': DollarSign,
  'circle-dollar-sign': CircleDollarSign,
  'wallet': Wallet,
  'bar-chart-3': BarChart3,
  'bar-chart-4': BarChart4,
  'trending-down': TrendingDown,
  'arrow-up-right': ArrowUpRight,
  'arrow-down-right': ArrowDownRight,
  'arrow-up': ArrowUp,
  'arrow-down': ArrowDown,
  
  // Status icons
  'check-circle-2': CheckCircle2,
  'circle-check': CircleCheck,
  'circle-x': CircleX,
  'circle-dot': CircleDot,
  'circle-dashed': CircleDashed,
  'check': Check,
  'ban': Ban,
  'alert-triangle': AlertTriangle,
  'alert-circle': AlertCircle,
  'hand': Hand,
  
  // UI/Action icons
  'save': Save,
  'plus': Plus,
  'loader-2': Loader2,
  'refresh-cw': RefreshCw,
  'filter': Filter,
  'filter-x': FilterX,
  'sliders-horizontal': SlidersHorizontal,
  'bell': Bell,
  'calendar': Calendar,
  'calendar-days': CalendarDays,
  'chevrons-up-down': ChevronsUpDown,
  'more-horizontal': MoreHorizontal,
  
  // Theme icons
  'moon': Moon,
  'sun': Sun,
  'monitor': Monitor,
  'palette': Palette,
  
  // Misc icons
  'brain': Brain,
  'line-chart': LineChart,
  'rocket': Rocket,
  'smartphone': Smartphone,
  'cloud-off': CloudOff,
  'badge': Badge,
  'lightbulb': Lightbulb,
  'heart': Heart,
  'clock': Clock,
  'timer-off': TimerOff,
  'repeat': Repeat,
  'move-right': MoveRight,
  'file-x': FileX,
  'newspaper': Newspaper,
  'link': Link,
  'link-2-off': Link2Off,
  'github': Github,
  
  // Achievement icons
  'target': Target,
  'sword': Sword,
  'coffee': Coffee,
  'heart-handshake': HeartHandshake,
  'hourglass': Hourglass,
  'check-check': CheckCheck,
  'medal': Medal,
  'award': Award,
  'globe': Globe,
  'crown': Crown,
  'sparkles': Sparkles,
};

// Component Icon chính
export const Icon: React.FC<IconProps> = ({ name, ...props }) => {
  const IconComponent = iconMap[name];
  
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found in icon library`);
    return null;
  }
  
  return <IconComponent {...props} />;
};

// Export các icon components cho khả năng tương thích ngược
export {
  // Navigation/Layout icons
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
  
  // Auth/User icons
  User,
  Lock,
  Eye,
  EyeOff,
  Shield,
  ShieldCheck,
  Mail,
  
  // Trading/Finance icons
  CreditCard,
  DollarSign,
  CircleDollarSign,
  Wallet,
  BarChart3,
  BarChart4,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  ArrowUp,
  ArrowDown,
  
  // Status icons
  CheckCircle2,
  CircleCheck,
  CircleX,
  CircleDot,
  CircleDashed,
  Check,
  Ban,
  AlertTriangle,
  AlertCircle,
  Hand,
  
  // UI/Action icons
  Save,
  Plus,
  Loader2,
  RefreshCw,
  Filter,
  FilterX,
  SlidersHorizontal,
  Bell,
  Calendar,
  CalendarDays,
  ChevronsUpDown,
  MoreHorizontal,
  
  // Theme icons
  Moon,
  Sun,
  Monitor,
  Palette,
  
  // Misc icons
  Brain,
  LineChart,
  Rocket,
  Smartphone,
  CloudOff,
  Badge,
  Lightbulb,
  Heart,
  Clock,
  TimerOff,
  Repeat,
  MoveRight,
  FileX,
  Newspaper,
  Link,
  Link2Off,
  Github,
  
  // Achievement icons
  Target,
  Sword,
  Coffee,
  HeartHandshake,
  Hourglass,
  CheckCheck,
  Medal,
  Award,
  Globe,
  Crown,
  Sparkles,
};

// Helper function để chuyển đổi iconName trong dữ liệu có sẵn sang IconName
export function getIconByName(iconName: string): React.FC<LucideProps> | null {
  // Mapping iconName định dạng PascalCase từ cơ sở dữ liệu sang kebab-case
  const pascalToKebabMapping: Record<string, IconName> = {
    'Target': 'target',
    'Trophy': 'trophy',
    'TrendingUp': 'trending-up',
    'Sword': 'sword',
    'Coffee': 'coffee',
    'Brain': 'brain',
    'HeartHandshake': 'heart-handshake',
    'Lightbulb': 'lightbulb',
    'LineChart': 'line-chart',
    'Hourglass': 'hourglass',
    'BookOpen': 'book-open',
    'CheckCheck': 'check-check',
    'CircleDollarSign': 'circle-dollar-sign',
    'Medal': 'medal',
    'Award': 'award',
    'Clock': 'clock',
    'Shield': 'shield',
    'BarChart3': 'bar-chart-3',
    'Calendar': 'calendar',
    'Globe': 'globe',
    'Sun': 'sun',
    'Crown': 'crown'
  };
  
  // Thử chuyển đổi định dạng PascalCase sang kebab-case
  const kebabName = pascalToKebabMapping[iconName];
  
  if (kebabName && iconMap[kebabName]) {
    return iconMap[kebabName];
  }
  
  // Thử trực tiếp nếu đã là kebab-case
  if (iconName in iconMap) {
    return iconMap[iconName as IconName];
  }
  
  console.warn(`Icon "${iconName}" not found in icon library`);
  return null;
}

export default Icon;