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
  CurrencyPair,
  Direction,
  Currency
} from '@/lib/forex-calculator';


interface UseTradeCalculationsProps {
  form: UseFormReturn<TradeFormValues>;
  userId: string;
}

export function useTradeCalculations({ form, userId }: UseTradeCalculationsProps) {
  // Calculation states với giá trị mặc định theo user profile thông thường
  const [accountBalance, setAccountBalance] = useState<number>(DASHBOARD_CONFIG.DEFAULT_INITIAL_BALANCE);
  const [riskPercentage, setRiskPercentage] = useState<number>(0.5); // Mặc định là 0.5% theo chuẩn industry
  const [riskRewardRatio, setRiskRewardRatio] = useState<number>(2); // Mặc định là 1:2
  const [defaultRiskRewardRatio, setDefaultRiskRewardRatio] = useState<number>(2);
  const [isCalculatingLotSize, setIsCalculatingLotSize] = useState(false);
  const [isCalculatingTakeProfit, setIsCalculatingTakeProfit] = useState(false);
  const [isLoadingUserData, setIsLoadingUserData] = useState<boolean>(true);
  
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
            // Thiết lập Risk per Trade từ settings (nếu có)
            if (userData.settings.defaultRiskPerTrade) {
              setRiskPercentage(userData.settings.defaultRiskPerTrade);
            }
            
            // Thiết lập Risk:Reward ratio từ settings (nếu có)
            if (userData.settings.defaultRiskRewardRatio) {
              const defaultRR = userData.settings.defaultRiskRewardRatio;
              setDefaultRiskRewardRatio(defaultRR);
              setRiskRewardRatio(defaultRR);
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
  
  // Calculate risk:reward ratio and auto-calculate take profit when relevant form fields change
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      // Auto-calculate take profit when entry price or stop loss changes
      if (
        name === 'entryPrice' || 
        name === 'stopLoss' || 
        name === 'direction'
      ) {
        const { entryPrice, stopLoss, direction, pair } = form.getValues();
        
        // If entry price and stop loss are set, automatically calculate the take profit
        if (entryPrice && stopLoss && direction && pair) {
          try {
            // Get risk:reward ratio from settings
            const rr = defaultRiskRewardRatio || 1.5;
            
            // Calculate take profit based on risk:reward ratio
            const takeProfitPrice = calculateTakeProfitPrice({
              entryPrice: Number(entryPrice),
              stopLossPrice: Number(stopLoss),
              direction: direction as Direction,
              riskRewardRatio: rr,
              symbol: pair as CurrencyPair
            });
            
            // Set take profit in form directly without formatting
            // NumberInput component will handle the formatting
            form.setValue('takeProfit', takeProfitPrice);
            
            // Also update the risk:reward ratio display
            setRiskRewardRatio(rr);
          } catch (error) {
            console.error('Error auto-calculating take profit:', error);
          }
        }
      }
      
      // Update risk:reward ratio when take profit changes manually
      if (name === 'takeProfit') {
        const { entryPrice, stopLoss, takeProfit, direction } = form.getValues();
        
        if (entryPrice && stopLoss && takeProfit && direction) {
          try {
            const ratio = calculateRiskRewardRatio(
              Number(entryPrice), 
              Number(stopLoss), 
              Number(takeProfit), 
              direction as Direction
            );
            setRiskRewardRatio(ratio);
          } catch (error) {
            console.error('Error calculating risk reward ratio:', error);
            // Use default risk reward ratio from settings if calculation fails
            setRiskRewardRatio(defaultRiskRewardRatio);
          }
        }
      }
      

    });
    
    return () => subscription.unsubscribe();
  }, [form, defaultRiskRewardRatio]);
  
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
        pair: pair as CurrencyPair,
        entryPrice: Number(entryPrice),
        stopLoss: Number(stopLoss),
        accountBalance,
        riskPercentage,
        direction: direction as Direction,
        accountCurrency: "USD" as Currency
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
      
      // Get risk:reward ratio from settings (defaultRiskRewardRatio)
      // or use 1.5 as fallback if something goes wrong
      const rr = defaultRiskRewardRatio || 1.5;
      
      // Calculate take profit based on risk:reward ratio
      const takeProfitPrice = calculateTakeProfitPrice({
        entryPrice: Number(entryPrice),
        stopLossPrice: Number(stopLoss),
        direction: direction as Direction,
        riskRewardRatio: rr,
        symbol: pair as CurrencyPair
      });
      
      // Set take profit in form directly without formatting
      // NumberInput component will handle the formatting
      form.setValue('takeProfit', takeProfitPrice);
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
    
    const directionTyped = direction as Direction;
    const pairTyped = pair as CurrencyPair;
    const entryPriceNum = Number(entryPrice);
    const exitPriceNum = Number(exitPrice);
    
    const pips = calculatePips(pairTyped, directionTyped, entryPriceNum, exitPriceNum);
    return pips.toFixed(1);
  }, [form]);
  
  // Calculate profit for preview in closed trades
  const calculatePreviewProfit = useCallback((): number => {
    const { pair, direction, entryPrice, exitPrice, lotSize } = form.getValues();
    if (!pair || !direction || !entryPrice || !exitPrice || !lotSize) return 0;
    
    const directionTyped = direction as Direction;
    const pairTyped = pair as CurrencyPair;
    const entryPriceNum = Number(entryPrice);
    const exitPriceNum = Number(exitPrice);
    const lotSizeNum = Number(lotSize);
    
    const profit = calculateProfit({
      pair: pairTyped,
      entryPrice: entryPriceNum,
      exitPrice: exitPriceNum,
      lotSize: lotSizeNum,
      direction: directionTyped,
      accountCurrency: "USD" as Currency
    });
    
    return profit;
  }, [form]);

  return {
    accountBalance,
    riskPercentage,
    setRiskPercentage,
    riskRewardRatio,
    setRiskRewardRatio,
    isCalculatingLotSize,
    isCalculatingTakeProfit,
    calculateOptimalLotSize,
    calculateOptimalTakeProfit
  };
}