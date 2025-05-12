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

          {/* Main Trade Form Card - Enhanced Visual Design */}
          <Card className="relative mb-5 overflow-hidden border-border/60">
            <CardGradient 
              variant="primary" 
              intensity="subtle" 
              direction="bottom-left" 
            />
            <CardHeader className="pb-2 lg:pb-4 border-b border-border/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardIcon color="primary" variant="soft">
                    <Icons.trade.candlestick className="h-5 w-5" />
                  </CardIcon>
                  <CardTitle>Trade Details</CardTitle>
                </div>
                
                {/* Simple status indicator */}
                {riskRewardRatio > 0 && (
                  <span className="text-xs text-primary">
                    Ready for submission
                  </span>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="p-5">
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

          {/* Strategy and Psychology Tabs - Enhanced UI */}
          <Card className="mb-5 border-border/60">
            <Tabs defaultValue="strategy" className="w-full">
              <CardHeader className="pb-0 border-b border-border/20">
                <TabsList className="grid w-full grid-cols-2 p-0.5 bg-muted/20">
                  <TabsTrigger value="strategy" className="data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm">
                    <Icons.ui.clipboardList className="h-4 w-4 mr-2" />
                    Trading Strategy
                  </TabsTrigger>
                  <TabsTrigger value="psychology" className="data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm">
                    <Icons.analytics.brain className="h-4 w-4 mr-2" />
                    Trading Psychology
                  </TabsTrigger>
                </TabsList>
              </CardHeader>
              
              <CardContent className="pt-5 px-5">
                <TabsContent value="strategy" className="mt-0 animate-in fade-in-50 duration-300 ease-in-out">
                  <TradeStrategy 
                    strategies={strategies}
                    isLoadingStrategies={isLoadingStrategies}
                    selectedStrategy={selectedStrategy}
                    strategyChecks={strategyChecks}
                    handleStrategyCheckToggle={handleStrategyCheckToggle}
                  />
                </TabsContent>
                
                <TabsContent value="psychology" className="mt-0 animate-in fade-in-50 duration-300 ease-in-out">
                  <TradePsychology />
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>

          {/* Notes Section - Enhanced UI */}
          <Card className="mb-5 border-border/60">
            <CardHeader className="pb-2 border-b border-border/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardIcon color="primary" variant="soft">
                    <Icons.general.clipboard className="h-4 w-4" />
                  </CardIcon>
                  <CardTitle>Trading Notes</CardTitle>
                </div>
                <span className="text-xs text-muted-foreground">Add your analysis and observations</span>
              </div>
            </CardHeader>
            <CardContent className="p-5">
              <NotesSection />
            </CardContent>
          </Card>

          {/* Chart Images - Enhanced UI */}
          <Card className="mb-5 border-border/60">
            <CardHeader className="pb-2 border-b border-border/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardIcon color="primary" variant="soft">
                    <Icons.analytics.barChart className="h-4 w-4" />
                  </CardIcon>
                  <CardTitle>Chart Images</CardTitle>
                </div>
                <div className="flex items-center">
                  <Icons.general.image className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Upload entry and exit screenshots</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-5">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
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
              </motion.div>
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