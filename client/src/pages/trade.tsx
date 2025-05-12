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

// Trade Form Components
import {
  FormHeader,
  TradeDetails,
  TradeStrategy,
  TradePsychology,
  TradeImages,
  NotesSection,
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
        <form onSubmit={onSubmit} className="space-y-5">
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

          {/* Main Trade Form Card */}
          <Card className="relative mb-5 overflow-hidden">
            <CardGradient 
              variant="primary" 
              intensity="subtle" 
              direction="bottom-left" 
            />
            <CardHeader className="pb-2 lg:pb-4">
              <div className="flex items-center gap-2">
                <Icons.trade.candlestick className="h-6 w-6 text-primary" />
                <CardTitle>Trade Details</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <TradeDetails
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
              />
            </CardContent>
          </Card>

          {/* Strategy and Psychology Tabs */}
          <Card className="mb-5">
            <Tabs defaultValue="strategy" className="w-full">
              <CardHeader className="pb-0">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="strategy" className="data-[state=active]:bg-muted">
                    <Icons.ui.clipboardList className="h-4 w-4 mr-2" />
                    Strategy
                  </TabsTrigger>
                  <TabsTrigger value="psychology" className="data-[state=active]:bg-muted">
                    <Icons.analytics.brain className="h-4 w-4 mr-2" />
                    Psychology
                  </TabsTrigger>
                </TabsList>
              </CardHeader>
              
              <CardContent className="pt-4">
                <TabsContent value="strategy" className="mt-0">
                  <TradeStrategy 
                    strategies={strategies}
                    isLoadingStrategies={isLoadingStrategies}
                    selectedStrategy={selectedStrategy}
                    strategyChecks={strategyChecks}
                    handleStrategyCheckToggle={handleStrategyCheckToggle}
                  />
                </TabsContent>
                
                <TabsContent value="psychology" className="mt-0">
                  <TradePsychology />
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>

          {/* Notes Section */}
          <Card className="mb-5">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Icons.general.clipboard className="h-5 w-5 text-primary" />
                <CardTitle>Notes</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <NotesSection />
            </CardContent>
          </Card>

          {/* Chart Images */}
          <Card className="mb-5">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Icons.analytics.barChart className="h-5 w-5 text-primary" />
                <CardTitle>Chart Images</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <TradeImages 
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