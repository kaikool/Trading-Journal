import { useState, useEffect, useRef, useMemo } from 'react';
import { auth, getStrategyById } from '@/lib/firebase';
import { 
  Card, 
  CardContent, 
  CardIcon, 
  CardGradient,
  CardValue
} from "@/components/ui/card";

import { Icons } from "@/components/icons/icons";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { useLocation } from "wouter";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { formatCurrency, formatPriceForPair, formatPips, formatProfitLoss } from "@/utils/format-number";
import { formatTimestamp } from "@/lib/format-timestamp";
import { useInView } from "react-intersection-observer";
import LazyCloseTradeForm from "../TradeView/LazyCloseTradeForm";
import { TradeStatus } from "@/lib/trade-status-config";
import TradeStatusBadge from "./TradeStatusBadge";
import DirectionBadge from "./DirectionBadge";
import { ChartImageDialog } from "../TradeView/ChartImageDialog";
import { useCachedImage } from "@/hooks/use-cached-image";
import { TradingStrategy } from "@/types";
import { debug } from "@/lib/debug";

// Component này không gọi trực tiếp TradeUpdateService
// được cập nhật qua:
// 1. Key prop dựa trên updateTrigger trong TradeHistory.tsx
// 2. Tham chiếu tới prop trade mới khi danh sách trades thay đổi
// 3. Memo hóa để tối ưu hiệu suất khi không cần thiết re-render

interface TradeHistoryCardProps {
  trade: any;
  onEdit: () => void;
  onDelete: (tradeId: string) => void;
}

/**
 * LazyTradeHistoryCard - Card component for displaying trade history with lazy loading
 * 
 * This component:
 * 1. Uses lazy loading for images with threshold and IntersectionObserver
 * 2. Has been optimized for performance with memo, useRef, and callback functions
 * 3. Only renders content when in viewport (using react-intersection-observer)
 */
