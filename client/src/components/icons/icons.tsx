import * as LucideIcons from 'lucide-react';

// Định nghĩa các nhóm icon theo chức năng
export const Icons = {
  // Nhóm Analytics (phân tích dữ liệu)
  analytics: {
    barChart: LucideIcons.BarChart2,
    lineChart: LucideIcons.LineChart,
    pieChart: LucideIcons.PieChart,
    areaChart: LucideIcons.Activity,
    brain: LucideIcons.Brain,
    brainCircuit: LucideIcons.BrainCircuit,
    award: LucideIcons.Award,
    lightbulb: LucideIcons.Lightbulb,
    activity: LucideIcons.Activity,
    trending: LucideIcons.TrendingUp,
    trendingUp: LucideIcons.TrendingUp,
    trendingDown: LucideIcons.TrendingDown,
    dollar: LucideIcons.DollarSign,
    percent: LucideIcons.Percent,
    stats: LucideIcons.BarChart4,
    compare: LucideIcons.GitCompare,
    target: LucideIcons.Target,
    scale: LucideIcons.Scale,
    profit: LucideIcons.TrendingUp,
    chartLine: LucideIcons.LineChart
  },
  
  // Nhóm User Interface (giao diện người dùng)
  ui: {
    // Spinner đã được xóa functionality nhưng giữ lại tham chiếu để tránh lỗi
    spinner: LucideIcons.ChevronsUpDown, // Thay thế bằng icon khác không có ý nghĩa loading
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
    xCircle: LucideIcons.XCircle,
    circleDashed: LucideIcons.CircleDashed,
    arrowRightCircle: LucideIcons.ArrowRightCircle,
    arrowLeftCircle: LucideIcons.ArrowLeftCircle,
    moveVertical: LucideIcons.MoveVertical,
    tag: LucideIcons.Tag,
    scale: LucideIcons.Scale,
    shieldAlert: LucideIcons.ShieldAlert,
    chartBar: LucideIcons.BarChart3,
    banknote: LucideIcons.Banknote,
    circleDot: LucideIcons.CircleDot,
    lock: LucideIcons.Lock,
    unlock: LucideIcons.Unlock,
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
    minus: LucideIcons.Minus,
    chevronsUpDown: LucideIcons.ChevronsUpDown,
    slidersHorizontal: LucideIcons.SlidersHorizontal,
    alertTriangle: LucideIcons.AlertTriangle,
    arrowUp: LucideIcons.ArrowUp,
    arrowDown: LucideIcons.ArrowDown,
    externalLink: LucideIcons.ExternalLink,
    clipboardList: LucideIcons.ClipboardList,
    moreHorizontal: LucideIcons.MoreHorizontal,
    gripVertical: LucideIcons.GripVertical,
    panelLeft: LucideIcons.PanelLeft,
    alertCircle: LucideIcons.AlertCircle,
    simpleUpload: LucideIcons.Upload,
    ban: LucideIcons.Ban,
    percent: LucideIcons.Percent,
    zap: LucideIcons.Zap,
    ruler: LucideIcons.Ruler,
    // Added for StrategyConditionInput.tsx
    settings2: LucideIcons.Settings2,
    pencil: LucideIcons.Pencil,
    x: LucideIcons.X,
  },

  // Nhóm Navigation (điều hướng) - cho sidebar và menu chính
  nav: {
    dashboard: LucideIcons.LayoutDashboard,
    newTrade: LucideIcons.TrendingUp,
    history: LucideIcons.History,
    analytics: LucideIcons.BarChart2,
    strategies: LucideIcons.BookOpen,
    goals: LucideIcons.Target,
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
    medal: LucideIcons.Medal,
    award: LucideIcons.Award,
    target: LucideIcons.Target,
    brain: LucideIcons.Brain,
    shield: LucideIcons.Shield,
    clock: LucideIcons.Clock,
    globe: LucideIcons.Globe,
    sun: LucideIcons.Sun,
    coffee: LucideIcons.Coffee,
    book: LucideIcons.BookOpen,
    swords: LucideIcons.Swords,
    heartHandshake: LucideIcons.HeartHandshake,
    lightbulb: LucideIcons.Lightbulb,
    hourglass: LucideIcons.Hourglass,
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
    api: LucideIcons.Webhook,
    candlestick: LucideIcons.CandlestickChart,
    coins: LucideIcons.Coins,
    arrowUp: LucideIcons.ArrowUp,
    arrowDown: LucideIcons.ArrowDown,
    checklist: LucideIcons.BookOpenCheck,
    trash: LucideIcons.Trash2,
    arrowLeft: LucideIcons.ArrowLeft,
    bookCopy: LucideIcons.BookCopy,
    bookmark: LucideIcons.Bookmark,
    listChecks: LucideIcons.ListChecks,
    doorOpen: LucideIcons.DoorOpen,
    logOut: LucideIcons.LogOut,
    clock: LucideIcons.Clock,
    // Loader đã bị xóa
    // Thêm các icon mới cho TradeDetails
    currencyPair: LucideIcons.Banknote,
    direction: LucideIcons.MoveVertical,
    priceTag: LucideIcons.Tag,
    lotSize: LucideIcons.Scale,
    stopLoss: LucideIcons.ShieldAlert,
    takeProfit: LucideIcons.Target,
    arrowCircleRight: LucideIcons.ArrowRightCircle,
    arrowCircleLeft: LucideIcons.ArrowLeftCircle,
    riskReward: LucideIcons.ScaleIcon,
    pips: LucideIcons.Ruler,
  },

  // Các icon khác không thuộc nhóm cụ thể
  general: {
    calendar: LucideIcons.Calendar,
    edit: LucideIcons.Edit,
    delete: LucideIcons.Trash2,
    view: LucideIcons.Eye,
    filter: LucideIcons.Filter,
    filterX: LucideIcons.FilterX,
    sort: LucideIcons.ArrowUpDown,
    database: LucideIcons.Database,
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
    trash: LucideIcons.Trash2,
    download: LucideIcons.Download,
    info: LucideIcons.Info,
    dollarSign: LucideIcons.DollarSign
  },
};

// The icons were directly added to the UI, analytics, and general groups above

// Helper để lấy icon trực tiếp từ lucide-react
// Chỉ sử dụng trong trường hợp bất đắc dĩ, ưu tiên sử dụng icon từ các nhóm đã định nghĩa
export function getIcon(name: keyof typeof LucideIcons) {
  return LucideIcons[name];
}

// Re-export lại một số nhóm/icons thường dùng để tiện sử dụng trực tiếp
export const UIIcons = Icons.ui;
export const NavIcons = Icons.nav;
export const TradeIcons = Icons.trade;
export const AnalyticsIcons = Icons.analytics;

// Export default cho trường hợp import toàn bộ
export default Icons;