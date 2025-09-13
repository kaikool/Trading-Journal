import React, { useState } from 'react';
import { Icons } from '@/components/icons/icons';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

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
  imageType, // hiện chưa dùng, giữ để không vỡ API
  onImageDeleted,
  onReplaceClick,
  readOnly = false
}: TradeImageManagerProps) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  // Lấy tên file từ URL để hiển thị/log (không bắt buộc cho API delete)
  const getFilenameFromUrl = (url: string): string => {
    if (!url) return '';
    // Firebase Storage URL
    if (url.includes('firebasestorage.googleapis.com')) {
      try {
        const encodedPath = url.split('/o/')[1]?.split('?')[0];
        if (!encodedPath) return '';
        const decodedPath = decodeURIComponent(encodedPath);
        const parts = decodedPath.split('/');
        const lastPart = parts[parts.length - 1] || '';
        return lastPart || '';
      } catch {
        return url.split('/').pop()?.split('?')[0] || '';
      }
    }
    // test-uploads/...
    if (url.includes('test-uploads/')) {
      const parts = url.split('/');
      return parts[parts.length - 1] || '';
    }
    // local uploads
    if (url.startsWith('/uploads/')) {
      return url.split('/').pop() || '';
    }
    // fallback
    return url.split('/').pop() || '';
  };

  const handleDelete = async () => {
    if (!imageUrl || !userId || !tradeId) return;

    try {
      setIsDeleting(true);

      // Nếu là ảnh lưu local (/uploads/...), gọi API delete của server
      if (imageUrl.startsWith('/uploads/')) {
        const res = await fetch(`/api/uploads/delete?path=${encodeURIComponent(imageUrl)}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' }
        });

        if (!res.ok) {
          const txt = await res.text();
          throw new Error(txt || 'Xóa ảnh thất bại');
        }

        toast({
          title: 'Đã xóa ảnh',
          description: `Đã xóa: ${getFilenameFromUrl(imageUrl)}`,
          variant: 'default',
        });

        onImageDeleted();
        return;
      }

      // Nếu là URL ngoài (Firebase/HTTP khác), không xóa được từ client:
      // -> chỉ gỡ liên kết lưu trong DB/UI
      toast({
        title: 'Gỡ liên kết ảnh',
        description: 'Ảnh không thuộc lưu trữ nội bộ, đã gỡ liên kết khỏi giao dịch.',
        variant: 'default',
      });
      onImageDeleted();
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
            aria-label="Delete image"
          >
            <Icons.ui.close className="h-3.5 w-3.5" />
          </Button>

          <Button
            variant="secondary"
            size="icon"
            className="h-7 w-7 bg-blue-600/90 hover:bg-blue-700 shadow-md"
            onClick={onReplaceClick}
            aria-label="Replace image"
          >
            <Icons.ui.upload className="h-3.5 w-3.5" />
          </Button>
        </>
      )}
    </div>
  );
}
