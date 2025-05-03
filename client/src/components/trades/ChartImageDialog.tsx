import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, ArrowRight, X } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSwipeable } from 'react-swipeable';
import { useCachedImage } from '@/hooks/use-cached-image';
import { cn } from '@/lib/utils';
import { isPWA } from '@/lib/pwa-helper';

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
  const [isPWAMode, setIsPWAMode] = useState(false);
  
  // Detect PWA mode when component mounts
  useEffect(() => {
    setIsPWAMode(isPWA());
  }, []);
  
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
        className={cn(
          "p-0 chart-dialog", 
          "sm:max-w-[92vw] md:max-w-[88vw] lg:max-w-[80vw]",
          isMobile && "sm:max-w-[95vw]"
        )}
        aria-describedby="chart-image-viewer-description"
      >
        <div id="chart-image-viewer-description" className="sr-only">Chart image viewer for trading analysis</div>
        
        <DialogTitle className="flex items-center justify-between py-2 px-4 border-b">
          <div className="flex flex-col">
            <span className="font-medium text-sm">{tradePair} - {currentImage.label}</span>
            {availableImages.length > 1 && (
              <span className="text-xs text-muted-foreground">
                {`${currentImageIndex + 1}/${availableImages.length}`}
              </span>
            )}
          </div>
        </DialogTitle>
        
        <div 
          {...swipeHandlers}
          className="chart-content"
        >
          <div className="relative w-full h-full flex items-center justify-center">
            {isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/50 backdrop-blur-sm z-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="mt-2 text-xs font-medium">Đang tải...</span>
              </div>
            )}
            
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
            
            <div className={cn(
              "chart-image-container",
              isLoading || error ? "opacity-0 scale-95" : "opacity-100 scale-100"
            )}>
              <img 
                src={imageUrl || '/icons/blank-chart.svg'} 
                alt={`${tradePair} ${currentImage.type} chart (${currentImage.timeframe})`}
                className={cn(
                  "chart-image",
                  (isLoading || error) && "invisible"
                )}
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
                  
                  if (currentImage.originalSrc && imgElement.src !== currentImage.originalSrc) {
                    console.log(`Retrying with original URL: ${currentImage.originalSrc}`);
                    imgElement.src = currentImage.originalSrc;
                    return;
                  }
                  
                  imgElement.classList.add('hidden');
                }}
              />
            </div>
          </div>
          
          
          {availableImages.length > 1 && (
            <div className="chart-pagination">
              <div className="bg-black/50 backdrop-blur-sm py-1.5 px-2.5 rounded-full flex items-center gap-2">
                {availableImages.map((_, index) => (
                  <button
                    key={index}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all duration-200",
                      index === currentImageIndex 
                        ? "bg-white scale-110" 
                        : "bg-white/30 scale-90 hover:bg-white/50"
                    )}
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