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
              // Initialize checks for both rules and entry conditions
              const allChecks: StrategyConditionCheck[] = [];
              
              // Add rules checks
              if (found.rules && found.rules.length > 0) {
                found.rules.forEach(condition => {
                  allChecks.push({
                    conditionId: condition.id,
                    checked: false,
                    passed: false
                  });
                });
              }
              
              // Add entry conditions checks
              if (found.entryConditions && found.entryConditions.length > 0) {
                found.entryConditions.forEach(condition => {
                  allChecks.push({
                    conditionId: condition.id,
                    checked: false,
                    passed: false
                  });
                });
              }
              
              setStrategyChecks(allChecks);
            }
          } else {
            // No strategy selected yet, set default
            form.setValue('strategy', userStrategies[0].id);
            setSelectedStrategy(userStrategies[0]);
            
            // Initialize checks for both rules and entry conditions
            const allChecks: StrategyConditionCheck[] = [];
            
            // Add rules checks
            if (userStrategies[0].rules && userStrategies[0].rules.length > 0) {
              userStrategies[0].rules.forEach(condition => {
                allChecks.push({
                  conditionId: condition.id,
                  checked: false,
                  passed: false
                });
              });
            }
            
            // Add entry conditions checks
            if (userStrategies[0].entryConditions && userStrategies[0].entryConditions.length > 0) {
              userStrategies[0].entryConditions.forEach(condition => {
                allChecks.push({
                  conditionId: condition.id,
                  checked: false,
                  passed: false
                });
              });
            }
            
            setStrategyChecks(allChecks);
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
          
          // Initialize checks for both rules and entry conditions
          const allChecks: StrategyConditionCheck[] = [];
          
          // Add rules checks
          if (foundStrategy.rules && foundStrategy.rules.length > 0) {
            foundStrategy.rules.forEach((condition: StrategyCondition) => {
              allChecks.push({
                conditionId: condition.id,
                checked: false,
                passed: false
              });
            });
          }
          
          // Add entry conditions checks
          if (foundStrategy.entryConditions && foundStrategy.entryConditions.length > 0) {
            foundStrategy.entryConditions.forEach((condition: StrategyCondition) => {
              allChecks.push({
                conditionId: condition.id,
                checked: false,
                passed: false
              });
            });
          }
          
          if (allChecks.length > 0) {
            setStrategyChecks(allChecks);
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
    strategyChecks,
    handleStrategyCheckToggle
  };
}