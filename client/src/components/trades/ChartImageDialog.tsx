import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
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
        className="sm:max-w-[95vw] md:max-w-[90vw] lg:max-w-[85vw] max-h-[85vh] p-0 overflow-hidden flex flex-col"
        aria-describedby="chart-image-viewer-description"
        style={{
          // Fix không gian hiển thị trong PWA, tránh vượt ra ngoài màn hình
          height: isMobile ? 'calc(100vh - 5rem)' : 'auto',
          marginTop: 'auto',
          marginBottom: 'auto'
        }}
      >
        <div id="chart-image-viewer-description" className="sr-only">Chart image viewer for trading analysis</div>
        
        {/* Only use DialogTitle - close button from default DialogContent */}
        <DialogTitle className="flex items-center p-2 sm:p-4">
          <div className="flex flex-col">
            <span>{tradePair} - {currentImage.label}</span>
            <span className="text-sm text-muted-foreground">
              {availableImages.length > 1 ? 
                `Image ${currentImageIndex + 1} of ${availableImages.length}` : 
                'Chart Image'
              }
            </span>
          </div>
        </DialogTitle>
        
        {/* Container that allows scrolling for tall images with swipe support */}
        <div 
          {...swipeHandlers}
          className="relative overflow-auto flex-1 flex items-center justify-center bg-black/5 dark:bg-white/5 rounded-md"
        >
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Loading overlay - always visible when loading */}
            {isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/5 z-10">
                <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
                <span className="mt-2 text-sm text-muted-foreground">Loading image...</span>
              </div>
            )}
            
            {/* Error overlay - only shown when error is present and not loading */}
            {error && !isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/5 z-10">
                <img 
                  src="/icons/image-not-supported.svg" 
                  alt="Error loading image"
                  className="h-16 w-16 opacity-60 mb-4"
                />
                <span className="text-sm text-muted-foreground">
                  Error loading image. Please try again later.
                </span>
              </div>
            )}
            
            {/* Image container - always present to avoid layout shifts */}
            <div className={`w-full h-full flex items-center justify-center transition-opacity duration-300 ${isLoading || error ? 'opacity-0' : 'opacity-100'}`}>
              <img 
                src={imageUrl || '/icons/blank-chart.svg'} 
                alt={`${tradePair} ${currentImage.type} chart (${currentImage.timeframe})`}
                className="max-w-full max-h-full object-contain"
                onClick={(e) => e.stopPropagation()} /* Prevent closing dialog when clicking image */
                decoding="async"
                loading="eager" /* Optimize for dialog view */
                style={{ visibility: isLoading || error ? 'hidden' : 'visible' }}
                onLoad={(e) => {
                  // Kiểm tra xem hình ảnh đã được tải thành công hay không
                  const img = e.currentTarget;
                  if (img.naturalWidth > 1 && img.naturalHeight > 1) {
                    // Ảnh hợp lệ, hiển thị
                    img.style.visibility = 'visible';
                  }
                }}
                onError={(e) => {
                  console.error(`Error loading image in ChartImageDialog: ${currentImage.originalSrc}`);
                  const imgElement = e.currentTarget as HTMLImageElement;
                  
                  // Ghi nhận lỗi nhưng không hiển thị thông báo lỗi
                  // Thử tải lại một lần nữa với URL gốc nếu có
                  if (currentImage.originalSrc && imgElement.src !== currentImage.originalSrc) {
                    console.log(`Retrying with original URL: ${currentImage.originalSrc}`);
                    imgElement.src = currentImage.originalSrc;
                    return;
                  }
                  
                  // Ẩn hình ảnh lỗi
                  imgElement.style.display = 'none';
                }}
              />
            </div>
          </div>
          
          {/* Overlay displaying timeframe and image type information */}
          <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded-sm">
            {currentImage.label}
          </div>
          

          
          {/* Swipe direction hints (only visible on mobile) */}
          {isMobile && availableImages.length > 1 && (
            <div className="absolute bottom-4 text-center text-white text-xs w-full opacity-70">
              <span>Swipe left/right to navigate</span>
            </div>
          )}
        </div>

        {availableImages.length > 1 && (
          <div className="flex justify-between items-center gap-2 p-2 sm:p-4 w-full">
            {/* Previous button optimized for mobile */}
            <Button 
              variant="outline" 
              size={isMobile ? "icon" : "sm"}
              onClick={handlePrevious}
              className="flex-shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
              {!isMobile && <span className="ml-1">Prev</span>}
            </Button>
            
            {/* Dot indicators placed between navigation buttons */}
            <div className="flex justify-center gap-1 overflow-x-auto">
              {availableImages.map((_, index) => (
                <button
                  key={index}
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    index === currentImageIndex 
                      ? 'bg-primary' 
                      : 'bg-muted-foreground'
                  }`}
                  onClick={() => setCurrentImageIndex(index)}
                  aria-label={`View image ${index + 1}`}
                />
              ))}
            </div>
            
            {/* Next button optimized for mobile */}
            <Button 
              variant="outline" 
              size={isMobile ? "icon" : "sm"}
              onClick={handleNext}
              className="flex-shrink-0"
            >
              {!isMobile && <span className="mr-1">Next</span>}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}