function LazyTradeHistoryCard({ trade, onEdit, onDelete }: TradeHistoryCardProps) {
  const [, setLocation] = useLocation();
  const isMobile = useIsMobile();
  
  // Sử dụng react-intersection-observer để chỉ render khi card nằm trong viewport
  const { ref, inView } = useInView({
    threshold: 0.1,     // Trigger khi 10% card hiện ra trong viewport
    triggerOnce: true,  // Chỉ trigger một lần để tránh re-render liên tục
    rootMargin: '100px', // Giảm khoảng cách pre-load để giảm số lượng card cần theo dõi
  });
  
  // Log trạng thái inView để debug
  useEffect(() => {
    if (trade && trade.id) {
      debug(`[SCROLL-DEBUG][${trade.id}] Card inView changed: ${inView}`);
    }
  }, [inView, trade]);
  
  // Lazy state cho hình ảnh
  const [imageLoaded, setImageLoaded] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const [showCloseForm, setShowCloseForm] = useState(false);
  // State cho dialog xem ảnh biểu đồ
  const [showChartDialog, setShowChartDialog] = useState(false);
  // State cho strategy name
  const [strategyName, setStrategyName] = useState<string>('');
  const [isLoadingStrategy, setIsLoadingStrategy] = useState<boolean>(false);
  
  // Lấy giá trị từ trade một cách an toàn
  const {
    id = '', 
    pair = '',
    direction = 'BUY',
    entryPrice = 0,
    exitPrice = 0,
    result = '',
    pips = 0,
    profitLoss = 0,
    strategy = 'Unknown',
    createdAt,
    closeDate,
    entryImage,
    entryImageM15,
    exitImage,
    exitImageM15
  } = trade || {};
  
  // Calculate time difference in user-friendly format
  const createdDateStr = createdAt ? formatTimestamp(createdAt) : 'Unknown';
  const closeDateStr = closeDate ? formatTimestamp(closeDate) : 'Open';
  
  // Kiểm tra nếu giao dịch đang mở (chưa có closeDate hoặc result)
  const isTradeOpen = !closeDate && !result;
  
  // Only handle user interaction if card is in view
  const handleViewTrade = () => {
    if (inView) {
      setLocation(`/trade/view/${id}`);
    }
  };
  
  const handleEdit = () => {
    if (inView) {
      onEdit();
    }
  };
  
  const handleDelete = () => {
    if (inView) {
      onDelete(id);
    }
  };
  
  const handleCloseTrade = () => {
    if (inView) {
      setShowCloseForm(true);
    }
  };
  
  // Handler để mở dialog xem ảnh
  const handleOpenChartDialog = (e: React.MouseEvent) => {
    if (inView) {
      e.stopPropagation();
      setShowChartDialog(true);
    }
  };
  
  // Xác định ảnh nào sẽ hiển thị dựa trên trạng thái lệnh và loại ảnh
  const { displayUrl, imageType } = useMemo(() => {
    // Nếu lệnh chưa đóng, hiển thị ảnh M15 lúc vào lệnh
    if (isTradeOpen && entryImageM15) {
      return { displayUrl: entryImageM15, imageType: 'entryM15' };
    }
    // Nếu lệnh đã đóng, hiển thị ảnh M15 lúc đóng lệnh (nếu có)
    else if (!isTradeOpen && exitImageM15) {
      return { displayUrl: exitImageM15, imageType: 'exitM15' };
    }
    // Fallback: ảnh H4 lúc vào lệnh nếu có
    else if (entryImage) {
      return { displayUrl: entryImage, imageType: 'entryH4' };
    }
    // Fallback: ảnh H4 lúc đóng lệnh nếu có
    else if (exitImage) {
      return { displayUrl: exitImage, imageType: 'exitH4' };
    }
    // Không có ảnh
    return { displayUrl: null, imageType: '' };
  }, [isTradeOpen, entryImage, entryImageM15, exitImage, exitImageM15]);

  // Sử dụng hook cache ảnh cho hiệu suất tốt hơn
  const { 
    imageUrl: cachedImageUrl, 
    isLoading: isImageLoading, 
    error: imageError 
  } = useCachedImage(displayUrl, {
    tradeId: id,
    imageType,
    placeholder: '/icons/blank-chart.svg',
  });

  // Theo dõi trạng thái ảnh
  useEffect(() => {
    if (trade && trade.id) {
      debug(`[SCROLL-DEBUG][${trade.id}] Image state: cachedUrl=${!!cachedImageUrl}, isLoading=${isImageLoading}`);
      
      if (cachedImageUrl && !isImageLoading) {
        debug(`[SCROLL-DEBUG][${trade.id}] Image loaded successfully`);
        setImageLoaded(true);
      }
    }
  }, [cachedImageUrl, isImageLoading, trade]);
  
  // Load strategy name from ID when component is in view
  useEffect(() => {
    const fetchStrategyName = async () => {
      if (!inView || !strategy || strategy === 'Unknown') return;
      
      try {
        setIsLoadingStrategy(true);
        const user = auth.currentUser;
        if (!user) return;
        
        const strategyData = await getStrategyById(user.uid, strategy);
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
  }, [inView, strategy]);
  


  // Optimized rendering with conditions
  return (
    <div ref={ref}>
      {/* Dialog cho xem ảnh biểu đồ */}
      <ChartImageDialog
        isOpen={showChartDialog}
        onClose={() => setShowChartDialog(false)}
        entryImage={entryImage}
        entryImageM15={entryImageM15}
        exitImage={exitImage}
        exitImageM15={exitImageM15}
        isTradeOpen={isTradeOpen}
        tradePair={pair}
        tradeId={id}
      />
    
      {/* Form đóng giao dịch */}
      {showCloseForm && (
        <LazyCloseTradeForm
          trade={trade}
          isOpen={showCloseForm}
          onClose={() => setShowCloseForm(false)}
          onSuccess={() => {
            setShowCloseForm(false);
            console.log("Trade closed successfully, waiting for Firestore update");
          }}
        />
      )}

      {inView ? (
        <Card 
          className={cn(
            "cursor-pointer relative card-spotlight border border-[0.09375rem]",
            // Thêm viền màu theo trạng thái giao dịch
            isTradeOpen 
              ? "border-primary/60" // Giao dịch đang mở
              : result === 'TP' || profitLoss > 0 
                ? "border-success/60" // Take profit hoặc lãi
                : result === 'SL' || profitLoss < 0
                  ? "border-destructive/60" // Stop loss hoặc lỗ
                  : result === 'BE' 
                    ? "border-warning/60" // Break even
                    : "border-primary/60" // Mặc định hoặc đóng thủ công
          )}
          onClick={() => handleViewTrade()}
        >
          {/* Gradient background phù hợp với loại giao dịch */}
          <CardGradient 
            variant={
              !result ? 'default' :
              result === 'WIN' || profitLoss > 0 ? 'success' :
              result === 'LOSS' || profitLoss < 0 ? 'destructive' :
              'default'
            }
            intensity="subtle"
            direction="top-right"
          />
          
          <CardContent className="p-0">
            <div className="flex flex-col md:flex-row">
              {/* Thumbnail container with CardImage */}
              <div 
                className="relative w-full md:w-48 h-48 flex-shrink-0 cursor-pointer group overflow-hidden"
                style={{ minHeight: '12rem' }} // Đặt chiều cao tối thiểu để tránh layout shift
                onClick={handleOpenChartDialog}
              >
                {displayUrl ? (
                  <div className="trade-card-image-container">
                    <OptimizedImage 
                      src={displayUrl}
                      alt={`${pair} ${direction} trade chart`}
                      tradeId={id}
                      imageType={imageType as any}
                      aspectRatio="1/1"
                      className="trade-card-image"
                      containerClassName="w-full h-full"
                      placeholder="/icons/blank-chart.svg"
                      fallbackSrc="/icons/image-not-supported.svg"
                      loading="lazy"
                      priority={false}
                    />
                    
                    {/* Timeframe badge */}
                    <div className="trade-card-timeframe-badge">
                      {imageType.includes('M15') ? 'M15' : 'H4'} - {imageType.includes('entry') ? 'Entry' : 'Exit'}
                    </div>
                    
                    {/* Zoom overlay icon that appears on hover */}
                    <div className="trade-card-zoom-overlay">
                      <Icons.ui.zoomIn className="h-8 w-8 text-white" />
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-muted/10">
                    <Icons.general.image className="h-10 w-10 opacity-30 mb-2" />
                    <span className="text-xs text-muted-foreground">No Chart</span>
                  </div>
                )}
                
                {/* Trade direction badge */}
                <div className="trade-direction-badge">
                  <DirectionBadge 
                    direction={direction as "BUY" | "SELL"}
                    iconOnly={false}
                    size="md"
                    variant="modern"
                  />
                </div>
                
                {/* Result badge if trade is closed */}
                {result && (
                  <div className="trade-result-badge">
                    <TradeStatusBadge 
                      status={result as TradeStatus}
                      iconOnly={false}
                      size="md"
                    />
                  </div>
                )}
              </div>
              
              {/* Trade details */}
              <div className="p-4 flex-grow relative">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <CardIcon
                      color={direction === "BUY" ? "primary" : "destructive"}
                      size="sm"
                      variant="soft"
                    >
                      {direction === "BUY" ? <Icons.trade.arrowUp className="h-3.5 w-3.5" /> : <Icons.trade.arrowDown className="h-3.5 w-3.5" />}
                    </CardIcon>
                    <h3 className="text-lg font-semibold truncate">
                      {pair}
                    </h3>
                  </div>
                  
                  <div className="flex items-center">
                    <CardIcon
                      color="muted"
                      size="sm"
                      variant="soft"
                    >
                      <Icons.analytics.barChart className="h-3.5 w-3.5" />
                    </CardIcon>
                    <span className="text-sm ml-1.5 text-muted-foreground font-medium max-w-[150px] truncate">
                      {isLoadingStrategy ? (
                        <span className="flex items-center">
                          Loading...
                        </span>
                      ) : strategyName || strategy}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3 text-sm bg-background/50 p-2.5 rounded-md border border-border/30 shadow-sm">
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Entry</span>
                    <span className="font-medium truncate">{formatPriceForPair(entryPrice, trade.pair)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Exit</span>
                    <span className="font-medium truncate">{exitPrice ? formatPriceForPair(exitPrice, trade.pair) : 'Open'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Stop Loss</span>
                    <span className="font-medium truncate">{formatPriceForPair(trade.stopLoss, trade.pair)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Take Profit</span>
                    <span className="font-medium truncate">{formatPriceForPair(trade.takeProfit, trade.pair)}</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 text-sm mb-3 bg-background/50 p-2 px-2.5 rounded-md border border-border/30 shadow-sm">
                  <span className="text-xs text-muted-foreground">Date:</span> 
                  <span className="font-medium truncate">{createdDateStr}</span>
                  {closeDate && (
                    <>
                      <span className="text-muted-foreground/60 mx-1">→</span>
                      <span className="font-medium truncate">{closeDateStr}</span>
                    </>
                  )}
                </div>
                
                <div className="flex flex-wrap justify-between items-center mt-4 border-t pt-3">
                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    {/* Nút action icons với CardIcon */}
                    <CardIcon
                      color="primary"
                      size="sm"
                      variant="soft"
                      className="cursor-pointer hover:bg-primary/25 transition-colors"
                      onClick={() => handleViewTrade()}
                      title="View Details"
                    >
                      <Icons.ui.eye className="h-3.5 w-3.5" />
                    </CardIcon>
                    
                    <CardIcon
                      color="primary"
                      size="sm"
                      variant="soft"
                      className="cursor-pointer hover:bg-primary/25 transition-colors"
                      onClick={() => onEdit()}
                      title="Edit Trade"
                    >
                      <Icons.general.edit className="h-3.5 w-3.5" />
                    </CardIcon>
                    
                    {isTradeOpen && (
                      <CardIcon
                        color="warning"
                        size="sm"
                        variant="soft"
                        className="cursor-pointer hover:bg-warning/25 transition-colors"
                        onClick={() => setShowCloseForm(true)}
                        title="Close Trade"
                      >
                        <Icons.ui.lock className="h-3.5 w-3.5" />
                      </CardIcon>
                    )}
                    
                    <CardIcon
                      color="destructive"
                      size="sm"
                      variant="soft"
                      className="cursor-pointer hover:bg-destructive/25 transition-colors"
                      onClick={() => onDelete(id)}
                      title="Delete Trade"
                    >
                      <Icons.general.trash className="h-3.5 w-3.5" />
                    </CardIcon>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-1 sm:mt-0">
                    {!isTradeOpen && ( 
                      <CardValue
                        size="sm"
                        status={
                          result === 'BE' ? 'neutral' :
                          result === 'MANUAL' ? 
                            (profitLoss > 0 ? 'success' : 
                             profitLoss < 0 ? 'danger' : 'neutral') :
                            (profitLoss > 0 ? 'success' : 'danger')
                        }
                        trend={
                          result === 'BE' ? 'neutral' :
                          result === 'MANUAL' ? 
                            (profitLoss > 0 ? 'up' : 
                             profitLoss < 0 ? 'down' : 'neutral') :
                            (profitLoss > 0 ? 'up' : 'down')
                        }
                        className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-background/80"
                      >
                        {result === 'BE' ? <Icons.ui.circleDot className="h-3.5 w-3.5" /> :
                         result === 'MANUAL' ? 
                          (profitLoss > 0 ? <Icons.analytics.trendingUp className="h-3.5 w-3.5" /> :
                           profitLoss < 0 ? <Icons.analytics.trendingDown className="h-3.5 w-3.5" /> :
                           <Icons.ui.circleDot className="h-3.5 w-3.5" />) :
                          (profitLoss > 0 ? <Icons.analytics.trendingUp className="h-3.5 w-3.5" /> :
                           <Icons.analytics.trendingDown className="h-3.5 w-3.5" />)
                        }
                        {formatProfitLoss(profitLoss, { showPlusSign: true })}
                      </CardValue>
                    )}
                    
                    {!isTradeOpen && (
                      <div className={cn(
                        "pip-badge px-2 py-1 rounded-md text-xs font-medium flex items-center",
                        result === 'BE' ? 'bg-muted/20 text-muted-foreground' :
                        result === 'MANUAL' ? 
                          (pips > 0 ? 'bg-success/10 text-success' : 
                           pips < 0 ? 'bg-destructive/10 text-destructive' : 'bg-muted/20 text-muted-foreground') :
                          (pips > 0 ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive')
                      )}>
                        {formatPips(pips, { includeUnit: true, showPlusSign: pips > 0 })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        // Empty placeholder when not in view
        <div className="w-full h-48 bg-background/5 rounded-md"></div>
      )}
    </div>
  );
}

export default LazyTradeHistoryCard;