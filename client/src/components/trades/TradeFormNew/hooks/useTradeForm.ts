import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TradeFormValues, tradeFormSchema, TradeFormProps } from '../types';
import { useDraftManagement } from './useDraftManagement';
import { useImageManagement } from './useImageManagement';
import { useStrategyManagement } from './useStrategyManagement';
import { useTradeCalculations } from './useTradeCalculations';
import { addTrade, updateTrade } from '@/lib/firebase';
import { serverTimestamp } from 'firebase/firestore';
import { debug, logError } from '@/lib/debug';
import { format } from "date-fns";

export function useTradeForm(props: TradeFormProps) {
  const { userId, onSubmitting, onSuccess, onError } = props;
  const isEditMode = props.mode === "edit";
  const initialValues = isEditMode ? props.initialValues : undefined;
  const tradeId = isEditMode ? initialValues?.id : undefined;
  
  // Form submission states
  const [isFormSubmitting, setIsFormSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  
  // Initialize the form with default values
  const form = useForm<TradeFormValues>({
    resolver: zodResolver(tradeFormSchema),
    defaultValues: getDefaultValues()
  });
  
  // Setup custom hooks
  const imageManagement = useImageManagement({
    userId,
    tradeId: tradeId?.toString(),
    onSaveDraft: (imageUrls) => {
      draftManagement.saveDraft(imageUrls);
    }
  });
  
  const draftManagement = useDraftManagement({
    form,
    userId,
    isEditMode,
    onImageStateUpdate: imageManagement.updateImageStateFromDraft
  });
  
  const strategyManagement = useStrategyManagement({
    form,
    userId
  });
  
  const calculations = useTradeCalculations({
    form,
    userId
  });
  
  // Set window beforeunload event to prevent accidental navigation
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Save draft before user leaves
      if (!isEditMode && !isSuccess) {
        const formData = form.getValues();
        const imageUrls = imageManagement.getAllImageUrls();
        draftManagement.saveDraft(imageUrls);
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [form, isEditMode, isSuccess, draftManagement, imageManagement]);
  
  // Handle form submission
  const onSubmit = async (data: TradeFormValues) => {
    try {
      setIsFormSubmitting(true);
      onSubmitting(true);
      
      // Get image URLs
      const imageUrls = imageManagement.getAllImageUrls();
      
      // Prepare trade data
      const tradeData = {
        ...data,
        entryImage: imageUrls.entryImage1,
        exitImage: imageUrls.exitImage1,
        entryImage2: imageUrls.entryImage2,
        exitImage2: imageUrls.exitImage2,
        userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isOpen: true // Default to open trade
      };
      
      let result;
      if (isEditMode && initialValues?.id) {
        // Update existing trade
        result = await updateTrade(initialValues.id, tradeData);
      } else {
        // Create new trade
        result = await addTrade(tradeData);
      }
      
      if (result.success) {
        setIsSuccess(true);
        
        // Clear draft if this was a new trade
        if (!isEditMode) {
          draftManagement.clearDraft();
        }
        
        onSuccess();
      } else {
        throw new Error(result.error || 'Unknown error occurred');
      }
    } catch (error) {
      logError('Error submitting trade:', error);
      onError(error);
    } finally {
      setIsFormSubmitting(false);
      onSubmitting(false);
    }
  };
  
  // Helper function to get default values for the form
  function getDefaultValues(): Partial<TradeFormValues> {
    if (isEditMode && initialValues) {
      // Prepare existing trade values for edit
      const values: Partial<TradeFormValues> = {
        pair: initialValues.pair || "",
        direction: initialValues.direction as "BUY" | "SELL",
        entryPrice: initialValues.entryPrice,
        stopLoss: initialValues.stopLoss,
        takeProfit: initialValues.takeProfit,
        lotSize: initialValues.lotSize,
        entryDate: initialValues.entryDate 
          ? format(new Date(initialValues.entryDate), "yyyy-MM-dd")
          : format(new Date(), "yyyy-MM-dd"),
        strategy: initialValues.strategy || "",
        techPattern: initialValues.techPattern || "",
        emotion: initialValues.emotion || "",
        followedPlan: initialValues.followedPlan,
        enteredEarly: initialValues.enteredEarly,
        revenge: initialValues.revenge,
        overLeveraged: initialValues.overLeveraged || false,
        movedStopLoss: initialValues.movedStopLoss || false,
        marketCondition: initialValues.marketCondition || "",
        sessionType: initialValues.sessionType || "",
        hasNews: initialValues.hasNews || false,
        notes: initialValues.notes || "",
        isOpen: initialValues.status === "OPEN",
        exitPrice: initialValues.exitPrice || null,
        result: initialValues.result as any || undefined,
        closingNote: ""
      };
      
      // Initialize image previews if available
      if (initialValues.entryImage) {
        imageManagement.updateImageStateFromDraft({
          entryImage1: initialValues.entryImage
        });
      }
      
      if (initialValues.entryImage2) {
        imageManagement.updateImageStateFromDraft({
          entryImage2: initialValues.entryImage2
        });
      }
      
      if (initialValues.exitImage) {
        imageManagement.updateImageStateFromDraft({
          exitImage1: initialValues.exitImage
        });
      }
      
      if (initialValues.exitImage2) {
        imageManagement.updateImageStateFromDraft({
          exitImage2: initialValues.exitImage2
        });
      }
      
      return values;
    } else {
      // For new trades, provide sensible defaults
      return {
        pair: "EURUSD",
        direction: "BUY",
        entryPrice: 0,
        stopLoss: 0,
        takeProfit: 0,
        lotSize: 0.01,
        entryDate: format(new Date(), "yyyy-MM-dd"),
        strategy: "",
        techPattern: "",
        emotion: "",
        followedPlan: true,
        enteredEarly: false,
        revenge: false,
        overLeveraged: false,
        movedStopLoss: false,
        marketCondition: "",
        sessionType: "",
        hasNews: false,
        notes: "",
        isOpen: true
      };
    }
  }
  
  // Handle image changes for entry images
  const handleEntryImageChange = useCallback((index: 1 | 2) => {
    return imageManagement.handleEntryImageChange(index);
  }, [imageManagement]);
  
  // Handle image changes for exit images
  const handleExitImageChange = useCallback((index: 1 | 2) => {
    return imageManagement.handleExitImageChange(index);
  }, [imageManagement]);
  
  // Handle removing images
  const removeEntryImage = useCallback((index: 1 | 2) => {
    return imageManagement.removeEntryImage(index);
  }, [imageManagement]);
  
  const removeExitImage = useCallback((index: 1 | 2) => {
    return imageManagement.removeExitImage(index);
  }, [imageManagement]);
  
  return {
    form,
    isEditMode,
    isFormSubmitting,
    isSuccess,
    
    // Draft management
    ...draftManagement,
    
    // Image management
    entryImage1: imageManagement.entryImage1,
    entryImage2: imageManagement.entryImage2,
    exitImage1: imageManagement.exitImage1,
    exitImage2: imageManagement.exitImage2,
    handleEntryImageChange,
    handleExitImageChange,
    removeEntryImage,
    removeExitImage,
    
    // Strategy management
    ...strategyManagement,
    
    // Trade calculations
    ...calculations,
    
    // Form submission
    onSubmit: form.handleSubmit(onSubmit)
  };
}