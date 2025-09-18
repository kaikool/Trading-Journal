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
import TradeViewDetails from "@/components/trades/TradeView/TradeViewDetails";
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

export default function TradeView() {
  const { tradeId } = useParams();
  const [trade, setTrade] = useState<Trade | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const userId = auth.currentUser?.uid;
  const [_, navigate] = useLocation();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

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
  
  // Observer for real-time updates
  useEffect(() => {
    if (!userId || !tradeId) return;
    
    const observer: TradeChangeObserver = {
      onTradesChanged: async (action, changedTradeId) => {
        if (changedTradeId === tradeId) {
          if (action === 'delete') {
            toast({ title: "Trade deleted", description: "This trade has been deleted" });
            navigate("/history");
            return;
          }
          try {
            const updatedTrade = await getTradeById(userId, tradeId);
            if (updatedTrade) setTrade(updatedTrade as Trade);
          } catch (error) {
            logError("Failed to refresh trade after update:", error);
          }
        }
      }
    };
    
    const unregister = tradeUpdateService.registerObserver(observer);
    return unregister;
  }, [userId, tradeId, navigate, toast]);

  const handleBack = () => navigate("/history");
  const handleDelete = () => setIsDeleteDialogOpen(true);
  
  const handleDeleteConfirm = async () => {
    if (!userId || !tradeId) return;
    
    try {
      setIsLoading(true);
      await deleteTrade(userId, tradeId);
      toast({ title: "Trade deleted", description: "The trade has been permanently deleted" });
      navigate("/history");
    } catch (error) {
      logError("Error deleting trade:", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to delete trade. Please try again." });
      setIsLoading(false);
    } finally {
      setIsDeleteDialogOpen(false);
    }
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
        <AppSkeleton level={SkeletonLevel.FORM} className="py-4" />
      ) : error ? (
        <Card className="mb-4 overflow-hidden">
          <CardContent className="py-8 px-4 sm:p-6 text-center">
            <h3 className="text-lg font-medium text-destructive mb-2">{error}</h3>
            <p className="text-muted-foreground mb-4">The trade could not be loaded. Please try again later.</p>
            <Button variant="outline" onClick={handleBack}>Return to Trade History</Button>
          </CardContent>
        </Card>
      ) : trade ? (
        <TradeViewDetails
            trade={trade}
            onDelete={handleDelete}
            onBack={handleBack}
        />
      ) : (
        <Card className="mb-4 overflow-hidden">
          <CardContent className="py-8 px-4 sm:p-6 text-center">
            <h3 className="text-lg font-medium text-destructive mb-2">Trade not found</h3>
            <p className="text-muted-foreground mb-4">The trade you're looking for doesn't exist or might have been deleted.</p>
            <Button variant="outline" onClick={handleBack}>Return to Trade History</Button>
          </CardContent>
        </Card>
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