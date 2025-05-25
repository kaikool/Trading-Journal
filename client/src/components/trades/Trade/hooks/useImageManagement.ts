import { useState, useCallback } from 'react';
import { uploadTradeImage } from '@/lib/api-service';
import { logError } from '@/lib/debug';
import { ImageState } from '../types';

interface UseImageManagementProps {
  userId: string;
  tradeId?: string;
  onSaveDraft?: (imageUrls: any) => void;
}

export function useImageManagement({
  userId,
  tradeId,
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

  // File size validation (max 5MB)
  const validateFileSize = (file: File): boolean => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return false;
    }
    return true;
  };

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

  // Handle image change for entry images
  const handleEntryImageChange = useCallback((index: 1 | 2) => async (e: React.ChangeEvent<HTMLInputElement>) => {
    
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }
    
    const file = e.target.files[0];
    const setImageState = index === 1 ? setEntryImage1 : setEntryImage2;
    
    // Reset previous state
    setImageState(prev => ({
      ...prev,
      file: null,
      preview: null,
      error: null,
      uploadProgress: 0,
      downloadUrl: null,
      uploadSuccess: false
    }));
    
    // Validate file size
    if (!validateFileSize(file)) {
      setImageState(prev => ({
        ...prev,
        error: "File size exceeds 5MB limit"
      }));
      return;
    }
    
    // Create a preview URL
    const previewUrl = URL.createObjectURL(file);
    
    // Update state with file and preview
    setImageState(prev => ({
      ...prev,
      file,
      preview: previewUrl,
      isUploading: true
    }));
    
    try {
      // Upload the image
      const imageTypeKey = index === 1 ? 'h4chart' : 'm15chart';
      const result = await uploadTradeImage(
        userId,
        tradeId || 'draft',
        file,
        imageTypeKey,
        (progress) => {
          setImageState(prev => ({
            ...prev,
            uploadProgress: progress
          }));
        }
      );
      
      if (result.success && result.imageUrl) {
        setImageState(prev => ({
          ...prev,
          downloadUrl: result.imageUrl,
          uploadSuccess: true,
          isUploading: false
        }));
        
        // Save draft with new image URLs
        saveImagesToDraft();
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      logError('Error uploading image:', error);
      setImageState(prev => ({
        ...prev,
        error: "Failed to upload image",
        isUploading: false
      }));
    }
  }, [userId, tradeId, saveImagesToDraft]);

  // Handle image change for exit images
  const handleExitImageChange = useCallback((index: 1 | 2) => async (e: React.ChangeEvent<HTMLInputElement>) => {
    
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }
    
    const file = e.target.files[0];
    const setImageState = index === 1 ? setExitImage1 : setExitImage2;
    
    // Reset previous state
    setImageState(prev => ({
      ...prev,
      file: null,
      preview: null,
      error: null,
      uploadProgress: 0,
      downloadUrl: null,
      uploadSuccess: false
    }));
    
    // Validate file size
    if (!validateFileSize(file)) {
      setImageState(prev => ({
        ...prev,
        error: "File size exceeds 5MB limit"
      }));
      return;
    }
    
    // Create a preview URL
    const previewUrl = URL.createObjectURL(file);
    
    // Update state with file and preview
    setImageState(prev => ({
      ...prev,
      file,
      preview: previewUrl,
      isUploading: true
    }));
    
    try {
      // Upload the image
      const imageTypeKey = index === 1 ? 'h4exit' : 'm15exit';
      const result = await uploadTradeImage(
        userId,
        tradeId || 'draft',
        file,
        imageTypeKey,
        (progress) => {
          setImageState(prev => ({
            ...prev,
            uploadProgress: progress
          }));
        }
      );
      
      if (result.success && result.imageUrl) {
        setImageState(prev => ({
          ...prev,
          downloadUrl: result.imageUrl,
          uploadSuccess: true,
          isUploading: false
        }));
        
        // Save draft with new image URLs
        saveImagesToDraft();
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      logError('Error uploading image:', error);
      setImageState(prev => ({
        ...prev,
        error: "Failed to upload image",
        isUploading: false
      }));
    }
  }, [userId, tradeId, saveImagesToDraft]);

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