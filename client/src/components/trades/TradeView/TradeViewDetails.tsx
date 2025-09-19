
import { useState, useEffect, useMemo } from "react";
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
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return 'Invalid Date';
    return formatDistanceStrict(endDate, startDate);
  } catch (error) {
    console.error("Error calculating trade duration:", error);
    return 'N/A';
  }
};

// Helper to calculate Risk/Reward ratio dynamically
const calculateRiskRewardRatio = (trade: Trade): number | null => {
    if (trade.riskRewardRatio != null) return trade.riskRewardRatio;
    const entry = parseFloat(trade.entryPrice as string);
    const stop = parseFloat(trade.stopLoss as string);
    if (isNaN(entry) || isNaN(stop)) return null;
    const potentialRisk = Math.abs(entry - stop);
    if (potentialRisk === 0) return null;
    if (trade.exitPrice) {
        const exit = parseFloat(trade.exitPrice as string);
        if (isNaN(exit)) return null;
        const actualReward = Math.abs(exit - entry);
        return actualReward / potentialRisk;
    }
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
  const [strategy, setStrategy] = useState<TradingStrategy | null>(null);
  const [notes, setNotes] = useState(trade.notes || '');
  const [closingNote, setClosingNote] = useState(trade.closingNote || '');
  const { toast } = useToast();

  const handleSaveNotes = async () => {
    const user = auth.currentUser;
    if (!user) {
      toast({ title: "Authentication Error", description: "You must be logged in to save notes.", variant: "destructive" });
      return;
    }
    try {
      await updateTrade(user.uid, trade.id, { notes, closingNote });
      toast({ title: "Success", description: "Your notes have been saved." });
    } catch (error) {
      console.error("Error saving notes:", error);
      toast({ title: "Error", description: "There was a problem saving your notes. Please try again.", variant: "destructive" });
    }
  };

  useEffect(() => {
    const fetchStrategy = async () => {
      if (!trade.strategy) {
        setStrategy(null);
        return;
      }
      try {
        const user = auth.currentUser;
        if (!user) return;
        const strategyData = await getStrategyById(user.uid, trade.strategy) as TradingStrategy;
        setStrategy(strategyData);
      } catch (error) {
        console.error('Error fetching strategy:', error);
        setStrategy(null);
      }
    };
    fetchStrategy();
  }, [trade.strategy]);

  // --- CORRECTLY PARSE ALL TRADE DETAILS --- 

  const disciplineIssues = useMemo(() => {
    const issues = [];
    const labels: { [key: string]: string } = {
        enteredEarly: 'Entered Early',
        revenge: 'Revenge Trading',
        overLeveraged: 'Over Leveraged',
        movedStopLoss: 'Moved Stop Loss',
    };
    if (trade.followedPlan === false) {
        issues.push("Did Not Follow Plan");
    }
    for (const key in labels) {
        if (trade[key as keyof Trade] === true) {
            issues.push(labels[key]);
        }
    }
    return issues;
  }, [trade]);

  const strategyConditionsMet = useMemo(() => {
    if (!strategy || !strategy.entryConditions || !trade.usedEntryConditions) {
        return [];
    }
    const usedIds = new Set(trade.usedEntryConditions);
    return strategy.entryConditions
        .filter(condition => usedIds.has(condition.id))
        .map(condition => condition.name);
  }, [strategy, trade.usedEntryConditions]);

  const marketContextTags = useMemo(() => [
    trade.sessionType && { label: 'Session', value: trade.sessionType, icon: <Icons.general.clock className="h-3 w-3" /> },
    trade.emotion && { label: 'Emotion', value: trade.emotion, icon: <Icons.analytics.brain className="h-3 w-3" /> },
    trade.hasNews && { label: 'News Impact', value: 'Yes', icon: <Icons.general.newspaper className="h-3 w-3" /> },
    trade.marketCondition && { label: 'Market Condition', value: trade.marketCondition, icon: <Icons.analytics.trendingUp className="h-3 w-3" /> },
    trade.techPattern && { label: 'Tech. Pattern', value: trade.techPattern, icon: <Icons.analytics.lineChart className="h-3 w-3" /> },
  ].filter(Boolean) as { label: string, value: string, icon: JSX.Element }[], 
  [trade.sessionType, trade.emotion, trade.hasNews, trade.marketCondition, trade.techPattern]);

  // --- END OF PARSING LOGIC --- 

  const tradeDuration = getTradeDuration(trade.createdAt, trade.closeDate);
  const calculatedRR = calculateRiskRewardRatio(trade);

  const galleryImages = [
    { src: trade.entryImage, caption: 'Entry Chart (H4)' },
    { src: trade.entryImageM15, caption: 'Entry Chart (M15)' },
    { src: trade.exitImage, caption: 'Exit Chart (H4)' },
    { src: trade.exitImageM15, caption: 'Exit Chart (M15)' },
  ].filter(img => img.src);

  const displayImage = trade.exitImage || trade.entryImage;

  const AnalysisSection = ({ title, icon, data, emptyText, tagClass, textClass, iconClass }: any) => (
    <div>
      <h4 className="text-base font-semibold mb-2 flex items-center">{icon} {title}</h4>
      <div className="flex flex-wrap gap-2">
        {data.length > 0 ? (
          data.map((item: any, index: number) => (
            <div key={index} className={cn("flex items-center text-xs py-1 px-2.5 rounded-full", tagClass)}>
              <div className={cn("mr-1.5", iconClass)}>{item.icon}</div> {item.value}
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">{emptyText}</p>
        )}
      </div>
    </div>
  );

  return (
    <>
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

          <div className="p-4">
            
            <Gallery withCaption>
              <div className="relative w-full aspect-video group overflow-hidden rounded-md border border-border/30 shadow-sm bg-card/40 mb-4">
                  {galleryImages.length > 0 ? (
                    <Item
                      original={galleryImages[0].src!}
                      thumbnail={displayImage!}
                      caption={galleryImages[0].caption}
                      width="1920"
                      height="1080"
                    >
                      {({ ref, open }) => (
                        <div ref={ref as React.RefObject<HTMLDivElement>} onClick={open} className="w-full h-full cursor-pointer">
                          <img src={displayImage!} alt={`${trade.pair} trade thumbnail`} className="trade-card-image loaded w-full h-full object-cover" />
                          <div className="trade-card-zoom-overlay"><Icons.ui.maximize className="h-8 w-8 text-white" /></div>
                        </div>
                      )}
                    </Item>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground bg-muted/10">
                      <Icons.ui.image className="h-10 w-10 mb-2 opacity-40" />
                      <span>No Chart Image</span>
                    </div>
                  )}

                  <div style={{ display: 'none' }}>
                    {galleryImages.slice(1).map((image, index) => (
                      <Item key={index} original={image.src!} thumbnail={image.src!} caption={image.caption} width="1920" height="1080">
                        {({ ref }) => <div ref={ref as React.RefObject<HTMLDivElement>}></div>}
                      </Item>
                    ))}
                  </div>
                  
                  <div className="trade-direction-badge"><DirectionBadge direction={trade.direction as Direction} showTooltip={false} size="sm" variant="modern" /></div>
                  {trade.result && <div className="trade-result-badge"><TradeStatusBadge status={trade.result as TradeStatus} showTooltip={false} size="sm" /></div>}
              </div>
            </Gallery>

            <div className="p-0 w-full mb-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                    <div className="flex items-center gap-2 mb-2 md:mb-0">
                        <CardIcon color={trade.direction === "BUY" ? "primary" : "destructive"} size="sm" variant="soft">{trade.direction === "BUY" ? <Icons.trade.arrowUp className="h-3.5 w-3.5" /> : <Icons.trade.arrowDown className="h-3.5 w-3.5" />}</CardIcon>
                        <h3 className="text-2xl font-semibold">{trade.pair}</h3>
                    </div>
                    <div className="flex items-center">
                        <CardIcon color="muted" size="sm" variant="soft" className="mr-1.5">
                            <Icons.analytics.barChart className="h-3.5 w-3.5" />
                        </CardIcon>
                        <span className="text-sm text-muted-foreground font-medium">{strategy?.name || 'No Strategy'}</span>
                    </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm app-accordion-content-section">
                    <div className="flex flex-col"><span className="text-xs text-muted-foreground card-label">Entry</span><span className="font-medium">{formatPriceForPair(trade.entryPrice, trade.pair)}</span></div>
                    <div className="flex flex-col"><span className="text-xs text-muted-foreground card-label">Exit</span><span className="font-medium">{trade.exitPrice ? formatPriceForPair(trade.exitPrice, trade.pair) : 'Open'}</span></div>
                    <div className="flex flex-col"><span className="text-xs text-muted-foreground card-label">Stop Loss</span><span className="font-medium">{formatPriceForPair(trade.stopLoss, trade.pair)}</span></div>
                    <div className="flex flex-col"><span className="text-xs text-muted-foreground card-label">Take Profit</span><span className="font-medium">{formatPriceForPair(trade.takeProfit, trade.pair)}</span></div>
                    <div className="flex flex-col"><span className="text-xs text-muted-foreground card-label">Lot Size</span><span className="font-medium">{trade.lotSize}</span></div>
                    <div className="flex flex-col"><span className="text-xs text-muted-foreground card-label">Pips</span><CardValue size="sm" status={Number(trade.pips) > 0 ? 'success' : Number(trade.pips) < 0 ? 'danger' : 'neutral'} trend={Number(trade.pips) > 0 ? 'up' : Number(trade.pips) < 0 ? 'down' : 'neutral'}>{formatPips(Number(trade.pips), { showPlusSign: true })}</CardValue></div>
                    <div className="flex flex-col"><span className="text-xs text-muted-foreground card-label">P/L</span><CardValue size="sm" status={Number(trade.profitLoss) > 0 ? 'success' : Number(trade.profitLoss) < 0 ? 'danger' : 'neutral'} trend={Number(trade.profitLoss) > 0 ? 'up' : Number(trade.profitLoss) < 0 ? 'down' : 'neutral'}>{formatProfitLoss(Number(trade.profitLoss), { showPlusSign: true })}</CardValue></div>
                    {calculatedRR != null && <div className="flex flex-col"><span className="text-xs text-muted-foreground card-label">R/R Ratio</span><span className="font-medium">{formatRiskReward(calculatedRR)}</span></div>}
                    {trade.closeDate && <div className="flex flex-col"><span className="text-xs text-muted-foreground card-label">Duration</span><span className="font-medium">{tradeDuration}</span></div>}
                </div>
            </div>

            <div className="space-y-6 mb-6 p-4 border rounded-md">
                <AnalysisSection 
                    title="Strategy Conditions Met"
                    icon={<Icons.trade.checklist className="h-4 w-4 mr-2 text-primary" />}
                    data={strategyConditionsMet.map(c => ({ value: c, icon: <Icons.ui.check className="h-3 w-3 text-success" /> }))}
                    emptyText="No strategy conditions were recorded."
                    tagClass="bg-primary/10 text-primary-foreground"
                />
                <AnalysisSection 
                    title="Psychology & Discipline Issues"
                    icon={<Icons.general.userCog className="h-4 w-4 mr-2 text-destructive" />}
                    data={disciplineIssues.map(i => ({ value: i, icon: <Icons.ui.alertTriangle className="h-3 w-3" /> }))}
                    emptyText="No discipline issues were recorded."
                    tagClass="bg-destructive/10 text-destructive-foreground"
                    iconClass="text-destructive"
                />
                <AnalysisSection 
                    title="Market Context"
                    icon={<Icons.general.globe className="h-4 w-4 mr-2 text-muted-foreground" />}
                    data={marketContextTags}
                    emptyText="No market context tags were added."
                    tagClass="bg-muted/50 text-muted-foreground"
                    iconClass="text-muted-foreground"
                />
            </div>

            <div className="space-y-4">
                <div className="app-accordion-content-section p-4 border rounded-md">
                    <h4 className="text-base font-semibold mb-2 flex items-center"><Icons.general.notebook className="h-4 w-4 mr-2 text-primary" />Entry Notes</h4>
                    <Textarea 
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add notes about your trade entry..."
                        className="text-sm"
                    />
                </div>
                <div className="app-accordion-content-section p-4 border rounded-md">
                    <h4 className="text-base font-semibold mb-2 flex items-center"><Icons.general.notebookText className="h-4 w-4 mr-2" />Closing Notes</h4>
                    <Textarea 
                        value={closingNote}
                        onChange={(e) => setClosingNote(e.target.value)}
                        placeholder="Add notes about your trade exit, what you learned, etc."
                        className="text-sm"
                    />
                </div>
                <div>
                    <Button onClick={handleSaveNotes} size="sm">
                        <Icons.ui.save className="h-3.5 w-3.5 mr-2" />
                        Save Notes
                    </Button>
                </div>
            </div>
          </div>
          
          <div className="border-t border-border/40 px-4 py-2 text-center text-xs text-muted-foreground mt-4">
             Trade ID: {trade.id}
          </div>

        </CardContent>
      </Card>
    </>
  );
}

export default TradeViewDetails;
