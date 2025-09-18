import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
// Bỏ getTradeById, thêm onTradeSnapshot
import { auth, onTradeSnapshot, deleteTrade } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Icons } from "@/components/icons/icons";
import { AppSkeleton, SkeletonLevel } from "@/components/ui/app-skeleton";
import { Trade } from "@/types";
import TradeViewDetails from "@/components/trades/TradeView/TradeViewDetails";
import { logError, debug } from "@/lib/debug";
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
// LazyCloseTradeForm được chuyển vào đây để quản lý trạng thái đóng lệnh
import { LazyCloseTradeForm } from "@/components/trades/TradeView/LazyCloseTradeForm";

export default function TradeView() {
  const { tradeId } = useParams();
  const [trade, setTrade] = useState<Trade | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const userId = auth.currentUser?.uid;
  const [_, navigate] = useLocation();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  // State để quản lý việc mở/đóng form
  const [isCloseFormOpen, setCloseFormOpen] = useState(false);

  // === LOGIC LẤY DỮ LIỆU MỚI, SỬ DỤNG ONTRADESNAPSHOT ===
  useEffect(() => {
    if (!userId || !tradeId) {
      setError("User or Trade ID is missing.");
      setIsLoading(false);
      return;
    }

    // Bắt đầu lắng nghe thay đổi của trade trong thời gian thực
    const unsubscribe = onTradeSnapshot(userId, tradeId, (tradeData) => {
      if (tradeData) {
        debug("Real-time update received for trade:", tradeData);
        setTrade(tradeData as Trade);
        setError(null);
      } else {
        // Xử lý trường hợp trade bị xóa hoặc không tìm thấy
        setError("Trade not found or you do not have permission to view it.");
        setTrade(null);
        toast({ title: "Trade Removed", description: "This trade may have been deleted." });
      }
      // Dừng loading chỉ sau lần fetch dữ liệu đầu tiên
      if (isLoading) {
        setIsLoading(false);
      }
    });

    // Quan trọng: Dọn dẹp listener khi component bị hủy
    return () => unsubscribe();
    
  }, [tradeId, userId, isLoading]); // Thêm `isLoading` để kiểm soát lần đầu

  const handleBack = () => navigate("/history");
  const handleDelete = () => setIsDeleteDialogOpen(true);
  
  const handleDeleteConfirm = async () => {
    if (!userId || !tradeId) return;
    
    setIsDeleteDialogOpen(false); // Đóng dialog ngay
    try {
      await deleteTrade(userId, tradeId);
      toast({ title: "Trade Deleted", description: "The trade has been permanently deleted." });
      navigate("/history");
    } catch (err) {
      logError("Error deleting trade:", err);
      toast({ variant: "destructive", title: "Error", description: "Failed to delete trade." });
    }
  };

  // === RENDER LOGIC ===
  if (isLoading) {
    return (
      <div className="container max-w-5xl px-0 sm:px-4 mt-12">
        <AppSkeleton level={SkeletonLevel.FORM} className="py-4" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container max-w-5xl px-0 sm:px-4 mt-4">
        <Card className="mb-4 overflow-hidden">
          <CardContent className="py-8 px-4 sm:p-6 text-center">
            <h3 className="text-lg font-medium text-destructive mb-2">{error}</h3>
            <Button variant="outline" onClick={handleBack}>Return to Trade History</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!trade) {
    // Trường hợp này đã được xử lý bởi `error` state, nhưng vẫn để dự phòng
    return null;
  }

  return (
    <div className="container max-w-5xl px-0 sm:px-4">
      <div className="mt-4">
        <Button variant="ghost" onClick={handleBack} className="mb-4">
          <Icons.trade.arrowLeft className="mr-2 h-4 w-4" />
          Back to Trade History
        </Button>
      </div>
      
      <TradeViewDetails
        trade={trade}
        onDelete={handleDelete}
        onBack={handleBack}
      />
      
      {/* Nút Close Trade chỉ hiện khi trade đang mở */}
      {trade.isOpen && (
        <div className="mt-6 flex justify-center sm:justify-end">
          <Button onClick={() => setCloseFormOpen(true)} size="lg" className="w-full sm:w-auto">
            <Icons.ui.unlock className="mr-2 h-4 w-4" />
            Close Trade Position
          </Button>
        </div>
      )}

      {/* Form đóng lệnh được tải lười */}
      {isCloseFormOpen && (
        <LazyCloseTradeForm 
          trade={trade} 
          isOpen={isCloseFormOpen} 
          onClose={() => setCloseFormOpen(false)} 
          onSuccess={() => {
            // Listener sẽ tự động cập nhật UI, chúng ta chỉ cần đóng form
            setCloseFormOpen(false);
            toast({
              title: "Trade Closed",
              description: "The trade details are being updated.",
            });
          }}
        />
      )}
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="safe-area-p">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Trade Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this <strong> {trade?.pair} {trade?.direction} </strong> trade? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
