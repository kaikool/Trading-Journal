import { useState, useEffect, useCallback } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { TradeFormValues } from '../types';
import { getStrategies } from '@/lib/firebase';
import { TradingStrategy, StrategyConditionCheck, StrategyCondition } from '@/types';
import { logError } from '@/lib/debug';

interface UseStrategyManagementProps {
  form: UseFormReturn<TradeFormValues>;
  userId: string;
}

export function useStrategyManagement({ form, userId }: UseStrategyManagementProps) {
  // Strategy states
  const [strategies, setStrategies] = useState<TradingStrategy[]>([]);
  const [isLoadingStrategies, setIsLoadingStrategies] = useState<boolean>(true);
  const [selectedStrategy, setSelectedStrategy] = useState<TradingStrategy | null>(null);
  const [strategyLoaded, setStrategyLoaded] = useState<boolean>(false);
  const [strategyChecks, setStrategyChecks] = useState<StrategyConditionCheck[]>([]);

  // Load strategies on component mount
  useEffect(() => {
    const loadStrategies = async () => {
      setIsLoadingStrategies(true);
      try {
        const userStrategies = await getStrategies(userId);
        setStrategies(userStrategies);
        
        // If we have strategies and a selected strategy in form, set it
        const currentStrategy = form.getValues().strategy;
        if (userStrategies.length > 0) {
          if (currentStrategy) {
            // Find the selected strategy from loaded strategies
            const found = userStrategies.find(s => s.id === currentStrategy);
            if (found) {
              setSelectedStrategy(found);
              if (found.rules && found.rules.length > 0) {
                setStrategyChecks(
                  found.rules.map(condition => ({
                    conditionId: condition.id,
                    checked: false,
                    passed: false
                  }))
                );
              }
            }
          } else {
            // No strategy selected yet, set default
            form.setValue('strategy', userStrategies[0].id);
            setSelectedStrategy(userStrategies[0]);
            if (userStrategies[0].rules && userStrategies[0].rules.length > 0) {
              setStrategyChecks(
                userStrategies[0].rules.map(condition => ({
                  conditionId: condition.id,
                  checked: false,
                  passed: false
                }))
              );
            }
          }
        }
        
        setStrategyLoaded(true);
      } catch (error) {
        logError('Error loading strategies:', error);
      } finally {
        setIsLoadingStrategies(false);
      }
    };
    
    if (userId) {
      loadStrategies();
    }
  }, [userId, form]);

  // Update selected strategy when strategy changes in form
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'strategy' && value.strategy && strategies.length > 0) {
        const strategyId = value.strategy;
        const foundStrategy = strategies.find(s => s.id === strategyId);
        
        if (foundStrategy) {
          setSelectedStrategy(foundStrategy);
          if (foundStrategy.rules && foundStrategy.rules.length > 0) {
            setStrategyChecks(
              foundStrategy.rules.map((condition: StrategyCondition) => ({
                conditionId: condition.id,
                checked: false,
                passed: false
              }))
            );
          } else {
            setStrategyChecks([]);
          }
        }
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form, strategies]);

  // Handle strategy checklist item toggle
  const handleStrategyCheckToggle = useCallback((id: string, checked: boolean) => {
    setStrategyChecks(prev => 
      prev.map(item => 
        item.conditionId === id ? { ...item, checked, passed: checked } : item
      )
    );
  }, []);

  return {
    strategies,
    isLoadingStrategies,
    selectedStrategy,
    strategyLoaded,
    strategyChecks,
    handleStrategyCheckToggle
  };
}