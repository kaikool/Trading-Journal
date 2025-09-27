import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { FormProvider } from "react-hook-form";
import { useTradeForm } from "@/components/trades/Trade/hooks";

// UI Components
import {
  Card,
  CardContent,
  CardGradient
} from "@/components/ui/card";
import { AppSkeleton, SkeletonLevel } from "@/components/ui/app-skeleton";

// Trade Form Components
import {
  FormHeader,
  TabbedTradeForm,
} from "@/components/trades/Trade/components";
import { FormActions } from "@/components/trades/Trade/components/FormActions";

// Types
import { TradeFormProps } from "@/components/trades/Trade/types";

export default function TradePage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [userId, setUserId] = useState<string | undefined>(auth.currentUser?.uid);
  
  useEffect(() => {
    if (auth.currentUser?.uid) {
      setUserId(auth.currentUser.uid);
    }
  }, []);

  if (!userId) {
    setLocation("/auth/login");
    return null;
  }

  const tradeFormProps: TradeFormProps = {
    mode: "new",
    userId,
    onSubmitting: setIsSubmitting,
    onSuccess: () => {
      toast({
        title: "Trade saved successfully",
        description: "Your trade has been recorded and added to your journal.",
      });
      setLocation("/history");
    },
    onError: (error: unknown) => {
      toast({
        variant: "destructive",
        title: "Failed to save trade",
        description: error instanceof Error ? error.message : "An error occurred",
      });
      setIsSubmitting(false);
    }
  };
  
  const {
    form,
    isFormSubmitting,
    
    // Draft management
    hasDraft,
    showDraftNotice,
    isDraftLoading,
    setShowDraftNotice,
    loadDraft,
    clearDraft,
    
    // Strategy management
    strategies,
    isLoadingStrategies,
    selectedStrategy,
    strategyChecks,
    handleStrategyCheckToggle,
    
    // Trade calculations
    accountBalance,
    riskPercentage,
    setRiskPercentage,
    riskRewardRatio,
    setRiskRewardRatio,
    isCalculatingLotSize,
    isCalculatingTakeProfit,
    calculateOptimalLotSize,
    calculateOptimalTakeProfit,
    
    // Form submission
    onSubmit
  } = useTradeForm(tradeFormProps);

  if (isSubmitting) {
    return (
      <div className="px-0 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="relative overflow-hidden">
            <CardGradient 
              variant="primary"
              intensity="subtle"
              direction="top-right"
            />
            <CardContent className="py-8">
              <AppSkeleton 
                level={SkeletonLevel.FORM}
                className="py-4"
                animation="pulse"
                title="Saving trade..."
                description="Recording your trade details. Images will be captured in the background."
              />
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    // NEW: Flexbox layout container
    <div className="flex flex-col h-full px-0 sm:px-6 lg:px-8">
      {/* --- 1. HEADER (non-scrollable) --- */}
      <div className="mb-4 flex-shrink-0">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
          New Trade
        </h1>
        <p className="text-muted-foreground mt-0.5 text-sm sm:text-base">
          Record your trade details to track performance and gain insights
        </p>
      </div>

      <FormProvider {...form}>
        {/* The form now acts as the primary layout manager for its children */}
        <form onSubmit={onSubmit} className="flex flex-col flex-grow min-h-0">
          
          {/* --- 2. SCROLLABLE CONTENT --- */}
          <div className="flex-grow overflow-y-auto pb-4">
            {hasDraft && showDraftNotice && (
              <div className="mb-5">
                <FormHeader 
                  isEditMode={false}
                  hasDraft={hasDraft}
                  showDraftNotice={showDraftNotice}
                  isDraftLoading={isDraftLoading}
                  setShowDraftNotice={setShowDraftNotice}
                  loadDraft={loadDraft}
                  clearDraft={clearDraft}
                />
              </div>
            )}

            <Card className="relative border-border/60">
              <CardGradient 
                variant="primary" 
                intensity="subtle" 
                direction="bottom-left" 
              />
              <CardContent className="p-5">
                <TabbedTradeForm
                  isCalculatingLotSize={isCalculatingLotSize}
                  isCalculatingTakeProfit={isCalculatingTakeProfit}
                  accountBalance={accountBalance}
                  riskPercentage={riskPercentage}
                  setRiskPercentage={setRiskPercentage}
                  calculateOptimalLotSize={calculateOptimalLotSize}
                  calculateOptimalTakeProfit={calculateOptimalTakeProfit}
                  riskRewardRatio={riskRewardRatio}
                  setRiskRewardRatio={setRiskRewardRatio}
                  strategies={strategies}
                  isLoadingStrategies={isLoadingStrategies}
                  selectedStrategy={selectedStrategy}
                  strategyChecks={strategyChecks}
                  handleStrategyCheckToggle={handleStrategyCheckToggle}
                />
              </CardContent>
            </Card>
          </div>

          {/* --- 3. FOOTER ACTIONS (non-scrollable) --- */}
          <div className="flex-shrink-0 pt-2 pb-4">
            <div className="bg-card rounded-lg border shadow-sm px-4 py-3">
              <FormActions 
                isEditMode={false}
                isFormSubmitting={isFormSubmitting}
                hasDraft={hasDraft}
                onCancel={() => setLocation("/history")}
                clearDraft={clearDraft}
              />
            </div>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}