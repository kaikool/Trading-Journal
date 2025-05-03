import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Định nghĩa các loại theme được hỗ trợ
export type ThemeType = 'light' | 'dark' | 'system';

// Interface cho context
interface ThemeContextType {
  theme: ThemeType; // Theme hiện tại được chọn trong settings
  currentTheme: ThemeType; // Theme đang được áp dụng thực tế
  setTheme: (theme: ThemeType) => void; // Cập nhật theme trong settings (không áp dụng ngay)
  applyTheme: (theme?: ThemeType) => void; // Áp dụng theme ngay lập tức
  isDarkMode: boolean; // Cho biết giao diện hiện tại có đang hiển thị ở chế độ tối hay không
  isLoading: boolean; // Trạng thái đang tải theme
}

// Tạo context với giá trị mặc định
const ThemeContext = createContext<ThemeContextType>({
  theme: 'system',
  currentTheme: 'system',
  setTheme: () => {},
  applyTheme: () => {},
  isDarkMode: false,
  isLoading: true,
});

// Hook để sử dụng ThemeContext
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Component Provider
export function ThemeProvider({ children }: { children: ReactNode }) {
  // Theme đang được chọn trong settings (chỉ thay đổi khi lưu)
  const [theme, setTheme] = useState<ThemeType>('system');
  
  // Theme đang thực sự được áp dụng cho UI
  const [currentTheme, setCurrentTheme] = useState<ThemeType>('system');
  
  // Trạng thái loading
  const [isLoading, setIsLoading] = useState(true);
  
  // Bộ nhớ dark mode
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Theo dõi chế độ được chọn của hệ thống
  useEffect(() => {
    // Khởi tạo từ localStorage
    const savedTheme = localStorage.getItem('theme') as ThemeType;
    const savedCurrentTheme = localStorage.getItem('currentTheme') as ThemeType;
    
    if (savedTheme) {
      setTheme(savedTheme);
    }
    
    if (savedCurrentTheme) {
      setCurrentTheme(savedCurrentTheme);
    } else if (savedTheme) {
      // Nếu không có currentTheme nhưng có theme, áp dụng theme đó
      setCurrentTheme(savedTheme);
    }
    
    setIsLoading(false);
    
    // Theo dõi thay đổi chế độ hệ thống
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      if (currentTheme === 'system') {
        setIsDarkMode(e.matches);
        applyDarkMode(e.matches);
      }
    };
    
    // Kiểm tra ngay lập tức chế độ hệ thống
    if (currentTheme === 'system') {
      setIsDarkMode(mediaQuery.matches);
      applyDarkMode(mediaQuery.matches);
    }
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Áp dụng theme ngay lập tức
  const applyTheme = (newTheme?: ThemeType) => {
    const themeToApply = newTheme || theme;
    setCurrentTheme(themeToApply);
    localStorage.setItem('currentTheme', themeToApply);
    
    if (themeToApply === 'system') {
      const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(isDarkMode);
      applyDarkMode(isDarkMode);
    } else {
      const isDark = themeToApply === 'dark';
      setIsDarkMode(isDark);
      applyDarkMode(isDark);
    }
  };

  // Áp dụng hoặc loại bỏ dark mode trên document
  const applyDarkMode = (isDark: boolean) => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Theo dõi thay đổi của currentTheme
  useEffect(() => {
    if (isLoading) return;
    
    // Dùng closure tại thời điểm này thay vì biến state để tránh stale value
    const theme = currentTheme;
    
    if (theme === 'system') {
      const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(isDarkMode);
      applyDarkMode(isDarkMode);
    } else {
      const isDark = theme === 'dark';
      setIsDarkMode(isDark);
      applyDarkMode(isDark);
    }
  }, [currentTheme, isLoading]);

  // Thay đổi theme trong settings (không áp dụng ngay)
  const handleSetTheme = (newTheme: ThemeType) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  return (
    <ThemeContext.Provider value={{
      theme,
      currentTheme,
      setTheme: handleSetTheme,
      applyTheme,
      isDarkMode,
      isLoading
    }}>
      {children}
    </ThemeContext.Provider>
  );
};