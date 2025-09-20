
import { useState, useEffect, useMemo, Children, ReactNode } from "react";
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
import { Badge } from "@/components/ui/badge";
import { useStrategies } from '@/hooks/use-strategies';
// --- SUB-COMPONENTS (Moved to top-level) ---

const ChecklistItem = ({ label, value, isBoolean = false }: { label: string, value: string | boolean, isBoolean?: boolean }) => (
    <div className="flex items-center justify-between text-sm py-1.5 px-2 rounded-md bg-muted/30">
        <span className="text-muted-foreground">{label}</span>
        {isBoolean ? (
             <Badge variant={value ? "success" : "secondary"}>{value ? 'Yes' : 'No'}</Badge>
        ) : (
            <span className="font-medium">{String(value) || "N/A"}</span>
        )}
    </div>
);

const AnalysisSection = ({ title, icon, children, emptyText }: { title: string, icon: JSX.Element, children: ReactNode, emptyText: string }) => {
  const childrenArray = Children.toArray(children);
  const hasChildren = childrenArray.length > 0 && childrenArray.some(child => child !== null && child !== false && child !== undefined);

  return (
      <div>
          <h4 className="text-base font-semibold mb-3 flex items-center">{icon} {title}</h4>
          {hasChildren ? (
              <div className="space-y-2">{children}</div>
          ) : (
              <p className="text-sm text-muted-foreground px-2">{emptyText}</p>
          )}
      </div>
  );
};


// --- HELPER FUNCTIONS ---

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

// --- MAIN COMPONENT ---

interface TradeViewDetailsProps {
  trade: Trade;
  onDelete: (tradeId: string) => void;
  onBack: () => void;
}

