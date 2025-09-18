import { useState, useCallback } from 'react';
import { ImageState } from '../types';

interface UseImageManagementProps {
  // Props vẫn được giữ lại để không gây lỗi ở component cha
  userId?: string;
  tradeId?: string;
  pair?: string;
  onSaveDraft?: (imageUrls: any) => void;
}

// Trả về một hook rỗng, không có logic chụp ảnh
export function useImageManagement(props?: UseImageManagementProps) {
  const emptyImage: ImageState = { file: null, preview: null, error: null, uploadProgress: 0, downloadUrl: null, uploadSuccess: false, isUploading: false };

  const [entryImage1] = useState<ImageState>(emptyImage);
  const [entryImage2] = useState<ImageState>(emptyImage);
  const [exitImage1] = useState<ImageState>(emptyImage);
  const [exitImage2] = useState<ImageState>(emptyImage);

  const emptyFunc = useCallback(() => () => {}, []);
  const emptyFuncPromise = useCallback(() => async () => {}, []);
  const emptyUpdateFunc = useCallback(() => {}, []);

  return {
    entryImage1,
    entryImage2,
    exitImage1,
    exitImage2,
    handleEntryImageChange: emptyFuncPromise,
    handleExitImageChange: emptyFuncPromise,
    removeEntryImage: emptyFunc,
    removeExitImage: emptyFunc,
    updateImageStateFromDraft: emptyUpdateFunc,
    getAllImageUrls: () => ({
      entryImage1: null,
      entryImage2: null,
      exitImage1: null,
      exitImage2: null,
    }),
  };
}
