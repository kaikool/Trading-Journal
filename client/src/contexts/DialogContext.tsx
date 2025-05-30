import React, { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';

// Định nghĩa kiểu dữ liệu cho context
interface DialogContextType {
  dialogOpen: boolean;
  openDialog: () => void;
  closeDialog: () => void;
}

// Tạo context với giá trị mặc định
const DialogContext = createContext<DialogContextType>({
  dialogOpen: false,
  openDialog: () => {},
  closeDialog: () => {},
});

// Custom hook để sử dụng context
export function useDialog() {
  return useContext(DialogContext);
}

// Provider component
export const DialogProvider = ({ children }: { children: ReactNode }) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const dialogCountRef = useRef(0); // Đếm số lượng dialog đang mở

  // Lắng nghe DOM để tự động phát hiện khi dialog được mở/đóng
  useEffect(() => {
    const detectDialogOpen = () => {
      // Phát hiện dialog qua selector role="dialog"
      const dialogElements = document.querySelectorAll('[role="dialog"]');
      
      // Phát hiện dialog qua Radix data-state="open"
      const radixDialogElements = document.querySelectorAll('[data-state="open"][aria-modal="true"]');
      
      // Tổng số dialog đang mở
      const totalDialogCount = dialogElements.length + radixDialogElements.length;
      
      // Cập nhật trạng thái và đếm số lượng
      if (totalDialogCount > 0 && !dialogOpen) {
        dialogCountRef.current = totalDialogCount;
        setDialogOpen(true);
      } else if (totalDialogCount === 0 && dialogOpen) {
        dialogCountRef.current = 0;
        setDialogOpen(false);
      } else {
        // Chỉ cập nhật số lượng nếu có thay đổi
        if (dialogCountRef.current !== totalDialogCount) {
          dialogCountRef.current = totalDialogCount;
        }
      }
    };

    // Thiết lập MutationObserver để theo dõi các thay đổi trong DOM
    const observer = new MutationObserver(detectDialogOpen);
    
    // Theo dõi toàn bộ cây DOM
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-state', 'aria-modal', 'role'], // Theo dõi các thuộc tính liên quan đến dialog
    });

    // Thiết lập theo dõi sự kiện dialog khi dùng không phải Radix
    const handleDialogEvent = () => {
      // Đợi một tick để DOM cập nhật
      setTimeout(detectDialogOpen, 0);
    };
    
    // Lắng nghe các sự kiện dialog
    document.addEventListener('dialog:open', handleDialogEvent);
    document.addEventListener('dialog:close', handleDialogEvent);

    // Kiểm tra ban đầu
    detectDialogOpen();

    // Cleanup khi unmount
    return () => {
      observer.disconnect();
      document.removeEventListener('dialog:open', handleDialogEvent);
      document.removeEventListener('dialog:close', handleDialogEvent);
    };
  }, [dialogOpen]);

  // Mở dialog
  const openDialog = () => {
    setDialogOpen(true);
  };

  // Đóng dialog
  const closeDialog = () => {
    setDialogOpen(false);
  };

  // Giá trị của context
  const value: DialogContextType = {
    dialogOpen,
    openDialog,
    closeDialog,
  };

  return (
    <DialogContext.Provider value={value}>
      {children}
    </DialogContext.Provider>
  );
};