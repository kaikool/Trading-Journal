import React from 'react';

interface LoadingFallbackProps {
  height?: number;
  showSpinner?: boolean;
  text?: string | null;
}

export function LoadingFallback({ 
  height, 
  showSpinner = false, 
  text = null
}: LoadingFallbackProps) {
  return (
    <div className="flex items-center justify-center p-4" 
         style={height ? { height: `${height}px` } : undefined}>
      {showSpinner ? (
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          {text && <div className="text-sm text-muted-foreground">{text}</div>}
        </div>
      ) : (
        <div className="h-full w-full rounded-lg bg-card/30"></div>
      )}
    </div>
  );
}

export default LoadingFallback;