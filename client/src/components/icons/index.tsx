/**
 * Hệ thống quản lý icon tập trung
 * Cập nhật: 08/05/2025
 * 
 * Hệ thống icon tập trung giúp:
 * 1. Dễ dàng tìm và sử dụng icon trong toàn bộ ứng dụng
 * 2. Đảm bảo tính nhất quán về giao diện
 * 3. Tối ưu hóa hiệu suất bằng cách tải icon theo nhu cầu
 * 4. Quản lý dễ dàng các icon từ nhiều nguồn khác nhau
 */

import * as LucideIcons from 'lucide-react';
import { SVGProps } from 'react';
import type { LucideIcon } from 'lucide-react';

export type IconProps = SVGProps<SVGSVGElement> & {
  size?: number | string;
  className?: string;
};

/**
 * Định nghĩa các nhóm icon theo chức năng
 */
export const Icons = {
  // Nhóm User Interface (giao diện người dùng)
  ui: {
    spinner: LucideIcons.Loader2,
    refresh: LucideIcons.RefreshCw,
    warning: LucideIcons.AlertTriangle,
    error: LucideIcons.AlertCircle,
    info: LucideIcons.Info,
    success: LucideIcons.CheckCircle2,
    close: LucideIcons.X,
    menu: LucideIcons.Menu,
    chevronRight: LucideIcons.ChevronRight,
    chevronLeft: LucideIcons.ChevronLeft,
    chevronDown: LucideIcons.ChevronDown,
    chevronUp: LucideIcons.ChevronUp,
    maximize: LucideIcons.Maximize2,
    zoomIn: LucideIcons.ZoomIn,
    zoomOut: LucideIcons.ZoomOut,
    upload: LucideIcons.UploadCloud,
    check: LucideIcons.Check,
    circle: LucideIcons.CircleDot,
    circleCheck: LucideIcons.CircleCheck,
    circleX: LucideIcons.CircleX,
    circleDashed: LucideIcons.CircleDashed,
    circleDot: LucideIcons.CircleDot,
    lock: LucideIcons.Lock,
    sun: LucideIcons.Sun,
    moon: LucideIcons.Moon,
    monitor: LucideIcons.Monitor,
    languages: LucideIcons.Languages,
    eye: LucideIcons.Eye,
    eyeOff: LucideIcons.EyeOff,
    calendar: LucideIcons.Calendar,
    calendarDays: LucideIcons.CalendarDays,
    save: LucideIcons.Save,
    mail: LucideIcons.Mail,
    github: LucideIcons.Github,
    user: LucideIcons.User,
    shieldCheck: LucideIcons.ShieldCheck,
    dollarSign: LucideIcons.DollarSign,
    logOut: LucideIcons.LogOut,
    link: LucideIcons.Link,
    linkOff: LucideIcons.Link2Off,
    palette: LucideIcons.Palette,
    barChart: LucideIcons.BarChart3,
    plus: LucideIcons.Plus,
    chevronsUpDown: LucideIcons.ChevronsUpDown,
    slidersHorizontal: LucideIcons.SlidersHorizontal,
    alertTriangle: LucideIcons.AlertTriangle,
    arrowUp: LucideIcons.ArrowUp,
    arrowDown: LucideIcons.ArrowDown,
  },

  // Nhóm Navigation (điều hướng) - cho sidebar và menu chính
  nav: {
    dashboard: LucideIcons.LayoutDashboard,
    newTrade: LucideIcons.TrendingUp,
    history: LucideIcons.History,
    analytics: LucideIcons.BarChart2,
    strategies: LucideIcons.BookOpen,
    achievements: LucideIcons.Trophy,
    settings: LucideIcons.Settings,
    logout: LucideIcons.LogOut,
  },

  // Nhóm Achievement (thành tựu) - các icon liên quan đến thành tựu
  achievement: {
    trophy: LucideIcons.Trophy,
    check: LucideIcons.Check,
    star: LucideIcons.Star,
    crown: LucideIcons.Crown,
    sword: LucideIcons.Sword,
    coffee: LucideIcons.Coffee,
    brain: LucideIcons.Brain,
    heartHandshake: LucideIcons.HeartHandshake,
    lightbulb: LucideIcons.Lightbulb,
    hourglass: LucideIcons.Hourglass,
    medal: LucideIcons.Medal,
    award: LucideIcons.Award,
    clock: LucideIcons.Clock,
    shield: LucideIcons.Shield,
    globe: LucideIcons.Globe,
    sun: LucideIcons.Sun,
  },

  // Nhóm PWA (Progressive Web App) - các icon liên quan đến PWA
  pwa: {
    smartphone: LucideIcons.Smartphone,
    wifi: LucideIcons.Wifi,
    wifiOff: LucideIcons.WifiOff,
    download: LucideIcons.Download,
    checkCircle: LucideIcons.CheckCircle2,
  },

  // Nhóm Trade (giao dịch) - các icon liên quan đến giao dịch
  trade: {
    entry: LucideIcons.ArrowDownRight,
    exit: LucideIcons.ArrowUpRight,
    profit: LucideIcons.TrendingUp,
    loss: LucideIcons.TrendingDown,
    bullish: LucideIcons.ArrowUp,
    bearish: LucideIcons.ArrowDown,
    price: LucideIcons.DollarSign,
  },

  // Các icon khác không thuộc nhóm cụ thể
  general: {
    calendar: LucideIcons.Calendar,
    edit: LucideIcons.Edit,
    delete: LucideIcons.Trash2,
    view: LucideIcons.Eye,
    filter: LucideIcons.Filter,
    sort: LucideIcons.ArrowUpDown,
    search: LucideIcons.Search,
    save: LucideIcons.Save,
    add: LucideIcons.Plus,
    camera: LucideIcons.Camera,
    image: LucideIcons.Image,
    clipboard: LucideIcons.Clipboard,
    hand: LucideIcons.Hand,
    target: LucideIcons.Target,
    lightbulb: LucideIcons.Lightbulb,
    heart: LucideIcons.Heart,
    clock: LucideIcons.Clock,
    newspaper: LucideIcons.Newspaper,
    timerOff: LucideIcons.TimerOff,
    repeat: LucideIcons.Repeat,
    moveRight: LucideIcons.MoveRight,
    fileX: LucideIcons.FileX,
  },
};

