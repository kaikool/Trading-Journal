import { lazy, Suspense, useState, useEffect } from "react";
import { Icons } from "@/components/icons/icons";
import { Trade, TradingStrategy } from "@/types";
import { auth, getStrategyById } from "@/lib/firebase";

// Define TradeDiscipline interface for better type safety
interface TradeDiscipline {
  followedPlan: boolean;
  enteredEarly: boolean;
  revenge: boolean;
  overLeveraged: boolean;
  movedStopLoss: boolean;
}
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardGradient, 
  CardIcon, 
  CardValue 
} from "@/components/ui/card";
import { formatTimestamp } from "@/lib/format-timestamp";
import { cn } from "@/lib/utils";
import { formatCurrency, formatPriceForPair } from "@/utils/format-number";
import { TradeStatus } from "@/lib/trade-status-config";
import { useIsMobile } from "@/hooks/use-mobile";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartImageDialog } from "./ChartImageDialog";
import DirectionBadge, { Direction } from "./DirectionBadge";
import TradeStatusBadge from "./TradeStatusBadge";

// Lazy load the components
const LazyTradeEditForm = lazy(() => import("./LazyTradeEditForm"));

interface LazyTradeViewEditProps {
  trade: Trade;
  userId: string;
  isLoading: boolean;
  onEdit: (isSubmitting: boolean) => void;
  onSuccess: () => void;
  onError: (error: unknown) => void;
  onDelete: (tradeId: string) => void;
  onBack: () => void;
}

