import React from 'react';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Icons } from '@/components/icons/icons';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ImageState } from '../types';
import { Badge } from '@/components/ui/badge';

interface ImageUploadProps {
  title: string;
  subtitle: string;
  imageState: ImageState;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  onRemoveImage: () => void;
  inputId: string;
}

export function ImageUpload({
  title,
  subtitle,
  imageState,
  onImageChange,
  onRemoveImage,
  inputId
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
      <div className="flex items-center mb-1">
        <Badge variant="outline" className="bg-muted/30 px-2 text-xs">{title}</Badge>
      </div>
      
      {preview ? (
        <div className="relative rounded-md overflow-hidden border border-border group">
          <img 
            src={preview}
            alt={title}
            className="w-full h-auto object-cover max-h-[200px]"
          />
          
          {isUploading && (
            <div className="absolute bottom-0 left-0 right-0">
              <Progress value={uploadProgress} className="h-1 rounded-none" />
            </div>
          )}
          
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
            <Button
              type="button"
              size="sm"
              variant="destructive"
              className="flex"
              onClick={onRemoveImage}
            >
              <span>Remove</span>
            </Button>
          </div>
          
          {uploadSuccess && (
            <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
              <Icons.ui.check className="h-3 w-3" />
            </div>
          )}
        </div>
      ) : (
        <div className="border border-dashed border-border rounded-md p-1.5 text-center">
          <Label 
            htmlFor={inputId}
            className="w-full flex flex-col items-center justify-center cursor-pointer py-1.5"
          >
            <span className="text-primary text-xs text-center">
              {subtitle}
            </span>
            <p className="text-xs text-muted-foreground text-center mt-0.5">
              PNG, JPG
            </p>
          </Label>
          <input 
            id={inputId} 
            type="file" 
            accept="image/*" 
            className="sr-only" 
            onChange={onImageChange}
          />
        </div>
      )}
      
      {error && (
        <div className="text-xs text-destructive flex items-center gap-1 mt-1 px-2 py-1 rounded-md">
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}