export function TradeViewDetails({
  trade,
  onDelete,
  onBack
}: TradeViewDetailsProps) {
  const isMobile = useIsMobile();
  const { data: strategies = [] } = useStrategies();
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

  const strategy: TradingStrategy | undefined = useMemo(() => {
    const strategyId = trade?.strategy;
    if (!strategyId || !strategies.length) {
      return undefined; // Trả về undefined nếu không có ID hoặc không có danh sách strategies
    }
    return strategies.find(s => s.id === strategyId);
  }, [trade?.strategy, strategies]);
  
  const tradingRulesChecklist = useMemo(() => {
    if (!strategy || !strategy.rules) return [];
    const usedIds = new Set(trade.usedRules || []);
    return strategy.rules.map(rule => ({ label: rule.label, value: usedIds.has(rule.id) }));
  }, [strategy, trade.usedRules]);

  const entryConditionsChecklist = useMemo(() => {
    if (!strategy || !strategy.entryConditions) return [];
    const usedIds = new Set(trade.usedEntryConditions || []);
    return strategy.entryConditions.map(condition => ({ label: condition.label, value: usedIds.has(condition.id) }));
  }, [strategy, trade.usedEntryConditions]);

  const disciplineChecklist = useMemo(() => [
      { label: 'Followed Plan', value: trade.followedPlan !== false },
      { label: 'Entered Early', value: trade.enteredEarly === true },
      { label: 'Revenge Trading', value: trade.revenge === true },
      { label: 'Over Leveraged', value: trade.overLeveraged === true },
      { label: 'Moved Stop Loss', value: trade.movedStopLoss === true },
  ], [trade]);

  const marketContextList = useMemo(() => {
    const context = [
      trade.sessionType && { label: 'Session', value: trade.sessionType },
      trade.emotion && { label: 'Emotion', value: trade.emotion },
      trade.marketCondition && { label: 'Market Condition', value: trade.marketCondition },
      trade.techPattern && { label: 'Technical Pattern', value: trade.techPattern },
      { label: 'News Impact', value: trade.hasNews === true, isBoolean: true }
    ].filter(Boolean);
    return context;
  }, [trade]);

  const tradeDuration = getTradeDuration(trade.createdAt, trade.closeDate);
  const calculatedRR = calculateRiskRewardRatio(trade);

  const galleryImages = useMemo(() => [
    { src: trade.entryImage, caption: 'Entry Chart (H4)' },
    { src: trade.entryImageM15, caption: 'Entry Chart (M15)' },
    { src: trade.exitImage, caption: 'Exit Chart (H4)' },
    { src: trade.exitImageM15, caption: 'Exit Chart (M15)' },
  ].filter(img => img.src), [trade]);

  const isTradeOpen = !trade.closeDate && !trade.result;

  const { displayUrl, imageType } = useMemo(() => {
    if (!isTradeOpen && trade.exitImageM15) return { displayUrl: trade.exitImageM15, imageType: 'exitM15' };
    if (trade.entryImageM15) return { displayUrl: trade.entryImageM15, imageType: 'entryM15' };
    if (!isTradeOpen && trade.exitImage) return { displayUrl: trade.exitImage, imageType: 'exitH4' };
    if (trade.entryImage) return { displayUrl: trade.entryImage, imageType: 'entryH4' };
    return { displayUrl: null, imageType: '' };
  }, [isTradeOpen, trade]);

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
                  {galleryImages.length > 0 && displayUrl ? (
                    <Item
                      original={displayUrl}
                      thumbnail={displayUrl}
                      caption={`${imageType.includes('entry') ? 'Entry' : 'Exit'} Chart (${imageType.includes('M15') ? 'M15' : 'H4'})`}
                      width="1920"
                      height="1080"
                    >
                      {({ ref, open }) => (
                        <div ref={ref as React.RefObject<HTMLDivElement>} onClick={open} className="w-full h-full cursor-pointer">
                          <img src={displayUrl} alt={`${trade.pair} trade thumbnail`} className="trade-card-image loaded w-full h-full object-cover" />
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
                    {galleryImages.filter(img => img.src !== displayUrl).map((image, index) => (
                      <Item key={index} original={image.src!} thumbnail={image.src!} caption={image.caption} width="1920" height="1080">
                        {({ ref }) => <div ref={ref as React.RefObject<HTMLDivElement>}></div>}
                      </Item>
                    ))}
                  </div>
                  
                  <div className="trade-direction-badge"><DirectionBadge direction={trade.direction as Direction} showTooltip={false} size="sm" variant="modern" /></div>
                  {trade.result && <div className="trade-result-badge"><TradeStatusBadge status={trade.result as TradeStatus} showTooltip={false} size="sm" /></div>}
                  {imageType && <div className="trade-card-timeframe-badge">{imageType.includes('M15') ? 'M15' : 'H4'} - {imageType.includes('entry') ? 'Entry' : 'Exit'}</div>}
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
                        <span className="text-sm text-muted-foreground font-medium">{strategy?.name || trade.strategy || 'N/A'}</span>
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

            <div className="space-y-8 mb-6 p-4 border rounded-md">
                <AnalysisSection 
                    title="Trading Rules"
                    icon={<Icons.trade.listChecks className="h-4 w-4 mr-2 text-primary" />}
                    emptyText="No trading rules were assigned to this strategy, or none were met."
                >
                    {tradingRulesChecklist.map((item, index) => (
                        <ChecklistItem key={index} label={item.label} value={item.value} isBoolean={true} />
                    ))}
                </AnalysisSection>

                <AnalysisSection 
                    title="Entry Conditions"
                    icon={<Icons.trade.checklist className="h-4 w-4 mr-2 text-primary" />}
                    emptyText="No entry conditions were assigned to this strategy, or none were met."
                >
                    {entryConditionsChecklist.map((item, index) => (
                         <ChecklistItem key={index} label={item.label} value={item.value} isBoolean={true} />
                    ))}
                </AnalysisSection>

                <AnalysisSection 
                    title="Psychology & Discipline"
                    icon={<Icons.general.userCog className="h-4 w-4 mr-2 text-primary" />}
                    emptyText="No discipline data was recorded for this trade."
                >
                   {disciplineChecklist.map((item, index) => (
                        <div key={index} className="flex items-center justify-between text-sm py-1.5 px-2 rounded-md bg-muted/30">
                            <span className="text-muted-foreground">{item.label}</span>
                            <Badge variant={item.label === 'Followed Plan' ? (item.value ? "success" : "destructive") : (item.value ? "destructive" : "success")}>
                                {item.label === 'Followed Plan' ? (item.value ? 'Yes' : 'No') : (item.value ? 'Yes' : 'No')}
                            </Badge>
                        </div>
                    ))}
                </AnalysisSection>

                <AnalysisSection 
                    title="Market Context"
                    icon={<Icons.general.globe className="h-4 w-4 mr-2 text-primary" />}
                    emptyText="No market context was recorded for this trade."
                >
                    {marketContextList.map((item, index) => (
                        item && <ChecklistItem key={index} label={item.label} value={item.value} isBoolean={item.isBoolean} />
                    ))}
                </AnalysisSection>
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
