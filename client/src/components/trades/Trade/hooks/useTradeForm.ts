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
import { logError, debug } from '@/lib/debug';
// Lưu ý: Đã có TradeUpdateService để thống nhất cập nhật UI
// addTrade và updateTrade đã tích hợp với TradeUpdateService trong file firebase.ts

export function useTradeForm(props: TradeFormProps) {
  const { userId, onSubmitting, onSuccess, onError } = props;
  const isEditMode = props.mode === "edit";
  const initialValues = isEditMode ? props.initialValues : undefined;
  const tradeId = isEditMode ? initialValues?.id : undefined;
  
  // Form submission states
  const [isFormSubmitting, setIsFormSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  
  // Tạo một tham chiếu không đồng bộ để tránh lỗi khởi tạo lồng nhau
  let imageManagementRef: ReturnType<typeof useImageManagement> | null = null;
  
  // Khởi tạo form với giá trị mặc định không phụ thuộc vào imageManagement
  const form = useForm<TradeFormValues>({
    resolver: zodResolver(tradeFormSchema),
    defaultValues: isEditMode && initialValues ? {
      pair: initialValues.pair || "",
      direction: initialValues.direction as "BUY" | "SELL",
      entryPrice: initialValues.entryPrice,
      stopLoss: initialValues.stopLoss,
      takeProfit: initialValues.takeProfit,
      lotSize: initialValues.lotSize,
      strategy: initialValues.strategy || "",
      techPattern: initialValues.techPattern || "",
      emotion: initialValues.emotion || "",
      followedPlan: initialValues.discipline?.followedPlan || false,
      enteredEarly: initialValues.discipline?.enteredEarly || false,
      revenge: initialValues.discipline?.revenge || false,
      overLeveraged: initialValues.discipline?.overLeveraged || false,
      movedStopLoss: initialValues.discipline?.movedStopLoss || false,
      marketCondition: initialValues.marketCondition || "",
      sessionType: initialValues.sessionType || "",
      hasNews: initialValues.hasNews || false,
      notes: initialValues.notes || "",
      isOpen: initialValues.isOpen, // Sử dụng giá trị thực từ giao dịch, không ghi đè mặc định
      exitPrice: initialValues.exitPrice || null,
      result: (initialValues.result as "TP" | "SL" | "BE" | "MANUAL" | undefined) || undefined, // Giữ nguyên kiểu dữ liệu để tương thích với zod schema
      closingNote: ""
    } : {
      pair: "XAUUSD",
      direction: "BUY",
      entryPrice: 0,
      stopLoss: 0,
      takeProfit: 0,
      lotSize: 0.01,
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
    }
  });
  
  // Setup custom hooks
  const imageManagement = useImageManagement({
    userId,
    tradeId: tradeId?.toString(),
    onSaveDraft: (imageUrls) => {
      draftManagement?.saveDraft(imageUrls);
    }
  });
  
  // Lưu tham chiếu sau khi khởi tạo
  imageManagementRef = imageManagement;
  
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
      
      // Get used conditions from strategy checklist
      const usedConditions = strategyManagement.getUsedConditions();
      
      // Prepare trade data - lọc bỏ giá trị undefined trước khi gửi lên Firebase
      // Copy dữ liệu form và loại bỏ các giá trị undefined
      const cleanData = Object.fromEntries(
        Object.entries(data).filter(([_, value]) => value !== undefined)
      );
      
      // Xử lý các trường đặc biệt để tránh lỗi undefined
      // Firebase không chấp nhận undefined, nhưng có thể xóa trường đó
      ['result', 'exitPrice', 'closingNote'].forEach(field => {
        if (cleanData[field] === undefined || cleanData[field] === null) {
          delete cleanData[field];
        }
      });
      
      const tradeData = {
        ...cleanData,
        entryImage: imageUrls.entryImage1 || null,
        exitImage: imageUrls.exitImage1 || null,
        entryImageM15: imageUrls.entryImage2 || null,
        exitImageM15: imageUrls.exitImage2 || null,
        // Include used conditions from strategy checklist
        usedRules: usedConditions.usedRules.length > 0 ? usedConditions.usedRules : null,
        usedEntryConditions: usedConditions.usedEntryConditions.length > 0 ? usedConditions.usedEntryConditions : null,
        usedExitConditions: usedConditions.usedExitConditions.length > 0 ? usedConditions.usedExitConditions : null,
        userId,
        updatedAt: serverTimestamp(),
        // Chỉ đặt createdAt và isOpen cho giao dịch mới
        ...(isEditMode 
          ? {} // Không ghi đè isOpen cho giao dịch đang edit
          : { 
              createdAt: serverTimestamp(),
              isOpen: true // Default to open trade chỉ khi tạo mới
            }
        )
      };
      
      let result;
      if (isEditMode && initialValues?.id) {
        // Update existing trade through TradeUpdateService
        debug(`[TradeForm] Updating trade ${initialValues.id} via centralized service`);
        // Vẫn sử dụng updateTrade nhưng lưu ý rằng updateTrade sẽ thông báo
        // cho tradeUpdateService (đã được triển khai trong firebase.ts)
        result = await updateTrade(userId, initialValues.id, tradeData);
      } else {
        // Create new trade through TradeUpdateService
        debug(`[TradeForm] Creating new trade via centralized service`);
        // Vẫn sử dụng addTrade nhưng lưu ý rằng addTrade sẽ thông báo
        // cho tradeUpdateService (đã được triển khai trong firebase.ts)
        result = await addTrade(userId, tradeData);
      }
      
      if (result.success) {
        setIsSuccess(true);
        
        // Clear draft if this was a new trade
        if (!isEditMode) {
          draftManagement.clearDraft();
        }
        
        onSuccess();
      } else {
        // Different error handling for failed operation
        throw new Error('Failed to save trade data');
      }
    } catch (error) {
      logError('Error submitting trade:', error);
      onError(error);
    } finally {
      setIsFormSubmitting(false);
      onSubmitting(false);
    }
  };
  
  // Khởi tạo hình ảnh nếu có trong trade
  useEffect(() => {
    // Chỉ thực hiện khi ở chế độ edit và có initialValues
    if (isEditMode && initialValues && imageManagement) {
      // Xử lý các ảnh nếu có
      if (initialValues.entryImage) {
        imageManagement.updateImageStateFromDraft({
          entryImage1: initialValues.entryImage
        });
      }
      
      if (initialValues.entryImageM15) {
        imageManagement.updateImageStateFromDraft({
          entryImage2: initialValues.entryImageM15
        });
      }
      
      if (initialValues.exitImage) {
        imageManagement.updateImageStateFromDraft({
          exitImage1: initialValues.exitImage
        });
      }
      
      if (initialValues.exitImageM15) {
        imageManagement.updateImageStateFromDraft({
          exitImage2: initialValues.exitImageM15
        });
      }
    }
  }, [isEditMode, initialValues, imageManagement]);
  
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
    isFormSubmitting,
    isEditMode,
    
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
    accountBalance: calculations.accountBalance,
    riskPercentage: calculations.riskPercentage,
    setRiskPercentage: calculations.setRiskPercentage,
    riskRewardRatio: calculations.riskRewardRatio,
    setRiskRewardRatio: calculations.setRiskRewardRatio,
    isCalculatingLotSize: calculations.isCalculatingLotSize,
    isCalculatingTakeProfit: calculations.isCalculatingTakeProfit,
    calculateOptimalLotSize: calculations.calculateOptimalLotSize,
    calculateOptimalTakeProfit: calculations.calculateOptimalTakeProfit,
    
    // Form submission
    onSubmit: form.handleSubmit(onSubmit)
  };
}