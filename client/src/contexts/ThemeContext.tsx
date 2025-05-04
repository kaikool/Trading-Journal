import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define supported theme types
export type ThemeType = 'light' | 'dark' | 'system';

// Context interface
interface ThemeContextType {
  theme: ThemeType; // Current theme selected in settings
  currentTheme: ThemeType; // Theme currently being applied
  setTheme: (theme: ThemeType) => void; // Update theme in settings (doesn't apply immediately)
  applyTheme: (theme?: ThemeType) => void; // Apply theme immediately
  isDarkMode: boolean; // Indicates if the current interface is in dark mode
  isLoading: boolean; // Theme loading state
}

// Create context with default values
const ThemeContext = createContext<ThemeContextType>({
  theme: 'system',
  currentTheme: 'system',
  setTheme: () => {},
  applyTheme: () => {},
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
  // Theme selected in settings (only changes when saved)
  const [theme, setTheme] = useState<ThemeType>('system');
  
  // Theme currently applied to the UI
  const [currentTheme, setCurrentTheme] = useState<ThemeType>('system');
  
  // Loading state
  const [isLoading, setIsLoading] = useState(true);
  
  // Dark mode state
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Monitor the system's selected theme
  useEffect(() => {
    // Initialize from localStorage
    const savedTheme = localStorage.getItem('theme') as ThemeType;
    const savedCurrentTheme = localStorage.getItem('currentTheme') as ThemeType;
    
    if (savedTheme) {
      setTheme(savedTheme);
    }
    
    if (savedCurrentTheme) {
      setCurrentTheme(savedCurrentTheme);
    } else if (savedTheme) {
      // If no currentTheme but theme exists, apply that theme
      setCurrentTheme(savedTheme);
    }
    
    setIsLoading(false);
    
    // Monitor system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      if (currentTheme === 'system') {
        setIsDarkMode(e.matches);
        applyDarkMode(e.matches);
      }
    };
    
    // Immediately check the system theme
    if (currentTheme === 'system') {
      setIsDarkMode(mediaQuery.matches);
      applyDarkMode(mediaQuery.matches);
    }
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Apply theme immediately
  const applyTheme = (newTheme?: ThemeType) => {
    const themeToApply = newTheme || theme;
    
    // Update both theme states when applying theme
    setCurrentTheme(themeToApply);
    setTheme(themeToApply); // Update theme state too so UI components reflect this
    
    // Save both theme values to localStorage
    localStorage.setItem('currentTheme', themeToApply);
    localStorage.setItem('theme', themeToApply);
    
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

  // Apply or remove dark mode on document
  const applyDarkMode = (isDark: boolean) => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Track changes to currentTheme
  useEffect(() => {
    if (isLoading) return;
    
    // Use closure at this point instead of state variable to avoid stale value
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

  // Change theme in settings (does not apply immediately)
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