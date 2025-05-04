import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define supported theme types
export type ThemeType = 'light' | 'dark' | 'system';

// Context interface - simplified for better consistency
interface ThemeContextType {
  theme: ThemeType; // The current theme setting
  setTheme: (theme: ThemeType) => void; // Update theme and apply it
  previewTheme: (theme: ThemeType) => void; // Preview a theme without saving to settings
  resetThemeToSaved: () => void; // Reset to last saved theme (for cancelling preview)
  isDarkMode: boolean; // Whether dark mode is active
  isLoading: boolean; // Loading state
}

// Create context with default values
const ThemeContext = createContext<ThemeContextType>({
  theme: 'system',
  setTheme: () => {},
  previewTheme: () => {},
  resetThemeToSaved: () => {},
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
  
  // Saved theme (last permanent setting)
  const [savedTheme, setSavedTheme] = useState<ThemeType>('system');
  
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
    setSavedTheme(loadedTheme);
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
    setSavedTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  // Preview a theme without saving permanently
  const previewTheme = (newTheme: ThemeType) => {
    setThemeState(newTheme);
  };

  // Reset to the last saved theme
  const resetThemeToSaved = () => {
    setThemeState(savedTheme);
  };

  return (
    <ThemeContext.Provider value={{
      theme,
      setTheme,
      previewTheme,
      resetThemeToSaved,
      isDarkMode,
      isLoading
    }}>
      {children}
    </ThemeContext.Provider>
  );
};