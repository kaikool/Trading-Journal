
import { FormProvider } from "react-hook-form";
import { Card, CardContent } from '@/components/ui/card';
import { useTradeForm } from './hooks';
import { TradeFormProps } from './types';
import {
  FormHeader,
  TradeDetails,
  TradeStrategy,
  TradePsychology,
  NotesSection,
  FormActions
} from './components';
import TradeImages from "./components/TradeImages";

export default function TradeFormNew(props: TradeFormProps) {
  const onCancel = props.mode === "edit" && props.hasOwnProperty('onCancel') 
    ? (props as any).onCancel 
    : undefined;
  
  // Destructuring all necessary values from the corrected useTradeForm hook
  const {
    form,
    isEditMode,
    isFormSubmitting,
    hasDraft,
    showDraftNotice,
    isDraftLoading,
    setShowDraftNotice,
    loadDraft,
    clearDraft,
    entryImage1,
    entryImage2,
    exitImage1,
    exitImage2,
    handleEntryImageChange,
    handleExitImageChange,
    removeEntryImage,
    removeExitImage,
    strategies,
    isLoadingStrategies,
    selectedStrategy,       // Prop is now available
    strategyChecks,         // Prop is now available
    handleStrategyCheckToggle, // Prop is now available
    accountBalance,
    riskPercentage,
    setRiskPercentage,
    riskRewardRatio,
    isCalculatingLotSize,
    isCalculatingTakeProfit,
    calculateOptimalLotSize,
    calculateOptimalTakeProfit,
    onSubmit
  } = useTradeForm(props);
  
  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className="space-y-6 overflow-hidden relative">
        <FormHeader 
          isEditMode={isEditMode}
          hasDraft={hasDraft}
          showDraftNotice={showDraftNotice}
          isDraftLoading={isDraftLoading}
          setShowDraftNotice={setShowDraftNotice}
          loadDraft={loadDraft}
          clearDraft={clearDraft}
        />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <TradeDetails 
                  isCalculatingLotSize={isCalculatingLotSize}
                  isCalculatingTakeProfit={isCalculatingTakeProfit}
                  accountBalance={accountBalance}
                  riskPercentage={riskPercentage}
                  setRiskPercentage={setRiskPercentage}
                  calculateOptimalLotSize={calculateOptimalLotSize}
                  calculateOptimalTakeProfit={calculateOptimalTakeProfit}
                  riskRewardRatio={riskRewardRatio}
                />
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                {/* Passing all the necessary props down to the dumb component */}
                <TradeStrategy 
                  strategies={strategies}
                  isLoadingStrategies={isLoadingStrategies}
                  selectedStrategy={selectedStrategy}
                  strategyChecks={strategyChecks}
                  handleStrategyCheckToggle={handleStrategyCheckToggle}
                />
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <TradePsychology />
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <NotesSection />
              </CardContent>
            </Card>
          </div>
        </div>
        
        <Card>
          <CardContent className="pt-6">
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
        
        <FormActions 
          isEditMode={isEditMode}
          isFormSubmitting={isFormSubmitting}
          hasDraft={hasDraft}
          onCancel={onCancel}
          clearDraft={clearDraft}
        />
      </form>
    </FormProvider>
  );
}
