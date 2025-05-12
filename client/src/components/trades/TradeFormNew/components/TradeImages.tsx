import React from 'react';
import { ImageUpload } from './ImageUpload';
import { ImageState } from '../types';

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
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold tracking-tight">Trade Charts</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Entry Images */}
        <div className="space-y-6">
          <h4 className="text-sm font-medium uppercase text-muted-foreground tracking-wider">Entry Analysis</h4>
          
          <ImageUpload
            title="H4 Chart Image"
            subtitle="Select H4 timeframe image"
            imageState={entryImage1}
            onImageChange={handleEntryImageChange(1)}
            onRemoveImage={removeEntryImage(1)}
            inputId="entryImage1"
          />
          
          <ImageUpload
            title="M15 Chart Image"
            subtitle="Select M15 timeframe image"
            imageState={entryImage2}
            onImageChange={handleEntryImageChange(2)}
            onRemoveImage={removeEntryImage(2)}
            inputId="entryImage2"
          />
        </div>
        
        {/* Exit Images */}
        <div className="space-y-6">
          <h4 className="text-sm font-medium uppercase text-muted-foreground tracking-wider">Exit Analysis</h4>
          
          <ImageUpload
            title="Exit H4 Chart"
            subtitle="Select H4 exit chart"
            imageState={exitImage1}
            onImageChange={handleExitImageChange(1)}
            onRemoveImage={removeExitImage(1)}
            inputId="exitImage1"
          />
          
          <ImageUpload
            title="Exit M15 Chart"
            subtitle="Select M15 exit chart"
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