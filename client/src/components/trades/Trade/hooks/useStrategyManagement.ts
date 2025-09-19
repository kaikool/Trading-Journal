
import { useState, useEffect, useCallback } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { TradeFormValues } from '../types';
import { getStrategies } from '@/lib/firebase';
import { TradingStrategy, StrategyConditionCheck } from '@/types';
import { logError } from '@/lib/debug';

interface UseStrategyManagementProps {
  form: UseFormReturn<TradeFormValues>;
  userId: string;
}

export function useStrategyManagement({ form, userId }: UseStrategyManagementProps) {
  const [strategies, setStrategies] = useState<TradingStrategy[]>([]);
  const [isLoadingStrategies, setIsLoadingStrategies] = useState<boolean>(true);
  const [selectedStrategy, setSelectedStrategy] = useState<TradingStrategy | null>(null);
  const [strategyChecks, setStrategyChecks] = useState<StrategyConditionCheck[]>([]);

  const initializeStrategyChecks = useCallback((strategy: TradingStrategy | null, savedChecks: StrategyConditionCheck[] = []) => {
    if (!strategy) {
      setStrategyChecks([]);
      return;
    }
    const allConditions = [...(strategy.rules || []), ...(strategy.entryConditions || [])];
    
    const initialChecks = allConditions.map(condition => {
      const existingCheck = savedChecks.find(c => c.conditionId === condition.id);
      return {
        conditionId: condition.id,
        passed: existingCheck?.passed || false,
      };
    });
    setStrategyChecks(initialChecks);
  }, []);

  // Effect to load strategies and set the initial state. Runs only when userId is available.
  useEffect(() => {
    let isMounted = true;
    const loadInitialData = async () => {
      if (!userId) {
        setIsLoadingStrategies(false);
        return;
      }
      setIsLoadingStrategies(true);
      try {
        const userStrategies = await getStrategies(userId);
        if (!isMounted) return;

        setStrategies(userStrategies);

        const formValues = form.getValues();
        const currentStrategyId = formValues.strategy;
        const savedChecks = formValues.strategyChecks || [];

        let strategyToSet: TradingStrategy | null = null;
        if (currentStrategyId) {
          strategyToSet = userStrategies.find(s => s.id === currentStrategyId) || null;
        } else {
          strategyToSet = userStrategies.find(s => s.isDefault) || userStrategies[0] || null;
        }

        if (strategyToSet) {
          if (strategyToSet.id !== currentStrategyId) {
            form.setValue('strategy', strategyToSet.id, { shouldDirty: true });
          }
          setSelectedStrategy(strategyToSet);
          initializeStrategyChecks(strategyToSet, savedChecks);
        }

      } catch (error) {
        logError('Error loading strategies:', error);
      } finally {
        if (isMounted) {
          setIsLoadingStrategies(false);
        }
      }
    };

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, [userId, form, initializeStrategyChecks]); // Added form and initializeStrategyChecks to dependencies

  // Effect to handle changing the strategy via the form
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'strategy') {
        // If strategies are not loaded yet, do nothing.
        // This prevents a race condition where this watcher runs before the initial data is loaded.
        if (strategies.length === 0) {
          return;
        }

        const newStrategyId = value.strategy;
        const newStrategy = strategies.find(s => s.id === newStrategyId) || null;
        setSelectedStrategy(newStrategy);
        // When strategy changes, re-initialize checks without any saved state
        initializeStrategyChecks(newStrategy, []);
        form.setValue('strategyChecks', []); // Clear saved checks in form
      }
    });
    return () => subscription.unsubscribe();
  }, [form, strategies, initializeStrategyChecks]);

  const handleStrategyCheckToggle = useCallback((conditionId: string, isPassed: boolean) => {
    setStrategyChecks(prevChecks => {
      const newChecks = prevChecks.map(item => 
        item.conditionId === conditionId ? { ...item, passed: isPassed } : item
      );
      // Update the react-hook-form state for submission
      form.setValue('strategyChecks', newChecks.filter(c => c.passed));
      return newChecks;
    });
  }, [form]);
  
  // This function is needed for form submission
  const getUsedConditions = useCallback(() => {
    const currentStrategy = strategies.find(s => s.id === form.getValues().strategy);
    if (!currentStrategy) return { usedRules: [], usedEntryConditions: [] };
    return {
      usedRules: currentStrategy.rules || [],
      usedEntryConditions: currentStrategy.entryConditions || [],
    };
  }, [form, strategies]);
  
  return {
    strategies,
    isLoadingStrategies,
    selectedStrategy,
    strategyChecks,
    handleStrategyCheckToggle,
    getUsedConditions,
  };
}
