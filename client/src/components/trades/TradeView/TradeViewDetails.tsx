
import { useState, useEffect } from "react";
import { Icons } from "@/components/icons/icons";
import { Trade, TradingStrategy } from "@/types";
import { auth, getStrategyById, updateTrade } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardGradient, 
  CardIcon, 
  CardValue 
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatPriceForPair, formatPips, formatProfitLoss, formatRiskReward } from "@/utils/format-number";
import { TradeStatus } from "@/lib/trade-status-config";
import { useIsMobile } from "@/hooks/use-mobile";
import DirectionBadge, { Direction } from "../History/DirectionBadge";
import TradeStatusBadge from "../History/TradeStatusBadge";
import { formatDistanceStrict } from 'date-fns';

// 1. Import the gallery and its styles
import 'photoswipe/dist/photoswipe.css';
import { Gallery, Item } from 'react-photoswipe-gallery';
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface TradeViewDetailsProps {
  trade: Trade;
  onDelete: (tradeId: string) => void;
  onBack: () => void;
}

// Helper to calculate trade duration, now robustly handling Firebase Timestamps
const getTradeDuration = (start: any, end: any): string => {
  if (!end) return 'Open';
  try {
    const startDate = start?.toDate ? start.toDate() : new Date(start);
    const endDate = end?.toDate ? end.toDate() : new Date(end);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return 'Invalid Date';
    }

    return formatDistanceStrict(endDate, startDate);
  } catch (error) {
    console.error("Error calculating trade duration:", error);
    return 'N/A';
  }
};

// Helper to calculate Risk/Reward ratio dynamically
const calculateRiskRewardRatio = (trade: Trade): number | null => {
    // Priority: Return pre-calculated RR if it exists
    if (trade.riskRewardRatio != null) {
        return trade.riskRewardRatio;
    }

    const entry = parseFloat(trade.entryPrice as string);
    const stop = parseFloat(trade.stopLoss as string);

    if (isNaN(entry) || isNaN(stop)) return null;

    const potentialRisk = Math.abs(entry - stop);
    if (potentialRisk === 0) return null;

    // For closed trades, calculate ACTUAL R:R
    if (trade.exitPrice) {
        const exit = parseFloat(trade.exitPrice as string);
        if (isNaN(exit)) return null;
        const actualReward = Math.abs(exit - entry);
        return actualReward / potentialRisk;
    }
    // For open trades, calculate EXPECTED R:R
    else if (trade.takeProfit) {
        const takeProfit = parseFloat(trade.takeProfit as string);
        if (isNaN(takeProfit)) return null;
        const potentialReward = Math.abs(takeProfit - entry);
        return potentialReward / potentialRisk;
    }

    return null;
};

