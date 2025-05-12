import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { FormProvider } from "react-hook-form";
import { useTradeForm } from "@/components/trades/TradeFormNew/hooks";

// UI Components
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
  CardGradient,
} from "@/components/ui/card";
import { Icons } from "@/components/icons/icons";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

// Trade Form Components
import {
  FormHeader,
  TradeDetails,
  TradeStrategy,
  TradePsychology,
  TradeImages,
  NotesSection,
} from "@/components/trades/TradeFormNew/components";

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

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
  const tradeFormProps = {
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
      <div className="container max-w-7xl mx-auto px-4 py-8 sm:px-6 md:px-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="relative overflow-hidden card-spotlight">
            <CardGradient 
              variant="primary"
              intensity="subtle"
              direction="top-right"
            />
            <CardContent className="flex flex-col items-center justify-center py-20 text-center">
              <motion.div 
                className="rounded-full bg-primary/10 p-6 mb-5"
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Icons.ui.spinner className="h-10 w-10 animate-spin text-primary" />
              </motion.div>
              <h3 className="text-lg font-semibold">Saving your trade...</h3>
              <p className="text-muted-foreground mt-2 max-w-md">
                Please wait while we record your trade details and process any uploaded images.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto px-4 py-8 sm:px-6 md:px-8">
      <motion.div
        className="mb-6"
        initial="hidden"
        animate="visible"
        variants={fadeIn}
      >
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
          New Trade
        </h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          Record your trade details to track performance and gain insights
        </p>
      </motion.div>

      <FormProvider {...form}>
        <form onSubmit={onSubmit} className="space-y-6">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {/* Draft notice */}
            {hasDraft && showDraftNotice && (
              <motion.div variants={fadeIn}>
                <FormHeader 
                  isEditMode={false}
                  hasDraft={hasDraft}
                  showDraftNotice={showDraftNotice}
                  isDraftLoading={isDraftLoading}
                  setShowDraftNotice={setShowDraftNotice}
                  loadDraft={loadDraft}
                  clearDraft={clearDraft}
                />
              </motion.div>
            )}

            {/* Main Trade Form Card */}
            <motion.div variants={fadeIn}>
              <Card className="relative mb-6 overflow-hidden card-spotlight">
                <CardGradient 
                  variant="primary" 
                  intensity="subtle" 
                  direction="bottom-left" 
                />
                <CardHeader className="pb-2 lg:pb-4">
                  <div className="flex items-center gap-2">
                    <Icons.tradingView className="h-6 w-6 text-primary" />
                    <CardTitle>Trade Details</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-2">
                    <TradeDetails 
                      canFetchPrice={canFetchPrice}
                      accountBalance={accountBalance}
                      riskPercentage={riskPercentage}
                      setRiskPercentage={setRiskPercentage}
                      riskRewardRatio={riskRewardRatio}
                      isCalculatingLotSize={isCalculatingLotSize}
                      isCalculatingTakeProfit={isCalculatingTakeProfit}
                      calculateOptimalLotSize={calculateOptimalLotSize}
                      calculateOptimalTakeProfit={calculateOptimalTakeProfit}
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Strategy and Psychology Tabs */}
            <motion.div variants={fadeIn}>
              <Card className="mb-6">
                <Tabs defaultValue="strategy" className="w-full">
                  <CardHeader className="pb-0">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="strategy" className="data-[state=active]:bg-muted">
                        <Icons.targetArrow className="h-4 w-4 mr-2" />
                        Strategy
                      </TabsTrigger>
                      <TabsTrigger value="psychology" className="data-[state=active]:bg-muted">
                        <Icons.psychology className="h-4 w-4 mr-2" />
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
            </motion.div>

            {/* Notes Section */}
            <motion.div variants={fadeIn}>
              <Card className="mb-6">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Icons.clipboard className="h-5 w-5 text-primary" />
                    <CardTitle>Notes</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <NotesSection />
                </CardContent>
              </Card>
            </motion.div>

            {/* Chart Images */}
            <motion.div variants={fadeIn}>
              <Card className="mb-6">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Icons.chartBar className="h-5 w-5 text-primary" />
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
            </motion.div>

            {/* Form Actions */}
            <motion.div variants={fadeIn}>
              <Card>
                <CardFooter className="flex justify-between px-6 py-4">
                  <div className="flex items-center gap-4">
                    {hasDraft && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={clearDraft}
                      >
                        <Icons.trash className="h-4 w-4 mr-2" />
                        Clear Draft
                      </Button>
                    )}
                  </div>
                  
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setLocation("/trade/history")}
                    >
                      Cancel
                    </Button>
                    
                    <Button 
                      type="submit"
                      disabled={isFormSubmitting}
                      className="relative overflow-hidden group"
                    >
                      <span className="relative z-10 flex items-center">
                        Save Trade
                        <Icons.arrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </span>
                      <span className="absolute inset-0 bg-primary/10 translate-y-[100%] group-hover:translate-y-0 transition-transform" />
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </motion.div>
          </motion.div>
        </form>
      </FormProvider>
    </div>
  );
}