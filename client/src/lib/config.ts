/**
 * App constants and configuration
 * Centralized place for all hardcoded values in the application
 */

// Dashboard configuration
export const DASHBOARD_CONFIG = {
  // Default time range for dashboard charts and data
  DEFAULT_TIME_RANGE: "7days",
  // Time ranges available for selection
  TIME_RANGES: ["1day", "7days", "30days", "90days", "1year", "all"] as const,
  // Initial account balance (used when user has no initial balance set)
  DEFAULT_INITIAL_BALANCE: 10000,
  // Recent activity limit on dashboard
  RECENT_ACTIVITY_LIMIT: 5,
  // Default user greeting when no name is available
  DEFAULT_USER_NAME: "Trader",
  // Default currency symbol
  CURRENCY_SYMBOL: "$",
  // Default target risk/reward ratio
  DEFAULT_RISK_REWARD_RATIO: "1:3",
}

// Chart configuration
export const CHART_CONFIG = {
  // Default view for performance chart
  DEFAULT_VIEW: "daily" as const,
  // Days in a week (for filtering weekly data)
  DAYS_IN_WEEK: 7,
  // Approximate days in a month (for filtering monthly data)
  DAYS_IN_MONTH: 30,
  // Date format for chart
  DATE_FORMAT: "MMM d",
  // Font size for axis labels
  AXIS_FONT_SIZE: 11,
  // Width of Y-axis
  YAXIS_WIDTH: 55,
  // Opacity for axis
  AXIS_OPACITY: 0.7,
  // Minimum gap between X-axis ticks
  XAXIS_MIN_GAP: 15,
  // Animation duration for chart
  ANIMATION_DURATION: 1200,
  // Active dot radius
  ACTIVE_DOT_RADIUS: 5,
  // Stroke width
  STROKE_WIDTH: 2,
  // Chart standardization
  STANDARD_HEIGHT: "250px",
  STANDARD_MARGIN: { top: 5, right: 0, left: 0, bottom: 5 },
  STANDARD_PADDING: 5,
  // Chart colors
  COLORS: [
    "hsl(var(--primary))",
    "hsl(var(--chart-2, 215 100% 50%))",
    "hsl(var(--chart-3, 142 76% 36%))",
    "hsl(var(--chart-4, 349 89% 60%))",
    "hsl(var(--chart-5, 25 95% 53%))"
  ],
  // Gradient and fills
  GRADIENT_OPACITY: {
    start: 0.2,
    end: 0,
  },
  // Responsive breakpoints for charts
  RESPONSIVE: {
    xAxisAngle: {
      sm: -45,
      md: -30,
      lg: 0
    },
    barSize: {
      sm: 20,
      md: 25,
      lg: 30
    }
  },
  // Grid styling
  GRID: {
    stroke: "hsl(var(--muted-foreground)/10)",
    strokeDasharray: "3 3",
    opacity: 0.3,
  },
  // Empty state
  EMPTY_STATE: {
    message: "Chưa có dữ liệu",
    description: "Thêm dữ liệu để hiển thị biểu đồ này",
  }
}

// Cache configuration đã được di chuyển vào lib/queryClient.ts

// UI configuration
export const UI_CONFIG = {
  // Default number of skeleton items to show in loading state
  DEFAULT_SKELETON_COUNT: 3,
  // Default limit for trades table
  DEFAULT_TRADES_LIMIT: 5,
  // Currency symbol
  CURRENCY_SYMBOL: "$",
  // Number formatting
  NUMBER_FORMAT: {
    LOCALE: 'en-US',
    DECIMAL_PLACES: 2,
    CURRENCY_DECIMAL_PLACES: 2,
    PERCENTAGE_DECIMAL_PLACES: 1,
    PIPS_DECIMAL_PLACES: 1,
    PROFIT_LOSS_DECIMAL_PLACES: 2,
    RISK_REWARD_DECIMAL_PLACES: 2,
    // Specific formatting for price by currency pair
    PRICE_DECIMAL_PLACES: {
      DEFAULT: 5,      // Default for most forex pairs
      XAUUSD: 2,       // Gold
      USDJPY: 3,       // JPY pairs
      JPY_PAIRS: 3,    // Other JPY pairs
    },
  },
  // Text strings
  TEXT: {
    SEE_ALL: "See all",
    CURRENT_BALANCE: "Current Balance",
    INITIAL_DEPOSIT: "initial deposit",
    NO_ACTIVITY: "No recent activity",
    ACTIVITY_HINT: "Complete a trade to see activity here",
    NO_PERFORMANCE_DATA: "No performance data yet",
    PERFORMANCE_HINT: "Complete trades to see your balance evolution over time",
    ADD_FIRST_TRADE: "Add Your First Trade",
    CHART_FILTER_DAILY: "Daily",
    CHART_FILTER_WEEKLY: "Weekly",
    CHART_FILTER_MONTHLY: "Monthly",
    TIME_RANGE_1DAY: "Last 1 Day",
    TIME_RANGE_7DAYS: "Last 7 Days",
    TIME_RANGE_30DAYS: "Last 30 Days",
    TIME_RANGE_90DAYS: "Last 90 Days",
    TIME_RANGE_1YEAR: "This Year",
    TIME_RANGE_ALL: "All Time",
  },
}



// Color configuration
export const COLOR_CONFIG = {
  // Default color for stat cards
  DEFAULT_STAT_COLOR: "default" as const,
  // Available colors for stat cards
  AVAILABLE_COLORS: ["default", "gold", "teal", "primary"] as const,
  // Color mappings for various UI elements
  COLORS: {
    default: {
      icon: "text-primary bg-primary/10",
      progressBg: "bg-gradient-to-r from-primary/80 to-primary",
      gradientFrom: "from-primary/5",
      gradientTo: "to-primary/0",
    },
    gold: {
      icon: "text-amber-500 bg-amber-500/10",
      progressBg: "bg-gradient-to-r from-amber-400 to-amber-500",
      gradientFrom: "from-amber-500/5", 
      gradientTo: "to-amber-500/0",
    },
    teal: {
      icon: "text-teal-600 bg-teal-500/10",
      progressBg: "bg-gradient-to-r from-teal-500/80 to-teal-600",
      gradientFrom: "from-teal-500/5",
      gradientTo: "to-teal-500/0",
    },
    primary: {
      icon: "text-primary bg-primary/10",
      progressBg: "bg-gradient-to-r from-primary/80 to-primary",
      gradientFrom: "from-primary/5",
      gradientTo: "to-primary/0",
    },
  },
  // Chart colors - optimized for financial market
  CHART: {
    POSITIVE: "hsl(142, 72%, 45%)", // Matches --success CSS variable
    NEGATIVE: "hsl(0, 84%, 60%)",   // Matches --destructive CSS variable
    NEUTRAL: "hsl(218, 85%, 32%)",  // Matches theme.json primary color
  }
}