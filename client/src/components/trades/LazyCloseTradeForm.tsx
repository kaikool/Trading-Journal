import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";
import type { Trade } from "@/types";

// Lazy load the CloseTradeForm component
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
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading form...</p>
          </div>
        </div>
      }
    >
      <CloseTradeFormComponent {...props} />
    </Suspense>
  );
}

export default LazyCloseTradeForm;