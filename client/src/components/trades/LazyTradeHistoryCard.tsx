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
  
  // Lazy state cho hình ảnh
  const [imageLoaded, setImageLoaded] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const [showCloseForm, setShowCloseForm] = useState(false);
  // State cho dialog xem ảnh biểu đồ
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

  // Theo dõi trạng thái ảnh
  useEffect(() => {
    if (cachedImageUrl && !isImageLoading) {
      setImageLoaded(true);
    }
  }, [cachedImageUrl, isImageLoading]);
  


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
          className="mb-4 overflow-hidden cursor-pointer relative card-spotlight"
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
                  <div className="trade-card-image-container">
                    {/* Placeholder image (always shown initially) */}
                    <div className={`trade-card-placeholder bg-gray-100 dark:bg-gray-800 ${imageLoaded && !isImageLoading ? 'trade-card-placeholder-hidden' : 'trade-card-placeholder-visible'}`}>
                      {isImageLoading && (
                        <div className="flex flex-col items-center justify-center">
                          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/50" />
                        </div>
                      )}
                    </div>
                    
                    {/* Actual image (hidden until loaded) */}
                    <div className={`trade-card-image ${imageLoaded && !isImageLoading ? 'loaded' : ''}`}>
                      <img 
                        ref={imageRef}
                        src={cachedImageUrl || '/icons/blank-chart.svg'}
                        alt={`${pair} ${direction} trade chart`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        decoding="async"
                        onLoad={() => {
                          // Only set as loaded if it's not an error image
                          if (cachedImageUrl && !cachedImageUrl.includes('image-not-supported')) {
                            setImageLoaded(true);
                          }
                        }}
                        onError={(e) => {
                          console.error(`Error displaying image for trade ${id}: ${displayUrl}`);
                          const imgElement = e.currentTarget as HTMLImageElement;
                          
                          // Không hiển thị lỗi tạm thời - giữ nguyên trạng thái loading
                          // Thử tải lại một lần nữa với URL gốc nếu có
                          if (displayUrl && imgElement.src !== displayUrl) {
                            console.log(`Retrying with original URL: ${displayUrl}`);
                            imgElement.src = displayUrl;
                            return;
                          }
                          
                          // Sử dụng state để quản lý ẩn/hiện thay vì thêm class
                          setImageLoaded(false);
                        }}
                      />
                    </div>
                    
                    {/* Zoom icon and timeframe badge - Only show when image is successfully loaded */}
                    {imageLoaded && !isImageLoading && !imageError && (
                      <>
                        {/* Zoom overlay icon that appears on hover */}
                        <div className="trade-card-zoom-overlay">
                          <Maximize2 className="h-8 w-8 text-white" />
                        </div>
                        
                        {/* Badge showing which timeframe is displayed */}
                        <div className="trade-card-timeframe-badge">
                          {imageType.includes('M15') ? 'M15' : 'H4'} - {imageType.includes('entry') ? 'Entry' : 'Exit'}
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
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
              <div className="p-4 flex-grow">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold flex items-center">
                    {pair}
                    <span className="text-sm font-normal ml-2 text-muted-foreground">
                      {strategy}
                    </span>

                  </h3>
                  
                  {/* Các nút đã được di chuyển xuống dưới đáy card */}
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Entry:</span> {entryPrice}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Exit:</span> {exitPrice || 'Open'}
                  </div>
                  <div>
                    <span className="text-muted-foreground">SL:</span> {trade.stopLoss}
                  </div>
                  <div>
                    <span className="text-muted-foreground">TP:</span> {trade.takeProfit}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 text-sm mb-2">
                  <span className="text-muted-foreground">Date:</span> 
                  <span>{entryDateStr}</span>
                  {closeDate && (
                    <>
                      <span className="text-muted-foreground/60">→</span>
                      <span>{closeDateStr}</span>
                    </>
                  )}
                </div>
                
                <div className="flex flex-wrap justify-between items-center mt-4 border-t pt-3">
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    {/* Nút action icons */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="action-button action-button-view"
                      onClick={() => handleViewTrade()}
                      title="View Details"
                    >
                      <EyeIcon className="action-button-icon" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="action-button action-button-edit"
                      onClick={() => onEdit()}
                      title="Edit Trade"
                    >
                      <PencilIcon className="action-button-icon" />
                    </Button>
                    
                    {isTradeOpen && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="action-button action-button-close"
                        onClick={() => setShowCloseForm(true)}
                        title="Close Trade"
                      >
                        <Lock className="action-button-icon" />
                      </Button>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="action-button action-button-delete"
                      onClick={() => onDelete(id)}
                      title="Delete Trade"
                    >
                      <Trash2Icon className="action-button-icon" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-1 sm:mt-0">
                    {!isTradeOpen && ( 
                      <div className={`pnl-indicator ${
                        result === 'BE' ? 'pnl-neutral' :
                        result === 'MANUAL' ? 
                          (profitLoss > 0 ? 'pnl-profit' : 
                           profitLoss < 0 ? 'pnl-loss' : 'pnl-neutral') :
                          (profitLoss > 0 ? 'pnl-profit' : 'pnl-loss')
                      }`}>
                        {result === 'BE' ? <CircleDot className="h-3.5 w-3.5" /> :
                         result === 'MANUAL' ? 
                          (profitLoss > 0 ? <TrendingUpIcon className="h-3.5 w-3.5" /> :
                           profitLoss < 0 ? <TrendingDownIcon className="h-3.5 w-3.5" /> :
                           <CircleDot className="h-3.5 w-3.5" />) :
                          (profitLoss > 0 ? <TrendingUpIcon className="h-3.5 w-3.5" /> :
                           <TrendingDownIcon className="h-3.5 w-3.5" />)
                        }
                        <span className="font-medium">{formatCurrency(profitLoss)}</span>
                      </div>
                    )}
                    
                    {!isTradeOpen && (
                      <div className={`pip-badge ${
                        result === 'BE' ? 'pip-badge-neutral' :
                        result === 'MANUAL' ? 
                          (pips > 0 ? 'pip-badge-profit' : 
                           pips < 0 ? 'pip-badge-loss' : 'pip-badge-neutral') :
                          (pips > 0 ? 'pip-badge-profit' : 'pip-badge-loss')
                      }`}>
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
        <Skeleton className="w-full h-48 mb-4" />
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