/**
 * Helper để lấy icon trực tiếp từ lucide-react
 * Chỉ sử dụng trong trường hợp bất đắc dĩ, ưu tiên sử dụng icon từ các nhóm đã định nghĩa
 */
export function getIcon(name: keyof typeof LucideIcons): LucideIcon {
  return LucideIcons[name];
}

/**
 * Hàm trợ giúp chuyển đổi tên icon thành component
 */
export function getIconByName(iconName: string): LucideIcon {
  // Danh sách icon mapping theo tên
  const iconMap: Record<string, LucideIcon> = {
    // Achievement icons
    "Target": Icons.general.target,
    "Trophy": Icons.achievement.trophy,
    "TrendingUp": Icons.trade.profit,
    "Sword": Icons.achievement.sword,
    "Coffee": Icons.achievement.coffee,
    "Brain": Icons.achievement.brain,
    "HeartHandshake": Icons.achievement.heartHandshake,
    "Lightbulb": Icons.achievement.lightbulb,
    "LineChart": Icons.nav.analytics,
    "Hourglass": Icons.achievement.hourglass,
    "BookOpen": Icons.nav.strategies,
    "CheckCheck": Icons.ui.check,
    "CircleDollarSign": Icons.trade.price,
    "Medal": Icons.achievement.medal,
    "Award": Icons.achievement.award,
    "Clock": Icons.achievement.clock,
    "Shield": Icons.achievement.shield,
    "BarChart3": Icons.nav.analytics,
    "Calendar": Icons.general.calendar,
    "Globe": Icons.achievement.globe,
    "Sun": Icons.achievement.sun,
    "Crown": Icons.achievement.crown
  };
  
  return iconMap[iconName] || Icons.achievement.trophy;
}

// Re-export các thành phần thường dùng để tiện sử dụng trực tiếp
export const Spinner = Icons.ui.spinner;
export const UIIcons = Icons.ui;
export const NavIcons = Icons.nav;
export const TradeIcons = Icons.trade;
export const GeneralIcons = Icons.general;
export const AchievementIcons = Icons.achievement;
export const PWAIcons = Icons.pwa;