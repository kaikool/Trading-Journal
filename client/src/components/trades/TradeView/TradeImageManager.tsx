import React, { useState } from 'react';
import { Icons } from '@/components/icons/icons';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface TradeImageManagerProps {
  userId: string;
  tradeId: string;
  imageUrl: string | null;
  imageType: 'entryImage' | 'entryImageM15' | 'exitImage' | 'exitImageM15'; // giữ để không vỡ API cũ, nhưng không dùng
  onImageDeleted: () => void;
  readOnly?: boolean;
}

export function TradeImageManager({
  userId,
  tradeId,
  imageUrl,
  imageType, // hiện chưa dùng
  onImageDeleted,
  readOnly = false
}: TradeImageManagerProps) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  // Helper: lấy tên file chỉ để hiển thị/log
  const getFilenameFromUrl = (url: string): string => {
    if (!url) return '';
    try {
      if (url.includes('firebasestorage.googleapis.com')) {
        const encodedPath = url.split('/o/')[1]?.split('?')[0];
        const decodedPath = encodedPath ? decodeURIComponent(encodedPath) : '';
        return decodedPath.split('/').pop() || '';
      }
      if (url.includes('test-uploads/')) {
        return url.split('/').pop() || '';
      }
      if (url.startsWith('/uploads/')) {
        return url.split('/').pop() || '';
      }
      return url.split('/').pop() || '';
    } catch {
      return url.split('/').pop()?.split('?')[0] || '';
    }
  };

  const handleDelete = async () => {
    if (!imageUrl || !userId || !tradeId) return;

    try {
      setIsDeleting(true);

      // Chỉ xoá được ảnh lưu local (/uploads/...). URL ngoài chỉ gỡ liên kết trong DB/UI.
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
      } else {
        toast({
          title: 'Gỡ liên kết ảnh',
          description: 'Ảnh không thuộc lưu trữ nội bộ, đã gỡ liên kết khỏi giao dịch.',
          variant: 'default',
        });
      }

      // Thông báo cho parent xoá field ảnh trong Firestore/UI
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
      )}
    </div>
  );
}
