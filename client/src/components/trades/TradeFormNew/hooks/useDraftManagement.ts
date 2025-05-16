import { useState, useRef, useCallback, useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { TradeFormValues, DRAFT_KEY_PREFIX, DRAFT_SAVE_DELAY } from '../types';
import { logError } from '@/lib/debug';

interface UseDraftManagementProps {
  form: UseFormReturn<TradeFormValues>;
  userId: string;
  isEditMode: boolean;
  onImageStateUpdate?: (imageUrls: any) => void;
}

interface ImageUrls {
  entryImage1?: string | null;
  entryImage2?: string | null;
  exitImage1?: string | null;
  exitImage2?: string | null;
}

export function useDraftManagement({
  form,
  userId,
  isEditMode,
  onImageStateUpdate
}: UseDraftManagementProps) {
  // State for draft management
  const [hasDraft, setHasDraft] = useState<boolean>(false);
  const [showDraftNotice, setShowDraftNotice] = useState<boolean>(false);
  const [isDraftLoading, setIsDraftLoading] = useState<boolean>(false);
  const [isDraftSaving, setIsDraftSaving] = useState<boolean>(false);
  const draftSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inactivityTimeoutRef = useRef<NodeJS.Timeout | null>(null);



  // Load draft from localStorage
  const loadDraftFromLocalStorage = useCallback((userId: string): { formData: any, imageUrls: any, timestamp: string } | null => {
    if (!userId) return null;
    
    try {
      const draftKey = `${DRAFT_KEY_PREFIX}${userId}`;
      const draftJson = localStorage.getItem(draftKey);
      
      if (!draftJson) return null;
      
      const draft = JSON.parse(draftJson);
      return draft;
    } catch (error) {
      logError('Error loading draft from localStorage:', error);
      return null;
    }
  }, []);
  
  // Clear draft from localStorage
  const clearDraftFromLocalStorage = useCallback((userId: string): boolean => {
    if (!userId) return false;
    
    try {
      const draftKey = `${DRAFT_KEY_PREFIX}${userId}`;
      localStorage.removeItem(draftKey);
      return true;
    } catch (error) {
      logError('Error clearing draft from localStorage:', error);
      return false;
    }
  }, []);
  
  // Function to save draft to localStorage with debouncing
  const saveDraftToLocalStorage = useCallback((userId: string, formData: any, imageUrls: any) => {
    // If editing an existing trade, don't save drafts
    if (isEditMode) return;
    
    // Clear any existing timeout
    if (draftSaveTimeoutRef.current) {
      clearTimeout(draftSaveTimeoutRef.current);
    }
    
    setIsDraftSaving(true);
    
    // Set a new timeout for saving
    draftSaveTimeoutRef.current = setTimeout(() => {
      try {
        const draftKey = `${DRAFT_KEY_PREFIX}${userId}`;
        const draftData = {
          formData,
          imageUrls,
          timestamp: new Date().toISOString()
        };
        
        localStorage.setItem(draftKey, JSON.stringify(draftData));
        setHasDraft(true);
      } catch (error) {
        logError('Error saving draft to localStorage:', error);
      } finally {
        setIsDraftSaving(false);
      }
    }, DRAFT_SAVE_DELAY);
  }, [isEditMode]);

  // Function to reset inactivity timer
  const resetInactivityTimer = useCallback(() => {
    // Clear old timer
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current);
    }
    
    // Only set timer if there's a draft
    if (!isEditMode && userId && hasDraft) {
      inactivityTimeoutRef.current = setTimeout(() => {
        // Clear draft after 5 minutes of inactivity
        clearDraftFromLocalStorage(userId);
        setHasDraft(false);
      }, 5 * 60 * 1000); // 5 minutes = 300,000ms
    }
  }, [isEditMode, userId, hasDraft, clearDraftFromLocalStorage]);

  // Set up user activity monitoring
  useEffect(() => {
    // Start counting time when there's a draft
    if (hasDraft) {
      resetInactivityTimer();
      
      // Set up event listeners to monitor activity
      const activityEvents = ['mousedown', 'keypress', 'scroll', 'touchstart'];
      
      const handleUserActivity = () => {
        resetInactivityTimer();
      };
      
      // Register event listeners
      activityEvents.forEach(event => {
        window.addEventListener(event, handleUserActivity);
      });
      
      // Clean up when unmounting
      return () => {
        activityEvents.forEach(event => {
          window.removeEventListener(event, handleUserActivity);
        });
        
        if (inactivityTimeoutRef.current) {
          clearTimeout(inactivityTimeoutRef.current);
        }
      };
    }
  }, [hasDraft, resetInactivityTimer]);

  // Automatically load draft when component mounts - no notification
  useEffect(() => {
    if (!isEditMode && userId) {
      const draft = loadDraftFromLocalStorage(userId);
      if (draft) {
        setHasDraft(true);
        // Automatically apply draft
        loadDraft();
      }
    }
  }, [isEditMode, userId]);  

  // Function to load and apply draft to form
  const loadDraft = useCallback(() => {
    if (!userId) return;
    
    setIsDraftLoading(true);
    try {
      const draft = loadDraftFromLocalStorage(userId);
      if (draft && draft.formData) {
        // Apply values from draft to form
        Object.keys(draft.formData).forEach(key => {
          if (key in draft.formData) {
            form.setValue(key as any, draft.formData[key]);
          }
        });
        
        // Apply image URLs if available and callback is provided
        if (draft.imageUrls && onImageStateUpdate) {
          onImageStateUpdate(draft.imageUrls);
        }
      }
    } catch (error) {
      logError('Error loading draft:', error);
    } finally {
      setIsDraftLoading(false);
    }
  }, [userId, loadDraftFromLocalStorage, form, onImageStateUpdate]);

  // Function to save current form data as draft
  const saveDraft = useCallback((imageUrls?: ImageUrls) => {
    if (!userId || isEditMode) return;
    
    const formData = form.getValues();
    saveDraftToLocalStorage(userId, formData, imageUrls);
  }, [userId, isEditMode, form, saveDraftToLocalStorage]);

  // Function to clear draft
  const clearDraft = useCallback(() => {
    if (!userId) return;
    
    if (clearDraftFromLocalStorage(userId)) {
      setHasDraft(false);
      setShowDraftNotice(false);
    }
  }, [userId, clearDraftFromLocalStorage]);

  return {
    hasDraft,
    showDraftNotice,
    isDraftLoading,
    setShowDraftNotice,
    loadDraft,
    saveDraft,
    clearDraft
  };
}