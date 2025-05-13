import { useState, useEffect, useCallback } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { TradeFormValues } from '../types';
import { DASHBOARD_CONFIG } from '@/lib/config';
import { getUserData } from '@/lib/firebase';
import { calculateCurrentBalance } from '@/lib/balance-calculation-rules';
import { 
  calculateLotSize, 
  calculateRiskRewardRatio, 
  calculatePips, 
  calculateProfit, 
  calculateTakeProfitPrice,
  formatPrice
} from '@/lib/forex-calculator';
import { isSymbolSupported } from '@/lib/market-price-service';

interface UseTradeCalculationsProps {
  form: UseFormReturn<TradeFormValues>;
  userId: string;
}

export function useTradeCalculations({ form, userId }: UseTradeCalculationsProps) {
  // Calculation states
  const [accountBalance, setAccountBalance] = useState<number>(DASHBOARD_CONFIG.DEFAULT_INITIAL_BALANCE);
  const [riskPercentage, setRiskPercentage] = useState<number>(1);
  const [riskRewardRatio, setRiskRewardRatio] = useState<number>(0);
  const [defaultRiskRewardRatio, setDefaultRiskRewardRatio] = useState<number>(1.5);
  const [isCalculatingLotSize, setIsCalculatingLotSize] = useState(false);
  const [isCalculatingTakeProfit, setIsCalculatingTakeProfit] = useState(false);
  const [isLoadingUserData, setIsLoadingUserData] = useState<boolean>(true);
  const [canFetchPrice, setCanFetchPrice] = useState<boolean>(false);
  
  // Load user data on component mount
  useEffect(() => {
    const loadUserData = async () => {
      if (!userId) return;
      
      setIsLoadingUserData(true);
      try {
        const userData = await getUserData(userId);
        if (userData) {
          // Set initial and current balance
          const initialBalance = userData.initialBalance || DASHBOARD_CONFIG.DEFAULT_INITIAL_BALANCE;
          setAccountBalance(userData.currentBalance || initialBalance);
          
          // If user has trades, calculate current balance
          if (userData.trades && userData.trades.length > 0) {
            const currentBalance = calculateCurrentBalance(initialBalance, userData.trades);
            setAccountBalance(currentBalance);
          }
          
          // Set risk and reward ratio defaults if available
          if (userData.settings) {
            if (userData.settings.defaultRiskPercentage) {
              setRiskPercentage(userData.settings.defaultRiskPercentage);
            }
            
            if (userData.settings.defaultRiskRewardRatio) {
              setDefaultRiskRewardRatio(userData.settings.defaultRiskRewardRatio);
            }
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setIsLoadingUserData(false);
      }
    };
    
    loadUserData();
  }, [userId]);
  
  // Calculate risk:reward ratio when relevant form fields change
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      // Only proceed if all required values are present
      if (
        name === 'entryPrice' || 
        name === 'stopLoss' || 
        name === 'takeProfit' || 
        name === 'direction'
      ) {
        const { entryPrice, stopLoss, takeProfit, direction } = form.getValues();
        
        if (entryPrice && stopLoss && takeProfit && direction) {
          const ratio = calculateRiskRewardRatio(entryPrice, stopLoss, takeProfit, direction);
          setRiskRewardRatio(ratio);
        }
      }
      
      // Check if price fetching is supported for the selected pair
      if (name === 'pair') {
        const pair = value.pair as string;
        if (pair) {
          const supported = isSymbolSupported(pair);
          setCanFetchPrice(supported);
        } else {
          setCanFetchPrice(false);
        }
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form]);
  
  // Calculate lot size based on risk percentage
  const calculateOptimalLotSize = useCallback(() => {
    setIsCalculatingLotSize(true);
    
    try {
      const { pair, entryPrice, stopLoss, direction } = form.getValues();
      
      if (!pair || !entryPrice || !stopLoss || !direction) {
        throw new Error('Please fill in pair, entry price, and stop loss before calculating lot size');
      }
      
      // Calculate lot size based on risk percentage
      const lotSize = calculateLotSize({
        symbol: pair,
        entryPrice,
        stopLossPrice: stopLoss,
        accountBalance,
        riskPercentage,
        direction
      });
      
      // Round to 2 decimal places
      const roundedLotSize = Math.round(lotSize * 100) / 100;
      
      // Set lot size in form
      form.setValue('lotSize', roundedLotSize);
    } catch (error) {
      console.error('Error calculating lot size:', error);
    } finally {
      setIsCalculatingLotSize(false);
    }
  }, [form, accountBalance, riskPercentage]);
  
  // Calculate take profit based on risk:reward ratio
  const calculateOptimalTakeProfit = useCallback(() => {
    setIsCalculatingTakeProfit(true);
    
    try {
      const { pair, entryPrice, stopLoss, direction } = form.getValues();
      
      if (!pair || !entryPrice || !stopLoss || !direction) {
        throw new Error('Please fill in pair, entry price, and stop loss before calculating take profit');
      }
      
      // Calculate take profit based on risk:reward ratio
      const takeProfitPrice = calculateTakeProfitPrice({
        entryPrice: Number(entryPrice),
        stopLossPrice: Number(stopLoss),
        direction: direction,
        riskRewardRatio: defaultRiskRewardRatio,
        symbol: pair
      });
      
      // Format the price to the appropriate number of decimal places
      const formattedPrice = formatPrice(takeProfitPrice, pair);
      
      // Set take profit in form
      form.setValue('takeProfit', formattedPrice);
    } catch (error) {
      console.error('Error calculating take profit:', error);
    } finally {
      setIsCalculatingTakeProfit(false);
    }
  }, [form, defaultRiskRewardRatio]);
  
  // Calculate pips for preview in closed trades
  const calculatePreviewPips = useCallback((): string => {
    const { pair, direction, entryPrice, exitPrice } = form.getValues();
    if (!pair || !direction || !entryPrice || !exitPrice) return "0";
    
    const directionTyped = direction;
    const pairTyped = pair;
    const entryPriceNum = entryPrice;
    const exitPriceNum = exitPrice;
    
    const pips = calculatePips(pairTyped, directionTyped, entryPriceNum, exitPriceNum);
    return pips.toFixed(1);
  }, [form]);
  
  // Calculate profit for preview in closed trades
  const calculatePreviewProfit = useCallback((): number => {
    const { pair, direction, entryPrice, exitPrice, lotSize } = form.getValues();
    if (!pair || !direction || !entryPrice || !exitPrice || !lotSize) return 0;
    
    const directionTyped = direction;
    const pairTyped = pair;
    const entryPriceNum = entryPrice;
    const exitPriceNum = exitPrice;
    const lotSizeNum = lotSize;
    
    const profit = calculateProfit({
      symbol: pairTyped,
      entryPrice: entryPriceNum,
      exitPrice: exitPriceNum,
      lotSize: lotSizeNum,
      direction: directionTyped
    });
    
    return profit;
  }, [form]);

  return {
    accountBalance,
    riskPercentage,
    setRiskPercentage,
    riskRewardRatio,
    defaultRiskRewardRatio,
    setDefaultRiskRewardRatio,
    isCalculatingLotSize,
    isCalculatingTakeProfit,
    isLoadingUserData,
    canFetchPrice,
    calculateOptimalLotSize,
    calculateOptimalTakeProfit,
    calculatePreviewPips,
    calculatePreviewProfit
  };
}