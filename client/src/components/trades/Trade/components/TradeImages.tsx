import { ImageUpload } from './ImageUpload';
import { ImageState } from '../types';
import { Badge } from '@/components/ui/badge';

interface TradeImagesProps {
  entryImage1: ImageState;
  entryImage2: ImageState;
  exitImage1: ImageState;
  exitImage2: ImageState;
  removeEntryImage: (index: 1 | 2) => () => void;
  removeExitImage: (index: 1 | 2) => () => void;
}

export function TradeImages({
  entryImage1,
  entryImage2,
  exitImage1,
  exitImage2,
  removeEntryImage,
  removeExitImage
}: TradeImagesProps) {
  return (
    <div className="space-y-5">

      {/* Entry Charts */}
      <div>
        <div className="flex items-center mb-2">
          <Badge 
            variant="outline" 
            className="bg-primary/10 text-primary border-primary/30 px-3 py-0.5"
          >
            Entry Analysis
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ImageUpload
            title="H4"
            subtitle="Higher Timeframe"
            imageState={entryImage1}
            onRemoveImage={removeEntryImage(1)}
          />

          <ImageUpload
            title="M15"
            subtitle="Lower Timeframe"
            imageState={entryImage2}
            onRemoveImage={removeEntryImage(2)}
          />
        </div>
      </div>

      {/* Exit Charts */}
      <div>
        <div className="flex items-center mb-2">
          <Badge 
            variant="outline" 
            className="bg-primary/10 text-primary border-primary/30 px-3 py-0.5"
          >
            Exit Analysis
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ImageUpload
            title="H4"
            subtitle="Higher Timeframe"
            imageState={exitImage1}
            onRemoveImage={removeExitImage(1)}
          />

          <ImageUpload
            title="M15"
            subtitle="Lower Timeframe"
            imageState={exitImage2}
            onRemoveImage={removeExitImage(2)}
          />
        </div>
      </div>
    </div>
  );
}
