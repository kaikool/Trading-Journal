import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { FormProvider } from "react-hook-form";
import { useTradeForm } from "@/components/trades/TradeFormNew/hooks";
import { debug } from "@/lib/debug";

// UI Components
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
  CardGradient,
  CardIcon
} from "@/components/ui/card";
import { Icons } from "@/components/icons/icons";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Trade Form Components
import {
  FormHeader,
  TradeDetails,
  TradeStrategy,
  TradePsychology,
  TradeImages,
  NotesSection,
  TabbedTradeForm,
} from "@/components/trades/TradeFormNew/components";
import { FormActions } from "@/components/trades/TradeFormNew/components/FormActions";

// Types
import { TradeFormProps } from "@/components/trades/TradeFormNew/types";

export default function TradePage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Get userId from Firebase auth
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

  // Setup trade form props for the custom hook
  const tradeFormProps: TradeFormProps = {
    mode: "new",
    userId,
    onSubmitting: setIsSubmitting,
    onSuccess: () => {
      toast({
        title: "Trade saved successfully",
        description: "Your trade has been recorded and added to your journal.",
      });
      setLocation("/trade/history");
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
  
  // Use the main custom hook that integrates all functionality
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
    
    // Image management
    entryImage1,
    entryImage2,
    exitImage1,
    exitImage2,
    handleEntryImageChange,
    handleExitImageChange,
    removeEntryImage,
    removeExitImage,
    
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
    isCalculatingLotSize,
    isCalculatingTakeProfit,
    canFetchPrice,
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
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="rounded-full bg-primary/10 p-5 mb-4">
                <Icons.ui.spinner className="h-8 w-8 animate-spin text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Saving trade...</h3>
              <p className="text-muted-foreground mt-2 max-w-md">
                Recording your trade details and processing uploaded images
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Log khi component được render
  debug("Rendering TradePage, draft status:", { hasDraft, showDraftNotice });

  return (
    <div className="px-0 sm:px-6 lg:px-8">
      {/* Header with consistent styling across app */}
      <div className="mb-4">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
          New Trade
        </h1>
        <p className="text-muted-foreground mt-0.5 text-sm sm:text-base">
          Record your trade details to track performance and gain insights
        </p>
      </div>

      <FormProvider {...form}>
        <form onSubmit={onSubmit} className="space-y-5 overflow-visible">
          {/* Draft notice */}
          {hasDraft && showDraftNotice && (
            <FormHeader 
              isEditMode={false}
              hasDraft={hasDraft}
              showDraftNotice={showDraftNotice}
              isDraftLoading={isDraftLoading}
              setShowDraftNotice={setShowDraftNotice}
              loadDraft={loadDraft}
              clearDraft={clearDraft}
            />
          )}

          {/* Main Trade Form Card with Tabbed Interface */}
          <Card className="relative mb-5 border-border/60">
            <CardGradient 
              variant="primary" 
              intensity="subtle" 
              direction="bottom-left" 
            />
            {/* Chỉ hiển thị indicator khi cần, không cần tiêu đề card */}
            {riskRewardRatio > 0 && (
              <div className="absolute top-3 right-3">
                <span className="text-xs text-primary font-medium bg-primary/10 px-2 py-1 rounded-md">
                  Ready for submission
                </span>
              </div>
            )}
            
            <CardContent className="p-5 overflow-visible">
              <TabbedTradeForm
                // Trade details props
                isCalculatingLotSize={isCalculatingLotSize}
                isCalculatingTakeProfit={isCalculatingTakeProfit}
                accountBalance={accountBalance}
                riskPercentage={riskPercentage}
                setRiskPercentage={setRiskPercentage}
                canFetchPrice={canFetchPrice}
                isEditMode={false}
                calculateOptimalLotSize={calculateOptimalLotSize}
                calculateOptimalTakeProfit={calculateOptimalTakeProfit}
                riskRewardRatio={riskRewardRatio}
                
                // Strategy props
                strategies={strategies}
                isLoadingStrategies={isLoadingStrategies}
                selectedStrategy={selectedStrategy}
                strategyChecks={strategyChecks}
                handleStrategyCheckToggle={handleStrategyCheckToggle}
                
                // Image props
                entryImage1={entryImage1}
                entryImage2={entryImage2}
                exitImage1={exitImage1}
                exitImage2={exitImage2}
                handleEntryImageChange={handleEntryImageChange}
                handleExitImageChange={handleExitImageChange}
                removeEntryImage={removeEntryImage}
                removeExitImage={removeExitImage}
              />
            </CardContent>
          </Card>

          {/* Form Actions */}
          <Card>
            <CardFooter className="px-6 py-4">
              <FormActions 
                isEditMode={false}
                isFormSubmitting={isFormSubmitting}
                hasDraft={hasDraft}
                onCancel={() => setLocation("/trade/history")}
                clearDraft={clearDraft}
              />
            </CardFooter>
          </Card>
        </form>
      </FormProvider>
    </div>
  );
}