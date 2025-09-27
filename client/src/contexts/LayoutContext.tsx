
import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';

// Giao diện cho các thuộc tính của LayoutContext
interface LayoutContextProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  // Thêm các state khác liên quan đến layout nếu cần
}

// Tạo Context với giá trị mặc định
const LayoutContext = createContext<LayoutContextProps | undefined>(undefined);

// Provider component
export const LayoutProvider = ({ children }: { children: ReactNode }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  return (
    <LayoutContext.Provider value={{ 
      isSidebarOpen, 
      toggleSidebar, 
    }}>
      {children}
    </LayoutContext.Provider>
  );
};

// Custom hook để sử dụng LayoutContext
export const useLayout = () => {
  const context = useContext(LayoutContext);
  if (context === undefined) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
};
