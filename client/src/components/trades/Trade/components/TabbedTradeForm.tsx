import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Icons } from '@/components/icons/icons';
import { useSwipeable } from 'react-swipeable';
import { 
  TradeDetails,
  TradeRiskReward,
  TradeStrategy,
  TradePsychology,
  TradeImages,
  NotesSection,
} from './';
import { cn } from '@/lib/utils';
import { ImageState } from '../types';

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [query]);

  return matches;
}

const TRADE_FORM_TABS = [
  {
    id: 'entry',
    label: 'Entry & Risk',
    icon: <Icons.ui.arrowRightCircle className="h-4 w-4" />,
    mobileLabel: 'Entry',
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
  isCalculatingLotSize: boolean;
  isCalculatingTakeProfit: boolean;
  accountBalance: number;
  riskPercentage: number;
  setRiskPercentage: (value: number) => void;
  calculateOptimalLotSize: () => void;
  calculateOptimalTakeProfit: () => void;
  riskRewardRatio: number;
  setRiskRewardRatio: (value: number) => void;
  strategies: any[];
  isLoadingStrategies: boolean;
  selectedStrategy: any;
  strategyChecks: any[];
  handleStrategyCheckToggle: (id: string, checked: boolean) => void;
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
  isCalculatingLotSize,
  isCalculatingTakeProfit,
  accountBalance,
  riskPercentage,
  setRiskPercentage,
  calculateOptimalLotSize,
  calculateOptimalTakeProfit,
  riskRewardRatio,
  setRiskRewardRatio,
  strategies,
  isLoadingStrategies,
  selectedStrategy,
  strategyChecks,
  handleStrategyCheckToggle,
  entryImage1,
  entryImage2,
  exitImage1,
  exitImage2,
  handleEntryImageChange,
  handleExitImageChange,
  removeEntryImage,
  removeExitImage,
}: TabbedTradeFormProps) {
  const [activeTab, setActiveTab] = useState('entry');
  const isMobile = useMediaQuery('(max-width: 640px)');
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const tabListRef = useRef<HTMLDivElement>(null);
  
  const checkScrollability = useCallback(() => {
    if (tabListRef.current) {
      const { scrollWidth, clientWidth, scrollLeft } = tabListRef.current;
      setCanScrollLeft(scrollLeft > 0);
      
      const lastTabElement = tabListRef.current.querySelector('[value="notes"]');
      if (lastTabElement) {
        const lastTabRight = lastTabElement.getBoundingClientRect().right;
        const tabListRight = tabListRef.current.getBoundingClientRect().right;
        const isLastTabVisible = lastTabRight <= tabListRight + 5;
        setCanScrollRight(!isLastTabVisible);
      } else {
        const margin = 50;
        setCanScrollRight(scrollLeft < (scrollWidth - clientWidth - margin));
      }
    }
  }, []);
  
  useEffect(() => {
    if (isMobile) {
      const tabListElement = tabListRef.current;
      if (tabListElement) {
        checkScrollability();
        tabListElement.addEventListener('scroll', checkScrollability);
        window.addEventListener('resize', checkScrollability);
        
        return () => {
          tabListElement.removeEventListener('scroll', checkScrollability);
          window.removeEventListener('resize', checkScrollability);
        };
      }
    }
  }, [checkScrollability, isMobile]);
  
  const tabContentVariants = {
    hidden: { opacity: 0, x: 5 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
  };
  
  const currentTabIndex = TRADE_FORM_TABS.findIndex(tab => tab.id === activeTab);
  
  const goToNextTab = useCallback(() => {
    if (currentTabIndex < TRADE_FORM_TABS.length - 1) {
      const nextTab = TRADE_FORM_TABS[currentTabIndex + 1].id;
      setActiveTab(nextTab);
    }
  }, [currentTabIndex, setActiveTab]);
  
  const goToPrevTab = useCallback(() => {
    if (currentTabIndex > 0) {
      const prevTab = TRADE_FORM_TABS[currentTabIndex - 1].id;
      setActiveTab(prevTab);
    }
  }, [currentTabIndex, setActiveTab]);
  
  const swipeHandlers = useSwipeable({
    onSwipedLeft: goToNextTab,
    onSwipedRight: goToPrevTab,
    preventScrollOnSwipe: false,
    trackMouse: false,
    swipeDuration: 250,
    delta: 10,
  });
  
  return (
    <Tabs 
      defaultValue="entry" 
      value={activeTab} 
      onValueChange={setActiveTab}
      className="w-full"
    >
      <div className="mb-4 relative">
        {/* Left scroll indicator */}
        {isMobile && canScrollLeft && (
          <div className="absolute -left-1 top-1/2 -translate-y-1/2 h-8 w-8 bg-gradient-to-r from-background to-transparent z-10 flex items-center justify-end pointer-events-none">
            <Icons.ui.chevronLeft className="h-4 w-4 text-muted-foreground/70" />
          </div>
        )}
        
        {/* Right scroll indicator */}
        {isMobile && canScrollRight && (
          <div className="absolute -right-1 top-1/2 -translate-y-1/2 h-8 w-8 bg-gradient-to-l from-background to-transparent z-10 flex items-center justify-start pointer-events-none">
            <Icons.ui.chevronRight className="h-4 w-4 text-muted-foreground/70" />
          </div>
        )}
        
        <TabsList 
          ref={tabListRef}
          className={cn(
            "w-full bg-muted/50 rounded-lg p-1", 
            isMobile ? "flex overflow-x-auto overflow-y-hidden scroll-smooth snap-x snap-mandatory touch-pan-x scrollbar-hide" : "grid grid-cols-5 overflow-hidden"
          )}
        >
          {TRADE_FORM_TABS.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className={cn(
                "flex items-center justify-center gap-2 h-9 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-md transition-all",
                isMobile ? "flex-shrink-0 px-3 min-w-[4.5rem] snap-start snap-always" : ""
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
        {...swipeHandlers}
        key={activeTab}
        initial="hidden"
        animate="visible"
        variants={tabContentVariants}
        className="min-h-[300px] overflow-visible touch-pan-y"
      >
        <TabsContent value="entry" className="mt-0 pt-2 overflow-visible">
          <div className="space-y-6">
            {/* Entry details section */}
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
            
            {/* Risk reward section - đơn giản hóa */}
            <TradeRiskReward
              accountBalance={accountBalance}
              riskPercentage={riskPercentage}
              setRiskPercentage={setRiskPercentage}
              riskRewardRatio={riskRewardRatio}
              setRiskRewardRatio={setRiskRewardRatio}
            />
          </div>
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
