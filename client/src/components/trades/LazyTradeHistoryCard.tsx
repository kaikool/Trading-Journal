import { useState, useEffect, useRef, memo, useMemo } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent } from "@/components/ui/card";
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
  Loader2
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
          className="mb-4 cursor-pointer hover:shadow-md transition-shadow duration-200 overflow-hidden"
          onClick={() => handleViewTrade()}
        >
          <CardContent className="p-0">
            <div className="flex flex-col md:flex-row">
              {/* Thumbnail container - fixed size for consistency */}
              <div 
                className="relative w-full md:w-48 h-48 bg-gray-100 dark:bg-gray-800 flex-shrink-0 cursor-pointer group"
                onClick={handleOpenChartDialog}
              >
                {displayUrl ? (
                  <>
                    {/* Placeholder image (always shown initially) */}
                    <div className={`absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 transition-opacity duration-300 ${imageLoaded && !isImageLoading ? 'opacity-0' : 'opacity-100'}`}>
                      {isImageLoading && (
                        <div className="flex flex-col items-center justify-center">
                          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/50" />
                        </div>
                      )}
                    </div>
                    
                    {/* Actual image (hidden until loaded) */}
                    <div className={`absolute inset-0 transition-opacity duration-300 ${imageLoaded && !isImageLoading ? 'opacity-100' : 'opacity-0'}`}>
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
                          
                          // Hiển thị hình ảnh thay thế nhưng giữ nguyên trạng thái loading
                          // để tránh hiển thị lỗi hình ảnh
                          imgElement.style.display = 'none';
                        }}
                      />
                    </div>
                    
                    {/* Zoom icon and timeframe badge - Only show when image is successfully loaded */}
                    {imageLoaded && !isImageLoading && !imageError && (
                      <>
                        {/* Zoom overlay icon that appears on hover */}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Maximize2 className="h-8 w-8 text-white" />
                        </div>
                        
                        {/* Badge showing which timeframe is displayed */}
                        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                          {imageType.includes('M15') ? 'M15' : 'H4'} - {imageType.includes('entry') ? 'Entry' : 'Exit'}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <span>No Chart</span>
                  </div>
                )}
                
                {/* Trade direction badge */}
                <div className="trade-direction-badge">
                  <div className={`trade-badge ${direction === 'BUY' ? 'trade-badge-buy' : 'trade-badge-sell'}`}>
                    <div className="trade-card-badge-container">
                      {direction === 'BUY' ? (
                        <ArrowUp className="trade-card-badge-icon" />
                      ) : (
                        <ArrowDown className="trade-card-badge-icon" />
                      )}
                      <span className="trade-card-badge-text">{direction}</span>
                    </div>
                  </div>
                </div>
                
                {/* Result badge if trade is closed */}
                {result && (
                  <div className="trade-result-badge">
                    <div className={`trade-badge ${
                      result === 'TP' ? 'trade-badge-tp' : 
                      result === 'SL' ? 'trade-badge-sl' : 
                      result === 'BE' ? 'trade-badge-be' : 
                      'trade-badge-default'
                    }`}>
                      <div className="trade-card-badge-container">
                        {(() => {
                          const config = getTradeStatusConfig(result as TradeStatus);
                          const Icon = config.icon;
                          return <Icon className="trade-card-badge-icon" />;
                        })()}
                        <span className="trade-card-badge-text">{getTradeStatusConfig(result as TradeStatus).label}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Trade details */}
              <div className="p-4 flex-grow">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold flex items-center">
                    {pair}
                    <span className="text-sm font-normal ml-2 text-gray-500">
                      {strategy}
                    </span>

                  </h3>
                  
                  {/* Các nút đã được di chuyển xuống dưới đáy card */}
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3 text-sm">
                  <div>
                    <span className="text-gray-500">Entry:</span> {entryPrice}
                  </div>
                  <div>
                    <span className="text-gray-500">Exit:</span> {exitPrice || 'Open'}
                  </div>
                  <div>
                    <span className="text-gray-500">SL:</span> {trade.stopLoss}
                  </div>
                  <div>
                    <span className="text-gray-500">TP:</span> {trade.takeProfit}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 text-sm mb-2">
                  <span className="text-gray-500">Date:</span> 
                  <span>{entryDateStr}</span>
                  {closeDate && (
                    <>
                      <span className="text-gray-400">→</span>
                      <span>{closeDateStr}</span>
                    </>
                  )}
                </div>
                
                <div className="flex flex-wrap justify-between items-center mt-4 border-t pt-3">
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    {/* Nút action icons */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 px-0 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                      onClick={() => handleViewTrade()}
                      title="View Details"
                    >
                      <EyeIcon className="h-3.5 w-3.5" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 px-0 rounded-full hover:bg-amber-100 dark:hover:bg-amber-900/20 text-amber-600 dark:text-amber-400"
                      onClick={() => onEdit()}
                      title="Edit Trade"
                    >
                      <PencilIcon className="h-3.5 w-3.5" />
                    </Button>
                    
                    {isTradeOpen && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 px-0 rounded-full hover:bg-green-100 dark:hover:bg-green-900/20 text-green-600 dark:text-green-400"
                        onClick={() => setShowCloseForm(true)}
                        title="Close Trade"
                      >
                        <Lock className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 px-0 rounded-full hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
                      onClick={() => onDelete(id)}
                      title="Delete Trade"
                    >
                      <Trash2Icon className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-1 sm:mt-0">
                    {!isTradeOpen && ( 
                      <div className={`flex items-center space-x-1 ${
                        (() => {
                          if (result === 'BE') return 'text-amber-600 dark:text-amber-400';
                          if (result === 'MANUAL') return profitLoss > 0 
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : profitLoss < 0
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-amber-600 dark:text-amber-400';
                          return profitLoss > 0 
                            ? 'text-emerald-600 dark:text-emerald-400' 
                            : 'text-red-600 dark:text-red-400';
                        })()
                      }`}>
                        {(() => {
                          if (result === 'BE') return <CircleDot className="h-3.5 w-3.5" />;
                          if (result === 'MANUAL') {
                            if (profitLoss > 0) return <TrendingUpIcon className="h-3.5 w-3.5" />;
                            if (profitLoss < 0) return <TrendingDownIcon className="h-3.5 w-3.5" />;
                            return <CircleDot className="h-3.5 w-3.5" />;
                          }
                          return profitLoss > 0 
                            ? <TrendingUpIcon className="h-3.5 w-3.5" />
                            : <TrendingDownIcon className="h-3.5 w-3.5" />;
                        })()}
                        <span className="font-medium">{formatCurrency(profitLoss)}</span>
                      </div>
                    )}
                    
                    {!isTradeOpen && (
                      <div className={`text-xs px-2.5 py-0.5 rounded-full ${
                        (() => {
                          if (result === 'BE') return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
                          if (result === 'MANUAL') {
                            if (pips > 0) return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
                            if (pips < 0) return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
                            return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
                          }
                          return pips > 0 
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' 
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
                        })()
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

export default memo(LazyTradeHistoryCard);