import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Icons } from '@/components/icons/icons';
import { 
  TradeDetails,
  TradeStrategy,
  TradePsychology,
  TradeImages,
  NotesSection,
} from './';
import { cn } from '@/lib/utils';
import { ImageState } from '../types';

/**
 * Custom hook for responsive design
 * Returns true if the media query matches
 * 
 * @param query CSS media query string
 * @returns boolean indicating if the query matches
 */
function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    
    // Set initial value
    setMatches(mediaQuery.matches);

    // Create event handler
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Add listener
    mediaQuery.addEventListener('change', handleChange);
    
    // Clean up
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [query]);

  return matches;
}

// Tab configuration for the trade form
const TRADE_FORM_TABS = [
  {
    id: 'general',
    label: 'General',
    icon: <Icons.ui.circleCheck className="h-4 w-4" />,
    mobileLabel: 'General',
  },
  {
    id: 'strategy',
    label: 'Strategy',
    icon: <Icons.ui.clipboardList className="h-4 w-4" />,
    mobileLabel: 'Strategy',
  },
  {
    id: 'psychology',
    label: 'Psychology',
    icon: <Icons.analytics.brain className="h-4 w-4" />,
    mobileLabel: 'Psych',
  },
  {
    id: 'images',
    label: 'Charts',
    icon: <Icons.analytics.barChart className="h-4 w-4" />,
    mobileLabel: 'Charts',
  },
  {
    id: 'notes',
    label: 'Notes',
    icon: <Icons.general.clipboard className="h-4 w-4" />,
    mobileLabel: 'Notes',
  },
] as const;

interface TabbedTradeFormProps {
  // Trade details props
  isCalculatingLotSize: boolean;
  isCalculatingTakeProfit: boolean;
  accountBalance: number;
  riskPercentage: number;
  setRiskPercentage: (value: number) => void;
  canFetchPrice: boolean;
  isEditMode: boolean;
  calculateOptimalLotSize: () => void;
  calculateOptimalTakeProfit: () => void;
  riskRewardRatio: number;
  
  // Strategy props
  strategies: any[];
  isLoadingStrategies: boolean;
  selectedStrategy: any;
  strategyChecks: any[];
  handleStrategyCheckToggle: (id: string, checked: boolean) => void;
  
  // Image props
  entryImage1: ImageState;
  entryImage2: ImageState;
  exitImage1: ImageState;
  exitImage2: ImageState;
  handleEntryImageChange: (index: 1 | 2) => (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleExitImageChange: (index: 1 | 2) => (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  removeEntryImage: (index: 1 | 2) => () => void;
  removeExitImage: (index: 1 | 2) => () => void;
}

export function TabbedTradeForm({
  // Trade details props
  isCalculatingLotSize,
  isCalculatingTakeProfit,
  accountBalance,
  riskPercentage,
  setRiskPercentage,
  canFetchPrice,
  isEditMode,
  calculateOptimalLotSize,
  calculateOptimalTakeProfit,
  riskRewardRatio,
  
  // Strategy props
  strategies,
  isLoadingStrategies,
  selectedStrategy,
  strategyChecks,
  handleStrategyCheckToggle,
  
  // Image props
  entryImage1,
  entryImage2,
  exitImage1,
  exitImage2,
  handleEntryImageChange,
  handleExitImageChange,
  removeEntryImage,
  removeExitImage,
}: TabbedTradeFormProps) {
  // State for active tab
  const [activeTab, setActiveTab] = useState('general');
  
  // Check if screen is mobile
  const isMobile = useMediaQuery('(max-width: 640px)');
  
  // Animation variants for tab content
  const tabContentVariants = {
    hidden: { opacity: 0, x: 5 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
  };
  
  return (
    <Tabs 
      defaultValue="general" 
      value={activeTab} 
      onValueChange={setActiveTab}
      className="w-full"
    >
      <div className="mb-4 relative overflow-hidden">
        <TabsList 
          className={cn(
            "w-full bg-muted/50 rounded-lg p-1", 
            isMobile ? "flex overflow-x-auto no-scrollbar overflow-y-hidden" : "grid grid-cols-5"
          )}
        >
          {TRADE_FORM_TABS.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className={cn(
                "flex items-center justify-center gap-2 h-9 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-md transition-all",
                isMobile ? "flex-shrink-0 px-3" : ""
              )}
            >
              {tab.icon}
              <span className={cn(
                isMobile ? "text-xs" : "text-sm"
              )}>
                {isMobile ? tab.mobileLabel : tab.label}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      
      <motion.div
        key={activeTab}
        initial="hidden"
        animate="visible"
        variants={tabContentVariants}
        className="min-h-[300px] overflow-visible"
      >
        <TabsContent value="general" className="mt-0 pt-2 overflow-visible">
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
        </TabsContent>
        
        <TabsContent value="strategy" className="mt-0 pt-2 overflow-visible">
          <TradeStrategy
            strategies={strategies}
            isLoadingStrategies={isLoadingStrategies}
            selectedStrategy={selectedStrategy}
            strategyChecks={strategyChecks}
            handleStrategyCheckToggle={handleStrategyCheckToggle}
          />
        </TabsContent>
        
        <TabsContent value="psychology" className="mt-0 pt-2 overflow-visible">
          <TradePsychology />
        </TabsContent>
        
        <TabsContent value="images" className="mt-0 pt-2 overflow-visible">
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
        </TabsContent>
        
        <TabsContent value="notes" className="mt-0 pt-2 overflow-visible">
          <NotesSection />
        </TabsContent>
      </motion.div>
    </Tabs>
  );
}