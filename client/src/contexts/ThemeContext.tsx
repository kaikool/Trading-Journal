import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

// Định nghĩa các loại theme được hỗ trợ
export type ThemeType = 'light' | 'dark' | 'system';

// Interface cho context
interface ThemeContextType {
  theme: ThemeType; 
  currentTheme: ThemeType; 
  setTheme: (theme: ThemeType) => void; 
  applyTheme: (theme?: ThemeType) => void; 
  isDarkMode: boolean; 
  isLoading: boolean; 
}

// Giá trị mặc định
const defaultContextValue: ThemeContextType = {
  theme: 'system',
  currentTheme: 'system',
  setTheme: () => {},
  applyTheme: () => {},
  isDarkMode: false,
  isLoading: true
};

// Tạo context
const ThemeContext = createContext<ThemeContextType>(defaultContextValue);

// Helper function để áp dụng dark mode vào document
const applyDarkModeToDOM = (isDark: boolean) => {
  if (isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
};

// Component Provider
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeType>('system');
  const [currentTheme, setCurrentTheme] = useState<ThemeType>('system');
  const [isLoading, setIsLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Cập nhật theme trong localStorage
  const setTheme = useCallback((newTheme: ThemeType) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
  }, []);

  // Áp dụng theme ngay lập tức
  const applyTheme = useCallback((newTheme?: ThemeType) => {
    const themeToApply = newTheme || theme;
    setCurrentTheme(themeToApply);
    localStorage.setItem('currentTheme', themeToApply);
    
    if (themeToApply === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(prefersDark);
      applyDarkModeToDOM(prefersDark);
    } else {
      const isDark = themeToApply === 'dark';
      setIsDarkMode(isDark);
      applyDarkModeToDOM(isDark);
    }
  }, [theme]);

  // Khởi tạo theme từ localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as ThemeType | null;
    const savedCurrentTheme = localStorage.getItem('currentTheme') as ThemeType | null;
    
    if (savedTheme) {
      setThemeState(savedTheme);
    }
    
    if (savedCurrentTheme) {
      setCurrentTheme(savedCurrentTheme);
    } else if (savedTheme) {
      setCurrentTheme(savedTheme);
    }
    
    setIsLoading(false);
  }, []);

  // Theo dõi thay đổi chế độ hệ thống
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      if (currentTheme === 'system') {
        setIsDarkMode(e.matches);
        applyDarkModeToDOM(e.matches);
      }
    };
    
    // Kiểm tra ngay lập tức
    if (currentTheme === 'system') {
      setIsDarkMode(mediaQuery.matches);
      applyDarkModeToDOM(mediaQuery.matches);
    }
    
    // Đăng ký event listener
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [currentTheme]);

  // Theo dõi thay đổi của currentTheme
  useEffect(() => {
    if (isLoading) return;
    
    if (currentTheme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(prefersDark);
      applyDarkModeToDOM(prefersDark);
    } else {
      const isDark = currentTheme === 'dark';
      setIsDarkMode(isDark);
      applyDarkModeToDOM(isDark);
    }
  }, [currentTheme, isLoading]);

  // Memoize context value 
  const contextValue = {
    theme,
    currentTheme,
    setTheme,
    applyTheme,
    isDarkMode,
    isLoading
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

// Hook để sử dụng ThemeContext
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}