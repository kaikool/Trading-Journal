import React, { useState } from 'react';
import { Icons } from '@/components/icons/icons';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { deleteTradeImage } from '@/lib/api-service';

interface TradeImageManagerProps {
  userId: string;
  tradeId: string;
  imageUrl: string | null;
  imageType: 'entryImage' | 'entryImageM15' | 'exitImage' | 'exitImageM15';
  onImageDeleted: () => void;
  onReplaceClick: () => void;
  readOnly?: boolean;
}

export function TradeImageManager({
  userId,
  tradeId,
  imageUrl,
  imageType,
  onImageDeleted,
  onReplaceClick,
  readOnly = false
}: TradeImageManagerProps) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  // Từ imageUrl, lấy tên file
  const getFilenameFromUrl = (url: string): string => {
    if (!url) return '';
    
    console.log('Getting filename from URL:', url);
    
    // Firebase Storage URL (https://firebasestorage.googleapis.com/...)
    if (url.includes('firebasestorage.googleapis.com')) {
      try {
        console.log('Extracting filename from Firebase URL:', url.substring(0, 80) + '...');
        
        // Extract filename from the Firebase URL
        // https://firebasestorage.googleapis.com/v0/b/trading-journal-b83e9.appspot.com/o/test-uploads%2FuserId_tradeId_filename.jpg?alt=media&token=...
        
        // 1. Decode the URL-encoded path between /o/ and ?alt=media
        const encodedPath = url.split('/o/')[1]?.split('?')[0];
        if (!encodedPath) {
          console.error('Invalid Firebase Storage URL format, cannot extract path');
          return '';
        }
        
        const decodedPath = decodeURIComponent(encodedPath);
        console.log('Decoded path:', decodedPath);
        
        // 2. Get the full filename with flat structure
        // Mới: test-uploads/userId_tradeId_filename.jpg
        if (decodedPath.includes('_')) {
          // Split by underscore to extract components from flat structure
          const parts = decodedPath.split('/');
          const lastPart = parts[parts.length - 1] || '';
          
          // Get the part after the second underscore (userId_tradeId_filename.jpg)
          const components = lastPart.split('_');
          if (components.length >= 3) {
            // Join all parts after the second underscore to handle filenames with underscores
            const filename = components.slice(2).join('_');
            console.log('Extracted filename from flat structure:', filename);
            return filename;
          }
          
          console.log('Flat structure detected but cant extract filename, using last part:', lastPart);
          return lastPart;
        }
        
        // Cũ: test-uploads/userId/tradeId/filename.jpg
        const filename = decodedPath.split('/').pop() || '';
        console.log('Extracted filename from nested structure:', filename);
        return filename;
      } catch (error) {
        console.error('Error parsing Firebase URL:', error);
        // Fallback to simpler method
        return url.split('/').pop()?.split('?')[0] || '';
      }
    }
    
    // Đường dẫn test-uploads direct (test-uploads/...)
    if (url.includes('test-uploads/')) {
      console.log('Extracting filename from test-uploads path:', url);
      
      // Check if using flat structure (test-uploads/userId_tradeId_filename.jpg)
      if (url.includes('_')) {
        const parts = url.split('/');
        const lastPart = parts[parts.length - 1] || '';
        
        // Try to extract the filename part (userId_tradeId_filename.jpg)
        const components = lastPart.split('_');
        if (components.length >= 3) {
          // Filename is everything after the second underscore
          const filename = components.slice(2).join('_');
          console.log('Extracted filename from flat structure (direct):', filename);
          return filename;
        }
        
        return lastPart;
      }
      
      // Fallback to simple path extraction
      const parts = url.split('/');
      return parts[parts.length - 1] || '';
    }
    
    // Đường dẫn local uploads (/uploads/...)
    if (url.startsWith('/uploads/')) {
      console.log('Extracting filename from local path:', url);
      return url.split('/').pop() || '';
    }
    
    // Fallback: lấy phần cuối cùng của URL
    console.log('Using fallback method to extract filename from:', url);
    return url.split('/').pop() || '';
  };

  // Xóa ảnh
  const handleDelete = async () => {
    if (!imageUrl || !userId || !tradeId) return;
    
    try {
      setIsDeleting(true);
      
      // Xử lý trường hợp ảnh từ Cloudinary (legacy không còn được hỗ trợ)
      if (imageUrl.includes('cloudinary.com')) {
        console.log(`Phát hiện URL Cloudinary (không còn hỗ trợ) cho trade ${tradeId}: ${imageUrl}`);
        
        toast({
          title: 'URL không được hỗ trợ',
          description: 'URL Cloudinary không còn được hỗ trợ. Vui lòng tải lên ảnh mới.',
          variant: 'destructive',
        });
        
        // Cho phép client xóa tham chiếu đến ảnh Cloudinary không còn hoạt động
        onImageDeleted();
        setIsDeleting(false);
        return;
      } else {
        // Xử lý trường hợp Firebase Storage hoặc local storage
        // Lấy filename từ URL
        const filename = getFilenameFromUrl(imageUrl);
        
        if (!filename) {
          throw new Error('Không thể xác định tên file');
        }
        
        console.log(`Deleting image: ${filename} for trade ${tradeId}`);
        
        // Gọi API để xóa
        const success = await deleteTradeImage(userId, tradeId, filename);
        
        if (success) {
          toast({
            title: 'Đã xóa ảnh',
            description: 'Ảnh đã được xóa thành công',
            variant: 'default',
          });
          
          // Thông báo cho component cha
          onImageDeleted();
        } else {
          throw new Error('Xóa ảnh thất bại');
        }
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      toast({
        title: 'Lỗi khi xóa ảnh',
        description: error instanceof Error ? error.message : 'Không thể xóa ảnh này',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Nếu không có URL hoặc đang ở chế độ chỉ đọc thì không hiển thị nút
  if (!imageUrl || readOnly) return null;

  return (
    <div className="absolute top-2 right-2 flex gap-1">
      {!readOnly && (
        <>
          <Button 
            variant="destructive" 
            size="icon" 
            className="h-7 w-7 bg-red-600/90 hover:bg-red-700 shadow-md" 
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Icons.ui.spinner className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Icons.ui.close className="h-3.5 w-3.5" />
            )}
          </Button>
          
          <Button 
            variant="secondary" 
            size="icon" 
            className="h-7 w-7 bg-blue-600/90 hover:bg-blue-700 shadow-md" 
            onClick={onReplaceClick}
          >
            <Icons.ui.upload className="h-3.5 w-3.5" />
          </Button>
        </>
      )}
    </div>
  );
}