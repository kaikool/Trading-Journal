import React from 'react';
import { ImageUpload } from './ImageUpload';
import { ImageState } from '../types';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

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
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        {/* Entry Section */}
        <div className="space-y-3">
          <div className="flex items-center mb-1">
            <Badge variant="secondary" className="px-2.5 py-0.5">ENTRY</Badge>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <ImageUpload
              title="H4"
              subtitle="H4 timeframe"
              imageState={entryImage1}
              onImageChange={handleEntryImageChange(1)}
              onRemoveImage={removeEntryImage(1)}
              inputId="entryImage1"
            />
            
            <ImageUpload
              title="M15"
              subtitle="M15 timeframe"
              imageState={entryImage2}
              onImageChange={handleEntryImageChange(2)}
              onRemoveImage={removeEntryImage(2)}
              inputId="entryImage2"
            />
          </div>
        </div>
        
        {/* Exit Section */}
        <div className="space-y-3">
          <div className="flex items-center mb-1">
            <Badge variant="secondary" className="px-2.5 py-0.5">EXIT</Badge>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <ImageUpload
              title="H4"
              subtitle="H4 timeframe"
              imageState={exitImage1}
              onImageChange={handleExitImageChange(1)}
              onRemoveImage={removeExitImage(1)}
              inputId="exitImage1"
            />
            
            <ImageUpload
              title="M15"
              subtitle="M15 timeframe"
              imageState={exitImage2}
              onImageChange={handleExitImageChange(2)}
              onRemoveImage={removeExitImage(2)}
              inputId="exitImage2"
            />
          </div>
        </div>
      </div>
    </div>
  );
}