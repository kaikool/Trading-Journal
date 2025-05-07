/**
 * Component cho nút lấy giá real-time từ TwelveData API
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { RefreshCw, Clock, CheckCircle } from 'lucide-react';
import { useMarketPrice } from '@/hooks/use-market-price';
import { debug } from '@/lib/debug';
import { toast } from '@/hooks/use-toast';

interface GetPriceButtonProps {
  symbol: string;
  onPriceFetched: (price: number) => void;
  tooltipText?: string;
}

export function GetPriceButton({ 
  symbol, 
  onPriceFetched,
  tooltipText = "Get Current Market Price" 
}: GetPriceButtonProps) {
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);
  
  const { 
    isLoading, 
    fetchPrice, 
    error 
  } = useMarketPrice({
    symbol,
    onSuccess: (price) => {
      debug(`[GetPriceButton] Received price for ${symbol}: ${price}`);
      onPriceFetched(price);
      setLastFetchTime(new Date());
      
      toast({
        title: "Price Updated",
        description: `${symbol} price updated to ${price}`,
        variant: "default",
      });
    },
    onError: (error) => {
      debug(`[GetPriceButton] Error fetching price: ${error.message}`);
      toast({
        title: "Unable to fetch price",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Định dạng thời gian lấy giá gần nhất
  const getTimeAgo = () => {
    if (!lastFetchTime) return '';
    
    const now = new Date();
    const diff = now.getTime() - lastFetchTime.getTime();
    
    // Nếu dưới 1 phút
    if (diff < 60000) {
      const seconds = Math.floor(diff / 1000);
      return `${seconds}s ago`;
    }
    
    // Nếu dưới 1 giờ
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes}m ago`;
    }
    
    // Nếu trên 1 giờ
    const hours = Math.floor(diff / 3600000);
    return `${hours}h ago`;
  };
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="w-8 h-8"
            onClick={() => fetchPrice()}
            disabled={isLoading}
          >
            {isLoading ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : lastFetchTime ? (
              <CheckCircle className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p className="text-sm">{tooltipText}</p>
          {lastFetchTime && (
            <div className="flex items-center mt-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3 mr-1" />
              <span>Updated {getTimeAgo()}</span>
            </div>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}