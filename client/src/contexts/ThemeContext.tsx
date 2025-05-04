import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';

// Define supported theme types
export type ThemeType = 'light' | 'dark' | 'system';

// Context interface
interface ThemeContextType {
  theme: ThemeType; // The current active theme
  setTheme: (theme: ThemeType) => void; // Apply and save theme permanently
  isDarkMode: boolean; // Whether dark mode is currently active
  isLoading: boolean; // Loading state
}

// Kiểm tra giá trị theme có hợp lệ hay không
const isValidTheme = (theme: any): theme is ThemeType => {
  return theme === 'light' || theme === 'dark' || theme === 'system';
};

// Create context with default values
const ThemeContext = createContext<ThemeContextType>({
  theme: 'system',
  setTheme: () => {},
  isDarkMode: false,
  isLoading: true,
});

// Hook to use ThemeContext
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Theme Provider Component
export function ThemeProvider({ children }: { children: ReactNode }) {
  // Hàm để lấy theme chính xác từ localStorage
  const getStoredTheme = (): ThemeType => {
    try {
      const storedTheme = localStorage.getItem('theme');
      // Nếu giá trị hợp lệ thì trả về, ngược lại dùng mặc định
      return isValidTheme(storedTheme) ? storedTheme : 'system';
    } catch (error) {
      console.error('Lỗi khi đọc theme từ localStorage:', error);
      return 'system';
    }
  };

  // Single source of truth for theme
  const [theme, setThemeState] = useState<ThemeType>(getStoredTheme());
  
  // Theo dõi trạng thái khởi tạo
  const [isLoading, setIsLoading] = useState(true);
  
  // Dark mode state 
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Ref để theo dõi trạng thái khởi tạo
  const initialized = useRef(false);

  // Apply dark mode class to document
  const applyDarkMode = (isDark: boolean) => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Initialize theme once on component mount
  useEffect(() => {
    if (initialized.current) return;

    const currentTheme = getStoredTheme();
    
    // Apply theme based on setting or system preference
    if (currentTheme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(prefersDark);
      applyDarkMode(prefersDark);
    } else {
      const isDark = currentTheme === 'dark';
      setIsDarkMode(isDark);
      applyDarkMode(isDark);
    }
    
    initialized.current = true;
    setIsLoading(false);
  }, []);

  // Apply the theme whenever it changes
  useEffect(() => {
    if (isLoading) return;
    
    // Save to localStorage first to ensure consistency
    localStorage.setItem('theme', theme);
    
    // Then apply the theme
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(prefersDark);
      applyDarkMode(prefersDark);
    } else {
      const isDark = theme === 'dark';
      setIsDarkMode(isDark);
      applyDarkMode(isDark);
    }
  }, [theme, isLoading]);

  // Listen for system theme changes when using 'system' theme
  useEffect(() => {
    if (isLoading) return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      if (theme === 'system') {
        setIsDarkMode(e.matches);
        applyDarkMode(e.matches);
      }
    };
    
    // Modern event listener approach for better browser compatibility
    try {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } catch (error) {
      // Fallback for older browsers
      // @ts-ignore - older browsers use addListener/removeListener
      mediaQuery.addListener(handleChange);
      return () => {
        // @ts-ignore
        mediaQuery.removeListener(handleChange);
      };
    }
  }, [theme, isLoading]);

  // Update theme - this is exposed to components
  const setTheme = (newTheme: ThemeType) => {
    if (!isValidTheme(newTheme)) {
      console.error('Giá trị theme không hợp lệ:', newTheme);
      return;
    }
    
    if (newTheme !== theme) {
      console.log('Đang áp dụng theme mới:', newTheme);
      setThemeState(newTheme);
    }
  };

  return (
    <ThemeContext.Provider value={{
      theme,
      setTheme,
      isDarkMode,
      isLoading
    }}>
      {children}
    </ThemeContext.Provider>
  );
};