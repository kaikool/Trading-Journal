import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

// Định nghĩa kiểu dữ liệu cho context
interface DialogContextType {
  dialogOpen: boolean;
  openDialog: () => void;
  closeDialog: () => void;
  // Thời gian (ms) mà hệ thống sẽ không cuộn khi dialog đóng
  preventScrollAfterDialogClose: number;
  // Kiểm tra xem có nên ngăn chặn cuộn lên đầu sau khi dialog đóng không
  shouldPreventScrollAfterDialogClose: () => boolean;
}

// Tạo context với giá trị mặc định
const DialogContext = createContext<DialogContextType>({
  dialogOpen: false,
  openDialog: () => {},
  closeDialog: () => {},
  preventScrollAfterDialogClose: 1000,
  shouldPreventScrollAfterDialogClose: () => false,
});

// Custom hook để sử dụng context
export function useDialog() {
  return useContext(DialogContext);
}

// Provider component
export const DialogProvider = ({ children }: { children: ReactNode }) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [lastDialogCloseTime, setLastDialogCloseTime] = useState(0);
  const preventScrollAfterDialogClose = 500; // 500ms

  // Lắng nghe DOM để tự động phát hiện khi dialog được mở/đóng
  useEffect(() => {
    const detectDialogOpen = () => {
      const dialogElements = document.querySelectorAll('[role="dialog"]');
      if (dialogElements.length > 0 && !dialogOpen) {
        setDialogOpen(true);
      } else if (dialogElements.length === 0 && dialogOpen) {
        setDialogOpen(false);
        setLastDialogCloseTime(Date.now());
      }
    };

    // Thiết lập MutationObserver để theo dõi các thay đổi trong DOM
    const observer = new MutationObserver(detectDialogOpen);
    
    // Theo dõi toàn bộ cây DOM
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-state'], // Theo dõi thuộc tính data-state của Radix UI
    });

    // Kiểm tra ban đầu
    detectDialogOpen();

    // Cleanup khi unmount
    return () => {
      observer.disconnect();
    };
  }, [dialogOpen]);

  // Mở dialog
  const openDialog = () => {
    setDialogOpen(true);
  };

  // Đóng dialog
  const closeDialog = () => {
    setDialogOpen(false);
    setLastDialogCloseTime(Date.now());
  };

  // Kiểm tra xem có nên ngăn chặn cuộn lên đầu sau khi dialog đóng không
  const shouldPreventScrollAfterDialogClose = () => {
    return Date.now() - lastDialogCloseTime < preventScrollAfterDialogClose;
  };

  // Giá trị của context
  const value: DialogContextType = {
    dialogOpen,
    openDialog,
    closeDialog,
    preventScrollAfterDialogClose,
    shouldPreventScrollAfterDialogClose,
  };

  return (
    <DialogContext.Provider value={value}>
      {children}
    </DialogContext.Provider>
  );
};