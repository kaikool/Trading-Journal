import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define supported theme types
export type ThemeType = 'light' | 'dark' | 'system';

// Context interface
interface ThemeContextType {
  theme: ThemeType; // The current active theme
  setTheme: (theme: ThemeType) => void; // Apply and save theme permanently
  isDarkMode: boolean; // Whether dark mode is currently active
  isLoading: boolean; // Loading state
}

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
  // Single source of truth for theme
  const [theme, setThemeState] = useState<ThemeType>('system');
  
  // Loading state
  const [isLoading, setIsLoading] = useState(true);
  
  // Dark mode state
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Apply dark mode class to document
  const applyDarkMode = (isDark: boolean) => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Initialize theme from localStorage
  useEffect(() => {
    const loadedTheme = localStorage.getItem('theme') as ThemeType || 'system';
    setThemeState(loadedTheme);
    setIsLoading(false);
  }, []);

  // Apply the current theme whenever it changes
  useEffect(() => {
    if (isLoading) return;
    
    if (theme === 'system') {
      // Use system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(prefersDark);
      applyDarkMode(prefersDark);
    } else {
      // Use explicit theme
      const isDark = theme === 'dark';
      setIsDarkMode(isDark);
      applyDarkMode(isDark);
    }
  }, [theme, isLoading]);

  // Listen for system theme changes when using 'system' theme
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      if (theme === 'system') {
        setIsDarkMode(e.matches);
        applyDarkMode(e.matches);
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  // Update theme and save it permanently
  const setTheme = (newTheme: ThemeType) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
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