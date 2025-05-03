import { lazy, Suspense, useState } from "react";
import { Loader2, ArrowUp, ArrowDown, PencilIcon, 
         ArrowLeft, Trash2Icon, BookOpenCheck, Maximize2 } from "lucide-react";
import { Trade } from "@/types";

// Define TradeDiscipline interface for better type safety
interface TradeDiscipline {
  followedPlan: boolean;
  enteredEarly: boolean;
  revenge: boolean;
  overLeveraged: boolean;
  movedStopLoss: boolean;
}
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatTimestamp } from "@/lib/format-timestamp";
import { cn, formatCurrency } from "@/lib/utils";
import { getTradeStatusConfig, TradeStatus } from "@/lib/trade-status-config";
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
  
  // Trade Details Display - used in both tabs
  const TradeDetailsDisplay = () => (
    <div className="flex flex-col md:flex-row">
      {/* Image container */}
      <div className="relative w-full md:w-48 h-48 bg-gray-100 dark:bg-gray-800 flex-shrink-0 cursor-pointer group" 
           onClick={() => setShowChartDialog(true)}>
        {trade.entryImage ? (
          <>
            <img 
              src={trade.entryImage}
              alt={`${trade.pair} ${trade.direction} trade chart`}
              className="w-full h-full object-cover"
            />
            {/* Add zoom overlay icon */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
              <Maximize2 className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 h-6 w-6" />
            </div>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <span>No Chart</span>
          </div>
        )}
        
        {/* Direction badge */}
        <div className="trade-direction-badge">
          <DirectionBadge
            direction={trade.direction as Direction}
            showTooltip={false}
            size="sm"
            variant="arrow"
          />
        </div>
        
        {/* Result badge */}
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
      <div className="p-4 flex-grow">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-2">
          <h3 className="text-lg font-semibold flex items-center">
            {trade.pair}
            <span className="text-sm font-normal ml-2 text-gray-500">
              {trade.strategy}
            </span>
          </h3>
          
          <div className="flex mt-2 md:mt-0 items-center">
            {/* Tabs are outside this component */}
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3 text-sm">
          <div>
            <span className="text-gray-500">Entry:</span> {trade.entryPrice}
          </div>
          <div>
            <span className="text-gray-500">Exit:</span> {trade.exitPrice || 'Open'}
          </div>
          <div>
            <span className="text-gray-500">Entry Date:</span> {formatTimestamp(trade.entryDate)}
          </div>
          <div>
            <span className="text-gray-500">Exit Date:</span> {trade.closeDate ? formatTimestamp(trade.closeDate) : 'Open'}
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3 text-sm">
          <div>
            <span className="text-gray-500">Stop Loss:</span> {trade.stopLoss}
          </div>
          <div>
            <span className="text-gray-500">Take Profit:</span> {trade.takeProfit}
          </div>
          <div>
            <span className="text-gray-500">Pips:</span> 
            <span className={Number(trade.pips) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
              {Number(trade.pips) >= 0 ? ' +' : ' '}{trade.pips}
            </span>
          </div>
          <div>
            <span className="text-gray-500">P/L:</span>
            <span className={Number(trade.profitLoss) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
              {Number(trade.profitLoss) >= 0 ? ' +' : ' '}{formatCurrency(Number(trade.profitLoss))}
            </span>
          </div>
        </div>
        
        {/* Discipline Factors */}
        {trade.discipline && (
          <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <h4 className="text-sm font-medium mb-2">Trade Discipline</h4>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
              <div className="text-xs py-1 px-2 bg-slate-100 dark:bg-slate-800 rounded-md flex items-center">
                <div className={`h-2 w-2 rounded-full mr-1.5 ${trade.discipline.followedPlan ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span>{trade.discipline.followedPlan ? 'Followed Plan' : 'Plan Deviation'}</span>
              </div>
              
              {trade.discipline.enteredEarly && (
                <div className="text-xs py-1 px-2 bg-slate-100 dark:bg-slate-800 rounded-md flex items-center">
                  <div className="h-2 w-2 rounded-full mr-1.5 bg-amber-500"></div>
                  <span>Entered Early</span>
                </div>
              )}
              
              {trade.discipline.revenge && (
                <div className="text-xs py-1 px-2 bg-slate-100 dark:bg-slate-800 rounded-md flex items-center">
                  <div className="h-2 w-2 rounded-full mr-1.5 bg-red-500"></div>
                  <span>Revenge Trade</span>
                </div>
              )}
              
              {trade.discipline.overLeveraged && (
                <div className="text-xs py-1 px-2 bg-slate-100 dark:bg-slate-800 rounded-md flex items-center">
                  <div className="h-2 w-2 rounded-full mr-1.5 bg-red-500"></div>
                  <span>Over Leveraged</span>
                </div>
              )}
              
              {trade.discipline.movedStopLoss && (
                <div className="text-xs py-1 px-2 bg-slate-100 dark:bg-slate-800 rounded-md flex items-center">
                  <div className="h-2 w-2 rounded-full mr-1.5 bg-red-500"></div>
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
      
      <Card className="mb-4 overflow-hidden">
        <CardContent className="p-0">
          <div className="border-b border-slate-200 dark:border-slate-800">
            <Tabs defaultValue="view" value={activeTab} onValueChange={setActiveTab}>
            <div className="flex justify-between items-center px-4 py-2">
              <TabsList>
                <TabsTrigger value="view" className="text-sm">
                  View
                </TabsTrigger>
                <TabsTrigger value="edit" className="text-sm">
                  Edit
                </TabsTrigger>
              </TabsList>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(trade.id)}
                  className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2Icon className="h-4 w-4 mr-1" />
                  {!isMobile && <span>Delete</span>}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onBack}
                  className="h-8"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  {!isMobile && <span>Back</span>}
                </Button>
              </div>
            </div>
            
            <TabsContent value="view" className="mt-0">
              <TradeDetailsDisplay />
              
              {/* Notes Section */}
              {trade.notes && (
                <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800">
                  <h4 className="text-sm font-medium mb-2">Notes</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap pl-1">
                    {trade.notes}
                  </p>
                </div>
              )}
              
              {/* Closing Notes Section */}
              {trade.closingNote && (
                <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800">
                  <h4 className="text-sm font-medium mb-2">Closing Notes</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap pl-1">
                    {trade.closingNote}
                  </p>
                </div>
              )}
              

            </TabsContent>
            
            <TabsContent value="edit" className="mt-0">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-4 py-2">
                <h3 className="text-sm font-medium">Edit Trade</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveTab("view")}
                  className="h-8 text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </Button>
              </div>
              
              <Suspense
                fallback={
                  <div className="w-full py-8 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
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