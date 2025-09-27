import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useCallback,
} from "react";

/** Các giá trị layout chia 2 phần:
 *  - Mobile drawer: isSidebarOpen / toggleSidebar / setSidebarOpen
 *  - Desktop collapse: sidebarCollapsed / setSidebarCollapsed / toggleSidebarCollapsed
 */
interface LayoutContextProps {
  // Mobile drawer
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (next: boolean) => void;

  // Desktop collapse (72px vs 256px)
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebarCollapsed: () => void;
}

const LayoutContext = createContext<LayoutContextProps | undefined>(undefined);

export const LayoutProvider = ({ children }: { children: ReactNode }) => {
  // Mobile drawer open/close
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  // Desktop collapsed (persist to localStorage)
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      const raw = window.localStorage.getItem("sidebar-collapsed");
      return raw === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem("sidebar-collapsed", String(sidebarCollapsed));
    } catch {
      // ignore
    }
  }, [sidebarCollapsed]);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  const toggleSidebarCollapsed = useCallback(() => {
    setSidebarCollapsed((prev) => !prev);
  }, []);

  return (
    <LayoutContext.Provider
      value={{
        isSidebarOpen,
        toggleSidebar,
        setSidebarOpen,

        sidebarCollapsed,
        setSidebarCollapsed,
        toggleSidebarCollapsed,
      }}
    >
      {children}
    </LayoutContext.Provider>
  );
};

export const useLayout = () => {
  const ctx = useContext(LayoutContext);
  if (!ctx) throw new Error("useLayout must be used within a LayoutProvider");
  return ctx;
};
