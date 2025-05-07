import { useState, useEffect, useRef, memo, useMemo } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  Card, 
  CardContent, 
  CardIcon, 
  CardGradient,
  CardImage,
  CardValue
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PencilIcon,
  Trash2Icon,
  TrendingUpIcon,
  TrendingDownIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  LockOpenIcon,
  ArrowUp,
  ArrowDown,
  Lock,
  CheckCircle2,
  Ban,
  Maximize2,
  CircleDot,
  Loader2,
  BarChart2
} from "lucide-react";
import { useLocation } from "wouter";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatCurrency, cn } from "@/lib/utils";
import { CurrencyPair } from "@/lib/forex-calculator";
import { formatTimestamp } from "@/lib/format-timestamp";
import { useInView } from "react-intersection-observer";
import LazyCloseTradeForm from "./LazyCloseTradeForm";
import { TradeStatus, getTradeStatusConfig, getTradeStatusColorClasses } from "@/lib/trade-status-config";
import { determineTradeStatus } from "@/lib/trade-status-helpers";
import TradeStatusBadge from "./TradeStatusBadge";
import DirectionBadge from "./DirectionBadge";
import axios from "axios";
import { ChartImageDialog } from "./ChartImageDialog";
import { useCachedImage } from "@/hooks/use-cached-image";
import { OptimizedImage } from "@/components/ui/optimized-image";

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
    triggerOnce: true,  // Chỉ kích hoạt một lần khi card hiện ra
    rootMargin: '200px', // Pre-load trước 200px
  });
  
  // State management for UI interactions
  const [showCloseForm, setShowCloseForm] = useState(false);
  const [showChartDialog, setShowChartDialog] = useState(false);
  
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
    entryDate,
    closeDate,
    entryImage,
    entryImageM15,
    exitImage,
    exitImageM15
  } = trade || {};
  
  // Calculate time difference in user-friendly format
  const entryDateStr = entryDate ? formatTimestamp(entryDate) : 'Unknown';
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

  // Không còn cần theo dõi trạng thái ảnh nữa vì OptimizedImage đã xử lý
  


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
            "overflow-hidden cursor-pointer relative card-spotlight border border-[0.09375rem]",
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
                className="relative w-full md:w-48 h-48 flex-shrink-0 cursor-pointer group"
                onClick={handleOpenChartDialog}
              >
                {displayUrl ? (
                  <div className="trade-card-image-container relative">
                    <OptimizedImage
                      src={displayUrl}
                      alt={`${pair} ${direction} trade chart`}
                      tradeId={id}
                      imageType={imageType}
                      aspectRatio="1/1"
                      className="w-full h-full object-cover rounded-tl-md rounded-tr-md md:rounded-tr-none md:rounded-bl-md"
                      containerClassName="h-48 w-full"
                      placeholder="/icons/blank-chart.svg"
                      fallbackSrc="/icons/image-not-supported.svg"
                      loading="lazy"
                      priority={false}
                      onLoad={() => {
                        console.log(`Image loaded successfully for trade ${id}`);
                      }}
                      onError={(e) => {
                        console.error(`Error loading image for trade ${id}: ${displayUrl}`);
                      }}
                    />
                    
                    {/* Zoom overlay icon */}
                    <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 hover:opacity-100 cursor-pointer">
                      <Maximize2 className="h-8 w-8 text-white" />
                    </div>
                    
                    {/* Badge showing which timeframe is displayed */}
                    <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                      {imageType.includes('M15') ? 'M15' : 'H4'} - {imageType.includes('entry') ? 'Entry' : 'Exit'}
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-48 flex items-center justify-center text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-tl-md rounded-tr-md md:rounded-tr-none md:rounded-bl-md">
                    <span>No Chart</span>
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
                      {direction === "BUY" ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />}
                    </CardIcon>
                    <h3 className="text-lg font-semibold">
                      {pair}
                    </h3>
                  </div>
                  
                  <div className="flex items-center">
                    <CardIcon
                      color="muted"
                      size="sm"
                      variant="soft"
                    >
                      <BarChart2 className="h-3.5 w-3.5" />
                    </CardIcon>
                    <span className="text-sm ml-1.5 text-muted-foreground font-medium">
                      {strategy}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3 text-sm bg-background/50 p-2.5 rounded-md border border-border/30 shadow-sm">
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Entry</span>
                    <span className="font-medium">{entryPrice}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Exit</span>
                    <span className="font-medium">{exitPrice || 'Open'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Stop Loss</span>
                    <span className="font-medium">{trade.stopLoss}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Take Profit</span>
                    <span className="font-medium">{trade.takeProfit}</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 text-sm mb-3 bg-background/50 p-2 px-2.5 rounded-md border border-border/30 shadow-sm">
                  <span className="text-xs text-muted-foreground">Date:</span> 
                  <span className="font-medium">{entryDateStr}</span>
                  {closeDate && (
                    <>
                      <span className="text-muted-foreground/60 mx-1">→</span>
                      <span className="font-medium">{closeDateStr}</span>
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
                      <EyeIcon className="h-3.5 w-3.5" />
                    </CardIcon>
                    
                    <CardIcon
                      color="primary"
                      size="sm"
                      variant="soft"
                      className="cursor-pointer hover:bg-primary/25 transition-colors"
                      onClick={() => onEdit()}
                      title="Edit Trade"
                    >
                      <PencilIcon className="h-3.5 w-3.5" />
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
                        <Lock className="h-3.5 w-3.5" />
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
                      <Trash2Icon className="h-3.5 w-3.5" />
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
                        {result === 'BE' ? <CircleDot className="h-3.5 w-3.5" /> :
                         result === 'MANUAL' ? 
                          (profitLoss > 0 ? <TrendingUpIcon className="h-3.5 w-3.5" /> :
                           profitLoss < 0 ? <TrendingDownIcon className="h-3.5 w-3.5" /> :
                           <CircleDot className="h-3.5 w-3.5" />) :
                          (profitLoss > 0 ? <TrendingUpIcon className="h-3.5 w-3.5" /> :
                           <TrendingDownIcon className="h-3.5 w-3.5" />)
                        }
                        {formatCurrency(profitLoss)}
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
                        {pips > 0 ? '+' : ''}{pips} pips
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        // Skeleton loading when not in view
        <Skeleton className="w-full h-48" />
      )}
    </div>
  );
}

// Sử dụng memoWithPerf từ performance.ts để tối ưu memoization
import { memoWithPerf } from '@/lib/performance';

export default memoWithPerf(LazyTradeHistoryCard, (prevProps, nextProps) => {
  // Tối ưu so sánh props để tránh re-renders không cần thiết
  const sameProps = [
    prevProps.trade.id === nextProps.trade.id,
    prevProps.trade.updatedAt === nextProps.trade.updatedAt,
    JSON.stringify(prevProps.trade.profitLoss) === JSON.stringify(nextProps.trade.profitLoss),
    prevProps.trade.result === nextProps.trade.result
  ];
  
  // Chỉ re-render nếu có bất kỳ giá trị nào thay đổi
  return sameProps.every(prop => prop === true);
});