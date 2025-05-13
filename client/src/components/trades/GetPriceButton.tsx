/**
 * Component cho nút lấy giá real-time từ TwelveData API
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Icons } from '@/components/icons/icons';
import { useMarketPrice } from '@/hooks/use-market-price';
import { debug } from '@/lib/debug';
import { toast } from '@/hooks/use-toast';
import { formatPrice } from '@/lib/forex-calculator';

interface GetPriceButtonProps {
  symbol: string;
  onPriceFetched?: (price: number) => void;
  onPriceReceived?: (price: number) => void;
  tooltipText?: string;
  size?: 'default' | 'sm' | 'xs'; // Button size
  variant?: 'outline' | 'ghost' | 'link'; // Button style
  className?: string; // Custom CSS
}

export function GetPriceButton({ 
  symbol, 
  onPriceFetched,
  onPriceReceived,
  tooltipText = "Get Current Market Price",
  size = 'default',
  variant = 'outline',
  className = ''
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
      
      // Ensure price is a number and properly formatted
      const formattedPrice = typeof price === 'number' ? price : Number(price);
      
      // Support both callback prop names
      if (onPriceFetched) onPriceFetched(formattedPrice);
      if (onPriceReceived) onPriceReceived(formattedPrice);
      setLastFetchTime(new Date());
      
      // Format price according to forex standard for display in toast
      const displayPrice = formatPrice(formattedPrice, symbol as any);
      
      toast({
        title: "Price Updated",
        description: `${symbol} price updated to ${displayPrice}`,
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
  
  // Sử dụng biểu tượng API chung cho tất cả các cặp tiền tệ
  const getApiIcon = () => {
    // Xác định cỡ biểu tượng theo kích thước nút
    const iconClass = iconSize;
    
    // Sử dụng biểu tượng Webhook (API) cho tất cả các cặp tiền tệ
    return <Icons.trade.api className={iconClass} />;
  };
  
  // Xác định kích thước nút dựa trên props
  const buttonSize = size === 'xs' ? 'w-6 h-6' : 
                     size === 'sm' ? 'w-7 h-7' : 
                     'w-8 h-8';
  
  // Xác định kích thước biểu tượng tương ứng
  const iconSize = size === 'xs' ? 'h-3 w-3' : 
                    size === 'sm' ? 'h-3.5 w-3.5' : 
                    'h-4 w-4';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant={variant}
            size="icon"
            className={`${buttonSize} ${className}`}
            onClick={() => fetchPrice()}
            disabled={isLoading}
          >
            {isLoading ? (
              <Icons.ui.refresh className={`${iconSize} animate-spin`} />
            ) : lastFetchTime ? (
              <Icons.ui.circleCheck className={`${iconSize} text-green-500`} />
            ) : (
              getApiIcon()
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p className="text-sm">{tooltipText}</p>
          {lastFetchTime && (
            <div className="flex items-center mt-1 text-xs text-muted-foreground">
              <Icons.general.clock className="w-3 h-3 mr-1" />
              <span>Updated {getTimeAgo()}</span>
            </div>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}