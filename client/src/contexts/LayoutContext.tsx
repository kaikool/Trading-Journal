import { createContext, useContext, useState, useEffect, ReactNode } from "react";

// Layout constants
export const SIDEBAR_WIDTH = "16rem"; // 256px = 16rem
export const SIDEBAR_COLLAPSED_WIDTH = "4.5rem"; // 72px for collapsed state

// Layout context type
export interface LayoutContextType {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

// Create context with default values
export const LayoutContext = createContext<LayoutContextType>({
  sidebarCollapsed: false,
  setSidebarCollapsed: () => {}
});

// Custom hook for child components to use
export function useLayout() {
  return useContext(LayoutContext);
}

// Layout Provider component
export function LayoutProvider({ children }: { children: ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Read sidebar state from localStorage when component mounts
  useEffect(() => {
    const savedCollapsed = localStorage.getItem("sidebar-collapsed");
    if (savedCollapsed) {
      setSidebarCollapsed(savedCollapsed === "true");
    }
  }, []);

  return (
    <LayoutContext.Provider value={{ sidebarCollapsed, setSidebarCollapsed }}>
      {children}
    </LayoutContext.Provider>
  );
}