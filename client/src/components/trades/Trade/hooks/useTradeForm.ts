import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TradeFormValues, tradeFormSchema, TradeFormProps } from '../types';
import { useDraftManagement } from './useDraftManagement';
import { useStrategyManagement } from './useStrategyManagement';
import { useTradeCalculations } from './useTradeCalculations';
import { addTrade, updateTrade } from '@/lib/firebase';
import { serverTimestamp } from 'firebase/firestore';
import { logError, debug } from '@/lib/debug';

export function useTradeForm(props: TradeFormProps) {
  const { userId, onSubmitting, onSuccess, onError } = props;
  const isEditMode = props.mode === "edit";
  const initialValues = isEditMode ? props.initialValues : undefined;

  const [isFormSubmitting, setIsFormSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

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
      isOpen: initialValues.isOpen,
      exitPrice: initialValues.exitPrice || null,
      result: (initialValues.result as "TP" | "SL" | "BE" | "MANUAL" | undefined) || undefined,
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
      followedPlan: false,
      enteredEarly: false,
      revenge: false,
      overLeveraged: false,
      movedStopLoss: false,
      marketCondition: "",
      sessionType: "",
      hasNews: false,
      notes: "",
      isOpen: true,
      captureStatus: 'pending' // Kích hoạt chụp ảnh khi TẠO MỚI
    }
  });

  const draftManagement = useDraftManagement({
    form,
    userId,
    isEditMode,
    onImageStateUpdate: () => {} // No-op function as images are handled by backend
  });

  const strategyManagement = useStrategyManagement({
    form,
    userId,
    isEditMode
  });

  const calculations = useTradeCalculations({
    form,
    userId
  });

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!isEditMode && !isSuccess) {
        draftManagement.saveDraft({});
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [form, isEditMode, isSuccess, draftManagement]);

  const onSubmit = async (data: TradeFormValues) => {
    try {
      setIsFormSubmitting(true);
      onSubmitting(true);

      const usedConditions = strategyManagement.getUsedConditions();

      const cleanData = Object.fromEntries(
        Object.entries(data).filter(([_, value]) => value !== undefined)
      );

      ['result', 'exitPrice', 'closingNote'].forEach(field => {
        if (cleanData[field] === undefined || cleanData[field] === null) {
          delete cleanData[field];
        }
      });

      const isClosingTrade = isEditMode && initialValues?.isOpen && data.exitPrice;

      const tradeData = {
        ...cleanData,
        usedRules: usedConditions.usedRules?.length ? usedConditions.usedRules : null,
        usedEntryConditions: usedConditions.usedEntryConditions?.length ? usedConditions.usedEntryConditions : null,
        usedExitConditions: usedConditions.usedExitConditions?.length ? usedConditions.usedExitConditions : null,
        userId,
        updatedAt: serverTimestamp(),
        ...(isEditMode
          ? {
             ...(isClosingTrade && { captureStatus: 'pending' }) // Kích hoạt chụp ảnh khi ĐÓNG LỆNH
            }
          : {
              createdAt: serverTimestamp(),
              isOpen: true,
              captureStatus: 'pending' // Giữ nguyên cho trường hợp tạo mới
            }
        )
      };

      let result;
      if (isEditMode && initialValues?.id) {
        result = await updateTrade(userId, initialValues.id, tradeData);
      } else {
        result = await addTrade(userId, tradeData);
      }

      if (result.success) {
        setIsSuccess(true);

        if (!isEditMode) {
          draftManagement.clearDraft();
        }

        onSuccess();
      } else {
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

  return {
    form,
    isFormSubmitting,
    isEditMode,
    ...draftManagement,
    ...strategyManagement,
    accountBalance: calculations.accountBalance,
    riskPercentage: calculations.riskPercentage,
    setRiskPercentage: calculations.setRiskPercentage,
    riskRewardRatio: calculations.riskRewardRatio,
    setRiskRewardRatio: calculations.setRiskRewardRatio,
    isCalculatingLotSize: calculations.isCalculatingLotSize,
    isCalculatingTakeProfit: calculations.isCalculatingTakeProfit,
    calculateOptimalLotSize: calculations.calculateOptimalLotSize,
    calculateOptimalTakeProfit: calculations.calculateOptimalTakeProfit,
    onSubmit: form.handleSubmit(onSubmit)
  };
}
