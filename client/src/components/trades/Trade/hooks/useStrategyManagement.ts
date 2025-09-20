
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
  }, [userId, form, initializeStrategyChecks]);

  // Effect to handle changing the strategy via the form
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'strategy') {
        if (strategies.length === 0) {
          return;
        }

        const newStrategyId = value.strategy;
        const newStrategy = strategies.find(s => s.id === newStrategyId) || null;
        setSelectedStrategy(newStrategy);
        initializeStrategyChecks(newStrategy, []);
        form.setValue('strategyChecks', []);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, strategies, initializeStrategyChecks]);

  const handleStrategyCheckToggle = useCallback((conditionId: string, isPassed: boolean) => {
    setStrategyChecks(prevChecks => {
      const newChecks = prevChecks.map(item => 
        item.conditionId === conditionId ? { ...item, passed: isPassed } : item
      );
      form.setValue('strategyChecks', newChecks.filter(c => c.passed).map(c => ({ conditionId: c.conditionId, passed: c.passed })));
      return newChecks;
    });
  }, [form]);
  
  // This function is needed for form submission
  const getUsedConditions = useCallback(() => {
    const passedChecks = strategyChecks.filter(check => check.passed);
    const passedConditionIds = new Set(passedChecks.map(check => check.conditionId));

    if (!selectedStrategy) {
      return { usedRules: [], usedEntryConditions: [], usedExitConditions: [] };
    }

    const usedRules = (selectedStrategy.rules || [])
      .filter(rule => passedConditionIds.has(rule.id))
      .map(rule => rule.id);

    const usedEntryConditions = (selectedStrategy.entryConditions || [])
      .filter(condition => passedConditionIds.has(condition.id))
      .map(condition => condition.id);
      
    return {
      usedRules,
      usedEntryConditions,
      usedExitConditions: [] // Exit conditions are not handled in the form yet.
    };
  }, [strategyChecks, selectedStrategy]);
  
  return {
    strategies,
    isLoadingStrategies,
    selectedStrategy,
    strategyChecks,
    handleStrategyCheckToggle,
    getUsedConditions,
  };
}
