import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, ArrowRight } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSwipeable } from 'react-swipeable';
import { useCachedImage } from '@/hooks/use-cached-image';

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
  const isMobile = useIsMobile();
  
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
  
  // Reset currentImageIndex when dialog opens
  useEffect(() => {
    if (isOpen) {
      setCurrentImageIndex(0);
    }
  }, [isOpen]);
  
  // If no images are available, don't display the dialog
  if (availableImages.length === 0) {
    return null;
  }

  const currentImage = availableImages[currentImageIndex];
  
  // Sử dụng hook useCachedImage để lấy ảnh từ cache hoặc tải từ nguồn
  const { 
    imageUrl, 
    isLoading, 
    error 
  } = useCachedImage(currentImage.originalSrc, {
    tradeId,
    imageType: currentImage.imageType,
    placeholder: '/icons/blank-chart.svg',
  });

  // Handler for Previous button
  const handlePrevious = () => {
    setCurrentImageIndex((prev) => 
      prev > 0 ? prev - 1 : availableImages.length - 1
    );
  };

  // Handler for Next button
  const handleNext = () => {
    setCurrentImageIndex((prev) => 
      prev < availableImages.length - 1 ? prev + 1 : 0
    );
  };
  
  // Setup swipe handlers
  const swipeHandlers = useSwipeable({
    onSwipedLeft: handleNext,
    onSwipedRight: handlePrevious,
    preventScrollOnSwipe: true,
    trackMouse: false,
    swipeDuration: 250,
    // These are reasonable settings for swiping images
    delta: 10,           // min distance before a swipe starts
    trackTouch: true,    // track touch input
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className="p-0 overflow-hidden flex flex-col w-full max-w-[95vw] sm:max-w-[92vw] md:max-w-[88vw] lg:max-w-[80vw]"
        aria-describedby="chart-image-viewer-description"
        style={{
          height: isMobile ? 'calc(100dvh - 32px)' : 'calc(95vh)', // Tăng không gian hiển thị
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          margin: 0,
          borderRadius: '0.75rem',
          // Đảm bảo tôn trọng safe area cho iOS
          paddingTop: 'env(safe-area-inset-top, 0px)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)'
        }}
      >
        <div id="chart-image-viewer-description" className="sr-only">Chart image viewer for trading analysis</div>
        
        {/* Dialog title tối giản hơn để tăng diện tích hiển thị ảnh */}
        <DialogTitle className="flex items-center py-2 px-4 border-b">
          <div className="flex flex-col">
            <span className="font-medium text-sm">{tradePair} - {currentImage.label}</span>
            {availableImages.length > 1 && (
              <span className="text-xs text-muted-foreground">
                {`${currentImageIndex + 1}/${availableImages.length}`}
              </span>
            )}
          </div>
        </DialogTitle>
        
        {/* Container tối ưu cho hình ảnh với swipe support */}
        <div 
          {...swipeHandlers}
          className="relative overflow-hidden flex-1 flex items-center justify-center bg-background/80 dark:bg-background/90"
        >
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Loading overlay */}
            {isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/50 backdrop-blur-sm z-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="mt-2 text-xs font-medium">Đang tải...</span>
              </div>
            )}
            
            {/* Error overlay */}
            {error && !isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-10">
                <div className="flex flex-col items-center p-4 rounded-lg bg-card border">
                  <img 
                    src="/icons/image-not-supported.svg" 
                    alt="Error loading image"
                    className="h-12 w-12 opacity-70 mb-3"
                  />
                  <span className="text-sm text-muted-foreground">
                    Không thể tải hình ảnh
                  </span>
                </div>
              </div>
            )}
            
            {/* Image container */}
            <div className={`w-full h-full flex items-center justify-center transition-all duration-300 ${
              isLoading || error ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
            }`}>
              <img 
                src={imageUrl || '/icons/blank-chart.svg'} 
                alt={`${tradePair} ${currentImage.type} chart (${currentImage.timeframe})`}
                className="max-w-full max-h-full object-contain select-none"
                onClick={(e) => e.stopPropagation()} 
                decoding="async"
                loading="eager"
                draggable="false"
                style={{ 
                  visibility: isLoading || error ? 'hidden' : 'visible',
                  touchAction: 'pan-y',
                }}
                onLoad={(e) => {
                  const img = e.currentTarget;
                  if (img.naturalWidth > 1 && img.naturalHeight > 1) {
                    img.style.visibility = 'visible';
                  }
                }}
                onError={(e) => {
                  console.error(`Error loading image: ${currentImage.originalSrc}`);
                  const imgElement = e.currentTarget as HTMLImageElement;
                  
                  if (currentImage.originalSrc && imgElement.src !== currentImage.originalSrc) {
                    console.log(`Retrying with original URL: ${currentImage.originalSrc}`);
                    imgElement.src = currentImage.originalSrc;
                    return;
                  }
                  
                  imgElement.style.display = 'none';
                }}
              />
            </div>
          </div>
          
          {/* Indicators cho thông tin hình ảnh và dot navigation */}
          <div className="absolute pointer-events-none select-none top-0 left-0 right-0 flex justify-between p-2 opacity-80">
            <div className="bg-black/60 text-white text-xs px-2 py-1 rounded-md backdrop-blur-sm">
              {currentImage.type} - {currentImage.timeframe}
            </div>
          </div>
          
          {/* Dot indicators đặt ở phía dưới hình ảnh */}
          {availableImages.length > 1 && (
            <div className="absolute bottom-4 left-0 right-0 flex justify-center items-center">
              <div className="bg-black/50 backdrop-blur-sm py-1.5 px-2.5 rounded-full flex items-center gap-2">
                {availableImages.map((_, index) => (
                  <button
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all duration-200 ${
                      index === currentImageIndex 
                        ? 'bg-white scale-110' 
                        : 'bg-white/30 scale-90 hover:bg-white/50'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex(index);
                    }}
                    aria-label={`View image ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}