export function TradeViewDetails({
  trade,
  onDelete,
  onBack
}: TradeViewDetailsProps) {
  const isMobile = useIsMobile();
  // We no longer need the state for the old dialog
  // const [showChartDialog, setShowChartDialog] = useState(false);
  const [strategyName, setStrategyName] = useState<string>("");
  const [notes, setNotes] = useState(trade.notes || '');
  const [closingNote, setClosingNote] = useState(trade.closingNote || '');
  const { toast } = useToast();

  const handleSaveNotes = async () => {
    const user = auth.currentUser;
    if (!user) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to save notes.",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateTrade(user.uid, trade.id, { notes, closingNote });
      toast({
        title: "Success",
        description: "Your notes have been saved.",
      });
    } catch (error) {
      console.error("Error saving notes:", error);
      toast({
        title: "Error",
        description: "There was a problem saving your notes. Please try again.",
        variant: "destructive",
      });
    }
  };


  useEffect(() => {
    const fetchStrategyName = async () => {
      if (!trade.strategy) {
        setStrategyName('No Strategy');
        return;
      }
      try {
        const user = auth.currentUser;
        if (!user) return;
        const strategyData = await getStrategyById(user.uid, trade.strategy) as unknown as TradingStrategy;
        setStrategyName(strategyData?.name || 'Unknown Strategy');
      } catch (error) {
        console.error('Error fetching strategy:', error);
        setStrategyName('Unknown Strategy');
      }
    };
    fetchStrategyName();
  }, [trade.strategy]);

  const tradeDuration = getTradeDuration(trade.createdAt, trade.closeDate);
  const calculatedRR = calculateRiskRewardRatio(trade);

  // 2. Prepare the list of images for the gallery
  const galleryImages = [
    { src: trade.entryImage, caption: 'Entry Chart (H4)' },
    { src: trade.entryImageM15, caption: 'Entry Chart (M15)' },
    { src: trade.exitImage, caption: 'Exit Chart (H4)' },
    { src: trade.exitImageM15, caption: 'Exit Chart (M15)' },
  ].filter(img => img.src); // Only include images that exist

  // Determine the primary image to show in the thumbnail
  const displayImage = trade.exitImage || trade.entryImage;

  const disciplineIssues = trade.discipline ? Object.entries(trade.discipline)
    .filter(([key, value]) => key !== 'followedPlan' && value === true)
    .map(([key]) => {
        const labels: { [key: string]: string } = {
            enteredEarly: 'Entered Early',
            revenge: 'Revenge Trading',
            overLeveraged: 'Over Leveraged',
            movedStopLoss: 'Moved Stop Loss',
        };
        return labels[key] || key;
    }) : [];

  const strategyConditionsMet = trade.strategyChecklist ? Object.entries(trade.strategyChecklist)
    .filter(([, value]) => value === true)
    .map(([key]) => key) : [];

  const marketContextTags = [
    trade.sessionType && { label: 'Session', value: trade.sessionType, icon: <Icons.ui.clock className="h-3 w-3" /> },
    trade.emotion && { label: 'Emotion', value: trade.emotion, icon: <Icons.ui.smile className="h-3 w-3" /> },
    trade.hasNews && { label: 'News Impact', value: 'Yes', icon: <Icons.general.newspaper className="h-3 w-3" /> },
  ].filter(Boolean) as { label: string, value: string, icon: JSX.Element }[];

  return (
    <>
      {/* 3. The old ChartImageDialog is now removed */}
      
      <Card className="mb-4 overflow-hidden relative border-border/50 card-spotlight">
        <CardGradient variant={!trade.result ? 'default' : (trade.result === 'WIN' || Number(trade.profitLoss) > 0 ? 'success' : (trade.result === 'LOSS' || Number(trade.profitLoss) < 0 ? 'destructive' : 'warning'))} intensity="subtle" direction="top-right" />
        <CardContent className="p-0">
          <div className="flex justify-between items-center px-4 py-2 border-b border-border/40">
              <h3 className="text-lg font-semibold flex items-center">
                  <Icons.ui.eye className="h-5 w-5 mr-2 text-primary" />
                  Trade Details
              </h3>
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" onClick={() => onDelete(trade.id)} className="h-8 action-button-delete"><Icons.trade.trash className="h-4 w-4 mr-1" />{!isMobile && <span>Delete</span>}</Button>
                <Button variant="outline" size="sm" onClick={onBack} className="h-8"><Icons.trade.arrowLeft className="h-4 w-4 mr-1" />{!isMobile && <span>Back</span>}</Button>
              </div>
          </div>

          {/* --- Main Content --- */}
          <div className="p-4">
            {/* Top Section: Image, Pair, etc. */}
            <div className="flex flex-col md:flex-row gap-4">
              {/* 4. Implement the Gallery */}
              <Gallery withCaption>
                <div className="relative w-full md:w-48 h-48 flex-shrink-0 group overflow-hidden rounded-md border border-border/30 shadow-sm bg-card/40">
                    
                    {galleryImages.length > 0 ? (
                      // The first Item is the visible thumbnail
                      <Item
                        original={galleryImages[0].src!}
                        thumbnail={displayImage!}
                        caption={galleryImages[0].caption}
                        width="1920"
                        height="1080"
                      >
                        {({ ref, open }) => (
                          <div ref={ref as React.RefObject<HTMLDivElement>} onClick={open} className="w-full h-full cursor-pointer">
                            <img src={displayImage!} alt={`${trade.pair} trade thumbnail`} className="trade-card-image loaded" />
                            <div className="trade-card-zoom-overlay"><Icons.ui.maximize className="h-6 w-6 text-white" /></div>
                          </div>
                        )}
                      </Item>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground bg-muted/10">
                        <Icons.ui.maximize className="h-8 w-8 mb-2 opacity-40" />
                        <span>No Chart Image</span>
                      </div>
                    )}

                    {/* These are the hidden items that complete the gallery */}
                    <div style={{ display: 'none' }}>
                      {galleryImages.slice(1).map((image, index) => (
                        <Item
                          key={index}
                          original={image.src!}
                          thumbnail={image.src!}
                          caption={image.caption}
                          width="1920"
                          height="1080"
                        >
                          {/* These only need the ref to be part of the gallery */}
                          {({ ref }) => <div ref={ref as React.RefObject<HTMLDivElement>}></div>}
                        </Item>
                      ))}
                    </div>
                    
                    <div className="trade-direction-badge"><DirectionBadge direction={trade.direction as Direction} showTooltip={false} size="sm" variant="modern" /></div>
                    {trade.result && <div className="trade-result-badge"><TradeStatusBadge status={trade.result as TradeStatus} showTooltip={false} size="sm" /></div>}
                </div>
              </Gallery>

                {/* ================================================================== */}
                {/* EVERYTHING BELOW THIS LINE IS UNCHANGED AND KEPT IN ITS ORIGINAL STATE */}
                {/* ================================================================== */}

                <div className="p-0 flex-grow">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                        <div className="flex items-center gap-2"><CardIcon color={trade.direction === "BUY" ? "primary" : "destructive"} size="sm" variant="soft">{trade.direction === "BUY" ? <Icons.trade.arrowUp className="h-3.5 w-3.5" /> : <Icons.trade.arrowDown className="h-3.5 w-3.5" />}</CardIcon><h3 className="text-lg font-semibold">{trade.pair}</h3></div>
                        <div className="flex mt-2 md:mt-0 items-center"><CardIcon color="muted" size="sm" variant="soft" className="mr-1.5"><Icons.analytics.barChart className="h-3.5 w-3.5" /></CardIcon><span className="text-sm text-muted-foreground font-medium">{strategyName}</span></div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm app-accordion-content-section">
                        <div className="flex flex-col"><span className="text-xs text-muted-foreground card-label">Entry</span><span className="font-medium">{formatPriceForPair(trade.entryPrice, trade.pair)}</span></div>
                        <div className="flex flex-col"><span className="text-xs text-muted-foreground card-label">Exit</span><span className="font-medium">{trade.exitPrice ? formatPriceForPair(trade.exitPrice, trade.pair) : 'Open'}</span></div>
                        <div className="flex flex-col"><span className="text-xs text-muted-foreground card-label">Stop Loss</span><span className="font-medium">{formatPriceForPair(trade.stopLoss, trade.pair)}</span></div>
                        <div className="flex flex-col"><span className="text-xs text-muted-foreground card-label">Take Profit</span><span className="font-medium">{formatPriceForPair(trade.takeProfit, trade.pair)}</span></div>
                        <div className="flex flex-col"><span className="text-xs text-muted-foreground card-label">Pips</span><CardValue size="sm" status={Number(trade.pips) > 0 ? 'success' : Number(trade.pips) < 0 ? 'danger' : 'neutral'} trend={Number(trade.pips) > 0 ? 'up' : Number(trade.pips) < 0 ? 'down' : 'neutral'}>{formatPips(Number(trade.pips), { showPlusSign: true })}</CardValue></div>
                        <div className="flex flex-col"><span className="text-xs text-muted-foreground card-label">P/L</span><CardValue size="sm" status={Number(trade.profitLoss) > 0 ? 'success' : Number(trade.profitLoss) < 0 ? 'danger' : 'neutral'} trend={Number(trade.profitLoss) > 0 ? 'up' : Number(trade.profitLoss) < 0 ? 'down' : 'neutral'}>{formatProfitLoss(Number(trade.profitLoss), { showPlusSign: true })}</CardValue></div>
                        {calculatedRR != null && <div className="flex flex-col"><span className="text-xs text-muted-foreground card-label">R/R Ratio</span><span className="font-medium">{formatRiskReward(calculatedRR)}</span></div>}
                        {trade.closeDate && <div className="flex flex-col"><span className="text-xs text-muted-foreground card-label">Duration</span><span className="font-medium">{tradeDuration}</span></div>}
                    </div>
                </div>
            </div>

            {/* --- Analysis Section --- */}
            <div className="mt-6 space-y-6">
              {/* Strategy Checklist */}
              {strategyConditionsMet.length > 0 && (
                <div>
                  <h4 className="text-base font-semibold mb-2 flex items-center"><Icons.trade.checklist className="h-4 w-4 mr-2 text-primary" />Strategy Conditions Met</h4>
                  <div className="flex flex-wrap gap-2">
                    {strategyConditionsMet.map(condition => (
                      <div key={condition} className="flex items-center text-xs py-1 px-2.5 rounded-full bg-primary/10 text-primary-foreground">
                        <Icons.ui.check className="h-3 w-3 mr-1.5 text-success" /> {condition}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Psychology & Discipline */}
              {disciplineIssues.length > 0 && (
                <div>
                  <h4 className="text-base font-semibold mb-2 flex items-center"><Icons.general.userCog className="h-4 w-4 mr-2 text-destructive" />Psychology & Discipline Issues</h4>
                  <div className="flex flex-wrap gap-2">
                    {disciplineIssues.map(issue => (
                      <div key={issue} className="flex items-center text-xs py-1 px-2.5 rounded-full bg-destructive/10 text-destructive-foreground">
                        <Icons.ui.alertTriangle className="h-3 w-3 mr-1.5" /> {issue}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Market Context */}
              {marketContextTags.length > 0 && (
                <div>
                  <h4 className="text-base font-semibold mb-2 flex items-center"><Icons.general.globe className="h-4 w-4 mr-2 text-muted-foreground" />Market Context</h4>
                  <div className="flex flex-wrap gap-2">
                    {marketContextTags.map(tag => (
                      <div key={tag.label} className="flex items-center text-xs py-1 px-2.5 rounded-full bg-muted/50 text-muted-foreground">
                        {tag.icon} <span className="ml-1.5">{tag.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* --- Notes Section --- */}
            <div className="mt-6 space-y-4">
                <div className="app-accordion-content-section p-4">
                    <h4 className="text-base font-semibold mb-2 flex items-center"><Icons.general.notebook className="h-4 w-4 mr-2 text-primary" />Entry Notes</h4>
                    <Textarea 
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add notes about your trade entry..."
                        className="text-sm"
                    />
                </div>
                <div className="app-accordion-content-section p-4">
                    <h4 className="text-base font-semibold mb-2 flex items-center"><Icons.general.notebookText className="h-4 w-4 mr-2" />Closing Notes</h4>
                    <Textarea 
                        value={closingNote}
                        onChange={(e) => setClosingNote(e.target.value)}
                        placeholder="Add notes about your trade exit, what you learned, etc."
                        className="text-sm"
                    />
                </div>
                <div className="px-4">
                    <Button onClick={handleSaveNotes} size="sm">
                        <Icons.ui.save className="h-3.5 w-3.5 mr-2" />
                        Save Notes
                    </Button>
                </div>
            </div>

          </div>
          
          {/* --- Footer --- */}
          <div className="border-t border-border/40 px-4 py-2 text-center text-xs text-muted-foreground">
             Trade ID: {trade.id}
          </div>

        </CardContent>
      </Card>
    </>
  );
}

export default TradeViewDetails;
