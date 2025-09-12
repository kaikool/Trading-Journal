import { Progress } from '@/components/ui/progress';
import { Icons } from '@/components/icons/icons';
import { Button } from '@/components/ui/button';
import { ImageState } from '../types';
import { Badge } from '@/components/ui/badge';

interface ImageUploadProps {
  title: string;
  subtitle: string;
  imageState: ImageState;
  onCaptureClick?: () => void;   // ✅ đổi sang trigger capture API
  onRemoveImage: () => void;
  inputId?: string;              // không còn dùng, nhưng giữ optional để khỏi vỡ props cũ
}

export function ImageUpload({
  title,
  subtitle,
  imageState,
  onCaptureClick,
  onRemoveImage,
}: ImageUploadProps) {
  const {
    preview,
    error,
    uploadProgress,
    uploadSuccess,
    isUploading
  } = imageState;

  return (
    <div className="overflow-visible">
      {preview ? (
        <div className="relative rounded-lg overflow-hidden border border-border/40 group shadow-sm">
          <div className="absolute top-0 left-0 right-0 p-2 z-10 bg-gradient-to-b from-black/50 to-transparent">
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="bg-black/40 text-white border-0 px-2 text-xs backdrop-blur-sm">
                {title}
              </Badge>

              {uploadSuccess && (
                <div className="bg-green-500/80 text-white rounded-full p-0.5 w-4 h-4 flex items-center justify-center backdrop-blur-sm">
                  <Icons.ui.check className="h-3 w-3" />
                </div>
              )}
            </div>
          </div>

          <img 
            src={preview || undefined}
            alt={title}
            className="w-full h-auto object-cover max-h-[180px]"
          />

          {isUploading && (
            <div className="absolute bottom-0 left-0 right-0">
              <Progress value={uploadProgress ?? 0} className="h-1 rounded-none bg-black/20" />
            </div>
          )}

          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
            <div className="flex gap-2">
              {onCaptureClick && (
                <Button
                  type="button"
                  size="sm"
                  className="shadow-md"
                  onClick={onCaptureClick}
                  disabled={isUploading}
                >
                  {isUploading ? 'Capturing…' : 'Re-Capture via API'}
                </Button>
              )}
              <Button
                type="button"
                size="sm"
                variant="destructive"
                className="shadow-md"
                onClick={onRemoveImage}
                disabled={isUploading}
              >
                <span>Remove</span>
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-lg bg-muted/10 border border-dashed border-border overflow-hidden hover:bg-muted/20 transition-colors p-4">
          <div className="w-full flex flex-col items-center justify-center py-4">
            <div className="w-10 h-10 rounded-full bg-muted/20 flex items-center justify-center mb-2">
              <span className="text-xs font-medium text-primary">{title}</span>
            </div>
            <span className="text-xs font-medium text-primary text-center px-3">
              {subtitle}
            </span>
            <p className="text-xs text-muted-foreground text-center mt-1 px-3 mb-3">
              Capture chart image via API (M15 & H4)
            </p>
            {onCaptureClick && (
              <Button
                type="button"
                size="sm"
                className="bg-primary text-white"
                onClick={onCaptureClick}
                disabled={isUploading}
              >
                {isUploading ? 'Capturing…' : 'Capture via API'}
              </Button>
            )}
            {isUploading && (
              <div className="w-full mt-3">
                <Progress value={uploadProgress ?? 0} className="h-1 rounded-none" />
              </div>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="text-xs text-destructive flex items-center gap-1 mt-1.5 px-1.5 rounded-md">
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
