import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogTitle, 
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons/icons';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSwipeable } from 'react-swipeable';
import { useCachedImage } from '@/hooks/use-cached-image';
import { cn } from '@/lib/utils';

interface ChartImageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  entryImage?: string | null;
  entryImageM15?: string | null;
  exitImage?: string | null;
  exitImageM15?: string | null;
  isTradeOpen: boolean;
  tradePair: string;
  tradeId?: string;
}

/**
 * Chart Image Dialog component for displaying trade charts with ability to switch between images
 * Enhanced with image caching capabilities for better performance.
 */
export function ChartImageDialog({
  isOpen,
  onClose,
  entryImage,
  entryImageM15,
  exitImage,
  exitImageM15,
  isTradeOpen,
  tradePair,
  tradeId = 'unknown'
}: ChartImageDialogProps) {
  // Device detection hook
  const isMobile = useIsMobile();
  
  // Ref for the image element
  const imageRef = useRef<HTMLImageElement>(null);
  
  // State for zoom and pan functionality
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // Create list of available images with timeframe and type information (entry/exit)
  const availableImages = [
    entryImage && { 
      originalSrc: entryImage, 
      type: 'Entry', 
      timeframe: 'H4', 
      label: 'Entry - H4',
      imageType: 'entryH4'
    },
    entryImageM15 && { 
      originalSrc: entryImageM15, 
      type: 'Entry', 
      timeframe: 'M15', 
      label: 'Entry - M15',
      imageType: 'entryM15'
    },
    !isTradeOpen && exitImage && { 
      originalSrc: exitImage, 
      type: 'Exit', 
      timeframe: 'H4', 
      label: 'Exit - H4',
      imageType: 'exitH4'
    },
    !isTradeOpen && exitImageM15 && { 
      originalSrc: exitImageM15, 
      type: 'Exit', 
      timeframe: 'M15', 
      label: 'Exit - M15',
      imageType: 'exitM15'
    },
  ].filter(Boolean) as { 
    originalSrc: string; 
    type: string; 
    timeframe: string; 
    label: string;
    imageType: string;
  }[];

  // State to track currently displayed image
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Reset zoom and pan to default values
  const resetZoom = useCallback(() => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  }, []);
  
  // Reset zoom and state when dialog opens or image changes
  useEffect(() => {
    if (isOpen) {
      resetZoom();
      setCurrentImageIndex(0);
    }
  }, [isOpen, resetZoom]);
  
  // Reset zoom when image changes
  useEffect(() => {
    if (currentImageIndex !== undefined) {
      resetZoom();
    }
  }, [currentImageIndex, resetZoom]);
  
  // If no images are available, don't display the dialog
  if (availableImages.length === 0) {
    return null;
  }

  const currentImage = availableImages[currentImageIndex];
  
  // Use cached image hook for performance optimization
  const { 
    url: imageUrl, 
    isLoading, 
    error,
    refetch 
  } = useCachedImage(currentImage.originalSrc, {
    placeholder: '/icons/blank-chart.svg',
    retry: true,
    retryCount: 2
  });

  // Zoom in function with maximum limit
  const zoomIn = useCallback(() => {
    const maxZoom = parseFloat(getComputedStyle(document.documentElement)
      .getPropertyValue('--chart-image-max-scale')) || 3;
    setScale(prev => Math.min(prev + 0.25, maxZoom));
  }, []);

  // Zoom out function with minimum limit of 1
  const zoomOut = useCallback(() => {
    setScale(prev => Math.max(prev - 0.25, 1));
  }, []);

  // Handler for mouse down events (start dragging)
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (scale <= 1) return; // Only allow dragging when zoomed in
    
    setIsDragging(true);
    setDragStart({
      x: e.clientX - translate.x,
      y: e.clientY - translate.y
    });
    
    e.preventDefault();
  }, [scale, translate]);

  // Handler for mouse move events (dragging)
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || scale <= 1) return;
    
    setTranslate({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
    
    e.preventDefault();
  }, [isDragging, dragStart, scale]);

  // Handler for mouse up events (end dragging)
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Handler for Previous button
  const handlePrevious = useCallback(() => {
    setCurrentImageIndex((prev) => 
      prev > 0 ? prev - 1 : availableImages.length - 1
    );
  }, [availableImages.length]);

  // Handler for Next button
  const handleNext = useCallback(() => {
    setCurrentImageIndex((prev) => 
      prev < availableImages.length - 1 ? prev + 1 : 0
    );
  }, [availableImages.length]);
  
  // Setup swipe handlers for mobile
  const swipeHandlers = useSwipeable({
    onSwipedLeft: handleNext,
    onSwipedRight: handlePrevious,
    preventScrollOnSwipe: true,
    trackMouse: false,
    swipeDuration: 250,
    trackTouch: true,
    delta: 10, // min distance before a swipe starts
  });
  
  // Calculate transform style for zooming and panning
  const imageTransform = `scale(${scale}) translate(${translate.x / scale}px, ${translate.y / scale}px)`;

  // Tên dialog và mô tả cho truy cập
  const dialogTitle = `${tradePair} - ${currentImage?.label || "Chart"}`;
  const dialogDescription = `Trading chart for ${tradePair}`;
  
  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent 
        variant="chart"
        className="h-[85vh] sm:h-[85vh] md:h-[85vh] lg:h-[85vh] max-h-[800px]"
      >
        {/* Title và Description theo chuẩn accessibility */}
        <DialogTitle className="sr-only">
          {dialogTitle}
        </DialogTitle>
        
        <DialogDescription className="sr-only">
          Trading chart analysis for {tradePair}
        </DialogDescription>
        
        {/* Thanh tiêu đề nhỏ gọn hơn */}
        <div className="flex flex-col py-2 px-3 border-b text-sm">
          <span className="font-medium chart-title">
            {dialogTitle}
          </span>
          {availableImages.length > 1 && (
            <span className="chart-subtitle">
              {`${currentImageIndex + 1}/${availableImages.length}`}
            </span>
          )}
        </div>
        
        {/* Main content area with swipe handlers */}
        <div className="chart-content">
          {/* Image viewport with zoom and pan handlers */}
          <div className="chart-image-viewport"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            {...(scale <= 1 ? swipeHandlers : {})}
          >
            {/* Loading indicator */}
            {isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/50 backdrop-blur-sm z-10">
                <Icons.ui.spinner className="h-8 w-8 animate-spin text-primary" />
                <span className="mt-2 text-xs font-medium">Đang tải...</span>
              </div>
            )}
            {/* Error state */}
            {error && !isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-10">
                <div className="flex flex-col items-center p-4 rounded-lg bg-card border">
                  <img src="/icons/image-not-supported.svg" alt="Error loading image" className="h-12 w-12 opacity-70 mb-3" />
                  <span className="text-sm text-muted-foreground">Không thể tải hình ảnh</span>
                </div>
              </div>
            )}
            {/* Chart image with container - with zoom and transform applied */}
            <div className={cn(
              "chart-image-container", 
              isLoading || error ? "opacity-0" : "opacity-100",
              scale > 1 ? "custom-transform zoomed-in" : "no-transform",
              isDragging && scale > 1 ? "dragging" : ""
            )}
              style={{ transform: scale > 1 ? imageTransform : undefined }}>
              <img ref={imageRef}
                src={imageUrl || '/icons/blank-chart.svg'} 
                alt={`${tradePair} ${currentImage.type} chart (${currentImage.timeframe})`}
                className={cn("chart-image", (isLoading || error) && "invisible")}
                onClick={(e) => e.stopPropagation()} 
                decoding="async"
                loading="eager"
                draggable="false"
                onLoad={(e) => {
                  const img = e.currentTarget;
                  if (img.naturalWidth > 1 && img.naturalHeight > 1) {
                    img.classList.remove('invisible');
                  }
                }}
                onError={(e) => {
                  console.error(`Error loading image: ${currentImage.originalSrc}`);
                  const imgElement = e.currentTarget as HTMLImageElement;
                  
                  // Nếu lỗi, thử tải lại bằng hook refetch
                  refetch().catch(() => {
                    // Nếu vẫn lỗi, thử trực tiếp URL
                    if (currentImage.originalSrc && imgElement.src !== currentImage.originalSrc) {
                      console.log(`Retrying with original URL: ${currentImage.originalSrc}`);
                      imgElement.src = currentImage.originalSrc;
                      return;
                    }
                    imgElement.classList.add('hidden');
                  });
                }}
              />
            </div>
            
            {/* Navigation buttons for desktop and tablets */}
            {availableImages.length > 1 && !isMobile && (
              <>
                <button className="chart-nav-button chart-nav-button-prev" onClick={handlePrevious} aria-label="Previous image">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6"></polyline>
                  </svg>
                </button>
                <button className="chart-nav-button chart-nav-button-next" onClick={handleNext} aria-label="Next image">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </button>
              </>
            )}
          </div>
          
          {/* Zoom controls */}
          <div className="chart-zoom-controls">
            <button className="chart-zoom-button" onClick={zoomIn} aria-label="Zoom in" disabled={scale >= 3}>
              <Icons.ui.zoomIn size={isMobile ? 16 : 20} />
            </button>
            <button className="chart-zoom-button" onClick={zoomOut} aria-label="Zoom out" disabled={scale <= 1}>
              <Icons.ui.zoomOut size={isMobile ? 16 : 20} />
            </button>
            <button className="chart-zoom-button" onClick={resetZoom} aria-label="Reset zoom" 
              disabled={scale === 1 && translate.x === 0 && translate.y === 0}>
              <Icons.ui.maximize size={isMobile ? 16 : 20} />
            </button>
          </div>
          
          {/* Image Pagination for mobile and desktop */}
          {availableImages.length > 1 && (
            <div className="chart-pagination">
              <div className="chart-pagination-dots">
                {isMobile && (
                  <button className="w-5 h-5 flex items-center justify-center text-white/90"
                    onClick={handlePrevious} aria-label="Previous image">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                  </button>
                )}
                {availableImages.map((_, index) => (
                  <button key={index}
                    className={cn("chart-pagination-dot",
                      index === currentImageIndex ? "chart-pagination-dot-active" : "chart-pagination-dot-inactive")}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex(index);
                    }}
                    aria-label={`View image ${index + 1}`}
                  />
                ))}
                {isMobile && (
                  <button className="w-5 h-5 flex items-center justify-center text-white/90"
                    onClick={handleNext} aria-label="Next image">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}