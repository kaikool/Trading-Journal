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
import { debug } from '@/lib/debug';

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

// Tab configuration for the trade form with proper section separation
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
  // Trade details props
  isCalculatingLotSize: boolean;
  isCalculatingTakeProfit: boolean;
  accountBalance: number;
  riskPercentage: number;
  setRiskPercentage: (value: number) => void;
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
  // State for active tab - set to 'entry' to match the first tab in TRADE_FORM_TABS
  const [activeTab, setActiveTab] = useState('entry');
  
  // Check if screen is mobile
  const isMobile = useMediaQuery('(max-width: 640px)');
  
  // States to track scrollability
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  
  // Reference to the tab list element
  const tabListRef = useRef<HTMLDivElement>(null);
  
  // Function to check scrollability in both directions
  const checkScrollability = useCallback(() => {
    if (tabListRef.current) {
      const { scrollWidth, clientWidth, scrollLeft } = tabListRef.current;
      
      // Can scroll left if we're not at the beginning
      setCanScrollLeft(scrollLeft > 0);
      
      // Cách tính toán mới:
      // 1. Lấy kích thước của tab list
      // 2. Kiểm tra vị trí cuối cùng của tab "Notes" có nằm trong tầm nhìn không
      
      // Tìm tab cuối cùng
      const lastTabElement = tabListRef.current.querySelector('[value="notes"]');
      
      if (lastTabElement) {
        // Vị trí của tab cuối và độ rộng của nó
        const lastTabRight = lastTabElement.getBoundingClientRect().right;
        const tabListRight = tabListRef.current.getBoundingClientRect().right;
        
        // Nếu phần bên phải của tab cuối cùng đã nằm trong phạm vi của tablist
        // thì không hiển thị mũi tên nữa
        const isLastTabVisible = lastTabRight <= tabListRight + 5; // thêm 5px margin
        
        setCanScrollRight(!isLastTabVisible);
      } else {
        // Dự phòng, sử dụng phương pháp cũ nếu không tìm thấy tab cuối
        const margin = 50;
        setCanScrollRight(scrollLeft < (scrollWidth - clientWidth - margin));
      }
    }
  }, []);
  
  // Set up listeners to check scrollability
  useEffect(() => {
    if (isMobile) {
      const tabListElement = tabListRef.current;
      if (tabListElement) {
        // Initial check
        checkScrollability();
        
        // Check on scroll
        tabListElement.addEventListener('scroll', checkScrollability);
        
        // Check on resize
        window.addEventListener('resize', checkScrollability);
        
        return () => {
          tabListElement.removeEventListener('scroll', checkScrollability);
          window.removeEventListener('resize', checkScrollability);
        };
      }
    }
  }, [checkScrollability, isMobile]);
  
  // Animation variants for tab content
  const tabContentVariants = {
    hidden: { opacity: 0, x: 5 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
  };
  
  // Find the current tab index
  const currentTabIndex = TRADE_FORM_TABS.findIndex(tab => tab.id === activeTab);
  
  // Get tab navigation helpers
  const goToNextTab = useCallback(() => {
    if (currentTabIndex < TRADE_FORM_TABS.length - 1) {
      const nextTab = TRADE_FORM_TABS[currentTabIndex + 1].id;
      setActiveTab(nextTab);
      // Tab changed via swipe left
    }
  }, [currentTabIndex, setActiveTab]);
  
  const goToPrevTab = useCallback(() => {
    if (currentTabIndex > 0) {
      const prevTab = TRADE_FORM_TABS[currentTabIndex - 1].id;
      setActiveTab(prevTab);
      // Tab changed via swipe right
    }
  }, [currentTabIndex, setActiveTab]);
  
  // Setup swipe handlers
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
            
            {/* Risk reward section */}
            <div className="mt-6 border-t border-border/30 pt-6">
              <h3 className="text-lg font-medium mb-4 text-foreground/90">Risk & Reward Configuration</h3>
              <TradeRiskReward
                accountBalance={accountBalance}
                riskPercentage={riskPercentage}
                setRiskPercentage={setRiskPercentage}
                riskRewardRatio={riskRewardRatio}
              />
            </div>
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
