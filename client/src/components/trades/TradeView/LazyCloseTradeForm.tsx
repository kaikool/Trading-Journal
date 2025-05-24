import { lazy, Suspense } from "react";
import type { Trade } from "@/types";
import { Icons } from "@/components/icons/icons";

/**
 * Lazy load the CloseTradeForm component
 * 
 * CloseTradeForm sử dụng TradeUpdateService để thông báo cập nhật UI
 * thông qua firebase.updateTrade sau khi đóng giao dịch. Điều này đảm bảo
 * tất cả các components đăng ký với TradeUpdateService sẽ được cập nhật đồng bộ.
 */
const CloseTradeFormComponent = lazy(() => import("./CloseTradeForm").then(module => ({
  default: module.default
})));

interface CloseTradeFormProps {
  trade: Trade;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function LazyCloseTradeForm(props: CloseTradeFormProps) {
  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8"></div>
            <p className="text-sm text-muted-foreground opacity-0">Loading form...</p>
          </div>
        </div>
      }
    >
      <CloseTradeFormComponent {...props} />
    </Suspense>
  );
}

export default LazyCloseTradeForm;