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

// Get valid theme from localStorage or fallback to system
const getStoredTheme = (): ThemeType => {
  const storedTheme = localStorage.getItem('theme');
  // Validate that the stored theme is one of our valid options
  if (storedTheme === 'light' || storedTheme === 'dark' || storedTheme === 'system') {
    return storedTheme;
  }
  return 'system'; // Default fallback
};

// Theme Provider Component
export function ThemeProvider({ children }: { children: ReactNode }) {
  // Single source of truth for theme
  const [theme, setThemeState] = useState<ThemeType>(getStoredTheme());
  
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

  // Initialize and apply theme on mount
  useEffect(() => {
    // Set initial isDarkMode based on the theme (either from localStorage or default)
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(prefersDark);
      applyDarkMode(prefersDark);
    } else {
      const isDark = theme === 'dark';
      setIsDarkMode(isDark);
      applyDarkMode(isDark);
    }
    
    setIsLoading(false);
  }, []);

  // Apply the current theme whenever it changes
  useEffect(() => {
    if (isLoading) return;
    
    // Apply the theme
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(prefersDark);
      applyDarkMode(prefersDark);
    } else {
      const isDark = theme === 'dark';
      setIsDarkMode(isDark);
      applyDarkMode(isDark);
    }
    
    // Always save to localStorage when theme changes (except during initial loading)
    localStorage.setItem('theme', theme);
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
  }, [theme]);

  // Update theme - this is exposed to components
  const setTheme = (newTheme: ThemeType) => {
    if (newTheme !== theme) {
      console.log('Theme changed to:', newTheme); // Debug log
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