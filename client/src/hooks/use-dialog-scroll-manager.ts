import { useEffect, useRef, useState } from 'react';
import { useDialog } from '@/contexts/DialogContext';
import { useLocation } from 'wouter';

/**
 * Hook quản lý scroll position khi dialog đóng
 * 
 * Hook này xử lý hai tình huống:
 * 1. Khi một dialog mở, lưu vị trí scroll hiện tại
 * 2. Khi dialog đóng, khôi phục vị trí scroll đã lưu
 * 
 * Điều này ngăn chặn việc trang web tự động cuộn lên đầu trang khi dialog đóng
 */
export function useDialogScrollManager() {
  const { dialogOpen, shouldPreventScrollAfterDialogClose } = useDialog();
  const scrollPositionRef = useRef(0);
  const dialogTimestampRef = useRef(0);
  const [location] = useLocation();
  const locationRef = useRef(location);
  
  // Ghi nhớ location hiện tại để so sánh
  useEffect(() => {
    locationRef.current = location;
  }, [location]);
  
  // State để theo dõi dialog đã mở trước đó
  const [wasDialogOpen, setWasDialogOpen] = useState(false);
  
  // Lắng nghe sự kiện dialog:open
  useEffect(() => {
    const handleDialogOpen = () => {
      // Lưu vị trí scroll hiện tại và timestamp
      dialogTimestampRef.current = Date.now();
      scrollPositionRef.current = window.scrollY;
      console.log('[DEBUG] Saved scroll position:', scrollPositionRef.current);
    };
    
    // Lắng nghe sự kiện dialog:close
    const handleDialogClose = () => {
      const elapsedSinceDialogOpen = Date.now() - dialogTimestampRef.current;
      
      // Nếu dialog mở quá nhanh (<200ms) có thể là false positive, không xử lý
      if (elapsedSinceDialogOpen < 200) {
        console.log('[DEBUG] Dialog opened/closed too quickly, ignoring');
        return;
      }
      
      console.log('[DEBUG] Dialog closed, restoring to:', scrollPositionRef.current);
      
      // Sử dụng setTimeout với RAF để đảm bảo khôi phục scroll sau khi browser hoàn thành rendering
      const restoreScroll = () => {
        // Chỉ khôi phục khi route không thay đổi
        if (locationRef.current === location) {
          window.scrollTo(0, scrollPositionRef.current);
          
          // Sử dụng RAF và nhiều lớp timeout để đảm bảo vị trí scroll được duy trì liên tục
          const maintainPosition = () => {
            window.scrollTo(0, scrollPositionRef.current);
          };
          
          // Thiết lập một loạt các timeout để đảm bảo vị trí scroll không bị thay đổi
          setTimeout(() => requestAnimationFrame(maintainPosition), 50);
          setTimeout(() => requestAnimationFrame(maintainPosition), 150);
          setTimeout(() => requestAnimationFrame(maintainPosition), 300);
          setTimeout(() => requestAnimationFrame(maintainPosition), 600);
          setTimeout(() => requestAnimationFrame(maintainPosition), 1000);
        } else {
          console.log('[DEBUG] Route changed, not restoring scroll position');
        }
      };
      
      // Sử dụng RequestAnimationFrame để đảm bảo chạy sau khi render
      requestAnimationFrame(() => {
        restoreScroll();
      });
    };
    
    document.addEventListener('dialog:open', handleDialogOpen);
    document.addEventListener('dialog:close', handleDialogClose);
    
    return () => {
      document.removeEventListener('dialog:open', handleDialogOpen);
      document.removeEventListener('dialog:close', handleDialogClose);
    };
  }, [location]);
  
  // Theo dõi thay đổi dialogOpen state
  useEffect(() => {
    if (dialogOpen && !wasDialogOpen) {
      // Khi dialog vừa mở, lưu vị trí scroll hiện tại
      scrollPositionRef.current = window.scrollY;
      dialogTimestampRef.current = Date.now();
      console.log('[DEBUG] Dialog opened, saving position:', scrollPositionRef.current);
    } else if (!dialogOpen && wasDialogOpen) {
      // Khi dialog vừa đóng, xử lý khôi phục scroll
      const handleActualDialogClose = () => {
        // Chỉ khôi phục vị trí khi route không thay đổi
        if (locationRef.current === location) {
          console.log('[DEBUG] Dialog just closed, attempting to restore position:', scrollPositionRef.current);
          
          const restorePosition = () => {
            window.scrollTo(0, scrollPositionRef.current);
          };
          
          // Thực hiện khôi phục vị trí theo nhiều giai đoạn
          requestAnimationFrame(restorePosition);
          setTimeout(() => requestAnimationFrame(restorePosition), 100);
          setTimeout(() => requestAnimationFrame(restorePosition), 300);
        }
      };
      
      // Đặt timeout ngắn để đảm bảo browser đã hoàn thành các tác vụ khác
      setTimeout(handleActualDialogClose, 0);
    }
    
    // Cập nhật state wasDialogOpen
    setWasDialogOpen(dialogOpen);
  }, [dialogOpen, location, wasDialogOpen]);
  
  // Trả về noop function để hook có thể được sử dụng trong component
  return () => {};
}