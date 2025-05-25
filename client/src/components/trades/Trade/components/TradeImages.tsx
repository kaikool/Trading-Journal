import React from 'react';
import { ImageUpload } from './ImageUpload';
import { ImageState } from '../types';
import { Badge } from '@/components/ui/badge';
import { TradingViewCapture } from './TradingViewCapture';
import { useFormContext } from 'react-hook-form';
import { TradeFormValues } from '../types';

interface TradeImagesProps {
  entryImage1: ImageState;
  entryImage2: ImageState;
  exitImage1: ImageState;
  exitImage2: ImageState;
  handleEntryImageChange: (index: 1 | 2) => (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleExitImageChange: (index: 1 | 2) => (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  removeEntryImage: (index: 1 | 2) => () => void;
  removeExitImage: (index: 1 | 2) => () => void;
}

export function TradeImages({
  entryImage1,
  entryImage2,
  exitImage1,
  exitImage2,
  handleEntryImageChange,
  handleExitImageChange,
  removeEntryImage,
  removeExitImage
}: TradeImagesProps) {
  const form = useFormContext<TradeFormValues>();
  const selectedPair = form.watch("pair");

  // Handler để set ảnh được capture từ TradingView
  const handleTradingViewCapture = (timeframe: 'H4' | 'M15', imageUrl: string) => {
    // Tạo một File object từ URL để tương thích với logic upload hiện có
    fetch(imageUrl)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], `tradingview_${selectedPair}_${timeframe}.png`, { type: 'image/png' });
        
        // Trigger event change để sử dụng logic upload hiện có
        const event = {
          target: {
            files: [file]
          }
        } as any;

        if (timeframe === 'H4') {
          handleEntryImageChange(1)(event);
        } else if (timeframe === 'M15') {
          handleEntryImageChange(2)(event);
        }
      })
      .catch(console.error);
  };

  return (
    <div className="space-y-5">
      {/* TradingView Auto Capture */}
      <TradingViewCapture
        pair={selectedPair}
        onImageCaptured={handleTradingViewCapture}
        disabled={!selectedPair}
      />

      {/* Entry Charts */}
      <div>
        <div className="flex items-center mb-2">
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 px-3 py-0.5">Entry Analysis</Badge>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ImageUpload
            title="H4"
            subtitle="Higher Timeframe"
            imageState={entryImage1}
            onImageChange={handleEntryImageChange(1)}
            onRemoveImage={removeEntryImage(1)}
            inputId="entryImage1"
          />
          
          <ImageUpload
            title="M15"
            subtitle="Lower Timeframe"
            imageState={entryImage2}
            onImageChange={handleEntryImageChange(2)}
            onRemoveImage={removeEntryImage(2)}
            inputId="entryImage2"
          />
        </div>
      </div>
      
      {/* Exit Charts */}
      <div>
        <div className="flex items-center mb-2">
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 px-3 py-0.5">Exit Analysis</Badge>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ImageUpload
            title="H4"
            subtitle="Higher Timeframe"
            imageState={exitImage1}
            onImageChange={handleExitImageChange(1)}
            onRemoveImage={removeExitImage(1)}
            inputId="exitImage1"
          />
          
          <ImageUpload
            title="M15"
            subtitle="Lower Timeframe"
            imageState={exitImage2}
            onImageChange={handleExitImageChange(2)}
            onRemoveImage={removeExitImage(2)}
            inputId="exitImage2"
          />
        </div>
      </div>
    </div>
  );
}