export function LazyTradeViewEdit({
  trade,
  userId,
  isLoading,
  onEdit,
  onSuccess,
  onError,
  onDelete,
  onBack
}: LazyTradeViewEditProps) {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState<string>("view");
  const [showChartDialog, setShowChartDialog] = useState(false);
  const [strategyName, setStrategyName] = useState<string>("");
  const [isLoadingStrategy, setIsLoadingStrategy] = useState<boolean>(false);
  
  // Fetch strategy name from ID when component loads
  useEffect(() => {
    const fetchStrategyName = async () => {
      try {
        if (!trade.strategy) {
          setStrategyName('No Strategy');
          return;
        }
        
        setIsLoadingStrategy(true);
        const user = auth.currentUser;
        if (!user) return;
        
        const strategyData = await getStrategyById(user.uid, trade.strategy);
        // TypeScript cast to make sure we have the right type
        const strategyWithName = strategyData as unknown as TradingStrategy;
        if (strategyWithName && strategyWithName.name) {
          setStrategyName(strategyWithName.name);
        } else {
          setStrategyName('Unknown Strategy');
        }
      } catch (error) {
        console.error('Error fetching strategy:', error);
        setStrategyName('Unknown Strategy');
      } finally {
        setIsLoadingStrategy(false);
      }
    };
    
    fetchStrategyName();
  }, [trade.strategy]);
  
  // Trade Details Display - used in both tabs
  const TradeDetailsDisplay = () => (
    <div className="flex flex-col md:flex-row gap-4 px-4 py-3">
      {/* Image container - using trade-card-image-container class from global CSS */}
      <div className="relative w-full md:w-48 h-48 flex-shrink-0 cursor-pointer group overflow-hidden rounded-md border border-border/30 shadow-sm bg-card/40" 
           onClick={() => setShowChartDialog(true)}>
        {trade.entryImage ? (
          <div className="trade-card-image-container">
            <img 
              src={trade.entryImage}
              alt={`${trade.pair} ${trade.direction} trade chart`}
              className="trade-card-image loaded"
            />
            {/* Add zoom overlay icon using trade-card-zoom-overlay from global CSS */}
            <div className="trade-card-zoom-overlay">
              <Icons.ui.maximize className="h-6 w-6 text-white" />
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground bg-muted/10">
            <Icons.ui.maximize className="h-8 w-8 mb-2 opacity-40" />
            <span>No Chart Image</span>
          </div>
        )}
        
        {/* Direction badge using global trade-direction-badge class */}
        <div className="trade-direction-badge">
          <DirectionBadge
            direction={trade.direction as Direction}
            showTooltip={false}
            size="sm"
            variant="modern"
          />
        </div>
        
        {/* Result badge using global trade-result-badge class */}
        {trade.result && (
          <div className="trade-result-badge">
            <TradeStatusBadge
              status={trade.result as TradeStatus}
              showTooltip={false}
              size="sm"
            />
          </div>
        )}
      </div>
      
      {/* Trade details */}
      <div className="p-0 flex-grow">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CardIcon
              color={trade.direction === "BUY" ? "primary" : "destructive"}
              size="sm"
              variant="soft"
            >
              {trade.direction === "BUY" ? <Icons.trade.arrowUp className="h-3.5 w-3.5" /> : <Icons.trade.arrowDown className="h-3.5 w-3.5" />}
            </CardIcon>
            <h3 className="text-lg font-semibold">
              {trade.pair}
            </h3>
          </div>
          
          <div className="flex mt-2 md:mt-0 items-center">
            <CardIcon
              color="muted"
              size="sm"
              variant="soft"
              className="mr-1.5"
            >
              <Icons.analytics.barChart className="h-3.5 w-3.5" />
            </CardIcon>
            <span className="text-sm text-muted-foreground font-medium">
              {isLoadingStrategy ? (
                <span className="inline-flex items-center">
                  <Icons.ui.spinner className="h-3 w-3 animate-spin mr-1" />
                  Loading...
                </span>
              ) : strategyName}
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3 text-sm app-accordion-content-section">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground card-label">Entry</span>
            <span className="font-medium">{formatPriceForPair(trade.entryPrice, trade.pair)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground card-label">Exit</span>
            <span className="font-medium">{trade.exitPrice ? formatPriceForPair(trade.exitPrice, trade.pair) : 'Open'}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground card-label">Entry Date</span>
            <span className="font-medium">{formatTimestamp(trade.createdAt)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground card-label">Exit Date</span>
            <span className="font-medium">{trade.closeDate ? formatTimestamp(trade.closeDate) : 'Open'}</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3 text-sm app-accordion-content-section">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground card-label">Stop Loss</span>
            <span className="font-medium">{trade.stopLoss}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground card-label">Take Profit</span>
            <span className="font-medium">{trade.takeProfit}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground card-label">Pips</span>
            <CardValue
              size="sm"
              status={Number(trade.pips) > 0 ? 'success' : Number(trade.pips) < 0 ? 'danger' : 'neutral'}
              trend={Number(trade.pips) > 0 ? 'up' : Number(trade.pips) < 0 ? 'down' : 'neutral'}
            >
              {Number(trade.pips) >= 0 ? '+' : ''}{trade.pips}
            </CardValue>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground card-label">P/L</span>
            <CardValue
              size="sm"
              status={Number(trade.profitLoss) > 0 ? 'success' : Number(trade.profitLoss) < 0 ? 'danger' : 'neutral'}
              trend={Number(trade.profitLoss) > 0 ? 'up' : Number(trade.profitLoss) < 0 ? 'down' : 'neutral'}
            >
              {Number(trade.profitLoss) >= 0 ? '+' : ''}{formatCurrency(Number(trade.profitLoss))}
            </CardValue>
          </div>
        </div>
        
        {/* Discipline Factors */}
        {trade.discipline && (
          <div className="mt-3 app-accordion-content-section">
            <h4 className="text-sm font-medium mb-2 flex items-center card-label">
              <CardIcon
                color="primary"
                size="sm"
                variant="soft"
                className="mr-1.5"
              >
                <Icons.trade.checklist className="h-3 w-3" />
              </CardIcon>
              Trade Discipline
            </h4>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
              <div className={cn(
                "text-xs py-1 px-2 rounded-md flex items-center",
                trade.discipline.followedPlan 
                  ? "bg-success/10 text-success" 
                  : "bg-destructive/10 text-destructive"
              )}>
                <div className={cn(
                  "h-2 w-2 rounded-full mr-1.5",
                  trade.discipline.followedPlan ? "bg-success" : "bg-destructive"
                )}></div>
                <span>{trade.discipline.followedPlan ? 'Followed Plan' : 'Plan Deviation'}</span>
              </div>
              
              {trade.discipline.enteredEarly && (
                <div className="text-xs py-1 px-2 bg-warning/10 text-warning rounded-md flex items-center">
                  <div className="h-2 w-2 rounded-full mr-1.5 bg-warning"></div>
                  <span>Entered Early</span>
                </div>
              )}
              
              {trade.discipline.revenge && (
                <div className="text-xs py-1 px-2 bg-destructive/10 text-destructive rounded-md flex items-center">
                  <div className="h-2 w-2 rounded-full mr-1.5 bg-destructive"></div>
                  <span>Revenge Trade</span>
                </div>
              )}
              
              {trade.discipline.overLeveraged && (
                <div className="text-xs py-1 px-2 bg-destructive/10 text-destructive rounded-md flex items-center">
                  <div className="h-2 w-2 rounded-full mr-1.5 bg-destructive"></div>
                  <span>Over Leveraged</span>
                </div>
              )}
              
              {trade.discipline.movedStopLoss && (
                <div className="text-xs py-1 px-2 bg-destructive/10 text-destructive rounded-md flex items-center">
                  <div className="h-2 w-2 rounded-full mr-1.5 bg-destructive"></div>
                  <span>Moved Stop Loss</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
  
  return (
    <>
      {/* Chart Image Dialog */}
      <ChartImageDialog
        isOpen={showChartDialog}
        onClose={() => setShowChartDialog(false)}
        entryImage={trade.entryImage}
        entryImageM15={trade.entryImageM15}
        exitImage={trade.exitImage}
        exitImageM15={trade.exitImageM15}
        isTradeOpen={!trade.closeDate}
        tradePair={trade.pair}
      />
      
      <Card className="mb-4 overflow-hidden relative border-border/50 card-spotlight">
        <CardGradient 
          variant={
            !trade.result ? 'default' :
            trade.result === 'TP' || Number(trade.profitLoss) > 0 ? 'success' :
            trade.result === 'SL' || Number(trade.profitLoss) < 0 ? 'destructive' :
            trade.result === 'BE' ? 'warning' : 'default'
          }
          intensity="subtle"
          direction="top-right"
        />
        <CardContent className="p-0">
          <div className="border-b border-border/40">
            <Tabs defaultValue="view" value={activeTab} onValueChange={setActiveTab}>
            <div className="flex justify-between items-center px-4 py-2">
              <TabsList className="h-9">
                <TabsTrigger value="view" className="text-sm">
                  <Icons.ui.eye className="h-4 w-4 mr-1.5" />
                  View
                </TabsTrigger>
                <TabsTrigger value="edit" className="text-sm">
                  <Icons.ui.pencil className="h-3.5 w-3.5 mr-1.5" />
                  Edit
                </TabsTrigger>
              </TabsList>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(trade.id)}
                  className="h-8 action-button-delete"
                >
                  <Icons.trade.trash className="h-4 w-4 mr-1" />
                  {!isMobile && <span>Delete</span>}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onBack}
                  className="h-8"
                >
                  <Icons.trade.arrowLeft className="h-4 w-4 mr-1" />
                  {!isMobile && <span>Back</span>}
                </Button>
              </div>
            </div>
            
            <TabsContent value="view" className="mt-0">
              <TradeDetailsDisplay />
              
              {/* Notes Section - Using app-accordion-content-section style from globals.css */}
              {trade.notes && (
                <div className="px-6 py-4 mt-4 mx-4 mb-4 app-accordion-content-section">
                  <h4 className="text-sm font-medium mb-2 flex items-center card-label">
                    <CardIcon
                      color="primary"
                      size="sm"
                      variant="soft"
                      className="mr-1.5"
                    >
                      <Icons.trade.checklist className="h-3 w-3" />
                    </CardIcon>
                    Trade Notes
                  </h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap pl-1">
                    {trade.notes}
                  </p>
                </div>
              )}
              
              {/* Closing Notes Section - Using app-accordion-content-section style from globals.css */}
              {trade.closingNote && (
                <div className="px-6 py-4 mt-4 mx-4 mb-4 app-accordion-content-section">
                  <h4 className="text-sm font-medium mb-2 flex items-center card-label">
                    <CardIcon
                      color={Number(trade.profitLoss) > 0 ? "success" : Number(trade.profitLoss) < 0 ? "destructive" : "warning"}
                      size="sm"
                      variant="soft"
                      className="mr-1.5"
                    >
                      <Icons.trade.checklist className="h-3 w-3" />
                    </CardIcon>
                    Closing Notes
                  </h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap pl-1">
                    {trade.closingNote}
                  </p>
                </div>
              )}
              
              {/* Add spacing at the bottom when there are no notes */}
              {!trade.closingNote && !trade.notes && <div className="pb-4" />}
              

            </TabsContent>
            
            <TabsContent value="edit" className="mt-0">
              <div className="flex items-center justify-between border-b border-border/40 px-4 py-2">
                <h3 className="text-sm font-medium flex items-center card-label">
                  <CardIcon 
                    color="primary" 
                    size="sm" 
                    variant="soft" 
                    className="mr-1.5"
                  >
                    <Icons.ui.pencil className="h-3 w-3" />
                  </CardIcon>
                  Edit Trade
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveTab("view")}
                  className="h-8 text-muted-foreground hover:text-foreground"
                >
                  <Icons.ui.x className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
              </div>
              
              <Suspense
                fallback={
                  <div className="w-full py-8 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-2">
                      <Icons.ui.spinner className="h-8 w-8 animate-spin text-primary" />
                      <p className="text-sm text-muted-foreground">Loading form...</p>
                    </div>
                  </div>
                }
              >
                <LazyTradeEditForm
                  trade={trade}
                  userId={userId}
                  onSubmitting={onEdit}
                  onSuccess={() => {
                    onSuccess();
                    setActiveTab("view");
                  }}
                  onError={onError}
                  onCancel={() => setActiveTab("view")}
                />
              </Suspense>
            </TabsContent>
            

          </Tabs>
        </div>
      </CardContent>
    </Card>
    </>
  );
}

export default LazyTradeViewEdit;