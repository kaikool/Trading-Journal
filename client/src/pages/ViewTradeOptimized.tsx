import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { auth, getTradeById, deleteTrade } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Icons } from "@/components/icons/icons";
import { AppSkeleton, SkeletonLevel } from "@/components/ui/app-skeleton";
import { Trade } from "@/types";
import { useLocation } from "wouter";
import { LazyTradeViewEdit } from "@/components/trades/LazyTradeViewEdit";
import { debug, logError } from "@/lib/debug";
import { tradeUpdateService, TradeChangeObserver } from "@/services/trade-update-service";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function ViewTradeOptimized() {
  const { tradeId } = useParams();
  const [trade, setTrade] = useState<Trade | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const userId = auth.currentUser?.uid;
  const [_, navigate] = useLocation();

  // Fetch trade data
  useEffect(() => {
    const fetchTrade = async () => {
      if (!tradeId || !userId) {
        setError("Trade ID or user ID is missing");
        setIsLoading(false);
        return;
      }

      try {
        debug(`Fetching trade with ID: ${tradeId}`);
        const tradeData = await getTradeById(userId, tradeId);

        if (!tradeData) {
          setError("Trade not found");
          setIsLoading(false);
          return;
        }

        debug("Trade data loaded:", tradeData);
        const trade = tradeData as Trade;
        setTrade(trade);
      } catch (err) {
        logError("Error fetching trade:", err);
        setError("Failed to load trade data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrade();
  }, [tradeId, userId]);
  
  // Đăng ký observer để lắng nghe sự thay đổi của trade
  // Sử dụng TradeUpdateService làm trung tâm thông báo thay vì sử dụng cơ chế revalidate
  // hoặc invalidate trực tiếp từ queryClient (cách tiếp cận chuẩn hóa toàn bộ ứng dụng)
  useEffect(() => {
    if (!userId || !tradeId) return;
    
    // Tạo observer để cập nhật UI khi trade thay đổi - pattern Observer
    // Interface TradeChangeObserver được định nghĩa trong trade-update-service.ts
    const observer: TradeChangeObserver = {
      onTradesChanged: async (action, changedTradeId) => {
        // Chỉ cập nhật khi thao tác liên quan đến trade hiện tại
        if (changedTradeId === tradeId) {
          debug(`Trade ${tradeId} changed, action: ${action}, refreshing view`);
          
          if (action === 'delete') {
            // Trở về trang lịch sử nếu trade bị xóa
            toast({
              title: "Trade deleted",
              description: "This trade has been deleted"
            });
            navigate("/trade/history");
            return;
          }
          
          try {
            // Lấy dữ liệu mới nhất sau khi cập nhật
            // Không cần gọi queryClient.invalidateQueries vì TradeUpdateService đã xử lý
            const updatedTrade = await getTradeById(userId, tradeId);
            if (updatedTrade) {
              setTrade(updatedTrade as Trade);
            }
          } catch (error) {
            logError("Failed to refresh trade after update:", error);
          }
        }
      }
    };
    
    // Đăng ký observer với TradeUpdateService để nhận thông báo cập nhật
    // tradeUpdateService là singleton nên tất cả các component dùng chung một instance
    const unregister = tradeUpdateService.registerObserver(observer);
    
    // Hủy đăng ký khi component unmount
    return unregister;
  }, [userId, tradeId, navigate, toast]);

  // Navigate back
  const handleBack = () => {
    navigate("/trade/history");
  };

  // Handle delete trade
  const handleDelete = async (tradeId: string) => {
    if (!userId) return;
    
    if (window.confirm("Are you sure you want to delete this trade? This action cannot be undone.")) {
      try {
        setIsLoading(true);
        // Sử dụng deleteTrade từ firebase.ts
        // deleteTrade đã được cập nhật để gọi tradeUpdateService.notifyTradeDeleted
        // Không cần cập nhật UI thủ công - TradeUpdateService sẽ thông báo cho observers
        await deleteTrade(userId, tradeId);
        toast({
          title: "Trade deleted",
          description: "The trade has been permanently deleted",
        });
        // Không cần navigate vì observer đã xử lý
        // Nhưng vẫn giữ lại để đảm bảo UI nhất quán
        navigate("/trade/history");
      } catch (error) {
        logError("Error deleting trade:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to delete trade. Please try again.",
        });
        setIsLoading(false);
      }
    }
  };

  // Handle edit success
  const handleEditSuccess = () => {
    toast({
      title: "Trade updated",
      description: "Your trade has been updated successfully",
    });
    // Không cần refresh thủ công - TradeUpdateService sẽ xử lý
  };

  // Handle edit error
  const handleEditError = (error: unknown) => {
    toast({
      variant: "destructive",
      title: "Failed to update trade",
      description: typeof error === 'string' 
        ? error 
        : error instanceof Error 
          ? error.message 
          : "An error occurred",
    });
  };

  return (
    <div className="container max-w-5xl px-0 sm:px-4">
      <div className="mt-4">
        <Button variant="ghost" onClick={handleBack} className="mb-4">
          <Icons.trade.arrowLeft className="mr-2 h-4 w-4" />
          Back to Trade History
        </Button>
      </div>
      
      {isLoading ? (
        <AppSkeleton 
          level={SkeletonLevel.FORM} 
          className="py-4"
          count={1}
        />
      ) : error ? (
        <Card className="mb-4 overflow-hidden">
          <CardContent className="py-8 px-4 sm:p-6 text-center">
            <h3 className="text-lg font-medium text-destructive mb-2">{error}</h3>
            <p className="text-muted-foreground mb-4">
              The trade could not be loaded. Please try again later.
            </p>
            <Button 
              variant="outline" 
              onClick={handleBack}
            >
              Return to Trade History
            </Button>
          </CardContent>
        </Card>
      ) : trade ? (
        <>
          <LazyTradeViewEdit
            trade={trade}
            userId={userId || ""}
            isLoading={isLoading}
            onEdit={(isSubmitting) => setIsLoading(isSubmitting)}
            onSuccess={handleEditSuccess}
            onError={handleEditError}
            onDelete={handleDelete}
            onBack={handleBack}
          />
        </>
      ) : (
        <Card className="mb-4 overflow-hidden">
          <CardContent className="py-8 px-4 sm:p-6 text-center">
            <h3 className="text-lg font-medium text-destructive mb-2">Trade not found</h3>
            <p className="text-muted-foreground mb-4">
              The trade you're looking for doesn't exist or might have been deleted.
            </p>
            <Button 
              variant="outline" 
              onClick={handleBack}
            >
              Return to Trade History
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}