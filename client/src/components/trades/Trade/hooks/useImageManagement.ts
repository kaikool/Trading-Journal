import { useState, useCallback } from 'react';
import { captureTradeImages } from '@/lib/capture';
import { logError } from '@/lib/debug';
import { ImageState } from '../types';

interface UseImageManagementProps {
  userId: string;
  tradeId?: string;
  pair: string;               // ✅ thêm để biết cặp cần capture (vd: "XAUUSD")
  onSaveDraft?: (imageUrls: any) => void;
}

export function useImageManagement({
  userId,
  tradeId,
  pair,
  onSaveDraft
}: UseImageManagementProps) {
  // Entry images
  const [entryImage1, setEntryImage1] = useState<ImageState>({
    file: null,
    preview: null,
    error: null,
    uploadProgress: 0,
    downloadUrl: null,
    uploadSuccess: false,
    isUploading: false
  });

  const [entryImage2, setEntryImage2] = useState<ImageState>({
    file: null,
    preview: null,
    error: null,
    uploadProgress: 0,
    downloadUrl: null,
    uploadSuccess: false,
    isUploading: false
  });

  // Exit images
  const [exitImage1, setExitImage1] = useState<ImageState>({
    file: null,
    preview: null,
    error: null,
    uploadProgress: 0,
    downloadUrl: null,
    uploadSuccess: false,
    isUploading: false
  });

  const [exitImage2, setExitImage2] = useState<ImageState>({
    file: null,
    preview: null,
    error: null,
    uploadProgress: 0,
    downloadUrl: null,
    uploadSuccess: false,
    isUploading: false
  });

  // Update image state from draft
  const updateImageStateFromDraft = useCallback((imageUrls: any) => {
    if (imageUrls.entryImage1) {
      setEntryImage1(prev => ({
        ...prev,
        preview: imageUrls.entryImage1,
        downloadUrl: imageUrls.entryImage1,
        uploadSuccess: true,
      }));
    }

    if (imageUrls.entryImage2) {
      setEntryImage2(prev => ({
        ...prev,
        preview: imageUrls.entryImage2,
        downloadUrl: imageUrls.entryImage2,
        uploadSuccess: true,
      }));
    }

    if (imageUrls.exitImage1) {
      setExitImage1(prev => ({
        ...prev,
        preview: imageUrls.exitImage1,
        downloadUrl: imageUrls.exitImage1,
        uploadSuccess: true,
      }));
    }

    if (imageUrls.exitImage2) {
      setExitImage2(prev => ({
        ...prev,
        preview: imageUrls.exitImage2,
        downloadUrl: imageUrls.exitImage2,
        uploadSuccess: true,
      }));
    }
  }, []);

  // Save current image states to draft
  const saveImagesToDraft = useCallback(() => {
    if (!onSaveDraft) return;

    const imageUrls = {
      entryImage1: entryImage1.downloadUrl,
      entryImage2: entryImage2.downloadUrl,
      exitImage1: exitImage1.downloadUrl,
      exitImage2: exitImage2.downloadUrl
    };

    onSaveDraft(imageUrls);
  }, [onSaveDraft, entryImage1.downloadUrl, entryImage2.downloadUrl, exitImage1.downloadUrl, exitImage2.downloadUrl]);

  /**
   * ✅ Thay cho upload thủ công:
   * Giữ nguyên API bề mặt (vẫn là handleEntryImageChange(index) => (e) => Promise).
   * Nhưng bỏ qua event & file input, thay bằng gọi API capture (H4 & M15) theo pair.
   * - entryImage1: H4
   * - entryImage2: M15
   */
  const handleEntryImageChange = useCallback((index: 1 | 2) => async (_e?: any) => {
    // set trạng thái "đang chụp" cho cả 2 slot entry
    setEntryImage1(prev => ({ ...prev, isUploading: true, uploadProgress: 10, error: null }));
    setEntryImage2(prev => ({ ...prev, isUploading: true, uploadProgress: 10, error: null }));

    try {
      const { entryH4, entryM15 } = await captureTradeImages(pair);

      if (entryH4) {
        setEntryImage1({
          file: null,
          preview: entryH4,
          downloadUrl: entryH4,
          error: null,
          uploadProgress: 100,
          uploadSuccess: true,
          isUploading: false
        });
      } else {
        setEntryImage1(prev => ({ ...prev, isUploading: false }));
      }

      if (entryM15) {
        setEntryImage2({
          file: null,
          preview: entryM15,
          downloadUrl: entryM15,
          error: null,
          uploadProgress: 100,
          uploadSuccess: true,
          isUploading: false
        });
      } else {
        setEntryImage2(prev => ({ ...prev, isUploading: false }));
      }

      saveImagesToDraft();
    } catch (error) {
      logError('Error capturing entry images:', error);
      setEntryImage1(prev => ({ ...prev, isUploading: false, error: "Capture failed" }));
      setEntryImage2(prev => ({ ...prev, isUploading: false, error: "Capture failed" }));
    }
  }, [pair, saveImagesToDraft]);

  /**
   * ✅ Tương tự cho exit — thay upload file bằng capture API (H4 & M15)
   * - exitImage1: H4
   * - exitImage2: M15
   */
  const handleExitImageChange = useCallback((index: 1 | 2) => async (_e?: any) => {
    setExitImage1(prev => ({ ...prev, isUploading: true, uploadProgress: 10, error: null }));
    setExitImage2(prev => ({ ...prev, isUploading: true, uploadProgress: 10, error: null }));

    try {
      const { entryH4, entryM15 } = await captureTradeImages(pair);

      if (entryH4) {
        setExitImage1({
          file: null,
          preview: entryH4,
          downloadUrl: entryH4,
          error: null,
          uploadProgress: 100,
          uploadSuccess: true,
          isUploading: false
        });
      } else {
        setExitImage1(prev => ({ ...prev, isUploading: false }));
      }

      if (entryM15) {
        setExitImage2({
          file: null,
          preview: entryM15,
          downloadUrl: entryM15,
          error: null,
          uploadProgress: 100,
          uploadSuccess: true,
          isUploading: false
        });
      } else {
        setExitImage2(prev => ({ ...prev, isUploading: false }));
      }

      saveImagesToDraft();
    } catch (error) {
      logError('Error capturing exit images:', error);
      setExitImage1(prev => ({ ...prev, isUploading: false, error: "Capture failed" }));
      setExitImage2(prev => ({ ...prev, isUploading: false, error: "Capture failed" }));
    }
  }, [pair, saveImagesToDraft]);

  // Handle removing images
  const removeEntryImage = useCallback((index: 1 | 2) => () => {
    const setImageState = index === 1 ? setEntryImage1 : setEntryImage2;

    setImageState({
      file: null,
      preview: null,
      error: null,
      uploadProgress: 0,
      downloadUrl: null,
      uploadSuccess: false,
      isUploading: false
    });

    // Update draft
    saveImagesToDraft();
  }, [saveImagesToDraft]);

  const removeExitImage = useCallback((index: 1 | 2) => () => {
    const setImageState = index === 1 ? setExitImage1 : setExitImage2;

    setImageState({
      file: null,
      preview: null,
      error: null,
      uploadProgress: 0,
      downloadUrl: null,
      uploadSuccess: false,
      isUploading: false
    });

    // Update draft
    saveImagesToDraft();
  }, [saveImagesToDraft]);

  return {
    entryImage1,
    entryImage2,
    exitImage1,
    exitImage2,
    // Giữ nguyên tên API cũ để không vỡ chỗ gọi:
    handleEntryImageChange,
    handleExitImageChange,
    removeEntryImage,
    removeExitImage,
    updateImageStateFromDraft,
    getAllImageUrls: () => ({
      entryImage1: entryImage1.downloadUrl,
      entryImage2: entryImage2.downloadUrl,
      exitImage1: exitImage1.downloadUrl,
      exitImage2: exitImage2.downloadUrl
    })
  };
}
