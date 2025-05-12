import React from 'react';
import { FormProvider } from "react-hook-form";
import { Card, CardContent } from '@/components/ui/card';
import { useTradeForm } from './hooks';
import { TradeFormProps } from './types';
import {
  FormHeader,
  TradeDetails,
  TradeStrategy,
  TradePsychology,
  TradeImages,
  NotesSection,
  FormActions
} from './components';

export default function TradeFormNew(props: TradeFormProps) {
  // Handle onCancel prop for edit mode
  const onCancel = props.mode === "edit" && 'onCancel' in props 
    ? (props as EditTradeProps).onCancel 
    : undefined;
  
  // Use the main custom hook that integrates all functionality
  const {
    form,
    isEditMode,
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
  } = useTradeForm(props);
  
  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className="space-y-6 overflow-hidden relative">
        {/* Draft notice if available */}
        <FormHeader 
          isEditMode={isEditMode}
          hasDraft={hasDraft}
          showDraftNotice={showDraftNotice}
          isDraftLoading={isDraftLoading}
          setShowDraftNotice={setShowDraftNotice}
          loadDraft={loadDraft}
          clearDraft={clearDraft}
        />
        
        {/* Main form content */}
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
                  canFetchPrice={canFetchPrice}
                  isEditMode={isEditMode}
                  calculateOptimalLotSize={calculateOptimalLotSize}
                  calculateOptimalTakeProfit={calculateOptimalTakeProfit}
                  riskRewardRatio={riskRewardRatio}
                />
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
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
        
        {/* Chart images section */}
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
        
        {/* Form actions */}
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