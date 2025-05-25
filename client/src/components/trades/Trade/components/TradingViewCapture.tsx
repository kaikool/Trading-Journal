/**
 * TradingView Auto Capture Component
 * 
 * Tích hợp tính năng tự động lấy ảnh chart từ TradingView
 * cho các timeframe H4 và M15
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Icons } from '@/components/icons/icons';
import { cn } from '@/lib/utils';
import { apiRequest } from '@/lib/queryClient';

interface TradingViewCaptureProps {
  pair: string;
  onImageCaptured: (timeframe: 'H4' | 'M15', imageUrl: string) => void;
  userId?: string;
  tradeId?: string;
  disabled?: boolean;
}

interface CaptureProgress {
  status: 'idle' | 'capturing' | 'uploading' | 'completed' | 'error';
  timeframe?: 'H4' | 'M15' | 'both';
  progress: number;
  message: string;
}

export function TradingViewCapture({
  pair,
  onImageCaptured,
  userId,
  tradeId,
  disabled = false
}: TradingViewCaptureProps) {
  const { toast } = useToast();
  const [captureProgress, setCaptureProgress] = useState<CaptureProgress>({
    status: 'idle',
    progress: 0,
    message: 'Ready to capture'
  });

  // Capture một timeframe cụ thể
  const captureSingleTimeframe = async (timeframe: 'H4' | 'M15') => {
    if (!pair) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please select a currency pair first"
      });
      return;
    }

    setCaptureProgress({
      status: 'capturing',
      timeframe,
      progress: 25,
      message: `Capturing ${timeframe} chart from TradingView...`
    });

    try {
      const response = await apiRequest('POST', '/api/tradingview/capture', {
        pair,
        timeframe,
        userId,
        tradeId
      });

      const data = await response.json();

      if (data.success) {
        setCaptureProgress({
          status: 'completed',
          timeframe,
          progress: 100,
          message: `${timeframe} chart captured successfully!`
        });

        // Gọi callback để cập nhật UI
        onImageCaptured(timeframe, data.imageUrl);

        toast({
          title: "Chart Captured",
          description: `${timeframe} chart from TradingView has been automatically captured and uploaded.`
        });

        // Reset sau 2 giây
        setTimeout(() => {
          setCaptureProgress({
            status: 'idle',
            progress: 0,
            message: 'Ready to capture'
          });
        }, 2000);

      } else {
        throw new Error(data.message || 'Failed to capture chart');
      }

    } catch (error) {
      console.error('Capture error:', error);
      
      setCaptureProgress({
        status: 'error',
        timeframe,
        progress: 0,
        message: 'Failed to capture chart'
      });

      toast({
        variant: "destructive",
        title: "Capture Failed",
        description: error instanceof Error ? error.message : 'Failed to capture chart from TradingView'
      });

      // Reset sau 3 giây
      setTimeout(() => {
        setCaptureProgress({
          status: 'idle',
          progress: 0,
          message: 'Ready to capture'
        });
      }, 3000);
    }
  };

  // Capture cả H4 và M15 cùng lúc
  const captureAllTimeframes = async () => {
    if (!pair) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please select a currency pair first"
      });
      return;
    }

    setCaptureProgress({
      status: 'capturing',
      timeframe: 'both',
      progress: 20,
      message: 'Capturing both H4 and M15 charts...'
    });

    try {
      const response = await apiRequest('POST', '/api/tradingview/capture-all', {
        pair,
        userId,
        tradeId
      });

      const data = await response.json();

      if (data.success) {
        setCaptureProgress({
          status: 'uploading',
          timeframe: 'both',
          progress: 80,
          message: 'Processing captured images...'
        });

        // Xử lý kết quả H4
        if (data.results.h4?.success) {
          onImageCaptured('H4', data.results.h4.imageUrl);
        }

        // Xử lý kết quả M15
        if (data.results.m15?.success) {
          onImageCaptured('M15', data.results.m15.imageUrl);
        }

        setCaptureProgress({
          status: 'completed',
          timeframe: 'both',
          progress: 100,
          message: 'All charts captured successfully!'
        });

        const successCount = (response.results.h4?.success ? 1 : 0) + (response.results.m15?.success ? 1 : 0);
        const totalCount = 2;

        toast({
          title: "Charts Captured",
          description: `Successfully captured ${successCount}/${totalCount} charts from TradingView.`
        });

        // Reset sau 2 giây
        setTimeout(() => {
          setCaptureProgress({
            status: 'idle',
            progress: 0,
            message: 'Ready to capture'
          });
        }, 2000);

      } else {
        throw new Error(response.message || 'Failed to capture charts');
      }

    } catch (error) {
      console.error('Capture all error:', error);
      
      setCaptureProgress({
        status: 'error',
        timeframe: 'both',
        progress: 0,
        message: 'Failed to capture charts'
      });

      toast({
        variant: "destructive",
        title: "Capture Failed",
        description: error instanceof Error ? error.message : 'Failed to capture charts from TradingView'
      });

      // Reset sau 3 giây
      setTimeout(() => {
        setCaptureProgress({
          status: 'idle',
          progress: 0,
          message: 'Ready to capture'
        });
      }, 3000);
    }
  };

  const isLoading = captureProgress.status === 'capturing' || captureProgress.status === 'uploading';

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Icons.analytics.barChart className="h-4 w-4 text-primary" />
              TradingView Auto Capture
            </CardTitle>
            <CardDescription className="text-sm">
              Automatically capture charts from TradingView for {pair || 'selected pair'}
            </CardDescription>
          </div>
          {captureProgress.status === 'completed' && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <Icons.ui.check className="h-3 w-3 mr-1" />
              Completed
            </Badge>
          )}
          {captureProgress.status === 'error' && (
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
              <Icons.ui.x className="h-3 w-3 mr-1" />
              Error
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress indicator */}
        {isLoading && (
          <div className="space-y-2">
            <Progress value={captureProgress.progress} className="h-2" />
            <p className="text-xs text-muted-foreground">{captureProgress.message}</p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col gap-2">
          {/* Capture all button */}
          <Button
            onClick={captureAllTimeframes}
            disabled={disabled || isLoading || !pair}
            className={cn(
              "w-full",
              isLoading && captureProgress.timeframe === 'both' && "bg-primary/80"
            )}
          >
            {isLoading && captureProgress.timeframe === 'both' ? (
              <>
                <Icons.ui.refresh className="h-4 w-4 mr-2 animate-spin" />
                Capturing...
              </>
            ) : (
              <>
                <Icons.ui.upload className="h-4 w-4 mr-2" />
                Capture Both (H4 + M15)
              </>
            )}
          </Button>

          {/* Individual timeframe buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={() => captureSingleTimeframe('H4')}
              disabled={disabled || isLoading || !pair}
              className={cn(
                isLoading && captureProgress.timeframe === 'H4' && "border-primary bg-primary/5"
              )}
            >
              {isLoading && captureProgress.timeframe === 'H4' ? (
                <>
                  <Icons.ui.refresh className="h-3 w-3 mr-1 animate-spin" />
                  H4
                </>
              ) : (
                <>
                  <Icons.ui.upload className="h-3 w-3 mr-1" />
                  H4 Only
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={() => captureSingleTimeframe('M15')}
              disabled={disabled || isLoading || !pair}
              className={cn(
                isLoading && captureProgress.timeframe === 'M15' && "border-primary bg-primary/5"
              )}
            >
              {isLoading && captureProgress.timeframe === 'M15' ? (
                <>
                  <Icons.ui.refresh className="h-3 w-3 mr-1 animate-spin" />
                  M15
                </>
              ) : (
                <>
                  <Icons.ui.upload className="h-3 w-3 mr-1" />
                  M15 Only
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Info text */}
        {!pair && (
          <p className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
            💡 Select a currency pair in the Entry tab to enable auto capture
          </p>
        )}
        
        {pair && captureProgress.status === 'idle' && (
          <p className="text-xs text-muted-foreground bg-primary/5 p-2 rounded">
            ✨ Ready to capture {pair} charts from TradingView automatically
          </p>
        )}
      </CardContent>
    </Card>
  );
}